-- CreateEnum
CREATE TYPE "permission_action_enum" AS ENUM ('READ', 'WRITE');

-- CreateTable
CREATE TABLE "principal" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "principal_pkey" PRIMARY KEY ("id")
);

-- Backfill principal from existing utilisateur and api_key rows
INSERT INTO "principal" ("id", "created_at")
SELECT "id", "created_at" FROM "utilisateur"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "principal" ("id", "created_at")
SELECT "id", "created_at" FROM "api_key"
ON CONFLICT ("id") DO NOTHING;

-- AddForeignKey
ALTER TABLE "utilisateur" ADD CONSTRAINT "utilisateur_id_fkey" FOREIGN KEY ("id") REFERENCES "principal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_id_fkey" FOREIGN KEY ("id") REFERENCES "principal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "indicateur_permission" (
    "principal_id" UUID NOT NULL,
    "indicateur_id" UUID NOT NULL,
    "action" "permission_action_enum" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateur_permission_pkey" PRIMARY KEY ("principal_id", "indicateur_id", "action")
);

-- CreateIndex
CREATE INDEX "indicateur_permission_indicateur_id_idx" ON "indicateur_permission"("indicateur_id");

-- AddForeignKey
ALTER TABLE "indicateur_permission" ADD CONSTRAINT "indicateur_permission_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "principal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_permission" ADD CONSTRAINT "indicateur_permission_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
