# kpilote-admin

Back-office interne de kpilote (package `@pilote/kpilote-admin`). Il sert à administrer les données de [kpilote-api](../kpilote-api) sur un environnement choisi (local, dev ou prod) : indicateurs, référentiels, relations, collections, utilisateurs, permissions, clés API, feature flags et centre d'aide. Il propose aussi une console pour appeler l'API à la main.

## Stack

- **React 19** + **TanStack Router** + **TanStack Query**
- **Tailwind CSS 4** avec le thème et les composants de [`@pilote/kpilote-ui`](../../packages/kpilote-ui)
- **React Hook Form** + **Zod**, schémas partagés via [`@pilote/kpilote-shared`](../../packages/kpilote-shared)
- **CodeMirror** (console JSON), **Tiptap** (éditeur du centre d'aide), **dnd-kit** (réordonnancement)
- **Hono** pour le serveur (BFF), **iron-session** pour les cookies chiffrés
- **Vite** + **Vitest**

## Fonctionnement

Contrairement à la webapp, l'admin ne passe pas par un fournisseur d'identité : on s'y connecte avec une **clé API kpilote** (`pilote_live_…`) propre à l'environnement ciblé.

1. L'utilisateur choisit un environnement (`/`) puis colle sa clé (`/cle/$environment`).
2. Le BFF vérifie la clé via `GET /auth/whoami` sur l'API de cet environnement, puis la stocke dans un cookie de session chiffré (8 h). Les clés validées sont mémorisées par environnement dans un second cookie (7 jours) ; seuls le libellé et le préfixe sont renvoyés au navigateur.
3. Le navigateur n'appelle jamais kpilote-api directement : toutes les requêtes passent par le BFF, qui ajoute la clé.

Le BFF (`src/server/`) expose :

| Préfixe    | Rôle                                                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/auth`    | Session : confirmation de clé (`/confirm`), réutilisation ou oubli d'une clé mémorisée (`/use`, `/forget`), déconnexion                             |
| `/api/*`   | Proxy vers kpilote-api, limité à une allowlist de ressources (`SAFE_PATH` dans `src/server/api/router.ts`) avec protection contre le path traversal |
| `/console` | Métadonnées, spec OpenAPI et relais de la console                                                                                                   |
| `/healthz` | Healthcheck                                                                                                                                         |

Une nouvelle ressource de l'API n'est accessible depuis l'admin qu'après son ajout à `SAFE_PATH`.

En **prod**, l'édition est verrouillée par défaut et doit être déverrouillée explicitement pour la session navigateur (`src/lib/useProdEditUnlock.ts`).

## Démarrage

```bash
cp .env.example .env    # définir un vrai SESSION_SECRET
pnpm dev                # https://kpilote-admin.modernisation.localhost
```

Il faut une clé API `ADMIN` pour l'environnement visé. En local, elle se génère avec `pnpm api-key:generate --admin` dans kpilote-api (voir son [README](../kpilote-api/README.md#scripts)).

Le domaine `*.localhost` en HTTPS est fourni par [portless](https://www.npmjs.com/package/portless). En dev, Vite délègue à Hono les chemins `/auth`, `/healthz`, `/api` et `/console/*`.

## Variables d'environnement

| Variable                                                      | Rôle                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `API_BASE_URL_LOCAL`, `API_BASE_URL_DEV`, `API_BASE_URL_PROD` | URL de kpilote-api pour chaque environnement                  |
| `SESSION_SECRET`                                              | Chiffrement des cookies (≥ 32 caractères, pas de placeholder) |
| `PUBLIC_BASE_URL`                                             | URL publique de l'admin                                       |
| `PORT`                                                        | Port du serveur (défaut 4001)                                 |
| `LOG_LEVEL`                                                   | Niveau de log                                                 |

## Organisation du code

```
src/
├── main.tsx            Point d'entrée React
├── session.ts          Client de session (appels à /auth)
├── routes/             Routes TanStack Router (_authed/ = pages protégées)
├── api/                Appels vers le BFF (/api)
├── queries/            Hooks TanStack Query
├── components/         Formulaires et écrans d'administration
├── context/            Contexte de configuration
├── lib/                Utilitaires (pagination complète, export curl, erreurs…)
└── server/             BFF Hono (auth par clé, proxy, console, environnements)
```

## Commandes

```bash
pnpm dev                  # Serveur de dev
pnpm build                # routes + tsc + build client + build serveur
pnpm start                # Serveur de production (dist/server/index.js)
pnpm test                 # Vitest
pnpm typecheck
pnpm lint                 # oxlint + tsc + prettier
pnpm lint:fix
pnpm routes:generate
```

## Déploiement

Même modèle que les autres apps kpilote, avec `APP_PACKAGE=@pilote/kpilote-admin` : `deploy:prepare` copie le `.slugignore`, `deploy:bundle` produit `kpilote-admin-deploy/` et copie `start.sh`.
