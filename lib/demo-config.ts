// Pure constants and helpers for "Try demo" accounts - no database or network access here,
// so this file is safe to import from anywhere (mail, actions, client components).

// A demo account lives this long after creation. The check is done against `createdAt`, so
// the account stops working at exactly this moment even if nobody has cleaned it up yet.
export const DEMO_TTL_HOURS = 24;
export const DEMO_TTL_MS = DEMO_TTL_HOURS * 60 * 60 * 1000;

// `.invalid` is reserved by RFC 2606 and can never receive mail, so a demo address can
// neither be used to log in by someone typing it nor ever reach a real inbox.
export const DEMO_EMAIL_DOMAIN = "demo.invalid";

// Not a valid bcrypt hash, so password login is impossible for demo accounts.
export const DEMO_UNUSABLE_PASSWORD_HASH = "!";

export const DEMO_LIMITS = {
  // Boards per demo team. Every board is a Liveblocks room, and the Free plan allows only
  // 500 active rooms per month in total.
  boards: 3,
  // Active (not revoked, not expired) share links across the demo team.
  shareLinks: 3,
  // Demo sessions created within the last DEMO_TTL_HOURS across the whole app. Together with
  // `boards` this keeps the monthly Liveblocks room budget (500) and Neon storage in check.
  maxActiveSessions: 15,
} as const;

// Reasons shown to the visitor when a demo rule blocks an action.
export const DEMO_MESSAGES = {
  boards: `Demo limit reached: up to ${DEMO_LIMITS.boards} boards. Create a free account to build more.`,
  shareLinks: `Demo limit reached: up to ${DEMO_LIMITS.shareLinks} active share links. Revoke one or create a free account.`,
  invites:
    "Email invitations are disabled in the demo. Copy a share link instead and open it in another browser.",
  organizations: "Creating extra teams is disabled in the demo. Create a free account to do that.",
  deleteOrganization: "Deleting the team is disabled in the demo.",
  capacity: "The demo is at capacity right now. Please try again in a few hours.",
} as const;

export const isDemoEmail = (email: string) => email.toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);

export const demoExpiresAt = (createdAt: Date) => new Date(createdAt.getTime() + DEMO_TTL_MS);

export const isDemoExpired = (user: { isDemo: boolean; createdAt: Date }, now: Date = new Date()) =>
  user.isDemo && now.getTime() >= demoExpiresAt(user.createdAt).getTime();
