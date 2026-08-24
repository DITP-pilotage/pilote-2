# Sécurisation des clés API mb-api : rôle CONTRIBUTOR / ADMIN

**Date :** 2026-06-15
**Ticket :** [PIL-1614](https://data-ditp.atlassian.net/browse/PIL-1614)
**App :** `apps/mb-api`
**Statut :** design validé, prêt pour plan d'implémentation

## Problème

Aujourd'hui toutes les clés API de mb-api ont les mêmes capacités. L'action de
permission `WRITE` (par indicateur) est **surchargée** : une même permission
autorise à la fois

- **gérer la définition** d'un indicateur — `PUT /indicateurs/{id}` (nom,
  rattachement aux référentiels),
- **saisir des valeurs** pour cet indicateur — `PUT/DELETE /indicateurs/{id}/valeurs`,
  `:batch`, objectifs.

On veut **découpler** ces deux capacités : une clé partenaire/widget doit pouvoir
saisir des valeurs sans pouvoir modifier la définition des indicateurs.

Deux trous de sécurité existants sont traités au passage :

1. **`PUT /referentiels/{id}` n'est gardé par aucune permission** — n'importe
   quelle clé authentifiée peut créer/modifier un référentiel.
2. **`PUT /indicateurs/{id}` en création** n'est pas gardé : n'importe quelle clé
   authentifiée peut créer un nouvel indicateur (la permission `WRITE` n'est
   vérifiée que sur la mise à jour d'un indicateur existant).

## Décision

On introduit un **rôle sur la clé API**, distinct et orthogonal à l'ACL par
ressource existante.

- L'**ACL par ressource** (`indicateur_permission`, action `WRITE`) continue de
  gouverner la **saisie de valeurs** — inchangée.
- Un **rôle global sur la clé** gouverne la **gestion de définition** (indicateurs
  et référentiels).

Choix assumé : un simple `role === ADMIN` plutôt qu'un système de scopes/capacités.
C'est plus grossier (une clé est ADMIN ou non, pas de granularité par ressource sur
la gestion), mais ça évite de devoir backfiller la base à chaque nouvelle capacité
admin. On raffinera (scopes, rôles intermédiaires) le jour où le besoin réel
apparaîtra.

### Pourquoi pas un scope par clé

Avec des scopes stockés par clé, ajouter une nouvelle capacité admin obligerait à
mettre à jour en base toutes les clés admin existantes. Avec un rôle, la
correspondance « ADMIN → quelles routes » vit dans le **code** : gater une nouvelle
route par ADMIN la couvre instantanément pour toutes les clés ADMIN existantes,
sans migration de données. Tradeoff accepté : perte de granularité fine.

## Modèle de données

```prisma
enum ApiKeyRole {
  CONTRIBUTOR
  ADMIN

  @@map("api_key_role_enum")
}

model ApiKey {
  // ... champs existants ...
  role ApiKeyRole @default(CONTRIBUTOR) @map("role")
}
```

- `CONTRIBUTOR` (défaut) : clé « commune ». Peut lire et **saisir des valeurs**
  selon son ACL `WRITE` par indicateur. Ne peut **pas** gérer les définitions.
  Terme choisi plutôt que `USER` car une clé n'est pas une personne, et le terme
  ne doit pas laisser croire à de la lecture seule (elle peut écrire des valeurs).
- `ADMIN` : peut gérer les définitions (indicateurs, référentiels) en plus du reste.

Migration Prisma : création du type enum + ajout de la colonne `role` avec défaut
`CONTRIBUTOR`. **Toutes les clés existantes deviennent `CONTRIBUTOR`.**

## Points d'enforcement

On ajoute un garde `ensureApiKeyAdmin` (sur le modèle de `ensureIndicateurWritePermission`)
qui lit le principal courant depuis l'AsyncLocalStorage (`userContext`) :

- principal de type `user` (OIDC) → **autorisé** (hors périmètre de ce durcissement) ;
- principal de type `apiKey` → autorisé **ssi** `role === ADMIN`, sinon `ForbiddenError` (403).

Routes gardées (gestion de définition) :

| Route | Changement |
| --- | --- |
| `PUT /indicateurs/{id}` | `ensureApiKeyAdmin` **en plus** des checks existants. Couvre création **et** mise à jour. L'ACL `WRITE` par indicateur reste vérifiée sur la mise à jour (changement additif, comportement préservé). |
| `PUT /referentiels/{id}` | `ensureApiKeyAdmin` (aujourd'hui non gardée → ferme le trou). |

Routes **inchangées** (saisie de valeurs / objectifs) — toujours gouvernées par
l'ACL `WRITE` par indicateur :

- `PUT /indicateurs/{id}/valeurs`, `DELETE /indicateurs/{id}/valeurs`,
  `PUT /indicateurs/{id}/valeurs:batch`
- `PUT /indicateurs/{id}/objectifs`, `DELETE /indicateurs/{id}/objectifs`

Note : pour une clé `ADMIN`, éditer la définition d'un indicateur **existant**
requiert toujours en plus le `WRITE` ACL sur cet indicateur (le gate ADMIN est
purement additif, on ne retire aucun check existant). Le `role` et l'ACL restent
orthogonaux : être `ADMIN` n'accorde pas automatiquement le `WRITE` valeurs sur un
indicateur.

## Flux d'authentification

`ApiKeyAuthentifiee` porte désormais le rôle :

```ts
export type ApiKeyAuthentifiee = {
  id: string
  label: string
  role: ApiKeyRole // ← nouveau
}
```

- `verifyApiKey.ts` sélectionne `role` sur la ligne `api_key` et le propage.
- Le principal est rangé dans l'ALS comme aujourd'hui ; les gardes y lisent le rôle.

## Génération de clés

`scripts/generate-api-key.ts` :

- accepte un flag optionnel `--admin` (ou `--role admin`) ;
- l'`INSERT INTO api_key` renseigne la colonne `role` (`CONTRIBUTOR` par défaut).

## Swagger (niveau 1)

Un seul document OpenAPI, mais les routes de gestion sont identifiées :

- ajout du tag `Admin` aux deux routes gardées (en plus de leur tag métier) ;
- mention dans la `description` que la route requiert une clé API de rôle `ADMIN` ;
- ajout de la réponse `403` documentée sur ces routes.

Le swagger séparé (deux documents) est **hors périmètre** — la doc n'est pas un
contrôle d'accès, le rempart reste `ensureApiKeyAdmin`.

## Migration / exploitation

- La migration Prisma met toutes les clés existantes à `CONTRIBUTOR`.
- **La promotion des clés légitimes en `ADMIN` est faite manuellement** par l'équipe,
  env par env (typiquement la clé mb-admin), via SQL direct après déploiement.
- ⚠️ Tant que cette promotion n'est pas faite, les écritures de définition /
  référentiels échoueront (403) pour ces clés. Le déploiement et la promotion
  doivent être coordonnés.

## Tests (mb-api, tests d'intégration)

- `CONTRIBUTOR` → `PUT /indicateurs/{id}` → **403**.
- `ADMIN` (+ `WRITE` ACL) → `PUT /indicateurs/{id}` → **200**.
- `CONTRIBUTOR` → `PUT /referentiels/{id}` → **403**.
- `ADMIN` → `PUT /referentiels/{id}` → **200**.
- `CONTRIBUTOR` (+ `WRITE` ACL) → `PUT /indicateurs/{id}/valeurs` → **200** (inchangé).
- Principal `user` (OIDC) → `PUT /indicateurs/{id}` → autorisé.
- Le builder de fixture `apiKey` (`src/test/fixtures.ts`) accepte un `role`
  (défaut `CONTRIBUTOR`) + helper pour une clé `ADMIN`.

## Hors périmètre / évolutions futures

- Scopes / rôles intermédiaires (ex. `GESTION_REFERENTIEL` seul) — quand le besoin
  de granularité fine apparaîtra.
- Gate de rôle pour les principals `user` (OIDC) — quand un form de gestion sera
  ouvert aux contributeurs humains, le système sera repensé à ce moment-là.
- Swagger en deux documents séparés (public / admin).
- Gating de `PUT /referentiels/{id}` par une ACL par ressource dédiée (table
  `referentiel_permission`).

## Fichiers impactés (indicatif)

- `apps/mb-api/prisma/schema.prisma` — enum + colonne.
- `apps/mb-api/prisma/migrations/...` — migration générée.
- `apps/mb-api/src/framework/auth/verifyApiKey.ts` — sélection + propagation du rôle.
- `apps/mb-api/src/framework/auth/userContext.ts` — type `ApiKeyAuthentifiee`.
- `apps/mb-api/src/framework/auth/ensureApiKeyAdmin.ts` — nouveau garde.
- `apps/mb-api/src/indicateur/routes.ts` + commande `upsertIndicateur` — gate + doc + 403.
- `apps/mb-api/src/referentiel/routes.ts` — gate + doc + 403.
- `apps/mb-api/scripts/generate-api-key.ts` — flag `--admin`.
- `apps/mb-api/src/test/fixtures.ts` — fixture `role`.
- Tests d'intégration des routes concernées.
