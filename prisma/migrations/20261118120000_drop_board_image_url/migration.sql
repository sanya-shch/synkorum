-- Board previews are drawn by the dashboard now; the stored image URL was never used.
ALTER TABLE "Board" DROP COLUMN "imageUrl";
