CREATE TABLE "public"."rapport_responsable_donnees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email_responsable" TEXT NOT NULL,
    "contenu_rapport" JSONB NOT NULL,
    "statut_envoi" "public"."statut_envoi_rapport" NOT NULL DEFAULT 'CREE',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_envoi" TIMESTAMP(3),
    "date_derniere_tentative" TIMESTAMP(3),
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur_envoi" TEXT,

    CONSTRAINT "rapport_responsable_donnees_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rapport_responsable_donnees_statut_envoi_idx" ON "public"."rapport_responsable_donnees"("statut_envoi");
CREATE INDEX "rapport_responsable_donnees_email_responsable_idx" ON "public"."rapport_responsable_donnees"("email_responsable");
