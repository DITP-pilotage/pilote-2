# Renouvellement certificats SSL (Sectigo / ACME HTTP-01)

Workflow : `.github/workflows/renouvellement-ssl.yml`.

Émet/renouvelle les certificats Sectigo pour les domaines des apps `pilote-ppg`
(webapp) et `pilote-ppg-auth` (keycloak), puis les pousse sur Scalingo.

## Déclenchement

- **Automatique** : cron le 1er du mois à 03h UTC.
- **Manuel** : onglet Actions → *Renouvellement certificats SSL* → *Run workflow*,
  choisir la cible parmi `tous` / `prod` / `preprod` / `dev` (défaut : `dev`).

## Configuration requise

### Repository secrets (Settings → Secrets and variables → Actions)
- `SECTIGO_ACME_EAB_KID` — ID EAB Sectigo.
- `SECTIGO_ACME_EAB_HMAC_KEY` — clé HMAC EAB Sectigo.
- `ACME_EMAIL` — email du compte ACME.
- `SCALINGO_API_TOKEN` — token API Scalingo (commun à tous les envs).

### Environments GitHub (Settings → Environments : `prod`, `preprod`, `dev`)
Variables :
- `WEBAPP_DOMAIN`, `WEBAPP_SCALINGO_APP` (requis)
- `AUTH_DOMAIN`, `AUTH_SCALINGO_APP` (optionnels — si absents, le job `auth` de
  l'env est ignoré proprement)

Secret :
- `ACME_UPLOAD_API_KEY` — clé Bearer de la route de challenge de cet env.

> Ne pas mettre de *required reviewers* sur ces environments, sinon le cron se
> bloque en attente d'approbation.

## Fonctionnement

certbot (`--manual`) émet le certificat. Le hook `scripts/acme/auth-hook.sh`
dépose la `keyAuthorization` via la route de push de l'app (Bearer) et attend
qu'elle soit servie sur `/.well-known/acme-challenge/<token>` ; la CA la vérifie ;
`scripts/acme/cleanup-hook.sh` la supprime. Le certificat est ensuite poussé sur
le domaine Scalingo (`PATCH tlscert/tlskey`).

Les routes de challenge diffèrent selon l'app (gérées automatiquement par le
workflow via `ACME_PUSH_PATH` / `ACME_DELETE_STYLE`) :

| App | Push (POST) | Cleanup (DELETE) |
|---|---|---|
| webapp (`pilote-ppg`) | `/api/admin/acme-challenge` | `/api/admin/acme-challenge?token=…` |
| auth (`pilote-ppg-auth`) | `/api/acme/challenge` | `/api/acme/challenge/<token>` |

## Limitation connue

Le store des challenges est **en mémoire par dyno**. Si une app web tourne sur
plus d'un dyno, la CA peut interroger un dyno qui n'a pas le token. Ce workflow
suppose des apps à **1 dyno web** pendant le renouvellement, ou tolère les retries
ACME.

## Tests locaux des hooks

```bash
bash scripts/acme/__tests__/hooks.test.sh
```
