# WI-08: Admin CLI, observability, and security hardening

## 目标

把 scheduler 从工程原型提升到可运维服务：人能安全干预，系统能解释调度决策，token / webhook / logs / worker 权限边界可审计。

## 背景

自动调度器一旦能并行执行，就必须具备“为什么没跑”“谁在阻塞”“哪个 token 权限不够”“哪个 lock 泄露”“哪个 PR 卡住”的回答能力。没有运维和安全层，自动化越强，事故越难收敛。

## 范围

- Admin CLI：inspect、force reconcile、pause/resume、retry/cancel、release lock。
- Structured logs and trace ids。
- Metrics：reconcile、run、worker、PR、lock、API rate limit。
- Skipped reason / project health report。
- Secret redaction。
- Token scope documentation and validation。
- Linear OAuth app actor / client credentials production path, including `actor=app` and native agent scopes。
- PermissionChange / app access revocation handling。
- GitHub token least privilege guidance。
- Security review checklist。

## 非目标

- 不构建完整 Web dashboard。
- 不实现多租户 SaaS 管理面。
- 不实现 sandbox/container 隔离的最终形态，只定义接口和最低边界。
- 不自动旋转所有 secrets。

## 依赖

- WI-02 到 WI-07。

## 设计要求

### Admin CLI minimum commands

```bash
scheduler reconcile --project <project>
scheduler runs list --project <project>
scheduler run inspect <run-id>
scheduler run retry <run-id> --reason <reason>
scheduler run cancel <run-id> --reason <reason>
scheduler locks list
scheduler locks release <lock-key> --run <run-id> --reason <reason>
scheduler project pause <project> --reason <reason>
scheduler project resume <project> --reason <reason>
```

Dangerous commands require reason and write `scheduler_events`。

### Observability

所有 logs / metrics 统一携带：

```text
trace_id, project_key, linear_identifier, run_id, attempt_id, task_id, repo_key, pr_url
```

### Security

- Linear production auth 优先 app actor / OAuth，不默认个人 API key。
- 生产默认使用 app actor identity；需要 native delegate/mention 时显式申请 `app:assignable` / `app:mentionable`。
- `Issue.delegate` 不替代人类 assignee；权限文档必须说明 ownership 边界。
- PermissionChange webhook 或 scope validation failure 必须 pause affected project 或进入 `security_blocked`。
- Webhook 必须验签。
- GitHub token 最小 repo scope。
- Worker 不直接获得 scheduler DB superuser 权限。
- 日志默认 redaction token、Authorization header、signed URLs。

## 验收标准

- [ ] Admin CLI 能 inspect run timeline 和 skipped reason。
- [ ] Pause project 后不会启动新 worker，但 active run 可继续跟踪。
- [ ] Retry / cancel / release lock 都需要 reason，并写 audit event。
- [ ] Metrics 覆盖 reconcile、run、worker、PR、lock、API errors。
- [ ] Logs 不泄露 token，测试覆盖 redaction。
- [ ] Security checklist 覆盖 Linear auth、AgentSession/Activities、delegate scopes、PermissionChange、GitHub auth、webhook signature、worker secrets、data retention。
- [ ] Admin inspect 能展示 AgentSession id、last activity、native stop requested、terminal success/non-success reason。

## 验证

- CLI integration tests：pause/resume/retry/cancel/release lock。
- Log snapshot tests：secret redaction。
- Manual drill：解释一个 blocked WI、释放一个 stale lock、暂停项目再恢复。
- Security review：按 checklist 逐项确认，包括 app actor scopes 与 native agent writeback 权限。

## Delivery notes

- Admin CLI lives in `scheduler/src/cli.ts` and is backed by `scheduler/src/admin.ts`.
- Durable project pause / security-blocked controls live in scheduler DB table `project_controls`; paused projects do not start new workers while active runs remain inspectable.
- Structured logging, metrics snapshots and secret redaction live in `scheduler/src/observability.ts`.
- PermissionChange / app access revocation handling records a security event and sets affected projects to `security_blocked` when a project can be identified.
- Security checklist and operator commands are documented in `scheduler/README.md`.

## 风险

- **运维入口过强**: release lock / cancel run 可能破坏一致性。缓解：必须 reason + audit + guard checks。
- **敏感信息泄露**: worker logs 和 webhook payload 可能含私密内容。缓解：redaction + retention policy。
- **权限漂移**: prototype token 进入生产。缓解：production readiness gate 要求 OAuth app actor / least privilege。
- **native 权限过宽**: agent 可被 mention/delegate 到不应处理的 issue。缓解：team/project allowlist、scope validation、PermissionChange 后 pause/reconcile。
