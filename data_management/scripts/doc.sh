## dbt docs
echo "-- [log] Chargement des variables d'env depuis le .env"
source .env
echo "-- [dbt.docs] Génération de la doc"
pipenv run dbt docs generate --profiles-dir . --project-dir data_factory/ 
echo "-- [dbt.docs] Lancement du serveur de doc"
pipenv run dbt docs serve --profiles-dir . --project-dir data_factory/ &

## Prisma studio
echo "-- [prisma.studio] Lancement de prisma studio"
npx prisma studio --schema ../src/database/prisma/schema.prisma