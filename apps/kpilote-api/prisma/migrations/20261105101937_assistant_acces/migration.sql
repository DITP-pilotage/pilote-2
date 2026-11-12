-- CreateTable
CREATE TABLE "assistant_parametres" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_parametres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_acces_utilisateur" (
    "utilisateur_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_acces_utilisateur_pkey" PRIMARY KEY ("utilisateur_id")
);

-- AddForeignKey
ALTER TABLE "assistant_acces_utilisateur" ADD CONSTRAINT "assistant_acces_utilisateur_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Coupé tant qu'un administrateur ne l'ouvre pas.
INSERT INTO "assistant_parametres" ("id", "actif", "updated_at") VALUES (1, false, now());
