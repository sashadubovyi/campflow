-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'member');

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "owner_id" UUID NOT NULL,
    "invite_code" VARCHAR(12) NOT NULL,
    "invite_token" UUID NOT NULL,
    "starts_at" DATE,
    "ends_at" DATE,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_members" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ,

    CONSTRAINT "room_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_invite_code_key" ON "rooms"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_invite_token_key" ON "rooms"("invite_token");

-- CreateIndex
CREATE INDEX "rooms_owner_id_idx" ON "rooms"("owner_id");

-- CreateIndex
CREATE INDEX "rooms_invite_code_idx" ON "rooms"("invite_code");

-- CreateIndex
CREATE INDEX "room_members_room_id_idx" ON "room_members"("room_id");

-- CreateIndex
CREATE INDEX "room_members_user_id_idx" ON "room_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_members_room_id_user_id_key" ON "room_members"("room_id", "user_id");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
