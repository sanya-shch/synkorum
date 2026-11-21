// Everything gated behind this flag exists ONLY because this app is deployed as a free-tier
// portfolio demo (Vercel Hobby pauses the site after 4 CPU-hours per month, Brevo/Liveblocks/
// Neon have hard monthly caps). A real production deployment on paid plans would not need
// any of it.
//
// Flip to `false` to get the "real production" behaviour back. Today it changes:
//   - lib/password.ts: bcrypt cost 10 instead of 12 (4x less CPU per login / sign-up).
//
// Demo-session limits (lib/demo-config.ts, actions/*) are NOT behind this flag: they are
// regular product rules for `isDemo` accounts and stay on in any deployment.
export const IS_FOR_PORTFOLIO = true;
