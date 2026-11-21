# Portfolio mode

Synkorum is deployed as a public portfolio demo on free tiers (Vercel Hobby, Neon Free,
Liveblocks Free, Brevo Free). Free tiers do not bill when exceeded - they pause - so this
document is about not running into those pauses, and about letting a stranger try the product
in one click without handing them a way to hurt it.

## The `IS_FOR_PORTFOLIO` flag

[`lib/portfolio.ts`](../lib/portfolio.ts) exports one constant. Everything behind it exists only
because of free-tier constraints and would not be needed on paid plans. Set it to `false` to get
the production behaviour back.

| Behind the flag                 | Portfolio (`true`) | Production (`false`) |
| ------------------------------- | ------------------ | -------------------- |
| bcrypt cost (`lib/password.ts`) | 10                 | 12                   |

Why: Vercel Hobby pauses the whole project after 4 hours of Active CPU per month, and `bcryptjs`
is pure JavaScript. Cost 10 is 4x cheaper per hash. The cost is stored inside each hash, so
accounts created under either setting keep working.

The demo rules below are **not** behind the flag - they are ordinary product rules for `isDemo`
accounts.

## Try demo

The landing page has a **Try demo** button. It calls `POST /api/auth/demo`, which:

1. rate-limits the IP (5 per hour),
2. verifies a Cloudflare Turnstile token (`lib/turnstile.ts`; fails closed in production),
3. refuses with `503` once `DEMO_LIMITS.maxActiveSessions` demo accounts were created in the
   last 24 hours (the body carries `DEMO_FALLBACK_URL` when set),
4. creates a throwaway `User` with `isDemo = true`, a `@demo.invalid` address (reserved TLD,
   can never receive mail), no usable password, its own team and a populated welcome board
   (`lib/demo-board.ts`, written into the Liveblocks room),
5. sets a 24-hour session cookie and redirects to the dashboard.

No email is involved anywhere in this path.

A demo account stops working exactly 24 hours after `createdAt` (`getCurrentUser` rejects it),
whether or not it has been deleted yet.

### Limits (`lib/demo-config.ts`)

All enforced in the Server Actions, not in the UI:

| Rule                                            | Where                                          |
| ----------------------------------------------- | ---------------------------------------------- |
| at most 3 boards                                | `createBoard`                                  |
| at most 3 active share links                    | `createBoardShareLink`                         |
| no email invitations (use a share link)         | `inviteMemberByEmail`                          |
| no extra teams, team can't be deleted           | `createOrganization`, `deleteOrganization`     |
| no password login, no password reset            | `/api/auth/login`, `/api/auth/forgot-password` |
| 100 shapes per board, with a toast when reached | canvas (client-side, like for everyone)        |

Edit `DEMO_LIMITS` to change the numbers. Regular accounts are unaffected.

**Testing collaboration:** in the demo, open **Share -> Copy anonymous share link** and paste
it into a second browser window, a private window, or another device - the link is just a URL
and works anywhere. Liveblocks Free allows 10 simultaneous connections per room.

## Cleanup

Expired demo accounts (with their team, boards, share links and Liveblocks rooms) are removed
by `purgeExpiredDemos` in two ways:

- **Opportunistically**: every successful "Try demo" sweeps up to 25 expired accounts after the
  response is sent.
- **Weekly cron** (`vercel.json` -> `/api/cron/purge-demos`, Sundays ~04:00 UTC). Vercel Hobby
  allows at most one run per day and fires within the scheduled hour. The route requires
  `Authorization: Bearer $CRON_SECRET`; set `CRON_SECRET` in Vercel and Vercel sends it itself.
  Cron only runs on the production deployment.

To run it by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/purge-demos
```

It only ever touches `isDemo` users and teams consisting solely of demo users.

## Setup checklist

1. Neon: create a project, run `npx prisma migrate deploy` with the **direct** connection
   string, use the **pooled** one as `DATABASE_URL` on Vercel.
2. Liveblocks: use the production project's secret key (not the one used by e2e tests - test
   rooms count towards the 500 monthly active rooms).
3. Brevo: create an API key, verify a sender, set `BREVO_API_KEY` and `EMAIL_FROM`.
4. Cloudflare Turnstile: create a widget for your domain, set
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
5. Set `CRON_SECRET`.
6. Optional: create a real account, build a showcase board, create a read-only share link and put
   it in `DEMO_FALLBACK_URL`.
7. Do not add a payment card to any of these services.
