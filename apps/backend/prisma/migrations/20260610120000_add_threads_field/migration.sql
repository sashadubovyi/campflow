-- AlterTable
ALTER TABLE "users" ADD COLUMN "threads" VARCHAR(64);
ALTER TABLE "users" ADD COLUMN "threads_visibility" "FieldVisibility" NOT NULL DEFAULT 'hidden';
