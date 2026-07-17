# Renouvellement automatique des certificats SSL (Sectigo / ACME HTTP-01)

## Contexte

Les domaines publics de la plateforme sont servis par des apps Scalingo. Le TLS
est terminé côté Scalingo (le certificat est poussé sur le domaine via l'API
Scalingo). Il faut automatiser l'émission/renouvellement de ces certificats via
l'autorité ACME de Sectigo.

Deux apps portent des domaines publics et savent répondre au challenge ACME
**HTTP-01** grâce à un mécanisme de _challenge push_ déjà implémenté :

| App | Sert le challenge | Push (POST) | Cleanup (DELETE) |
|---|---|---|---|
| **pilote-ppg** (Next.js) | `GET /.well-known/acme-challenge/:token` (rewrite Next → `/api/acme-challenge/:token`) | `POST /api/admin/acme-challenge` body `{token, keyAuthorization}` | `DELETE /api/admin/acme-challenge?token=…` |
| **pilote-ppg-auth** (Keycloak, via `acme-proxy` Hono) | `GET /.well-known/acme-challenge/:token` (store mémoire) | `POST /api/acme/challenge` body `{token, keyAuthorization}` | `DELETE /api/acme/challenge/:token` |

Dans les deux cas :
- la route de push est protégée par un header `Authorization: Bearer <ACME_UPLOAD_API_KEY>` ;
- le challenge est stocké **en mémoire** dans le dyno et servi sur le chemin `/.well-known/acme-challenge/:token` public.

Le mécanisme attend explicitement un client ACME de type **certbot** (cf. commentaire
`apps/pilote-ppg-auth/scripts/start.sh`) : le client émet le certificat, dépose la
`keyAuthorization` via la route de push, la CA la lit sur le domaine public, puis le
client nettoie.

## Objectif

Un workflow GitHub Actions qui, sur planification mensuelle et sur déclenchement
manuel, émet/renouvelle les certificats Sectigo pour les domaines des apps
`pilote-ppg` (webapp) et `pilote-ppg-auth` (keycloak), sur les environnements
`prod`, `preprod`, `dev`, puis pousse chaque certificat sur le domaine Scalingo
correspondant.

## Choix de conception

### Client ACME : certbot (pas lego)

Le modèle de référence (autre projet) utilisait `lego` en **DNS-01 Cloudflare**.
Ici on est en **HTTP-01 « push »** : le client doit déposer le challenge dans une
API distante (la route de push de l'app), pas sur un webroot local ni via DNS.

`lego` en HTTP-01 ne sait faire que `standalone` / `webroot` / `memcached` / `s3` —
aucun mécanisme pour pousser vers une API custom distante. `certbot --manual` avec
`--manual-auth-hook` / `--manual-cleanup-hook` correspond exactement au besoin (et
au commentaire du code) : le hook d'auth POST le challenge, le hook de cleanup le
DELETE.

### Matrice via GitHub Environments

La matrice est le produit cartésien `environnement ∈ {prod, preprod, dev}` ×
`application ∈ {webapp, auth}` → 6 jobs (`fail-fast: false`).

Chaque job déclare `environment: ${{ matrix.environnement }}`, ce qui donne accès
aux **variables** et **secrets** scopés à cet Environment GitHub. Les valeurs
concrètes (domaine, nom d'app Scalingo) ne sont donc **pas** hardcodées dans le
workflow — elles vivent dans les `vars` de chaque Environment, cohérent avec le
reste de la conf déjà en base/plateforme.

### Région Scalingo

`osc-secnum-fr1` (comme les autres workflows du repo), base API
`https://api.osc-secnum-fr1.scalingo.com`. **Pas** `osc-fr1`.

## Configuration attendue (côté GitHub, hors code)

### Repository secrets (communs à tous les envs)
- `SECTIGO_ACME_EAB_KID` — l'ID EAB reçu de Sectigo.
- `SECTIGO_ACME_EAB_HMAC_KEY` — la clé HMAC EAB reçue de Sectigo.
- `ACME_EMAIL` — email du compte ACME.
- `SCALINGO_API_TOKEN` — token API Scalingo (identique pour tous les envs).

### Par Environment (`prod`, `preprod`, `dev`)
- **Variables** (`vars`, non sensibles) :
  - `WEBAPP_DOMAIN`, `WEBAPP_SCALINGO_APP` (requis)
  - `AUTH_DOMAIN`, `AUTH_SCALINGO_APP` (**optionnels** : si absents sur un env, le
    job `auth` de cet env se termine en _skipped_ propre)
- **Secret** :
  - `ACME_UPLOAD_API_KEY` — clé Bearer de la route de push de cet env (celle lue
    par `configuration().acme.uploadApiKey` côté pilote-ppg et `ACME_UPLOAD_API_KEY`
    côté acme-proxy).

### Non secret, dans le workflow
- `ACME_DIRECTORY_URL = https://acme.sectigo.com/v2/OV`.

### Protection rules
Les 3 environments n'ont **pas** de required reviewers, sinon le cron mensuel se
bloquerait en attente d'approbation manuelle à chaque exécution.

## Architecture du workflow

Fichier : `.github/workflows/renouvellement-ssl.yml`.

### Déclencheurs
- `schedule` : cron mensuel (1er du mois, ~03h UTC).
- `workflow_dispatch` avec un input `cible` : `tous` (défaut) / `prod` / `preprod` / `dev`.

### Filtrage de la matrice
Un job s'exécute si l'input `cible == tous` (ou déclenchement par cron) ou si
`cible == matrix.environnement`. Implémenté via une condition `if:` au niveau du
job (le job est marqué skipped sinon, sans échouer la run).

### Étapes d'un job

1. **Checkout** (pour disposer des scripts de hook versionnés).

2. **Résoudre la cible** : selon `matrix.application`, dériver dans l'env du step :
   - `DOMAINE` ← `vars.WEBAPP_DOMAIN` ou `vars.AUTH_DOMAIN`
   - `SCALINGO_APP` ← `vars.WEBAPP_SCALINGO_APP` ou `vars.AUTH_SCALINGO_APP`
   - `ACME_PUSH_PATH` ← `/api/admin/acme-challenge` (webapp) ou `/api/acme/challenge` (auth)
   - `ACME_DELETE_STYLE` ← `query` (webapp, `?token=`) ou `path` (auth, `/:token`)
   - Si `DOMAINE` est vide (env sans cette app) → le job se termine proprement en
     _skipped_ (log explicite, pas d'échec).

3. **Installer certbot** (version épinglée, via `pip` dans un venv ou `apt`).

4. **Émettre le certificat** :
   ```
   certbot certonly \
     --manual --preferred-challenges http \
     --server "$ACME_DIRECTORY_URL" \
     --eab-kid "$SECTIGO_ACME_EAB_KID" --eab-hmac-key "$SECTIGO_ACME_EAB_HMAC_KEY" \
     --email "$ACME_EMAIL" --agree-tos --no-eff-email \
     --key-type rsa2048 \
     --domain "$DOMAINE" \
     --config-dir "$GITHUB_WORKSPACE/.certbot/config" \
     --work-dir  "$GITHUB_WORKSPACE/.certbot/work" \
     --logs-dir  "$GITHUB_WORKSPACE/.certbot/logs" \
     --manual-auth-hook    "$GITHUB_WORKSPACE/scripts/acme/auth-hook.sh" \
     --manual-cleanup-hook "$GITHUB_WORKSPACE/scripts/acme/cleanup-hook.sh" \
     --non-interactive
   ```
   Le certificat émis se trouve dans `.certbot/config/live/$DOMAINE/{fullchain,privkey}.pem`.

5. **Vérifier le certificat émis** (repris du modèle) : nombre de certs dans le
   bundle (≥ 2 = leaf + intermédiaire(s)), subject/issuer/dates, cohérence
   clé privée ↔ certificat (comparaison des pubkeys). Échec dur si mismatch.

6. **Pousser sur Scalingo** :
   - échange `SCALINGO_API_TOKEN` → JWT (`POST https://auth.scalingo.com/v1/tokens/exchange`) ;
   - `GET /v1/apps/$SCALINGO_APP/domains` → trouver l'`id` du domaine `$DOMAINE` ;
   - `PATCH /v1/apps/$SCALINGO_APP/domains/$ID` avec `{domain:{tlscert, tlskey}}` ;
   - vérifier le code HTTP 2xx, logguer la réponse.

### Scripts de hook (versionnés)

`scripts/acme/auth-hook.sh` :
- lit `$CERTBOT_DOMAIN`, `$CERTBOT_TOKEN`, `$CERTBOT_VALIDATION` (fournis par certbot) ;
- lit `$ACME_PUSH_PATH`, `$ACME_UPLOAD_API_KEY` depuis l'env du job ;
- `POST https://$CERTBOT_DOMAIN$ACME_PUSH_PATH` avec `Authorization: Bearer …`,
  body JSON `{token, keyAuthorization}` (`keyAuthorization = $CERTBOT_VALIDATION`) ;
- **poll** `GET https://$CERTBOT_DOMAIN/.well-known/acme-challenge/$CERTBOT_TOKEN`
  jusqu'à recevoir la `keyAuthorization` attendue (timeout borné), pour garantir
  que le challenge est servi avant que la CA ne vérifie ;
- échec dur si le POST échoue ou si le poll expire.

`scripts/acme/cleanup-hook.sh` :
- selon `$ACME_DELETE_STYLE` : `DELETE …$ACME_PUSH_PATH?token=$CERTBOT_TOKEN`
  (query) ou `DELETE …$ACME_PUSH_PATH/$CERTBOT_TOKEN` (path), avec le Bearer ;
- best-effort : loggue mais n'échoue pas la run si le cleanup rate (le store est
  en mémoire, le challenge disparaîtra au prochain redéploiement de toute façon).

Ces scripts sont versionnés (testables, lisibles) plutôt qu'en heredoc inline.

## Gestion des erreurs

- `fail-fast: false` : l'échec d'un couple (env, app) n'annule pas les autres.
- `auth-hook` : échec dur si le challenge ne peut pas être déposé/servi → certbot
  reporte l'échec, le job est rouge pour ce couple uniquement.
- `cleanup-hook` : best-effort, n'échoue jamais le job.
- Push Scalingo : échec dur si code HTTP non-2xx.
- Vérification cert : échec dur si mismatch clé/cert.

## Points de vigilance / limitations connues

- **Store en mémoire non partagé entre dynos** : si une app web tourne sur > 1 dyno,
  la CA peut interroger un dyno qui n'a pas le token (le poll de l'auth-hook ne
  couvre pas ce cas car le load-balancer peut router la CA vers un autre dyno).
  **Hypothèse** : renouvellement sur des apps à **1 dyno web**, ou tolérance aux
  retries ACME. À documenter dans le README du workflow.
- **Sectigo OV + EAB** : l'organisation doit être pré-validée côté Sectigo ; l'EAB
  pré-autorise le compte ACME. La validation de domaine reste automatisée par HTTP-01.
- **App `auth` optionnelle** : `AUTH_DOMAIN` / `AUTH_SCALINGO_APP` peuvent être
  absents sur n'importe quel env (Keycloak pas déployé séparément, etc.). Dans ce
  cas le job `auth` de cet env se termine en _skipped_ propre (étape 2), sans job
  rouge. Seul le couple `webapp` est garanti présent.

## Testabilité

- Scripts de hook : testables en isolation (mock du serveur de push via un petit
  serveur local ou variables d'env, vérification du body POST et de la logique de
  poll/cleanup selon `ACME_DELETE_STYLE`).
- Workflow : validable via `act` ou un déclenchement `workflow_dispatch` ciblé sur
  `dev` d'abord, avant d'activer le cron.

## Hors scope

- Émission de certs pour des domaines non fronted par une route de challenge ACME
  (nécessiterait d'ajouter le mécanisme de push sur l'app concernée).
- Bascule DNS-01.
- Monitoring/alerting de l'expiration (pourrait faire l'objet d'une US dédiée).
