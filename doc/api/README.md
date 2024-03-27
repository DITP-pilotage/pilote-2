# API Pilote

Ce dossier contient la documentation de l'API Pilote.

## Edition

Pour éditer simplement le fichier de spécifications OpenAPI, l'outil *Stoplight Studio* fonctionne très bien et est très complet. Si c'est la première fois que vous souhaitez éditer ce fichier, veuillez suivre les étapes suivantes:

- Télécharger *Stoplight Studio* sur le [repo Github](https://github.com/stoplightio/studio/releases)
- Créer un compte et un *workspace* en ligne sur [stoplight.io](https://stoplight.io/welcome). L'adresse utilisée pourra être une adresse jetable. Cette étape est utile pour ouvrir l'application lors de sa première ouverture
- Lancer *Stoplight Studio* et se connecter avec les identifiants de l'étape précédente
- Cliquer sur *Ouvrir un dossier* et sélectionner le dossier contenant le fichier de spécifications `pilote-api.yaml`
- Vous pouvez désormais éditer la spécification

## Exposition

Pour exposer la documentation, on utilise [Swagger UI](https://swagger.io/tools/swagger-ui/) qui permet de visualiser et tester les différents endpoints de l'API.

Pour lancer cette documentation interactive:

- Copier `.env.example` vers `.env` (`cp .env.example .env`)
- Lancer `docker-compose up`
- Se rendre sur `localhost:<port>` (le port est spécifié dans le fichier `.env`)

## Testing

Pour tester des requêtes, on peut utiliser l'outil *Bruno*, voir le dossier [api/testing/bruno/](testing/bruno/).
