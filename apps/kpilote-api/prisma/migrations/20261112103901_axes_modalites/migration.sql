-- CreateTable
CREATE TABLE "axe" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "axe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveau_axe" (
    "id" UUID NOT NULL,
    "axe_id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niveau_axe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalite" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "axe_id" UUID NOT NULL,
    "niveau_axe_id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modalite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "axe_public_id_key" ON "axe"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "niveau_axe_axe_id_ordre_key" ON "niveau_axe"("axe_id", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "modalite_public_id_key" ON "modalite"("public_id");

-- CreateIndex
CREATE INDEX "modalite_axe_id_idx" ON "modalite"("axe_id");

-- CreateIndex
CREATE INDEX "modalite_niveau_axe_id_idx" ON "modalite"("niveau_axe_id");

-- CreateIndex
CREATE INDEX "modalite_parent_id_idx" ON "modalite"("parent_id");

-- AddForeignKey
ALTER TABLE "niveau_axe" ADD CONSTRAINT "niveau_axe_axe_id_fkey" FOREIGN KEY ("axe_id") REFERENCES "axe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalite" ADD CONSTRAINT "modalite_axe_id_fkey" FOREIGN KEY ("axe_id") REFERENCES "axe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalite" ADD CONSTRAINT "modalite_niveau_axe_id_fkey" FOREIGN KEY ("niveau_axe_id") REFERENCES "niveau_axe"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalite" ADD CONSTRAINT "modalite_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "modalite"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

