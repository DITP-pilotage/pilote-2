# Scripts

## Webapp

Pour réinitialiser la base de données avec prisma, exécuter

```sh
# Reset db [docker]
docker compose run --rm pilote_webapp /bin/bash scripts/prisma_reset_and_migrate.sh
## [local]
/bin/bash scripts/prisma_reset_and_migrate.sh
```

Les commandes `npm` (*lint, test, ...*) sont également éxécutables via Docker:

```sh
# Commande npm [docker]
docker compose run --rm pilote_webapp npm run lint
# [local]
npm run lint
```

## Scripts "daily"

Voir [daily](./daily).
