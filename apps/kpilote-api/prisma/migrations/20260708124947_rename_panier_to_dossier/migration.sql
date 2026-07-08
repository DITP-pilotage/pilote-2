-- AlterTable
ALTER TABLE "dossier" RENAME CONSTRAINT "panier_pkey" TO "dossier_pkey";

-- AlterTable
ALTER TABLE "dossier_commentaire" RENAME CONSTRAINT "panier_commentaire_pkey" TO "dossier_commentaire_pkey";

-- AlterTable
ALTER TABLE "dossier_contact_utile" RENAME CONSTRAINT "panier_contact_utile_pkey" TO "dossier_contact_utile_pkey";

-- AlterTable
ALTER TABLE "dossier_indicateur" RENAME CONSTRAINT "panier_indicateur_pkey" TO "dossier_indicateur_pkey";

-- AlterTable
ALTER TABLE "dossier_permission" RENAME CONSTRAINT "panier_permission_pkey" TO "dossier_permission_pkey";

-- AlterTable
ALTER TABLE "dossier_responsable" RENAME CONSTRAINT "panier_responsable_pkey" TO "dossier_responsable_pkey";

-- RenameForeignKey
ALTER TABLE "dossier_commentaire" RENAME CONSTRAINT "panier_commentaire_commentaire_id_fkey" TO "dossier_commentaire_commentaire_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_commentaire" RENAME CONSTRAINT "panier_commentaire_panier_id_fkey" TO "dossier_commentaire_panier_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_contact_utile" RENAME CONSTRAINT "panier_contact_utile_contact_utile_id_fkey" TO "dossier_contact_utile_contact_utile_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_contact_utile" RENAME CONSTRAINT "panier_contact_utile_panier_id_fkey" TO "dossier_contact_utile_panier_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_indicateur" RENAME CONSTRAINT "panier_indicateur_indicateur_id_fkey" TO "dossier_indicateur_indicateur_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_indicateur" RENAME CONSTRAINT "panier_indicateur_panier_id_fkey" TO "dossier_indicateur_panier_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_permission" RENAME CONSTRAINT "panier_permission_panier_id_fkey" TO "dossier_permission_panier_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_permission" RENAME CONSTRAINT "panier_permission_principal_id_fkey" TO "dossier_permission_principal_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_responsable" RENAME CONSTRAINT "panier_responsable_panier_id_fkey" TO "dossier_responsable_panier_id_fkey";

-- RenameForeignKey
ALTER TABLE "dossier_responsable" RENAME CONSTRAINT "panier_responsable_utilisateur_id_fkey" TO "dossier_responsable_utilisateur_id_fkey";

-- RenameIndex
ALTER INDEX "panier_public_id_key" RENAME TO "dossier_public_id_key";

-- RenameIndex
ALTER INDEX "panier_commentaire_panier_id_idx" RENAME TO "dossier_commentaire_panier_id_idx";

-- RenameIndex
ALTER INDEX "panier_contact_utile_panier_id_idx" RENAME TO "dossier_contact_utile_panier_id_idx";

-- RenameIndex
ALTER INDEX "panier_indicateur_panier_id_created_at_idx" RENAME TO "dossier_indicateur_panier_id_created_at_idx";

-- RenameIndex
ALTER INDEX "panier_permission_panier_id_idx" RENAME TO "dossier_permission_panier_id_idx";

-- RenameIndex
ALTER INDEX "panier_responsable_panier_id_created_at_idx" RENAME TO "dossier_responsable_panier_id_created_at_idx";
