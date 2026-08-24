# Pilote MB Admin — Design

> Date : 2026-06-10
> Statut : design validé (brainstorming), prêt pour plan d'implémentation
> Périmètre du jour : `PUT /indicateurs/{id}` et `PUT /referentiels/{id}` via une webapp admin multi-environnements

## 1. Objectif

Créer une nouvelle application `apps/mb-admin` permettant à un opérateur de modifier les
données de Pilote MB sur les trois environnements (Local, Dev, Prod), à la manière d'un
Postman couplé à un Swagger : on saisit une **clé API**, on choisit un **environnement**,
puis on accède aux **fonctionnalités** sous forme de collection de routes outillées.

Aujourd'hui, deux fonctionnalités sont en périmètre :

- **Indicateurs** — création / modification via `PUT /indicateurs/{id}`.
- **Référentiels** — création / modification via `PUT /referentiels/{id}` (avec création /
  modification des individus par transitivité).

> Contrainte forte : **le code est public**. Aucun secret ne doit être committé, et
> l'architecture ne doit pas introduire de faille (clé API exposée, CORS trop permissif…).

## 2. Architecture

### 2.1 Nouvelle app dans le monorepo

`apps/mb-admin`, package `@pilote/mb-admin`, calquée sur `apps/mb-webapp` :

- **Front** : React 19, TanStack Router (routing par fichiers), Vite, Tailwind v4 +
  `clsxm` (clsx + tailwind-merge) + `cva`, TanStack Query, `ky`, Zod.
- **Back (BFF)** : Hono + `@hono/node-server`, `iron-session` pour la session.
- Configs (`tsconfig`, `eslint.config.mjs`, `.prettierrc`, `vite.config.ts`,
  `vite.server.config.ts`, `deploy-*.sh`, `start.sh`, `.slugignore`) reprises du modèle
  `mb-webapp`.
- Dépendance workspace sur `@pilote/mb-shared` pour réutiliser les schémas Zod
  (indicateur, référentiel, etc.).

### 2.2 BFF proxy (décision structurante)

Le navigateur **ne parle jamais directement à mb-api**. Il appelle uniquement le backend
de `mb-admin`, qui relaie (proxy) vers le mb-api de l'environnement choisi.

Conséquences sécurité :

- **Aucune ouverture CORS** à faire sur le mb-api de prod (appels serveur-à-serveur).
- Les URLs des environnements vivent **côté serveur** (pas exposées en clair au client via
  des variables `VITE_*`).

### 2.3 Variables d'environnement

Nouvelles variables **serveur** de `mb-admin` (des URLs, non secrètes) :

```
API_BASE_URL_LOCAL=...
API_BASE_URL_DEV=...
API_BASE_URL_PROD=...
SESSION_SECRET=...        # ≥ 32 caractères, chiffrement de la session (jamais committé)
PUBLIC_BASE_URL=...
LOG_LEVEL=info
PORT=...
```

> Nommage `API_BASE_URL_*` cohérent avec `API_BASE_URL` (variable serveur existante de
> mb-webapp). Pas de variante `VITE_*` : c'est volontaire, le client ne doit pas connaître
> les URLs des environnements.

### 2.4 Gestion de la clé API (sécurité)

> **Une clé API est liée à un seul environnement** : chaque mb-api (Local/Dev/Prod) a sa
> propre base et son propre `API_KEY_HMAC_SECRET`. Une clé générée en Prod n'est pas valide
> en Dev. Le flux est donc **« environnement d'abord, puis clé de cet environnement »**.

- L'utilisateur choisit d'abord un **environnement**, puis saisit la clé (`pilote_live_…`)
  **propre à cet environnement**.
- Le BFF la **valide** auprès du mb-api **de cet environnement** via `GET /auth/whoami`
  (cf. §3), puis stocke `{ environment, apiKey }` dans une **session `iron-session` (cookie
  httpOnly, chiffré)**. La clé n'est **jamais** renvoyée au navigateur ni accessible au JS
  → immunité XSS.
- Tous les appels suivants : le navigateur appelle le BFF, qui lit `{ environment, apiKey }`
  en session et relaie vers le mb-api correspondant en injectant `Authorization: Bearer …`.
- « Changer d'environnement » ou « Changer de clé » = destruction de la session et retour à
  la sélection d'environnement.

## 3. Backend mb-api — ajouts

### 3.1 `GET /auth/whoami` (nouveau)

Endpoint qui **supporte les API keys** (contrairement à `/me` qui force `requireUser()` et
ne marche qu'avec les JWT utilisateurs).

- `200` + `{ label }` si la clé est valide (non révoquée, non expirée).
- `401` si invalide.

C'est le mécanisme de **validation de clé** au clic sur « Confirmer », et la base du rappel
« clé active » affiché en header.

> Évolution prévue (hors périmètre du jour) : enrichir `whoami` avec les **scopes** de la
> clé pour piloter l'affichage des fonctionnalités selon les droits réels.

### 3.2 Dette de sécurité assumée (à traiter plus tard)

Choix pragmatique pour aujourd'hui : on **ne restreint pas** encore les écritures.

- `PUT /indicateurs/{id}` : la *modification* d'un indicateur existant exige déjà un
  `WRITE` direct ; en revanche la **création** reste ouverte à toute clé valide.
- `PUT /referentiels/{id}` : **aucun contrôle de permission** — toute clé valide peut créer
  et écraser n'importe quel référentiel.

Mitigation future (conçue, non implémentée) : ajouter des **scopes** sur l'API key
(ex. `indicateurs:write`, `referentiels:write`) + un middleware `requireScope`, et exposer
ces scopes via `whoami`. À planifier dans un ticket dédié.

## 4. Parcours utilisateur

1. **Landing / choix d'environnement** : titre + courte description, puis trois cartes
   « à barre » — **Local** et **Dev** (barre bleue), **Prod** (barre rouge, bandeau
   « ⚠ Données réelles »). Pas de bandeau d'alerte séparé : la carte rouge porte le message.
2. **Saisie de la clé (par environnement)** : écran « deux colonnes / split » — panneau
   marque à gauche (bleu République, rappel de l'environnement choisi + avertissement rouge
   si Prod), formulaire de saisie de clé à droite + note de sécurité. Au « Confirmer », le
   BFF appelle `whoami` **contre le mb-api de l'environnement choisi** ; succès → session
   `{ environment, apiKey }` créée, redirection vers le choix de fonctionnalité ; échec →
   message d'erreur (clé invalide pour cet environnement).
3. **Choix de fonctionnalité** (« Que souhaitez-vous gérer ? ») : deux cartes — **Gérer les
   indicateurs**, **Gérer les référentiels**.
4. **Listing** : tableau des éléments existants (via `GET`), recherche, pagination, bouton
   « ＋ Créer ». Clic sur une ligne → formulaire d'édition.
5. **Formulaire (PUT)** :
   - **Indicateur** : identifiant (`IND-XXX`, éditable en création, figé en modif), nom,
     visibilité (Public/Privé), unité (Pourcentage/Années/Aucune), et liste **replace-all**
     des référentiels liés (chacun avec sa fonction d'agrégation Somme/Moyenne/Aucune). La
     sémantique replace-all est explicitée à l'écran.
   - **Référentiel** : identifiant (`REF-XXX`), nom, description, liste des individus
     (`publicId` + nom). Rappel du comportement : un individu ne peut appartenir qu'à un
     seul référentiel (conflit → 409).
6. **Garde-fou Prod** *(optionnel — forme à confirmer)* : en Prod uniquement, une
   confirmation explicite avant l'écriture (maquette proposée : modale avec re-saisie de
   l'identifiant). En Local/Dev : enregistrement direct. Le **besoin** d'un garde-fou Prod
   est acté ; sa forme exacte (modale, double-clic, simple bouton rouge distinct) reste
   ouverte.

## 5. Principes de design transverses

- **Header officiel** repris de mb-webapp : bloc Marianne (drapeau + Marianne + devise
  « Liberté · Égalité · Fraternité »), branding « Pilote MB — Console d'administration ».
- **Rappel permanent** en header de l'environnement courant (rouge en Prod) et de la clé
  active, + action « Changer de clé ».
- **Layout centré** à `max-width` (≈ `max-w-7xl`/1080px), header inclus.
- **Cartes « à barre »** comme motif signature : contenu centré (icône en pastille, titre,
  description), flèche à droite, barre épaisse en bas — bleu `#000091` par défaut, rouge
  `#c9191e` pour le danger.
- **Icônes Lucide** (déjà dans mb-webapp) — pas d'emojis dans l'implémentation.
- **Animations** : apparition en **fade-in / stagger** des cartes et contenus, transitions
  douces au hover (translate + bordure), micro-feedback au clic.
- Thème **DSFR-inspired** (Bleu République, Inter, surfaces tintées).
- Composants UI **dupliqués** depuis `mb-webapp/src/components/ui` pour démarrer ; une
  refacto ultérieure les mutualisera dans `mb-shared` (hors périmètre).

## 6. Découpage en unités

- **`server/`** (BFF) : config env (3 URLs + session), session iron-session, routes proxy
  vers mb-api (lecture clé en session, injection Bearer, sélection d'env), endpoints
  d'auth (`/auth/confirm` → whoami + création session, `/auth/logout`).
- **`api/`** (client front → BFF) : client `ky` typé, parsing Zod des réponses.
- **`components/ui/`** : design system dupliqué + composants spécifiques (carte « à barre »,
  badge env, header admin avec Marianne).
- **`routes/`** : landing, sélection env, sélection fonctionnalité, listing & formulaire
  indicateurs, listing & formulaire référentiels.

## 7. Gestion des erreurs

- **Clé invalide** (`whoami` 401) : message clair sur la landing, pas de session créée.
- **Erreurs de validation mb-api** (400) : remontées telles quelles dans le formulaire
  (ex. `unknownReferentielIds` pour un indicateur, champs requis).
- **Conflit référentiel/individu** (409) : message dédié (« individus déjà rattachés à un
  autre référentiel : … »).
- **Session expirée / clé révoquée en cours de route** : retour à la landing.
- **Indisponibilité d'un environnement** (proxy en échec) : message d'erreur explicite
  mentionnant l'environnement.

## 8. Tests

- **Backend mb-api** : tests (vitest) sur `GET /auth/whoami` — clé valide → 200 + label,
  clé invalide/révoquée/expirée → 401.
- **Front mb-admin** : conformément à la convention projet, **pas de plan de tests front**
  formel pour cette feature.

## 9. Dépendances à vérifier

- Existence des endpoints **`GET` de listing** côté mb-api pour alimenter les tableaux
  (`GET /indicateurs`, `GET /referentiels`) et des `GET` de détail pour pré-remplir les
  formulaires d'édition. À confirmer lors du plan ; à créer si absents (alors *dans* le
  périmètre).

## 10. Hors périmètre (explicite)

- Scopes/permissions sur l'API key et restriction des `PUT` (dette §3.2).
- Refacto des composants UI vers `mb-shared`.
- Toute route au-delà de celles nécessaires au parcours indicateurs/référentiels du jour
  (les `PUT` ciblés + les `GET` de listing/détail correspondants).
- Gestion / génération de clés API depuis l'admin.
