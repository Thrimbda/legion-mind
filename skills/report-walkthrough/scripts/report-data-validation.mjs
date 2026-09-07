import { readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'references', 'report-data.schema.json');

export function loadReportDataSchema() {
  return JSON.parse(readFileSync(schemaPath, 'utf8'));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function jsonPointer(root, reference) {
  if (!reference.startsWith('#/')) throw new Error(`Only local schema references are supported: ${reference}`);
  return reference.slice(2).split('/').reduce((value, token) => {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    return value?.[key];
  }, root);
}

function matchesType(value, type) {
  if (type === 'object') return isObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'null') return value === null;
  return true;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateSchema(value, current, root, path = '$', errors = []) {
  if (current === true) return errors;
  if (current === false) {
    errors.push(`${path} is not allowed`);
    return errors;
  }
  if (current.$ref) {
    const target = jsonPointer(root, current.$ref);
    if (!target) throw new Error(`Schema reference not found: ${current.$ref}`);
    return validateSchema(value, target, root, path, errors);
  }
  if (current.const !== undefined && !sameValue(value, current.const)) {
    errors.push(`${path} must equal ${JSON.stringify(current.const)}`);
  }
  if (current.enum && !current.enum.some((candidate) => sameValue(value, candidate))) {
    errors.push(`${path} must be one of ${current.enum.map((item) => JSON.stringify(item)).join(', ')}`);
  }
  if (current.type && !matchesType(value, current.type)) {
    errors.push(`${path} must be ${current.type}`);
    return errors;
  }
  for (const child of current.allOf ?? []) validateSchema(value, child, root, path, errors);
  if (current.anyOf && !current.anyOf.some((child) => validateSchema(value, child, root, path, []).length === 0)) {
    errors.push(`${path} does not satisfy any allowed shape`);
  }
  if (current.oneOf) {
    const count = current.oneOf.filter((child) => validateSchema(value, child, root, path, []).length === 0).length;
    if (count !== 1) errors.push(`${path} must satisfy exactly one allowed shape`);
  }
  if (current.not && validateSchema(value, current.not, root, path, []).length === 0) {
    errors.push(`${path} matches a forbidden shape`);
  }
  if (current.if) {
    const branch = validateSchema(value, current.if, root, path, []).length === 0 ? current.then : current.else;
    if (branch) validateSchema(value, branch, root, path, errors);
  }
  if (typeof value === 'string') {
    if (current.minLength !== undefined && [...value].length < current.minLength) errors.push(`${path} is too short`);
    if (current.maxLength !== undefined && [...value].length > current.maxLength) errors.push(`${path} is too long`);
    if (current.pattern && !(new RegExp(current.pattern, 'u')).test(value)) errors.push(`${path} has an invalid format`);
  }
  if (Array.isArray(value)) {
    if (current.minItems !== undefined && value.length < current.minItems) errors.push(`${path} needs at least ${current.minItems} items`);
    if (current.maxItems !== undefined && value.length > current.maxItems) errors.push(`${path} allows at most ${current.maxItems} items`);
    if (current.items) value.forEach((item, index) => validateSchema(item, current.items, root, `${path}[${index}]`, errors));
  }
  if (isObject(value)) {
    for (const key of current.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${path}.${key} is required`);
    }
    for (const [key, child] of Object.entries(current.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateSchema(value[key], child, root, `${path}.${key}`, errors);
    }
    if (current.additionalProperties === false) {
      const allowed = new Set(Object.keys(current.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) errors.push(`${path}.${key} is not declared`);
      }
    }
  }
  return errors;
}

function validateHttpsUrl(value, path, errors) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) {
      errors.push(`${path} must be an HTTPS URL without embedded credentials`);
    }
  } catch {
    errors.push(`${path} is not a valid URL`);
  }
}

export function semanticErrors(data) {
  const errors = [];
  const evidence = Array.isArray(data?.evidence) ? data.evidence : [];
  if (data?.status === 'complete' && evidence.some((item) => item?.status === 'fail')) {
    errors.push('$.status cannot be complete while evidence contains a failure');
  }
  validateHttpsUrl(data?.render?.url, '$.render.url', errors);
  for (const [index, item] of evidence.entries()) {
    validateHttpsUrl(item?.url, `$.evidence[${index}].url`, errors);
    if (typeof item?.locator === 'string' && item.locator.includes('`')) {
      errors.push(`$.evidence[${index}].locator cannot contain a backtick`);
    }
  }
  return errors;
}

export function validateReportData(data, schema = loadReportDataSchema()) {
  return [...validateSchema(data, schema, schema), ...semanticErrors(data)];
}

export function resolveInputFile(candidate, cwd = process.cwd()) {
  if (typeof candidate !== 'string' || candidate.trim() === '') throw new Error('Missing --input path');
  const absolute = resolve(cwd, candidate);
  const real = realpathSync(absolute);
  if (!statSync(real).isFile()) throw new Error(`Input is not a regular file: ${candidate}`);
  return real;
}
