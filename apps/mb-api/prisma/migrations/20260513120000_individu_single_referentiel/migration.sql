-- Cardinalité Individu → Referentiel passe de many-to-many (pivot) à many-to-one (FK directe).
-- Pas encore de prod : on remet à zéro les individus et toutes leurs dépendances ; le seed les recrée.

-- DropForeignKey
ALTER TABLE "valeur_avancement" DROP CONSTRAINT "valeur_avancement_individu_id_fkey";

-- DropForeignKey
ALTER TABLE "relation" DROP CONSTRAINT "relation_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "relation" DROP CONSTRAINT "relation_child_id_fkey";

-- DropForeignKey
ALTER TABLE "referentiel_individu" DROP CONSTRAINT "referentiel_individu_referentiel_id_fkey";

-- DropForeignKey
ALTER TABLE "referentiel_individu" DROP CONSTRAINT "referentiel_individu_individu_id_fkey";

-- Wipe individu-dependent data (pas de prod)
TRUNCATE TABLE "valeur_avancement", "relation", "referentiel_individu", "individu";

-- DropTable
DROP TABLE "referentiel_individu";

-- AlterTable
ALTER TABLE "individu" ADD COLUMN "referentiel_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "individu_referentiel_id_idx" ON "individu"("referentiel_id");

-- AddForeignKey
ALTER TABLE "individu" ADD CONSTRAINT "individu_referentiel_id_fkey" FOREIGN KEY ("referentiel_id") REFERENCES "referentiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relation" ADD CONSTRAINT "relation_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "individu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relation" ADD CONSTRAINT "relation_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "individu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valeur_avancement" ADD CONSTRAINT "valeur_avancement_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
