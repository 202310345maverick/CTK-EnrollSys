export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "");
  return value
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/\x00/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (typeof val === "string") {
      result[key] = sanitizeString(val);
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      result[key] = sanitizeObject(val as Record<string, unknown>);
    }
  }
  return result as T;
}
