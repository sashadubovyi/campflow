-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('active', 'closed');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "closed_at" TIMESTAMPTZ,
ADD COLUMN     "deletion_warned_at" TIMESTAMPTZ,
ADD COLUMN     "event_date" DATE,
ADD COLUMN     "last_activity_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "event_memories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "room_name" VARCHAR(120) NOT NULL,
    "event_date" DATE,
    "participants" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_memories_user_id_idx" ON "event_memories"("user_id");

-- CreateIndex
CREATE INDEX "rooms_status_last_activity_at_idx" ON "rooms"("status", "last_activity_at");

-- CreateIndex
CREATE INDEX "rooms_status_event_date_idx" ON "rooms"("status", "event_date");

-- AddForeignKey
ALTER TABLE "event_memories" ADD CONSTRAINT "event_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
