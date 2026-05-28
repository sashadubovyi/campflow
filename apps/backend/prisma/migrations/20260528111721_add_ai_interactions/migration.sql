-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "room_id" UUID,
    "kind" VARCHAR(40) NOT NULL,
    "locale" "UserLocale" NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_interactions_user_id_idx" ON "ai_interactions"("user_id");

-- CreateIndex
CREATE INDEX "ai_interactions_kind_idx" ON "ai_interactions"("kind");

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
