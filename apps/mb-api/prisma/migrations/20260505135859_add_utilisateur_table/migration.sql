-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('keycloak');

-- CreateTable
CREATE TABLE "utilisateur" (
    "id" UUID NOT NULL,
    "provider_sub" TEXT NOT NULL,
    "provider_type" "ProviderType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_provider_sub_provider_type_key" ON "utilisateur"("provider_sub", "provider_type");
