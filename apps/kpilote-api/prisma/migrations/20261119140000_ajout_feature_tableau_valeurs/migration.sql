-- Tableau des valeurs par axe sur la fiche indicateur : masqué tant que la feature est désactivée.
INSERT INTO "feature" ("id", "key", "nom", "etat", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'TABLEAU_VALEURS', 'Tableau des valeurs par axe sur la fiche indicateur', 'DESACTIVE', now(), now());
