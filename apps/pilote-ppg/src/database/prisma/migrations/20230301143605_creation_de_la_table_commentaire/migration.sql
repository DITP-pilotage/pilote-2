-- CreateTable
CREATE TABLE "commentaire" (
    "id" TEXT NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "auteur" TEXT NOT NULL,
    "maille" TEXT NOT NULL,
    "code_insee" TEXT NOT NULL,

    CONSTRAINT "commentaire_pkey" PRIMARY KEY ("id")
);
