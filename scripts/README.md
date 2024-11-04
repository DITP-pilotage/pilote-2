# Scripts webapp


Pour réinitialiser la base de données avec prisma, exécuter

```sh
# En local
/bin/bash scripts/prisma_reset_and_migrate.sh
# Via docker
docker compose run --rm pilote_webapp /bin/bash scripts/prisma_reset_and_migrate.sh
```

Les commandes `npm` (*lint, test, ...*) sont également éxécutables via Docker:

```sh
# En local
npm run lint
# Via docker
docker compose run --rm pilote_webapp npm run lint
```

# Scripts "daily"

Voir [daily](./daily).
