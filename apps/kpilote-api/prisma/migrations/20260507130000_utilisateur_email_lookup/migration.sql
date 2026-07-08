-- Bascule vers un matching email-first (sub devient un cache hint).
-- Aucun mapping des comptes existants : on repart d'une base propre.
DELETE FROM "utilisateur";

ALTER TABLE "utilisateur" ADD COLUMN "email" TEXT NOT NULL;
ALTER TABLE "utilisateur" ALTER COLUMN "provider_sub" DROP NOT NULL;
ALTER TABLE "utilisateur" ALTER COLUMN "provider_type" DROP NOT NULL;

CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");
