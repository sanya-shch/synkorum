import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

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
