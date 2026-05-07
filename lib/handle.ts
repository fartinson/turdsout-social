export function normalizeHandle(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  return base.length >= 3 ? base : null;
}

export function defaultHandleFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  return normalizeHandle(local);
}

export function withSuffix(base: string, suffix: string) {
  const maxBase = Math.max(3, 20 - (suffix.length + 1));
  const trimmed = base.slice(0, maxBase);
  return `${trimmed}_${suffix}`;
}
