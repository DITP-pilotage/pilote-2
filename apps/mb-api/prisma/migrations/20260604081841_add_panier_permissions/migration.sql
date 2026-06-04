-- AlterTable (add nullable column to allow backfill)
ALTER TABLE "panier" ADD COLUMN "visibilite" "visibilite_enum";

-- Backfill existing paniers as PUBLIC (comportement antérieur : tous les paniers
-- étaient accessibles sans filtrage).
UPDATE "panier" SET "visibilite" = 'PUBLIC' WHERE "visibilite" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "panier" ALTER COLUMN "visibilite" SET NOT NULL;

-- CreateTable
CREATE TABLE "panier_permission" (
    "principal_id" UUID NOT NULL,
    "panier_id" UUID NOT NULL,
    "action" "permission_action_enum" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panier_permission_pkey" PRIMARY KEY ("principal_id", "panier_id", "action")
);

-- CreateIndex
CREATE INDEX "panier_permission_panier_id_idx" ON "panier_permission"("panier_id");

-- AddForeignKey
ALTER TABLE "panier_permission" ADD CONSTRAINT "panier_permission_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "principal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panier_permission" ADD CONSTRAINT "panier_permission_panier_id_fkey" FOREIGN KEY ("panier_id") REFERENCES "panier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
