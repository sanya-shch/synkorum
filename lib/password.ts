import bcrypt from "bcryptjs";
import { IS_FOR_PORTFOLIO } from "@/lib/portfolio";

// 12 is the production setting. The portfolio deployment runs on Vercel Hobby, which pauses
// the whole site after 4 hours of Active CPU per month, and bcryptjs (pure JS) burns hundreds
// of milliseconds of CPU on every hash - so there it uses cost 10 (4x cheaper). The cost is
// stored inside each hash, so hashes created under either setting keep verifying.
const PRODUCTION_SALT_ROUNDS = 12;
const PORTFOLIO_SALT_ROUNDS = 10;

export const SALT_ROUNDS = IS_FOR_PORTFOLIO ? PORTFOLIO_SALT_ROUNDS : PRODUCTION_SALT_ROUNDS;

export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

// Login for an unknown email must take about as long as one for a known email, otherwise
// response time reveals which addresses are registered. Hash a throwaway value once
// (lazily - bcrypt at this cost is slow) and compare against it when there is no user.
let dummyHash: Promise<string> | undefined;

export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash("dummy-password-for-timing", SALT_ROUNDS);
  await bcrypt.compare(password, await dummyHash);
}
