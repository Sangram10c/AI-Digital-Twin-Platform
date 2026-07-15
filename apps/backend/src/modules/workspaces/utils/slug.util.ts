export function slugifyWorkspaceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}

export function appendSlugSuffix(base: string, suffix: string): string {
  const trimmed = base.slice(0, Math.max(1, 150 - suffix.length - 1));
  return `${trimmed}-${suffix}`;
}
