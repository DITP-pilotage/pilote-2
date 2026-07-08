-- Cut-over net Keycloak -> ProConnect : aucun mapping des sub existants.
DELETE FROM "utilisateur";

ALTER TYPE "ProviderType" RENAME VALUE 'keycloak' TO 'proconnect';
