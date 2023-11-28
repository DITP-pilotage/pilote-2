-- CreateTable
CREATE TABLE "public"."historisation_modification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_objet_modifie" TEXT NOT NULL,
    "utilisateur_nom" TEXT NOT NULL,
    "type_de_modification" TEXT NOT NULL,
    "date_de_modification" TEXT NOT NULL,
    "table_modifie_id" TEXT NOT NULL,
    "ancienne_valeur" JSONB,
    "nouvelle_valeur" JSONB,

    CONSTRAINT "historisation_modification_pkey" PRIMARY KEY ("id")
);
