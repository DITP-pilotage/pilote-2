-- CreateTable
CREATE TABLE "referentiel" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referentiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individu" (
    "id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referentiel_individu" (
    "referentiel_id" UUID NOT NULL,
    "individu_id" UUID NOT NULL,

    CONSTRAINT "referentiel_individu_pkey" PRIMARY KEY ("referentiel_id","individu_id")
);

-- CreateTable
CREATE TABLE "relation" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "parent_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valeur_avancement" (
    "id" UUID NOT NULL,
    "indicateur_id" UUID NOT NULL,
    "individu_id" UUID NOT NULL,
    "date_observation" TEXT NOT NULL,
    "valeur" DECIMAL(18,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valeur_avancement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referentiel_public_id_key" ON "referentiel"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "individu_public_id_key" ON "individu"("public_id");

-- CreateIndex
CREATE INDEX "referentiel_individu_individu_id_idx" ON "referentiel_individu"("individu_id");

-- CreateIndex
CREATE INDEX "relation_parent_id_type_idx" ON "relation"("parent_id", "type");

-- CreateIndex
CREATE INDEX "relation_child_id_type_idx" ON "relation"("child_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "relation_type_parent_id_child_id_key" ON "relation"("type", "parent_id", "child_id");

-- CreateIndex
CREATE INDEX "valeur_avancement_indicateur_id_date_observation_idx" ON "valeur_avancement"("indicateur_id", "date_observation");

-- CreateIndex
CREATE INDEX "valeur_avancement_individu_id_date_observation_idx" ON "valeur_avancement"("individu_id", "date_observation");

-- CreateIndex
CREATE UNIQUE INDEX "valeur_avancement_indicateur_id_individu_id_date_observatio_key" ON "valeur_avancement"("indicateur_id", "individu_id", "date_observation");

-- AddForeignKey
ALTER TABLE "referentiel_individu" ADD CONSTRAINT "referentiel_individu_referentiel_id_fkey" FOREIGN KEY ("referentiel_id") REFERENCES "referentiel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referentiel_individu" ADD CONSTRAINT "referentiel_individu_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relation" ADD CONSTRAINT "relation_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "individu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relation" ADD CONSTRAINT "relation_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "individu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valeur_avancement" ADD CONSTRAINT "valeur_avancement_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valeur_avancement" ADD CONSTRAINT "valeur_avancement_individu_id_fkey" FOREIGN KEY ("individu_id") REFERENCES "individu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
