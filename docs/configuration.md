# Configuration

Copy [`.env.example`](../.env.example) to `.env` and fill in the values.

| Variable                | Required | Purpose                                                                                                        |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | yes      | PostgreSQL connection string (matches `docker-compose.yml` locally)                                            |
| `AUTH_SECRET`           | yes      | Signs session JWTs. Generate with `openssl rand -base64 32`; changing it signs everyone out                    |
| `LIVEBLOCKS_SECRET_KEY` | yes      | Issues room tokens in `/api/liveblocks-auth`                                                                   |
| `RESEND_API_KEY`        | yes      | Sends verification, reset, and invite emails                                                                   |
| `NEXT_PUBLIC_APP_URL`   | yes      | Public base URL used in emails and share links                                                                 |
| `EMAIL_FROM`            | no       | Sender address; defaults to the Resend sandbox sender                                                          |
| `TRUSTED_PROXY_COUNT`   | no       | Number of reverse proxies in front of the app (default `1`), used to find the real client IP for rate limiting |

`.env*` files are git-ignored; only [`.env.example`](../.env.example) is committed.
