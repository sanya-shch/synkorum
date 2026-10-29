// JWT sessions are stateless, so logging out only clears the cookie and a stolen token
// would stay valid for its full 30 days. To be able to cut off old sessions we record
// `User.passwordChangedAt` and refuse any token issued before it.
//
// `issuedAt` is in seconds (JWT `iat`), the date has millisecond precision, so we compare
// at second granularity: a token issued in the same second as the change is still valid.
export function isSessionRevoked(issuedAt: number, passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return false;
  return issuedAt < Math.floor(passwordChangedAt.getTime() / 1000);
}
