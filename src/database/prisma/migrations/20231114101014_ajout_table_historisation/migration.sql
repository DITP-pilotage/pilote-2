-- CreateTable
CREATE TABLE "public"."historisation_modification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "typeDeModification" TEXT NOT NULL,
    "dateDeModification" TEXT NOT NULL,
    "tableModifieId" TEXT NOT NULL,
    "ancienneValeur" JSONB,
    "nouvelleValeur" JSONB,

    CONSTRAINT "historisation_modification_pkey" PRIMARY KEY ("id")
);
