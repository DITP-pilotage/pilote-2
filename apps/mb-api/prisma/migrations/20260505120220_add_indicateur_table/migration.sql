-- CreateTable
CREATE TABLE "indicateur" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicateur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicateur_public_id_key" ON "indicateur"("public_id");
