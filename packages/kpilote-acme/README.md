# @pilote/kpilote-acme

Routes Hono du challenge ACME HTTP-01, montées par [kpilote-api](../../apps/kpilote-api) et [kpilote-webapp](../../apps/kpilote-webapp) pour le renouvellement de leurs certificats SSL. Le workflow et son fonctionnement sont décrits dans [`.github/workflows/README-renouvellement-ssl.md`](../../.github/workflows/README-renouvellement-ssl.md).

Le package n'est ni buildé ni publié : les consommateurs importent les sources via le workspace pnpm et les bundlent (`ssr.noExternal`). `hono` et `zod` sont des `peerDependencies`, déjà présentes dans les apps.

## Utilisation

```ts
import { createAcmeChallengeRoutes } from '@pilote/kpilote-acme/acmeChallengeRoutes'

app.route('/', createAcmeChallengeRoutes({ uploadApiKey: env.ACME_UPLOAD_API_KEY }))
```

À monter **avant** les middlewares globaux qui exigent une session ou un token, et avant tout fallback SPA : la CA lit le challenge sans authentification.

| Méthode et route                         | Auth                  | Effet                                                |
| ---------------------------------------- | --------------------- | ---------------------------------------------------- |
| `POST /api/acme/challenge`               | Bearer `uploadApiKey` | Stocke `{ token, keyAuthorization }` → `201`         |
| `GET /.well-known/acme-challenge/:token` | Public (lu par la CA) | Sert la `keyAuthorization` en `text/plain`, ou `404` |
| `DELETE /api/acme/challenge/:token`      | Bearer `uploadApiKey` | Supprime le challenge → `204`                        |

Sans `uploadApiKey` (variable `ACME_UPLOAD_API_KEY` absente ou vide), le dépôt et la suppression répondent `503`.

Le store est une `Map` en mémoire propre à chaque process : le renouvellement suppose **un seul dyno web**.

## Commandes

```bash
pnpm -F @pilote/kpilote-acme test     # Vitest
pnpm -F @pilote/kpilote-acme lint     # oxlint + tsc + prettier
pnpm -F @pilote/kpilote-acme format
```
