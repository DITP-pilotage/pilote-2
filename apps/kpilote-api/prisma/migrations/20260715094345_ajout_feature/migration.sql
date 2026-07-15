-- CreateEnum
CREATE TYPE "FeatureEtat" AS ENUM ('ACTIVE', 'ACTIVE_POUR_UTILISATEUR', 'DESACTIVE');

-- CreateTable
CREATE TABLE "feature" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "etat" "FeatureEtat" NOT NULL DEFAULT 'DESACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_utilisateur" (
    "feature_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_utilisateur_pkey" PRIMARY KEY ("feature_id","utilisateur_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_key_key" ON "feature"("key");

-- CreateIndex
CREATE INDEX "feature_utilisateur_feature_id_idx" ON "feature_utilisateur"("feature_id");

-- CreateIndex
CREATE INDEX "feature_utilisateur_utilisateur_id_idx" ON "feature_utilisateur"("utilisateur_id");

-- AddForeignKey
ALTER TABLE "feature_utilisateur" ADD CONSTRAINT "feature_utilisateur_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_utilisateur" ADD CONSTRAINT "feature_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
