-- CreateTable
CREATE TABLE "direct_chats" (
    "id" UUID NOT NULL,
    "user_a_id" UUID NOT NULL,
    "user_b_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "direct_chats_user_a_id_user_b_id_key" ON "direct_chats"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "direct_chats_user_a_id_last_message_at_idx" ON "direct_chats"("user_a_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "direct_chats_user_b_id_last_message_at_idx" ON "direct_chats"("user_b_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "direct_messages_chat_id_created_at_idx" ON "direct_messages"("chat_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "direct_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
