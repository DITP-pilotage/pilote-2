-- CreateTable
CREATE TABLE "perm_chantier_permission" (
    "chantier_id" TEXT NOT NULL,
    "identite_id" TEXT NOT NULL,
    "scope" TEXT[],

    CONSTRAINT "perm_chantier_permission_pkey" PRIMARY KEY ("chantier_id","identite_id")
);
