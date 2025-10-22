-- AlterTable
ALTER TABLE "public"."referentiel_objectif" ADD COLUMN     "tutelle_id" UUID;

-- CreateTable
CREATE TABLE "public"."referentiel_tutelle" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referentiel_tutelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instruction_objectif" (
    "id" UUID NOT NULL,
    "objectif_id" UUID NOT NULL,
    "rattachement_utilisateur_etape_jalon_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruction_objectif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instruction_critere" (
    "id" UUID NOT NULL,
    "critere_id" UUID NOT NULL,
    "rattachement_utilisateur_etape_jalon_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruction_critere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instruction_objectif_objectif_id_rattachement_utilisateur_e_key" ON "public"."instruction_objectif"("objectif_id", "rattachement_utilisateur_etape_jalon_id");

-- CreateIndex
CREATE UNIQUE INDEX "instruction_critere_critere_id_rattachement_utilisateur_eta_key" ON "public"."instruction_critere"("critere_id", "rattachement_utilisateur_etape_jalon_id");

-- AddForeignKey
ALTER TABLE "public"."referentiel_objectif" ADD CONSTRAINT "referentiel_objectif_tutelle_id_fkey" FOREIGN KEY ("tutelle_id") REFERENCES "public"."referentiel_tutelle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instruction_objectif" ADD CONSTRAINT "instruction_objectif_objectif_id_fkey" FOREIGN KEY ("objectif_id") REFERENCES "public"."referentiel_objectif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instruction_objectif" ADD CONSTRAINT "instruction_objectif_rattachement_utilisateur_etape_jalon__fkey" FOREIGN KEY ("rattachement_utilisateur_etape_jalon_id") REFERENCES "public"."rattachement_utilisateur_etape_jalon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instruction_critere" ADD CONSTRAINT "instruction_critere_critere_id_fkey" FOREIGN KEY ("critere_id") REFERENCES "public"."referentiel_critere"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instruction_critere" ADD CONSTRAINT "instruction_critere_rattachement_utilisateur_etape_jalon_i_fkey" FOREIGN KEY ("rattachement_utilisateur_etape_jalon_id") REFERENCES "public"."rattachement_utilisateur_etape_jalon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
