source .env

echo ">> Anonymisation des utilisateurs..."
time psql -d "$DATABASE_URL" -c "
UPDATE utilisateur
SET email = REPLACE(CONCAT(id, '@example.com'), ' ', '')
WHERE email NOT LIKE '%@example%' AND email <> 'import.csv@modernisation.gouv.fr';
"
