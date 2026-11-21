# Configuration

Copy [`.env.example`](../.env.example) to `.env` and fill in the values.

| Variable                         | Required | Purpose                                                                                                        |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | yes      | PostgreSQL connection string (matches `docker-compose.yml` locally)                                            |
| `AUTH_SECRET`                    | yes      | Signs session JWTs. Generate with `openssl rand -base64 32`; changing it signs everyone out                    |
| `LIVEBLOCKS_SECRET_KEY`          | yes      | Issues room tokens in `/api/liveblocks-auth`                                                                   |
| `BREVO_API_KEY`                  | yes      | Sends verification, reset, and invite emails through Brevo                                                     |
| `NEXT_PUBLIC_APP_URL`            | yes      | Public base URL used in emails and share links                                                                 |
| `EMAIL_FROM`                     | yes      | Sender, `Name <address>`; the address must be a verified sender in Brevo                                       |
| `TRUSTED_PROXY_COUNT`            | no       | Number of reverse proxies in front of the app (default `1`), used to find the real client IP for rate limiting |
| `UPSTASH_REDIS_REST_URL`         | prod     | Upstash Redis REST URL. Shares rate-limit counters and the daily email budget across instances                 |
| `UPSTASH_REDIS_REST_TOKEN`       | prod     | Upstash Redis REST token (set together with the URL)                                                           |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | prod     | Cloudflare Turnstile site key for the "Try demo" bot check                                                     |
| `TURNSTILE_SECRET_KEY`           | prod     | Turnstile secret. Missing in production = "Try demo" refuses to start (fails closed)                           |
| `DEMO_FALLBACK_URL`              | no       | View-only share link to a showcase board, offered when the live demo is at capacity                            |
| `CRON_SECRET`                    | prod     | Protects `/api/cron/purge-demos`; Vercel sends it automatically as a Bearer token                              |

`.env*` files are git-ignored; only [`.env.example`](../.env.example) is committed.
