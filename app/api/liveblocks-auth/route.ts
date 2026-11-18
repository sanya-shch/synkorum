import { logError } from "@/lib/logger";
import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

export async function POST(request: Request) {
  try {
    const { room } = await request.json();
    const boardId = room;

    const board = await db.board.findUnique({ where: { id: boardId } });
    if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    const user = await getCurrentUser();

    if (user) {
      const membership = await db.membership.findUnique({
        where: {
          userId_organizationId: { userId: user.id, organizationId: board.organizationId },
        },
      });

      if (membership) {
        const ls = liveblocks.prepareSession(user.id, {
          userInfo: {
            name: user.name ?? "Teammeate",
            picture: user.image ?? undefined,
          },
        });
        ls.allow(room, ls.FULL_ACCESS);
        const { status, body } = await ls.authorize();
        return new Response(body, { status });
      }
    }

    const cookieStore = await cookies();
    const shareToken = cookieStore.get(`share_${boardId}`)?.value;

    if (shareToken) {
      const link = await db.boardShareLink.findUnique({ where: { token: shareToken } });
      const isValid =
        link &&
        link.boardId === boardId &&
        !link.revoked &&
        (!link.expiresAt || link.expiresAt > new Date());

      if (isValid) {
        const guestId = `guest:${crypto.randomUUID()}`;
        const ls = liveblocks.prepareSession(guestId, {
          userInfo: { name: link.canEdit ? "Guest" : "Guest (view only)", picture: undefined },
        });
        ls.allow(room, link.canEdit ? ls.FULL_ACCESS : ls.READ_ACCESS);
        const { status, body } = await ls.authorize();
        return new Response(body, { status });
      }
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (err) {
    // Liveblocks' SDK throws (rather than returning a {status,body} pair) for things
    // like a missing/invalid LIVEBLOCKS_SECRET_KEY. Without this, that exception
    // became Next's default HTML error page, which the client-side Liveblocks SDK
    // then failed to JSON-parse - hiding the real cause behind a useless
    // "Unexpected token '<'" message. Log and return a real error instead.
    logError("liveblocks-auth", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
