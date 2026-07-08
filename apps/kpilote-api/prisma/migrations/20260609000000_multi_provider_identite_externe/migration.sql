-- Remplace la colonne provider_sub nullable sur utilisateur
-- par une table identite_externe (provider, provider_sub) → utilisateur_id.
-- Permet à un même utilisateur d'avoir des identités ProConnect et Keycloak.

DELETE FROM "utilisateur" WHERE "provider_sub" IS NULL;

CREATE TYPE "provider_type_enum" AS ENUM ('proconnect', 'keycloak');

CREATE TABLE "identite_externe" (
    "provider"       "provider_type_enum" NOT NULL,
    "provider_sub"   TEXT                 NOT NULL,
    "utilisateur_id" UUID                 NOT NULL,
    "created_at"     TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "identite_externe_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("provider", "provider_sub")
);

CREATE INDEX "identite_externe_utilisateur_id_idx" ON "identite_externe"("utilisateur_id");

INSERT INTO "identite_externe" ("provider", "provider_sub", "utilisateur_id", "created_at")
SELECT 'proconnect', "provider_sub", "id", "created_at"
FROM "utilisateur"
WHERE "provider_sub" IS NOT NULL;

ALTER TABLE "utilisateur" DROP COLUMN "provider_sub";
