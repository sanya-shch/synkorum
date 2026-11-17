import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

import { Room } from "@/components/room";
import { RenameModal } from "@/components/modals/rename-modal";

import { Canvas } from "./_components/canvas";
import { Loading } from "./_components/loading";

export const metadata: Metadata = {
  title: "Board",
  robots: { index: false, follow: false },
};

interface BoardIdPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

const BoardIdPage = async ({ params }: BoardIdPageProps) => {
  const { boardId } = await params;

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: { organization: { select: { name: true } } },
  });
  if (!board) return notFound();

  // Anonymous share-link guests only get the board itself, never the team's name.
  const boardData = (isMember: boolean) => ({
    id: board.id,
    title: board.title,
    organizationId: board.organizationId,
    organizationName: isMember ? board.organization.name : null,
  });

  const user = await getCurrentUser();

  if (user) {
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: board.organizationId,
        },
      },
    });

    if (membership) {
      return (
        <>
          <Room roomId={boardId} fallback={<Loading />}>
            <Canvas board={boardData(true)} isMember />
          </Room>
          <RenameModal />
        </>
      );
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
      return (
        <>
          <Room roomId={boardId} fallback={<Loading />}>
            <Canvas board={boardData(false)} isMember={false} />
          </Room>
          <RenameModal />
        </>
      );
    }
  }

  redirect("/login");
};

export default BoardIdPage;
