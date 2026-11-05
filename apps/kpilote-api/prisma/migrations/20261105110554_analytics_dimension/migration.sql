-- CreateTable
CREATE TABLE "analytics_dimension" (
    "cle" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_dimension_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_dimension_slot_key" ON "analytics_dimension"("slot");
