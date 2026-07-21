La Documentation officielle a été suivie pour la création de assets de Keycloak dans le répertoire `/auth` du repository. Pour rappel, le pattern utilisé est un monorepo (voir références en fin d'article).

Voir aussi :

- [/auth/README.md](/DITP-pilotage/pilote-2/blob/main/auth/README.md)
- [Renouvellement SSL / TLS (ACME HTTP-01)](./docs/renouvellement-ssl.md)

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

## Build Keycloak optimisé (`--optimized`)

### Le problème

Au boot, `kc.sh start` relance automatiquement le **build d'augmentation
Quarkus** dès qu'un changement de configuration est détecté (log
« Changes detected in configuration. Updating the server image »). Ce build est
gourmand en RAM et se faisait **OOM-killer** dans le dyno Scalingo (process java
`Killed` = SIGKILL), ce qui mettait l'app en crash-loop.

### La solution

Le repo **versionne toute la distribution Keycloak** (`bin/`, `lib/quarkus/`,
`conf/`, `themes/`…). Le build d'augmentation écrit justement dans
`lib/quarkus/*`. On **bake l'augmentation une fois** et on **committe** le
résultat, puis le dyno démarre en `--optimized` sur ces artefacts déjà
construits. C'est le pattern Keycloak officiel (`build` puis `start
--optimized`), transposé au vendoring déjà en place.

Concrètement :

- `scripts/start.sh` lance `kc.sh start --optimized` → **aucun build à runtime**,
  donc plus d'OOM.
- Les artefacts `lib/quarkus/*` sont versionnés et suffisent au boot.
- `conf/keycloak.conf` fixe `db=postgres`, une option **build-time** : elle est
  bakée dans les artefacts et **doit** correspondre au runtime (`create-env.sh`
  exporte `KC_DB=postgres`).

> Pourquoi pas un build au build-time via buildpack ? `kc.sh build` a besoin de
> Java, or le buildpack `nodejs` tourne avant `jvm-common`. Réordonner les
> buildpacks échoue au deploy : `jvm-common` est un buildpack helper qui cherche
> `system.properties` à la racine du build, alors que c'est `nodejs` qui
> relocalise `PROJECT_DIR`. Il ne peut donc pas passer en premier, et il n'y a
> pas de hook build après lui. Préconstruire + committer contourne tout ça.

### Régénérer les artefacts

Toute modification d'une option **build-time** de Keycloak (vendor `db`,
`features`, `cache`, `metrics-enabled`…) ou tout ajout de provider dans
`providers/` nécessite de régénérer et committer les artefacts :

```bash
pnpm run build:keycloak   # = bash bin/kc.sh build
git add lib/quarkus/
```

Sans ça, `start --optimized` refuse de démarrer si une option build-time diffère
de ce qui a été baké.

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
