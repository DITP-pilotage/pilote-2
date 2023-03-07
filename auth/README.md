La Documentation officielle a été suivie pour la création de assets de Keycloak dans le répertoire `/auth` du repository. Pour rappel, le pattern utilisé est un monorepo (voir références en fin d'article).

Voir aussi :

- [/auth/README.md](/DITP-pilotage/pilote-2/blob/main/auth/README.md)

## Installation dans une app scalingo

Nous avons suivi les étapes suivantes.

Pour l'env de DEV:

1. Création d'un application
1. Ajout d'un addon PostgreSQL
1. Créer les variables d'environnement dans les variables d'env (cf annexe)
1. Ajouter la remote URL Git de l'application Scalingo cible, en la nommant par
   exemple `scalingo-keycloak`
1. Lancer le déploiement en faisant un git push sur le remote Scalingo, par
   exemple `git push scalingo-keycloak <local_branche>:master`

Note : comme l'application Keycloak a vocation à être stable, et que nous
développons sur un monorepo, nous avons préféré ne pas déclencher de
redéploiement à chaque push et conserver ce déploiement manuel. Ça évite de
déclencher un redéploiement de l'IAM à chaque changement de la WebApp par
exemple.

Variables d'env à configurer sur l'application Scalingo :

```ini
BUILDPACK_URL=https://github.com/Scalingo/buildpack-jvm-common
KC_HTTPS_PORT=443
KC_HTTP_PORT=$PORT
KC_PROXY=edge
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<MON_MOT_DE_PASSE>
PROJECT_DIR=auth
```

## Configuration de la WebApp

```ini
KEYCLOAK_CLIENT_ID=pilote
KEYCLOAK_CLIENT_SECRET=<secret-généré-par-keycloak>
KEYCLOAK_ISSUER=https://dev-keycloak-ditp.osc-fr1.scalingo.io/realms/DITP
NEXTAUTH_SECRET=<secret-nextauth-à-générer>  # Voir ci-dessous
NEXTAUTH_URL=https://dev-pilote-ditp.osc-fr1.scalingo.io
```

Générer un secret pour `NEXTAUTH_SECRET` :

```bash
openssl rand -base64 32
```

Note : on avait mis un backslash à la fin de `NEXTAUTH_URL` et ça créait une
erreur de type `error: OPError: invalid_grant (Incorrect redirect_uri)`

Note : ce qui est secret a été remplacé, ce qui n'est pas secret est à titre
d'exemple.

## Références

### Liens

- Guide to deploy Keycloak on Scalingo ~ https://scalingo.com/blog/guide-to-deploy-keycloak-on-scalingo
- Deploying multiple apps from a mono repository on Scalingo ~ https://scalingo.com/blog/monorepo
- Keycloak Server Configuration Guides ~ https://www.keycloak.org/guides#server

### Keycloak

To get help configuring Keycloak via the CLI, run:

on Linux/Unix:

    $ bin/kc.sh

on Windows:

    $ bin\kc.bat

To try Keycloak out in development mode, run: 

on Linux/Unix:

    $ bin/kc.sh start-dev

on Windows:

    $ bin\kc.bat start-dev

After the server boots, open http://localhost:8080 in your web browser. The welcome page will indicate that the server is running.

To get started, check out the [configuration guides](https://www.keycloak.org/guides#server).
