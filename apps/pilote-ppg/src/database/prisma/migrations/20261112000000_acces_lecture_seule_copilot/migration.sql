-- Accès en lecture seule de copilot (plateforme data, github.com/DITP-pilotage/copilot),
-- qui importe des tables de cette base : il se connectait jusqu'ici avec l'utilisateur
-- propriétaire, donc avec tous les droits.
--
-- Le rôle `copilot` est créé hors migration, par Scalingo
-- (`scalingo database-users-create --read-only copilot`), qui ne lui donne la lecture
-- que sur le schéma `public`. On l'étend ici aux autres schémas que copilot importe.
-- ALTER DEFAULT PRIVILEGES couvre les tables créées plus tard par l'utilisateur qui
-- joue les migrations, dont celles que dbt recrée à chaque run.
--
-- Sans effet là où le rôle n'existe pas (local, CI) ; un schéma absent est ignoré.
DO $$
DECLARE
  schema_name name;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'copilot') THEN
    FOR schema_name IN
      SELECT nspname FROM pg_namespace
      WHERE nspname IN ('public', 'raw_data', 'marts', 'barometre')
    LOOP
      EXECUTE format('GRANT USAGE ON SCHEMA %I TO copilot', schema_name);
      EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO copilot', schema_name);
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT ON TABLES TO copilot',
        schema_name
      );
    END LOOP;
  END IF;
END $$;
