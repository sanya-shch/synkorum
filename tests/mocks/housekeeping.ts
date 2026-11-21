import { vi } from "vitest";

export const runHousekeepingMock = vi
  .fn()
  .mockResolvedValue({ demos: {}, unverified: { users: 0, organizations: 0 } });
