-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('keycloak');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "provider_sub" TEXT NOT NULL,
    "provider_type" "ProviderType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_provider_sub_provider_type_key" ON "user"("provider_sub", "provider_type");
