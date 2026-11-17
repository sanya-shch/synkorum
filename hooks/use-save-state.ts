"use client";

import { useStatus, useSyncStatus } from "@liveblocks/react";

export type SaveState = "saved" | "saving" | "reconnecting" | "offline";

export const SAVE_STATE_LABEL: Record<SaveState, { short: string; long: string }> = {
  saved: { short: "Saved", long: "All changes saved" },
  saving: { short: "Saving…", long: "Saving changes…" },
  reconnecting: { short: "Reconnecting…", long: "Reconnecting…" },
  offline: { short: "Offline", long: "Offline - changes sync when you reconnect" },
};

// Combines the websocket connection status with Liveblocks' sync status (pending writes).
export const useSaveState = (): SaveState => {
  const connection = useStatus();
  const sync = useSyncStatus();

  if (connection === "disconnected") return "offline";
  if (connection === "reconnecting" || connection === "connecting") return "reconnecting";
  if (sync === "synchronizing") return "saving";
  return "saved";
};
