-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "rooms_is_public_idx" ON "rooms"("is_public");
