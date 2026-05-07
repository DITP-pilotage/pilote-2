-- Suppression du provider_type : ProConnect est le seul IdP supporté.
DROP INDEX "utilisateur_provider_sub_provider_type_key";

ALTER TABLE "utilisateur" DROP COLUMN "provider_type";

DROP TYPE "ProviderType";

CREATE UNIQUE INDEX "utilisateur_provider_sub_key" ON "utilisateur"("provider_sub");
