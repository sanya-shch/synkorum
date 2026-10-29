-- CreateTable
CREATE TABLE "BoardFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardFavorite_boardId_idx" ON "BoardFavorite"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardFavorite_userId_boardId_key" ON "BoardFavorite"("userId", "boardId");

-- AddForeignKey
ALTER TABLE "BoardFavorite" ADD CONSTRAINT "BoardFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardFavorite" ADD CONSTRAINT "BoardFavorite_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
