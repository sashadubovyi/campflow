-- CreateTable
CREATE TABLE "final_plan_items" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "poll_id" UUID,
    "option_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "address" TEXT,
    "assigned_to" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "approved_by" UUID NOT NULL,
    "approved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "final_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "final_plan_items_room_id_idx" ON "final_plan_items"("room_id");

-- AddForeignKey
ALTER TABLE "final_plan_items" ADD CONSTRAINT "final_plan_items_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
