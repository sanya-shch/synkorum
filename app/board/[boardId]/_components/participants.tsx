"use client";

import { connectionIdToColor } from "@/lib/utils";
import { useOthers, useSelf, useStatus } from "@liveblocks/react";

import { UserAvatar } from "./user-avatar";

const MAX_SHOWN_USERS = 3;

export const Participants = () => {
  const status = useStatus();
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > MAX_SHOWN_USERS;

  return (
    <div
      className="flex items-center -space-x-2"
      data-testid="liveblocks-status"
      data-status={status}
    >
      {users.slice(0, MAX_SHOWN_USERS).map(({ connectionId, info }) => {
        return (
          <UserAvatar
            borderColor={connectionIdToColor(connectionId)}
            key={connectionId}
            src={info?.picture}
            name={info?.name}
            fallback={info?.name?.[0] || "T"}
          />
        );
      })}

      {currentUser && (
        <UserAvatar
          borderColor={connectionIdToColor(currentUser.connectionId)}
          src={currentUser.info?.picture}
          name={`${currentUser.info?.name} (You)`}
          fallback={currentUser.info?.name?.[0]}
        />
      )}

      {hasMoreUsers && (
        <UserAvatar
          name={`${users.length - MAX_SHOWN_USERS} more`}
          fallback={`+${users.length - MAX_SHOWN_USERS}`}
        />
      )}
    </div>
  );
};
