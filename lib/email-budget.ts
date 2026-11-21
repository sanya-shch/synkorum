import { AppError } from "@/lib/errors";
import { logError } from "@/lib/logger";
import { getRedis } from "@/lib/redis";
import { IS_FOR_PORTFOLIO, PORTFOLIO_LIMITS, PORTFOLIO_MESSAGES } from "@/lib/portfolio";

// A global per-day budget of outgoing emails. Brevo's free plan stops sending after its daily
// quota, which would silently break sign-up, password reset and invitations for everyone -
// so in portfolio mode we count emails ourselves and tell the user up front instead.
//
// The counter lives in Upstash Redis when configured (shared by all instances) and in memory
// otherwise. If Redis fails we let the email through: Brevo enforces the real limit anyway.

export const EMAIL_BUDGET_MESSAGE = PORTFOLIO_MESSAGES.emails;

export class EmailBudgetError extends AppError {
  constructor() {
    super(EMAIL_BUDGET_MESSAGE, 503);
    this.name = "EmailBudgetError";
  }
}

const memory = new Map<string, number>();

const todayKey = (now: Date) => `synkorum:email-budget:${now.toISOString().slice(0, 10)}`;

const used = async (key: string): Promise<number> => {
  const redis = getRedis();
  if (redis) {
    try {
      return Number((await redis.get<number>(key)) ?? 0);
    } catch (err) {
      logError("email-budget", err);
      return 0;
    }
  }
  return memory.get(key) ?? 0;
};

// Read-only check, for flows that should refuse before doing any work (creating an account
// whose confirmation email could not be sent).
export async function emailBudgetAvailable(now: Date = new Date()): Promise<boolean> {
  if (!IS_FOR_PORTFOLIO) return true;
  return (await used(todayKey(now))) < PORTFOLIO_LIMITS.emailsPerDay;
}

// Takes one slot for an email that is about to be sent. Returns false when the day is full.
export async function reserveEmailSlot(now: Date = new Date()): Promise<boolean> {
  if (!IS_FOR_PORTFOLIO) return true;

  const key = todayKey(now);
  const redis = getRedis();

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 2 * 24 * 60 * 60);
      return count <= PORTFOLIO_LIMITS.emailsPerDay;
    } catch (err) {
      logError("email-budget", err);
      return true;
    }
  }

  const count = (memory.get(key) ?? 0) + 1;
  memory.set(key, count);
  return count <= PORTFOLIO_LIMITS.emailsPerDay;
}

export async function assertEmailBudget() {
  if (!(await emailBudgetAvailable())) throw new EmailBudgetError();
}

export const resetEmailBudget = () => memory.clear();
