// Everything gated behind this flag exists ONLY because this app is deployed as a free-tier
// portfolio demo (Vercel Hobby pauses the site after 4 CPU-hours per month, Brevo/Liveblocks/
// Neon have hard monthly caps). A real production deployment on paid plans would not need
// any of it.
//
// Flip to `false` to get the "real production" behaviour back. Today it changes:
//   - lib/password.ts: bcrypt cost 10 instead of 12 (4x less CPU per login / sign-up).
//   - PORTFOLIO_LIMITS below: global caps that keep the free tiers of Liveblocks (500 active
//     rooms per month) and Brevo (300 emails per day) from running out.
//
// Demo-session limits (lib/demo-config.ts, actions/*) are NOT behind this flag: they are
// regular product rules for `isDemo` accounts and stay on in any deployment.
export const IS_FOR_PORTFOLIO = true;

// Global caps for the whole deployment, only enforced while IS_FOR_PORTFOLIO is true. They
// sit below the real provider limits so there is a safety margin.
export const PORTFOLIO_LIMITS = {
  // Every board is a Liveblocks room, and the Free plan allows 500 active rooms per month.
  maxBoards: 400,
  // Brevo Free: 300 emails per day. Counted per UTC day.
  emailsPerDay: 250,
} as const;

export const PORTFOLIO_MESSAGES = {
  boards:
    "This demo site has reached its free-tier limit for boards, so new boards can't be created right now. Please try again later.",
  emails:
    "We've hit today's email limit on this free demo site, so we can't send emails right now. Please try again tomorrow - or use \u201cTry demo\u201d, which needs no email.",
} as const;
