-- Renommage du concept "panier" → "collection" (étape 3/3 : suppression des anciennes tables).
-- Les données ont été copiées vers collection_* à l'étape précédente ; on supprime
-- désormais les tables panier_* et l'enum associé. À l'issue de cette migration, le
-- schéma physique correspond exactement au schéma Prisma (plus aucune table panier_*).
-- L'ordre respecte les contraintes de clés étrangères (tables feuilles en premier).

-- DropTable
DROP TABLE "panier_commentaire";

-- DropTable
DROP TABLE "panier_contact_utile";

-- DropTable
DROP TABLE "panier_responsable";

-- DropTable
DROP TABLE "panier_indicateur";

-- DropTable
DROP TABLE "panier_permission";

-- DropTable
DROP TABLE "panier";

-- DropEnum
DROP TYPE "panier_commentaire_type_enum";
