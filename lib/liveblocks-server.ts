import { Liveblocks } from "@liveblocks/node";
import type { PlainLsonObject } from "@liveblocks/client";
import { logError } from "@/lib/logger";

let client: Liveblocks | undefined;

// Created lazily so importing this module never needs the secret (tests, builds).
const getClient = () =>
  (client ??= new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "" }));

// Creates the (private) room for a board up front and fills it with `storage`, so a new demo
// visitor lands on a populated canvas instead of an empty one. Clients never override
// existing storage with their `initialStorage`, so this is safe to call before first join.
export async function seedBoardRoom(roomId: string, storage: PlainLsonObject) {
  const liveblocks = getClient();
  await liveblocks.createRoom(roomId, { defaultAccesses: [] }, { idempotent: true });
  await liveblocks.initializeStorageDocument(roomId, storage);
}

// Best effort: a room that never existed (nobody opened the board) answers 404, which is fine.
export async function deleteBoardRoom(roomId: string) {
  try {
    await getClient().deleteRoom(roomId);
  } catch (err) {
    if ((err as { status?: number }).status === 404) return;
    logError("liveblocks-delete-room", err);
  }
}
