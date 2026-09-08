-- Trace le fournisseur d'identité utilisé lors de la dernière connexion réussie.
-- Nullable : les comptes existants n'ont pas d'historique.
ALTER TABLE "utilisateur" ADD COLUMN "dernier_provider_connexion" TEXT;
