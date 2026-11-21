import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { purgeMock } = vi.hoisted(() => ({ purgeMock: vi.fn() }));
vi.mock("@/lib/demo", () => ({ purgeExpiredDemos: purgeMock }));

import { GET } from "@/app/api/cron/purge-demos/route";

const call = (authorization?: string) =>
  GET(
    new Request("http://localhost/api/cron/purge-demos", {
      headers: authorization ? { authorization } : {},
    }),
  );

beforeEach(() => {
  purgeMock.mockReset().mockResolvedValue({ users: 3, organizations: 3, rooms: 4 });
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/purge-demos", () => {
  it("refuses everything when CRON_SECRET is not configured", async () => {
    expect((await call("Bearer undefined")).status).toBe(401);
    expect((await call()).status).toBe(401);
    expect(purgeMock).not.toHaveBeenCalled();
  });

  it("refuses a missing or wrong secret", async () => {
    process.env.CRON_SECRET = "s3cret-value";

    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong-value")).status).toBe(401);
    expect(purgeMock).not.toHaveBeenCalled();
  });

  it("purges and reports the counts for the right secret", async () => {
    process.env.CRON_SECRET = "s3cret-value";

    const res = await call("Bearer s3cret-value");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ users: 3, organizations: 3, rooms: 4 });
  });
});
