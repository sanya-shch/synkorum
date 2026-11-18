# Authentication

- Passwords are hashed with `bcryptjs` (cost 12). New passwords must be 8-72 bytes (bcrypt ignores anything beyond 72 bytes); accounts created under the older, shorter rule can still sign in.
- Sessions are 30-day HS256 JWTs (the algorithm is pinned on verification) in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). The user is re-read from the database on every request, and any session issued before `User.passwordChangedAt` is rejected, so a password reset signs out every older session.
- Login returns the same error for an unknown email and a wrong password, and does a dummy password check for unknown emails so response time doesn't reveal which addresses exist. Password reset always returns the same response, whether or not the account exists.
- Unverified accounts cannot sign in; a fresh verification email is sent instead.
- Rate limiting: sign-in is limited per IP and per account, registration, forgot-password, and reset-password per IP, and invitation emails per organization (`429` with `Retry-After` where applicable). The client IP is taken from the entry your own proxy appended to `X-Forwarded-For` (see `TRUSTED_PROXY_COUNT`), not from the client-controlled first entry.
- Expected business errors are thrown as `AppError` and shown to the user as-is. Anything else is logged server-side and replaced with a generic message, so internal errors (for example, a Liveblocks SDK exception or a database connection string) never reach the client as a raw stack trace or an unparsable HTML error page.
