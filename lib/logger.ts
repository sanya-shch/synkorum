// The one place server-side errors get reported. Today it only writes to the console;
// plugging in an error tracker (Sentry, ...) means changing this file, not every call site.
export function logError(scope: string, err: unknown) {
  console.error(`[${scope}]`, err);
}
