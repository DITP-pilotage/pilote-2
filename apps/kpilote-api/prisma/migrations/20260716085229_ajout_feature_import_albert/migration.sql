-- This is an empty migration.

INSERT INTO "feature" ("id", "key", "nom", "etat", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'IMPORT_ALBERT', 'Import assisté par Albert', 'DESACTIVE', now(), now());