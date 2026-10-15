-- Accès à l'assistant IA (Albert) par profil : un profil est activé si sa ligne existe.
CREATE TABLE "albert_access_profil" (
    "profil_code" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "albert_access_profil_pkey" PRIMARY KEY ("profil_code")
);

-- Accès à l'assistant IA accordés individuellement à des utilisateurs.
CREATE TABLE "albert_access_utilisateur" (
    "utilisateur_id" UUID NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "albert_access_utilisateur_pkey" PRIMARY KEY ("utilisateur_id")
);

ALTER TABLE "albert_access_profil" ADD CONSTRAINT "albert_access_profil_profil_code_fkey" FOREIGN KEY ("profil_code") REFERENCES "profil"("code") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "albert_access_utilisateur" ADD CONSTRAINT "albert_access_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
