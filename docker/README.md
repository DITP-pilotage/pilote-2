# Docker pour la webapp

```sh
# Exécuter une commande npm
docker compose run --rm pilote_webapp npm run lint
# Reset la db
docker compose run --rm pilote_webapp /bin/bash scripts/prisma_reset_and_migrate.sh
```

