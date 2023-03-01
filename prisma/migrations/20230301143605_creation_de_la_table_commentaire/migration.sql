-- CreateTable
CREATE TABLE "commentaire" (
    "id" SERIAL NOT NULL,
    "chantier_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "date" TIMESTAMP,
    "auteur" TEXT,

    CONSTRAINT "commentaire_pkey" PRIMARY KEY ("id")
);
