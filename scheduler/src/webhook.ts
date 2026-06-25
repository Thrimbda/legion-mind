import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import type { SchedulerStore } from './sqlite-store.ts';

export const LINEAR_SIGNATURE_HEADER = 'linear-signature';
export const DEFAULT_WEBHOOK_TOLERANCE_MS = 60_000;

export type LinearWebhookAction = 'created' | 'updated' | 'removed' | 'prompted' | 'stopped' | 'delegated' | 'teamAccessChanged' | string;

export interface LinearWebhookEnvelope {
  type: string;
  action: LinearWebhookAction;
  webhookId?: string;
  webhookTimestamp?: number;
  organizationId?: string;
  projectId?: string;
  teamId?: string;
  data?: Record<string, unknown>;
  agentSession?: {
    id?: string;
    issue?: {
      id?: string;
      identifier?: string;
      project?: { id?: string; name?: string };
    };
  };
  agentActivity?: Record<string, unknown>;
  addedTeamIds?: string[];
  removedTeamIds?: string[];
}

export interface IngestLinearWebhookInput {
  store: SchedulerStore;
  rawBody: Buffer | string;
  headers?: IncomingHttpHeaders | Record<string, string | string[] | undefined>;
  secret: string;
  now?: string;
  toleranceMs?: number;
  traceId?: string | null;
}

export interface IngestLinearWebhookResult {
  accepted: true;
  duplicate: boolean;
  webhookEventId: string;
  resourceType: string;
  action: string;
  routed: string[];
}

export class LinearWebhookAuthError extends Error {}
export class LinearWebhookParseError extends Error {}

function asBuffer(value: Buffer | string): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

function sha256Hex(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function headerValue(headers: IngestLinearWebhookInput['headers'], name: string): string | null {
  if (!headers) return null;
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== lowerName) continue;
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }
  return null;
}

export function verifyLinearWebhookSignature(input: { rawBody: Buffer | string; signatureHeader: string | null | undefined; secret: string }): boolean {
  if (!input.secret || typeof input.signatureHeader !== 'string' || !input.signatureHeader) {
    return false;
  }
  let headerSignature: Buffer;
  try {
    headerSignature = Buffer.from(input.signatureHeader, 'hex');
  } catch {
    return false;
  }
  const computed = createHmac('sha256', input.secret).update(asBuffer(input.rawBody)).digest();
  if (computed.length !== headerSignature.length) {
    return false;
  }
  return timingSafeEqual(computed, headerSignature);
}

export function parseLinearWebhookBody(rawBody: Buffer | string): LinearWebhookEnvelope {
  try {
    const parsed = JSON.parse(asBuffer(rawBody).toString('utf-8')) as LinearWebhookEnvelope;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string' || typeof parsed.action !== 'string') {
      throw new Error('Webhook payload must include string type and action.');
    }
    return parsed;
  } catch (error) {
    throw new LinearWebhookParseError(error instanceof Error ? error.message : String(error));
  }
}

function timestampToMs(timestamp: number): number {
  return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
}

export function validateWebhookTimestamp(timestamp: number | undefined, options: { now?: string; toleranceMs?: number } = {}): boolean {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return false;
  }
  const nowMs = options.now ? Date.parse(options.now) : Date.now();
  if (!Number.isFinite(nowMs)) {
    return false;
  }
  return Math.abs(nowMs - timestampToMs(timestamp)) <= (options.toleranceMs ?? DEFAULT_WEBHOOK_TOLERANCE_MS);
}

function projectIdFromEnvelope(envelope: LinearWebhookEnvelope): string | null {
  const data = envelope.data ?? {};
  const project = data.project as { id?: string } | undefined;
  return envelope.projectId
    ?? project?.id
    ?? envelope.agentSession?.issue?.project?.id
    ?? null;
}

function linearIdentifierFromEnvelope(envelope: LinearWebhookEnvelope): string | null {
  const data = envelope.data ?? {};
  return typeof data.identifier === 'string' ? data.identifier : envelope.agentSession?.issue?.identifier ?? null;
}

function agentSessionId(envelope: LinearWebhookEnvelope): string | null {
  return envelope.agentSession?.id ?? (typeof envelope.data?.agentSessionId === 'string' ? envelope.data.agentSessionId : null);
}

function enqueueReconcile(store: SchedulerStore, envelope: LinearWebhookEnvelope, webhookEventId: string, traceId: string | null | undefined, now: string | undefined, reason: string): string {
  const projectId = projectIdFromEnvelope(envelope);
  const identifier = linearIdentifierFromEnvelope(envelope);
  return store.enqueueSchedulerOutbox({
    sideEffect: 'reconcile_project',
    idempotencyKey: `webhook:${webhookEventId}:reconcile:${projectId ?? 'unknown'}:${reason}`,
    payload: {
      reason,
      webhookEventId,
      type: envelope.type,
      action: envelope.action,
      projectId,
      linearIdentifier: identifier,
      agentSessionId: agentSessionId(envelope),
      traceId: traceId ?? null,
    },
    now,
  });
}

function enqueueNativeSessionEvent(store: SchedulerStore, envelope: LinearWebhookEnvelope, webhookEventId: string, traceId: string | null | undefined, now: string | undefined): string {
  return store.enqueueSchedulerOutbox({
    sideEffect: 'native_session_event',
    idempotencyKey: `webhook:${webhookEventId}:native-session:${envelope.action}`,
    payload: {
      webhookEventId,
      action: envelope.action,
      agentSessionId: agentSessionId(envelope),
      projectId: projectIdFromEnvelope(envelope),
      linearIdentifier: linearIdentifierFromEnvelope(envelope),
      traceId: traceId ?? null,
    },
    now,
  });
}

export function ingestLinearWebhook(input: IngestLinearWebhookInput): IngestLinearWebhookResult {
  const rawBody = asBuffer(input.rawBody);
  const signature = headerValue(input.headers, LINEAR_SIGNATURE_HEADER);
  if (!verifyLinearWebhookSignature({ rawBody, signatureHeader: signature, secret: input.secret })) {
    throw new LinearWebhookAuthError('Linear webhook signature verification failed.');
  }
  const envelope = parseLinearWebhookBody(rawBody);
  if (!validateWebhookTimestamp(envelope.webhookTimestamp, { now: input.now, toleranceMs: input.toleranceMs })) {
    throw new LinearWebhookAuthError('Linear webhook timestamp is outside the accepted replay window.');
  }

  const deliveryId = headerValue(input.headers, 'linear-delivery-id') ?? headerValue(input.headers, 'linear-webhook-id') ?? envelope.webhookId ?? null;
  const record = input.store.recordWebhookEvent({
    linearWebhookId: envelope.webhookId ?? null,
    deliveryId,
    signatureHash: sha256Hex(rawBody),
    resourceType: envelope.type,
    action: envelope.action,
    payload: envelope,
    now: input.now,
  });

  if (record.duplicate) {
    return { accepted: true, duplicate: true, webhookEventId: record.id, resourceType: envelope.type, action: envelope.action, routed: [] };
  }

  const routed: string[] = [];
  const type = envelope.type.toLowerCase();
  const action = envelope.action.toLowerCase();

  if (type === 'permissionschange' || type === 'permissionchange' || action === 'teamaccesschanged') {
    const outboxId = input.store.enqueueSchedulerOutbox({
      sideEffect: 'permission_change',
      idempotencyKey: `webhook:${record.id}:permission-change`,
      payload: {
        webhookEventId: record.id,
        organizationId: envelope.organizationId ?? null,
        addedTeamIds: envelope.addedTeamIds ?? [],
        removedTeamIds: envelope.removedTeamIds ?? [],
        traceId: input.traceId ?? null,
      },
      now: input.now,
    });
    routed.push(outboxId);
    return { accepted: true, duplicate: false, webhookEventId: record.id, resourceType: envelope.type, action: envelope.action, routed };
  }

  if (type === 'agentsessionevent') {
    const sessionId = agentSessionId(envelope);
    if (action === 'stopped') {
      const run = sessionId ? input.store.findRunByAgentSessionId(sessionId) : null;
      if (run) {
        input.store.requestNativeStop(run.id, 'Linear AgentSessionEvent stopped webhook.', { actor: 'webhook', traceId: input.traceId ?? undefined, now: input.now });
        routed.push(`native_stop:${run.id}`);
      } else {
        routed.push(enqueueReconcile(input.store, envelope, record.id, input.traceId, input.now, 'unmatched_agent_session_stop'));
      }
      routed.push(enqueueNativeSessionEvent(input.store, envelope, record.id, input.traceId, input.now));
      return { accepted: true, duplicate: false, webhookEventId: record.id, resourceType: envelope.type, action: envelope.action, routed };
    }

    if (['created', 'prompted', 'delegated'].includes(action)) {
      routed.push(enqueueNativeSessionEvent(input.store, envelope, record.id, input.traceId, input.now));
      routed.push(enqueueReconcile(input.store, envelope, record.id, input.traceId, input.now, `agent_session_${action}`));
      return { accepted: true, duplicate: false, webhookEventId: record.id, resourceType: envelope.type, action: envelope.action, routed };
    }

    routed.push(enqueueNativeSessionEvent(input.store, envelope, record.id, input.traceId, input.now));
    routed.push(enqueueReconcile(input.store, envelope, record.id, input.traceId, input.now, 'agent_session_event'));
    return { accepted: true, duplicate: false, webhookEventId: record.id, resourceType: envelope.type, action: envelope.action, routed };
  }

  routed.push(enqueueReconcile(input.store, envelope, record.id, input.traceId, input.now, 'webhook_event'));
  return { accepted: true, duplicate: false, webhookEventId: record.id, resourceType: envelope.type, action: envelope.action, routed };
}

export function createLinearWebhookHttpHandler(input: { store: SchedulerStore; secret: string; maxBodyBytes?: number; toleranceMs?: number }) {
  const maxBodyBytes = input.maxBodyBytes ?? 1024 * 1024;
  return (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.writeHead(405).end();
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        res.writeHead(413).end();
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        ingestLinearWebhook({ store: input.store, rawBody: Buffer.concat(chunks), headers: req.headers, secret: input.secret, toleranceMs: input.toleranceMs });
        res.writeHead(200).end();
      } catch (error) {
        if (error instanceof LinearWebhookAuthError) {
          res.writeHead(401).end();
        } else if (error instanceof LinearWebhookParseError) {
          res.writeHead(400).end();
        } else {
          res.writeHead(500).end();
        }
      }
    });
  };
}

export function startLinearWebhookServer(input: { store: SchedulerStore; secret: string; port: number; host?: string; maxBodyBytes?: number; toleranceMs?: number }) {
  const server = createServer(createLinearWebhookHttpHandler(input));
  server.listen(input.port, input.host);
  return server;
}
