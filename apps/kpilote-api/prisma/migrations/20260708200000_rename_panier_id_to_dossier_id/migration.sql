-- Renomme la colonne panier_id → dossier_id dans toutes les tables dossier_*
ALTER TABLE "dossier_permission"    RENAME COLUMN "panier_id" TO "dossier_id";
ALTER TABLE "dossier_indicateur"    RENAME COLUMN "panier_id" TO "dossier_id";
ALTER TABLE "dossier_responsable"   RENAME COLUMN "panier_id" TO "dossier_id";
ALTER TABLE "dossier_contact_utile" RENAME COLUMN "panier_id" TO "dossier_id";
ALTER TABLE "dossier_commentaire"   RENAME COLUMN "panier_id" TO "dossier_id";
