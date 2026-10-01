# kpilote-webapp

Application web kpilote destinée aux utilisateurs finaux (package `@pilote/kpilote-webapp`) : consultation et saisie des indicateurs, collections, commentaires, import de valeurs et centre d'aide. Elle s'appuie sur [kpilote-api](../kpilote-api).

## Stack

- **React 19** + **TanStack Router** (routes fichier, code splitting auto) + **TanStack Query**
- **Tailwind CSS 4** avec le thème et les composants de [`@pilote/kpilote-ui`](../../packages/kpilote-ui)
- **React Hook Form** + **Zod**, schémas partagés via [`@pilote/kpilote-shared`](../../packages/kpilote-shared)
- **ky** (client HTTP), **ECharts** (graphiques, carte de France), **Tiptap** (éditeur riche), **xlsx** (lecture des imports)
- **Hono** pour le serveur (BFF d'authentification + service des fichiers statiques)
- **Vite** + **Vitest** (jsdom, Testing Library, MSW)

## Architecture

```
Navigateur ──(access token en mémoire)──▶ kpilote-api
    │
    └──▶ BFF Hono (/auth/*) ──▶ ProConnect / Keycloak
```

La SPA appelle **directement** kpilote-api avec un access token court conservé en mémoire (`src/auth/tokenStore.ts`). Le BFF (`src/server/`) ne sert qu'à la danse OIDC (PKCE, callback, logout) et garde le refresh token dans un cookie httpOnly chiffré (iron-session). Sur un 401, le client `src/api/client.ts` rafraîchit le token puis rejoue la requête ; en cas d'échec, il redirige vers `/auth/login`.

Deux fournisseurs d'identité sont supportés : **ProConnect** et **Keycloak**.

Le serveur applique aussi les headers de sécurité (CSP, HSTS…) et expose `/healthz`.

## Démarrage

Prérequis : kpilote-api lancée en local.

```bash
cp .env.example .env    # renseigner les secrets OIDC / Keycloak et SESSION_SECRET
pnpm dev                # https://kpilote.modernisation.localhost
```

Depuis la racine du monorepo : `pnpm dev:kpilote-webapp`.

En dev, Vite sert la SPA et délègue à Hono les chemins `/auth`, `/healthz` et `/api`. Le domaine `*.localhost` en HTTPS est fourni par [portless](https://www.npmjs.com/package/portless).

## Variables d'environnement

| Variable                                                                                                        | Côté    | Rôle                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`                                                                                                  | client  | URL de kpilote-api appelée par le navigateur                                                                                     |
| `VITE_ANALYTICS_ENABLED`, `VITE_MATOMO_URL`, `VITE_MATOMO_SITE_ID`                                              | client  | Analytics Matomo (actif seulement en build de prod, sans Do Not Track)                                                           |
| `API_BASE_URL`                                                                                                  | serveur | URL de kpilote-api vue du serveur (peut être un réseau interne)                                                                  |
| `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`, `OIDC_POST_LOGOUT_REDIRECT_URI` | serveur | Client ProConnect                                                                                                                |
| `KEYCLOAK_ISSUER_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`                                           | serveur | Client Keycloak                                                                                                                  |
| `SESSION_SECRET`                                                                                                | serveur | Chiffrement du cookie de session (≥ 32 caractères, pas de placeholder)                                                           |
| `PUBLIC_BASE_URL`                                                                                               | serveur | URL publique de l'app                                                                                                            |
| `LOG_LEVEL`                                                                                                     | serveur | Niveau de log                                                                                                                    |
| `ACME_UPLOAD_API_KEY`                                                                                           | serveur | Optionnel — clé Bearer du dépôt des challenges ACME ([renouvellement SSL](../../.github/workflows/README-renouvellement-ssl.md)) |

Les variables `VITE_*` sont figées au build.

## Organisation du code

```
src/
├── main.tsx            Point d'entrée React
├── routes/             Routes TanStack Router (_authenticated/ = pages protégées)
├── api/                Appels HTTP vers kpilote-api
├── queries/            Hooks TanStack Query (lecture)
├── mutations/          Hooks TanStack Query (écriture)
├── components/         Composants propres à l'app (indicateurs, collections, widgets…)
├── lib/                Utilitaires
├── auth/, auth.ts      Gestion de l'access token côté client
├── analytics/          Suivi Matomo
├── server/             BFF Hono (auth OIDC, session, headers de sécurité)
├── scripts/            Génération du GeoJSON de la carte de France
└── tests/              Helpers de test (factories, serveur MSW)
```

Les composants génériques vont dans `@pilote/kpilote-ui`, la logique pure et les schémas dans `@pilote/kpilote-shared`.

## Commandes

```bash
pnpm dev                  # Serveur de dev
pnpm build                # routes + tsc + build client (dist/client) + build serveur (dist/server)
pnpm start                # Serveur de production
pnpm test                 # Vitest
pnpm lint                 # oxlint + tsc + prettier
pnpm lint:fix
pnpm routes:generate      # Régénère routeTree.gen.ts
pnpm maps:generate        # Régénère le GeoJSON de la carte de France
```

## Fichiers d'exemple

[`samples/`](samples) contient des CSV pour tester l'import de valeurs, dont le fallback de normalisation par Albert (qui nécessite `ALBERT_API_KEY` côté kpilote-api).

## Déploiement

Déployée sur Scalingo avec `APP_PACKAGE=@pilote/kpilote-webapp`. `deploy:prepare` copie le `.slugignore` à la racine, `deploy:bundle` produit `kpilote-webapp-deploy/` et copie `start.sh`, qui lance `dist/server/index.js`.

## Documentation

- [`design-doc.md`](design-doc.md) : direction visuelle (sites gouvernementaux « nouvelle école »)
- [`docs/superpowers/`](docs/superpowers) : specs et plans (carte de France)
- Authentification : [`../kpilote-api/docs/architecture/auth-design.md`](../kpilote-api/docs/architecture/auth-design.md)
