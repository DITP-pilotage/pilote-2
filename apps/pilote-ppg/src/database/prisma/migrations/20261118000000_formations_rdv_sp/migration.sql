-- Motifs de formation RDV-SP. Remplie par copilot depuis RDV-SP.
CREATE TABLE "formation_motif" (
    "id" BIGINT NOT NULL,
    "nom" TEXT NOT NULL,
    "date_suppression" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formation_motif_pkey" PRIMARY KEY ("id")
);

-- Séances de formation RDV-SP. Remplie par copilot depuis RDV-SP.
CREATE TABLE "formation_seance" (
    "id" BIGINT NOT NULL,
    "motif_id" BIGINT NOT NULL,
    "date_debut" TIMESTAMPTZ NOT NULL,
    "duree_minutes" INTEGER NOT NULL,
    "lieu" TEXT,
    "animateurs" TEXT,
    "date_annulation" TIMESTAMPTZ,
    "nombre_places_max" INTEGER,
    "nombre_inscrits" INTEGER NOT NULL,
    "url_inscription" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formation_seance_pkey" PRIMARY KEY ("id")
);

-- Profils à qui chaque motif est proposé. Sans clé étrangère vers formation_motif : le rechargement de copilot ne doit pas l'effacer.
CREATE TABLE "formation_motif_profil" (
    "motif_id" BIGINT NOT NULL,
    "profil_code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formation_motif_profil_pkey" PRIMARY KEY ("motif_id","profil_code")
);

-- Périodes d'information pendant lesquelles les formations sont proposées.
CREATE TABLE "formation_periode_information" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formation_periode_information_pkey" PRIMARY KEY ("id")
);

-- Motifs concernés par une période. Sans clé étrangère vers formation_motif, pour la même raison.
CREATE TABLE "formation_periode_information_motif" (
    "periode_id" UUID NOT NULL,
    "motif_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formation_periode_information_motif_pkey" PRIMARY KEY ("periode_id","motif_id")
);

-- État de la slide-in des formations pour un utilisateur sur une période.
CREATE TABLE "formation_periode_information_utilisateur" (
    "utilisateur_id" UUID NOT NULL,
    "periode_id" UUID NOT NULL,
    "date_presentation" TIMESTAMPTZ NOT NULL,
    "date_report" TIMESTAMPTZ,
    "date_fermeture" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formation_periode_information_utilisateur_pkey" PRIMARY KEY ("utilisateur_id","periode_id")
);

CREATE INDEX "formation_seance_date_debut_idx" ON "formation_seance"("date_debut");

ALTER TABLE "formation_seance" ADD CONSTRAINT "formation_seance_motif_id_fkey" FOREIGN KEY ("motif_id") REFERENCES "formation_motif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "formation_motif_profil" ADD CONSTRAINT "formation_motif_profil_profil_code_fkey" FOREIGN KEY ("profil_code") REFERENCES "profil"("code") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "formation_periode_information_motif" ADD CONSTRAINT "formation_periode_information_motif_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "formation_periode_information"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "formation_periode_information_utilisateur" ADD CONSTRAINT "formation_periode_information_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "formation_periode_information_utilisateur" ADD CONSTRAINT "formation_periode_information_utilisateur_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "formation_periode_information"("id") ON DELETE CASCADE ON UPDATE CASCADE;
