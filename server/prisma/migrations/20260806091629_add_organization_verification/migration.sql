-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "ein" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_ein_key" ON "Organization"("ein");
