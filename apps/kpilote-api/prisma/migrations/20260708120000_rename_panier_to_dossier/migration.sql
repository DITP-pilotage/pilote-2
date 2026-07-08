-- Renommage du concept "panier" → "dossier"

-- 1. Enum (avant les tables qui l'utilisent)
ALTER TYPE "panier_commentaire_type_enum" RENAME TO "dossier_commentaire_type_enum";

-- 2. Tables feuilles (sans dépendance sortante vers panier)
ALTER TABLE "panier_permission" RENAME TO "dossier_permission";
ALTER TABLE "panier_indicateur" RENAME TO "dossier_indicateur";
ALTER TABLE "panier_responsable" RENAME TO "dossier_responsable";
ALTER TABLE "panier_contact_utile" RENAME TO "dossier_contact_utile";
ALTER TABLE "panier_commentaire" RENAME TO "dossier_commentaire";

-- 3. Table racine
ALTER TABLE "panier" RENAME TO "dossier";
