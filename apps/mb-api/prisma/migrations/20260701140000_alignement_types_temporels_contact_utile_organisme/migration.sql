-- DropForeignKey
ALTER TABLE "contact_utile" DROP CONSTRAINT "contact_utile_organisme_id_fkey";

-- DropForeignKey
ALTER TABLE "panier_contact_utile" DROP CONSTRAINT "panier_contact_utile_contact_utile_id_fkey";

-- DropForeignKey
ALTER TABLE "panier_contact_utile" DROP CONSTRAINT "panier_contact_utile_panier_id_fkey";

-- AlterTable
ALTER TABLE "contact_utile" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organisme" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "panier_contact_utile" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "panier_responsable" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "contact_utile" ADD CONSTRAINT "contact_utile_organisme_id_fkey" FOREIGN KEY ("organisme_id") REFERENCES "organisme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panier_contact_utile" ADD CONSTRAINT "panier_contact_utile_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "panier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panier_contact_utile" ADD CONSTRAINT "panier_contact_utile_contact_utile_id_fkey" FOREIGN KEY ("contact_utile_id") REFERENCES "contact_utile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

