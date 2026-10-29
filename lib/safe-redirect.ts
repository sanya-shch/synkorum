// `callbackUrl` comes from the query string, so it is attacker-controlled. Only local,
// same-origin paths are allowed; anything else (https://evil.com, //evil.com, /\evil.com,
// javascript:...) falls back to the default.
export function getSafeCallbackUrl(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;

  // Must be an absolute path on this origin. "//host" and "/\host" are treated by
  // browsers as protocol-relative URLs, i.e. a different origin.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;

  // Tabs/newlines/control characters are stripped by URL parsers and can turn "/\t/evil.com"
  // into "//evil.com".
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const base = "http://localhost";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
