export function slugLinearIdentifier(identifier: string): string {
  const slug = identifier.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) {
    throw new Error(`Linear identifier cannot be converted to a Legion task id: ${identifier}`);
  }
  return slug;
}

export function taskIdFromLinearIdentifier(identifier: string, prefix = 'linear'): string {
  const normalizedPrefix = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!normalizedPrefix) {
    throw new Error(`Task id prefix cannot be empty: ${prefix}`);
  }
  return `${normalizedPrefix}-${slugLinearIdentifier(identifier)}`;
}
