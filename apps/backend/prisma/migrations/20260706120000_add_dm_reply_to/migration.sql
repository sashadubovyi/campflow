-- AlterTable
ALTER TABLE "direct_messages" ADD COLUMN "reply_to_id" UUID;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "direct_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "direct_messages_reply_to_id_idx" ON "direct_messages"("reply_to_id");
