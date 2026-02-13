-- CreateTable
CREATE TABLE "public"."rapport_propositions_avancement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "utilisateur_id" UUID NOT NULL,
    "contenu_rapport" JSONB NOT NULL,
    "statut_envoi" "public"."statut_envoi_rapport" NOT NULL DEFAULT 'CREE',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_envoi" TIMESTAMP(3),
    "date_derniere_tentative" TIMESTAMP(3),
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur_envoi" TEXT,

    CONSTRAINT "rapport_propositions_avancement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rapport_propositions_avancement_statut_envoi_idx" ON "public"."rapport_propositions_avancement"("statut_envoi");

-- CreateIndex
CREATE INDEX "rapport_propositions_avancement_utilisateur_id_idx" ON "public"."rapport_propositions_avancement"("utilisateur_id");

-- AddForeignKey
ALTER TABLE "public"."rapport_propositions_avancement" ADD CONSTRAINT "rapport_propositions_avancement_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
