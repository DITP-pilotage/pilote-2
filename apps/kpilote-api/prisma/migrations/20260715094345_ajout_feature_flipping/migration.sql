-- CreateEnum
CREATE TYPE "FeatureFlippingEtat" AS ENUM ('ACTIVE', 'ACTIVE_POUR_UTILISATEUR', 'DESACTIVE');

-- CreateTable
CREATE TABLE "feature_flipping" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "etat" "FeatureFlippingEtat" NOT NULL DEFAULT 'DESACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flipping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flipping_utilisateur" (
    "feature_flipping_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flipping_utilisateur_pkey" PRIMARY KEY ("feature_flipping_id","utilisateur_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flipping_key_key" ON "feature_flipping"("key");

-- CreateIndex
CREATE INDEX "feature_flipping_utilisateur_feature_flipping_id_idx" ON "feature_flipping_utilisateur"("feature_flipping_id");

-- AddForeignKey
ALTER TABLE "feature_flipping_utilisateur" ADD CONSTRAINT "feature_flipping_utilisateur_feature_flipping_id_fkey" FOREIGN KEY ("feature_flipping_id") REFERENCES "feature_flipping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flipping_utilisateur" ADD CONSTRAINT "feature_flipping_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
