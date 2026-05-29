/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'unspecified');

-- CreateEnum
CREATE TYPE "FieldVisibility" AS ENUM ('public', 'contacts', 'hidden');

-- CreateEnum
CREATE TYPE "InvitePolicy" AS ENUM ('all', 'contacts', 'none');

-- DropIndex
DROP INDEX "users_email_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "email_visibility" "FieldVisibility" NOT NULL DEFAULT 'hidden',
ADD COLUMN     "facebook" VARCHAR(64),
ADD COLUMN     "facebook_visibility" "FieldVisibility" NOT NULL DEFAULT 'hidden',
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hobbies_custom" VARCHAR(200),
ADD COLUMN     "instagram" VARCHAR(64),
ADD COLUMN     "instagram_visibility" "FieldVisibility" NOT NULL DEFAULT 'hidden',
ADD COLUMN     "invite_from" "InvitePolicy" NOT NULL DEFAULT 'all',
ADD COLUMN     "phone_visibility" "FieldVisibility" NOT NULL DEFAULT 'hidden',
ADD COLUMN     "telegram" VARCHAR(64),
ADD COLUMN     "telegram_visibility" "FieldVisibility" NOT NULL DEFAULT 'hidden',
ADD COLUMN     "username_changed_at" TIMESTAMPTZ,
ADD COLUMN     "whatsapp" VARCHAR(32),
ADD COLUMN     "whatsapp_visibility" "FieldVisibility" NOT NULL DEFAULT 'hidden',
ALTER COLUMN "full_name" SET DATA TYPE TEXT,
ALTER COLUMN "password_hash" SET DATA TYPE TEXT,
ALTER COLUMN "phone" SET DATA TYPE TEXT;
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(32);
UPDATE "users" SET "username" = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9_]', '_', 'g')) || '_' || SUBSTRING(id::text, 1, 4);
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
