-- CreateTable
CREATE TABLE "utilisateur" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "profil_id" UUID NOT NULL,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateur_chantier" (
    "utilisateur_id" UUID NOT NULL,
    "chantier_id" TEXT NOT NULL,

    CONSTRAINT "utilisateur_chantier_pkey" PRIMARY KEY ("utilisateur_id","chantier_id")
);

-- CreateTable
CREATE TABLE "profil" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profil_habilitation" (
    "profil_id" UUID NOT NULL,
    "habilitation_scope_id" UUID NOT NULL,

    CONSTRAINT "profil_habilitation_pkey" PRIMARY KEY ("profil_id","habilitation_scope_id")
);

-- CreateTable
CREATE TABLE "habilitation_scope" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "habilitation_scope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profil_code_key" ON "profil"("code");

-- CreateIndex
CREATE UNIQUE INDEX "profil_nom_key" ON "profil"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "habilitation_scope_code_key" ON "habilitation_scope"("code");

-- CreateIndex
CREATE UNIQUE INDEX "habilitation_scope_nom_key" ON "habilitation_scope"("nom");
