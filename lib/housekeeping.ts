import { purgeExpiredDemos } from "@/lib/demo";
import { purgeUnverifiedAccounts } from "@/lib/unverified";

// Everything that cleans up after abandoned accounts. Called after a "Try demo" or a sign-up
// (small batches, so it is effectively free) and by the weekly cron (large batch).
export async function runHousekeeping({ limit }: { limit: number }) {
  const [demos, unverified] = await Promise.all([
    purgeExpiredDemos({ limit }),
    purgeUnverifiedAccounts({ limit }),
  ]);

  return { demos, unverified };
}
