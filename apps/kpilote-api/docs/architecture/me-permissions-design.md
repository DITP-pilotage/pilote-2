# Design — `GET /me/permissions` (permissions transverses du principal courant)

Date : 2026-06-30
Statut : Décisions arrêtées, prêt à implémenter sur une branche dédiée (issue de `dev`)

## 1. Contexte

Aujourd'hui, ni la webapp ni les autres clients ne peuvent prédire si le
principal courant a le droit d'écrire sur une ressource (collection, indicateur)
avant d'envoyer la mutation. Résultat : les boutons « Enregistrer » s'affichent
même pour des principals en lecture seule, qui reçoivent ensuite un `403` au
clic.

Premier cas remonté : onglet « Commentaires » du collection (PIL-1588). Le besoin
est transverse : même problème pour les commentaires indicateurs, les
contacts utiles, les responsables, etc.

Le modèle de permissions est décrit dans
[`permissions-design.md`](./permissions-design.md). Ce document ajoute la
**vue côté principal** : « qu'est-ce que je peux faire ? » plutôt que
« qui peut faire X sur cette ressource ? ».

## 2. Objectifs

1. Exposer en un seul appel toutes les permissions **explicites** du
   principal courant, afin que les clients puissent gater leur UI sans 1
   requête par ressource.
2. Garder l'endpoint transverse : la même réponse sert à toutes les pages
   (collection, indicateur, futures ressources).
3. Rester aligné sur le modèle existant : `PermissionAction` (`READ` /
   `WRITE`), visibilité PUBLIC / PRIVE, propagation collection → indicateur.

## 3. Non-objectifs

- Ne **pas** matérialiser le READ implicite des ressources `PUBLIC`. Le
  client connaît déjà la visibilité d'un collection qu'il affiche ; il fera la
  condition « public OR permission explicite » côté webapp. Cela évite de
  renvoyer la totalité du catalogue à chaque appel.
- Ne **pas** introduire de filtre `?type=collection` ou de pagination dès le
  v0 — on attend qu'un cas concret le justifie (cf. §7).
- Ne **pas** gérer le cache d'invalidation : `staleTime` raisonnable côté
  client suffit, l'OIDC réauthentifie à chaque session.

## 4. Contrat HTTP

### Route

```
GET /me/permissions
```

Tags OpenAPI : `Authentication` (cohérent avec `/me` et `/auth/whoami`).
Middleware : `requireAuthentication` (utilisateur OU API key).

### Réponse 200 — principal standard

```json
{
  "collections": [
    { "id": "COL-005", "actions": ["READ", "WRITE"] }
  ],
  "indicateurs": [
    { "id": "IND-001", "actions": ["READ", "WRITE"] },
    { "id": "IND-002", "actions": ["READ"] }
  ]
}
```

### Réponse 200 — principal admin (api_key.role = ADMIN)

```json
{
  "isAdmin": true,
  "collections": [],
  "indicateurs": []
}
```

Le champ `isAdmin` est **optionnel et ne vaut que `true`** quand il est
présent. Côté client : si `isAdmin` est présent, on bypass toute vérif. Sinon,
on s'appuie sur `collections` / `indicateurs`. Cela évite d'aligner le client sur
un booléen toujours présent.

### Schema partagé (`packages/mb-shared/src/mePermissions.ts`)

```ts
const permissionEntrySchema = z.object({
  id: z.string(),               // publicId (COL-… / IND-…)
  actions: z.array(z.enum(['READ', 'WRITE'])).min(1),
})

export const mePermissionsApiModelSchema = z.object({
  isAdmin: z.literal(true).optional(),
  collections: z.array(permissionEntrySchema),
  indicateurs: z.array(permissionEntrySchema),
})
```

L'`id` est toujours le `publicId` (`COL-…`, `IND-…`) — c'est ce que la
webapp manipule partout, on ne renvoie jamais d'UUID interne.

### Tri

Tri stable par `id` ASC pour faciliter les comparaisons / snapshots.

### Erreurs

- `401` si non authentifié (géré par le middleware existant).
- Pas d'autre erreur attendue.

## 5. Sémantique

### Sources de permissions matérialisées

Règles confirmées par lecture du code (`apps/kpilote-api/src/collection/permissions.ts`
et `apps/mb-api/src/indicateur/permissions.ts`) :

| Action | Source |
|---|---|
| READ collection | direct uniquement (la visibilité PUBLIC n'est pas matérialisée) |
| WRITE collection | direct uniquement |
| READ indicateur | direct **OU** propagé depuis un collection où le principal a READ ou WRITE |
| WRITE indicateur | direct uniquement (**pas de propagation**) |

Concrètement, on assemble la réponse à partir de :

1. **`CollectionPermission`** du principal → liste `collections[]`.
2. **`IndicateurPermission`** du principal → contributions `READ` et/ou
   `WRITE` à `indicateurs[]`.
3. **Propagation collection → indicateur** : pour chaque collection de (1) (qu'il
   porte READ ou WRITE), on ajoute `READ` sur chacun des indicateurs liés
   via `CollectionIndicateur`. **WRITE ne propage jamais**.

### Pas matérialisé

- La visibilité `PUBLIC` (READ implicite). Le client le sait déjà en
  affichant la ressource → condition `visibilite === 'PUBLIC' || permissionExplicite`.
- Les admins (`api_key.role = ADMIN`) : on renvoie `isAdmin: true` et des
  listes vides plutôt que de matérialiser tout le catalogue.

### Déduplication

Un indicateur peut recevoir des `actions` depuis plusieurs sources
(permission directe + propagation). On les fusionne en une seule entrée
par `publicId`, avec `actions` dédupliqué et trié (`READ` avant `WRITE`).

## 6. Implémentation (esquisse)

Fichiers :

```
apps/mb-api/src/me/queries/listerMesPermissions.ts   # use case neverthrow
apps/mb-api/src/me/routes.ts                          # createRoute + handler
apps/mb-api/src/me/queries/listerMesPermissions.test.ts
packages/mb-shared/src/mePermissions.ts               # schema + type
```

Use case (pseudo) :

```ts
export const listerMesPermissions = (): ResultAsync<MePermissionsApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(Promise.all([
    db().collectionPermission.findMany({
      where: { principalId },
      include: { collection: { select: { publicId: true } } },
    }),
    db().indicateurPermission.findMany({
      where: { principalId },
      include: { indicateur: { select: { publicId: true } } },
    }),
  ])).andThen(([collectionPerms, indicateurPerms]) =>
    // joindre CollectionIndicateur pour propagation READ, dédupliquer, trier
    ...
  )
}
```

Branche : `feat/me-permissions` (depuis `dev`).

## 7. Décisions arrêtées

| # | Question | Décision |
|---|---|---|
| 1 | Forme de la réponse pour un admin | `{ isAdmin: true, collections: [], indicateurs: [] }`. Le champ `isAdmin` est **optionnel** et n'est présent que lorsqu'il vaut `true` — pas de `isAdmin: false` pour les principals standards. |
| 2 | Propagation `WRITE` collection → indicateur | **Non**. Confirmé par lecture de `ensureIndicateurWritePermission` : le WRITE indicateur est strictement direct. La propagation collection → indicateur ne concerne que `READ`. |
| 3 | Format d'`id` | **`publicId`** (`COL-…`, `IND-…`). On ne renvoie jamais d'UUID interne — la webapp ne manipule que des publicIds. |

## 8. Côté webapp (suite, hors scope API)

- Nouveau `queries/mePermissions.ts` (React Query, `staleTime: 5min`).
- Provider `MePermissionsProvider` au montage du shell authentifié.
- Hook `useCanWriteCollection(collectionId)` / `useCanWriteIndicateur(indicateurId)`.
- Câblage dans `CollectionCommentaireConfigProvider` et
  `IndicateurCommentaireConfigProvider` pour désactiver l'éditeur et
  masquer les boutons quand le hook renvoie `false`.

## 9. Tests

- Intégration `listerMesPermissions` :
  - principal sans permission → `{ collections: [], indicateurs: [] }`
  - principal avec WRITE sur COL-005 → entrée COL-005 + IND-001..003
    propagés en READ.
  - dédup : permission directe READ sur IND-001 + READ propagé via COL-005 →
    une seule entrée IND-001 avec `actions: ['READ']`.
- Route : status 200 + schéma respecté, 401 sans auth.
