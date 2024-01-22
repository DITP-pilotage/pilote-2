#0
dbt deps --project-dir data_factory
#0
npx prisma migrate reset --schema ../src/database/prisma/schema.prisma
npx prisma generate --schema ../src/database/prisma/schema.prisma
npx prisma migrate dev --schema ../src/database/prisma/schema.prisma

#4
if [ SEED_DB=='true' ];
then
    echo ">> Seeding database"
    dbt run --project-dir data_factory --select seeds_
fi

#2.1
rm -rf "$PPG_METADATA_DIRECTORY"
mkdir "$PPG_METADATA_DIRECTORY"
git clone "https://$PPG_METADATA_GITHUB_TOKEN@github.com/DITP-pilotage/PPG_metadata.git" "$PPG_METADATA_DIRECTORY" -b $PPG_METADATA_GITHUB_BRANCH --depth 1

#2.2
dbt run --project-dir data_factory --select raw.ppg_metadata

#5

dbt run --project-dir data_factory --select staging --exclude raw.dfakto+

#7

psql "$DATABASE_URL" -c "UPDATE public.axe SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.perimetre SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.ppg SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.chantier SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.indicateur SET a_supprimer = TRUE"
psql "$DATABASE_URL" -c "UPDATE public.ministere SET a_supprimer = TRUE"

dbt run --project-dir data_factory --select intermediate exposition df3 --exclude raw.dfakto+

if [ $? -eq 0 ]; then
  psql "$DATABASE_URL" -c "DELETE FROM public.axe WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.perimetre WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.ppg WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.chantier WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.indicateur WHERE a_supprimer = TRUE"
  psql "$DATABASE_URL" -c "DELETE FROM public.ministere WHERE a_supprimer = TRUE"
  # Add similar delete queries for other tables if needed
else
  echo "dbt job failed. Skipping delete queries."
fi
