-- CreateTable
CREATE TABLE "public"."erreur_validation_fichier" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "cellule" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "nom_du_champ" TEXT NOT NULL,
    "numero_de_ligne" INTEGER NOT NULL,
    "position_de_ligne" INTEGER NOT NULL,
    "position_du_champ" INTEGER NOT NULL,
    "rapport_id" UUID NOT NULL,

    CONSTRAINT "erreur_validation_fichier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."erreur_validation_fichier" ADD CONSTRAINT "erreur_validation_fichier_rapport_id_fkey" FOREIGN KEY ("rapport_id") REFERENCES "public"."rapport_import_mesure_indicateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
