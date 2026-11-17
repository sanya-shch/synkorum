// "/" is the marketing landing page - it is public, the dashboard lives at /dashboard.
export const publicRoutes: string[] = ["/", "/invalid-link"];

export const publicRoutePrefixes: string[] = ["/board-link", "/board", "/invite"];

export const authRoutes: string[] = ["/login", "/register", "/reset", "/new-password"];

export const apiAuthPrefix = "/api/auth";

export const DASHBOARD_PATH = "/dashboard";

export const DEFAULT_LOGIN_REDIRECT = DASHBOARD_PATH;

// A prefix matches the route itself or anything below it ("/board" and "/board/abc"),
// but not look-alike paths such as "/boardroom".
const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isPublicPath = (pathname: string) =>
  publicRoutes.includes(pathname) ||
  publicRoutePrefixes.some((prefix) => matchesPrefix(pathname, prefix));
