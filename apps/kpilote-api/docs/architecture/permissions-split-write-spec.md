# Permissions — Spec : split de WRITE en WRITE_DATA et WRITE_COMMENT

Date : 2026-07-30
Statut : décidé

## Contexte

L'action `WRITE` sur les indicateurs couvre actuellement deux catégories d'opérations sans rapport entre elles :

1. **Écriture de données** : saisir et modifier les valeurs d'avancement et les objectifs
2. **Écriture de commentaires** : créer, publier et modifier ses commentaires

Cette granularité insuffisante force à accorder les deux capacités ensemble. Le besoin est de pouvoir donner à un principal le droit de commenter un indicateur sans lui permettre d'en modifier les données, ou inversement.

---

## Décisions structurantes

- **`WRITE` est supprimé**. Pas de période de transition : la suppression des données existantes, l'`ALTER TYPE` et la mise à jour du code se font dans le même déploiement.
- **Les collections n'ont pas d'action `WRITE_DATA`**. La seule mutation non-ADMIN sur une collection est la création de commentaires : l'ancienne action `WRITE` collection est renommée `WRITE_COMMENT`.
- **Les droits d'écriture sur les indicateurs restent strictement directs**, jamais propagés depuis une collection.
- **`WRITE_COMMENT` sur une collection propage READ sur ses indicateurs**, au même titre que l'ancien `WRITE` — le comportement de propagation est inchangé.
- **L'invariant "WRITE implique READ" est appliqué uniquement à la couche query** (via `INDICATEUR_READ_PERMISSIONS` et `COLLECTION_READ_PERMISSIONS`), pas au moment du grant. Une ligne `WRITE_DATA` en base sans ligne `READ` est un état valide : `withIndicateurReadPermission` accepte les trois actions dans son filtre `action: { in: [...] }`.
- **La revocation "tout effacer"** (`deleteMany` sans filtre action) supprime les trois actions en une opération — comportement inchangé.
- **Le composant commun de commentaires** conserve sa prop `useCanWrite: () => bool` inchangée. Seule l'injection dans chaque provider change (hook différent, même signature).

### Actions disponibles par type de ressource

| Action         | Collection | Indicateur |
| -------------- | :--------: | :--------: |
| `READ`         |     ✓      |     ✓      |
| `WRITE_COMMENT`|     ✓      |     ✓      |
| `WRITE_DATA`   |     —      |     ✓      |

---

## Migration SQL

La base ne contient que des seeds (pas de données réelles). On supprime les lignes `WRITE` **avant** l'`ALTER TYPE` pour éviter toute contrainte sur l'enum au moment de la suppression de l'ancienne valeur.

```sql
-- Étape 1 : supprimer toutes les lignes WRITE (uniquement des seeds)
DELETE FROM indicateur_permission WHERE action = 'WRITE';
DELETE FROM collection_permission WHERE action = 'WRITE';

-- Étape 2 : ajouter les nouvelles valeurs (non transactionnel, irréversible)
ALTER TYPE permission_action_enum ADD VALUE 'WRITE_DATA';
ALTER TYPE permission_action_enum ADD VALUE 'WRITE_COMMENT';

-- Étape 3 : supprimer l'ancienne valeur WRITE
-- Nécessite de recréer l'enum entier car PostgreSQL ne supporte pas DROP VALUE
-- À coordonner avec Prisma selon la stratégie de migration choisie
```

> `ALTER TYPE … ADD VALUE` est non transactionnel et irréversible. En cas d'échec après l'étape 2, on se retrouve avec les trois valeurs dans l'enum mais aucune donnée `WRITE` en base (supprimée à l'étape 1) — état cohérent, pas de rollback manuel nécessaire.

---

## Seeds à modifier

**Fichier :** `apps/kpilote-api/prisma/seed.ts`

Deux emplacements à mettre à jour :

**Ligne 356** — permissions indicateurs (IND-001..008) :
```ts
// Avant
for (const action of ['READ', 'WRITE'] as const)

// Après
for (const action of ['READ', 'WRITE_DATA', 'WRITE_COMMENT'] as const)
```

**Ligne 827** — permissions collection COL-005 :
```ts
// Avant
for (const action of ['READ', 'WRITE'] as const)

// Après
for (const action of ['READ', 'WRITE_COMMENT'] as const)
```

---

## Inventaire des changements

### 1. Schema Prisma

**Fichier :** `apps/kpilote-api/prisma/schema.prisma`

```prisma
enum PermissionAction {
  READ
  WRITE_DATA
  WRITE_COMMENT

  @@map("permission_action_enum")
}
```

---

### 2. Types partagés (`kpilote-shared`)

**Fichier :** `packages/kpilote-shared/src/permission.ts`

```ts
// Avant
export const permissionActionSchema = z.enum(['READ', 'WRITE'])

// Après
export const permissionActionSchema = z.enum(['READ', 'WRITE_DATA', 'WRITE_COMMENT'])
```

`grantIndicateurPermissionBodySchema` et `revokeIndicateurPermissionQuerySchema` utilisent ce même enum : ils accepteront les nouvelles valeurs sans autre modification.

**Fichier :** `packages/kpilote-shared/src/mePermissions.ts`

Le champ `actions: z.array(permissionActionSchema)` de `permissionEntrySchema` est automatiquement mis à jour. Mettre à jour le JSDoc pour décrire la sémantique des deux nouvelles actions (`WRITE_DATA` : valeurs et objectifs, `WRITE_COMMENT` : commentaires).

Le format de réponse reste une liste d'actions : `{ id: "...", actions: ["READ", "WRITE_DATA"] }`.

---

### 3. Permissions helpers — indicateurs

**Fichier :** `apps/kpilote-api/src/indicateur/permissions.ts`

`INDICATEUR_READ_PERMISSIONS` passe de `[READ, WRITE]` à `[READ, WRITE_DATA, WRITE_COMMENT]` : tout droit d'écriture implique le droit de lecture, appliqué à la couche query.

`ensureIndicateurWritePermission` est supprimée et remplacée par deux fonctions :

```ts
export const ensureIndicateurWriteDataPermission = ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): ResultAsync<void, never> =>
  // findUnique sur IndicateurPermission avec action = WRITE_DATA
  // lève ForbiddenError si absent

export const ensureIndicateurWriteCommentPermission = ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): ResultAsync<void, never> =>
  // findUnique sur IndicateurPermission avec action = WRITE_COMMENT
  // lève ForbiddenError si absent
```

La clause `OR` de `withIndicateurReadPermission` (propagation collection → indicateur) est mise à jour :

```ts
action: { in: [PermissionAction.READ, PermissionAction.WRITE_DATA, PermissionAction.WRITE_COMMENT] }
```

**Tests à mettre à jour :** `apps/kpilote-api/src/indicateur/permissions.test.ts`

Cas à couvrir :
- `WRITE_DATA` direct ouvre la lecture et l'écriture de données
- `WRITE_COMMENT` direct ouvre la lecture et l'écriture de commentaires
- `WRITE_DATA` seul n'ouvre pas l'écriture de commentaires (et vice versa)
- `WRITE_COMMENT` sur une collection propage READ sur ses indicateurs (comportement inchangé)
- `WRITE_DATA` sur une collection n'existe pas — non testable, défendu par le type

---

### 4. Permissions helpers — collections

**Fichier :** `apps/kpilote-api/src/collection/permissions.ts`

`COLLECTION_READ_PERMISSIONS` passe de `[READ, WRITE]` à `[READ, WRITE_COMMENT]`.

`ensureCollectionWritePermission` est renommée `ensureCollectionWriteCommentPermission` sans autre changement de logique.

---

### 5. Pipeline d'autorisation des mutations indicateur

**Fichier :** `apps/kpilote-api/src/indicateur/resolveIndicateurForWrite.ts`

La fonction unique est remplacée par deux exports :

```ts
export const resolveIndicateurForWriteData = async ({ indicateurPublicId }) => {
  // 1. findIndicateurWithReadPermission
  // 2. ensureIndicateurWriteDataPermission
  // retourne { indicateur, principalId }
}

export const resolveIndicateurForWriteComment = async ({ indicateurPublicId }) => {
  // 1. findIndicateurWithReadPermission
  // 2. ensureIndicateurWriteCommentPermission
  // retourne { indicateur, principalId }
}
```

**Fichier :** `apps/kpilote-api/src/indicateur/resolveIndicateurAndIndividuForWrite.ts`

Appelle désormais `resolveIndicateurForWriteData` (couvre valeurs ET objectifs).

---

### 6. Handlers de mutations

**Valeurs et objectifs** — aucune modification directe des routes ni des handlers : le changement est absorbé par `resolveIndicateurAndIndividuForWrite`.

Fichiers concernés sans modification :
- `src/valeurAvancement/routes.ts` et commandes associées
- `src/objectifIndicateurIndividu/routes.ts` et commandes associées

**Commentaires indicateur :**

`src/indicateur/commands/creerIndicateurIndividuCommentaire.ts` — remplacer `ensureIndicateurWritePermission` par `ensureIndicateurWriteCommentPermission`.

**Commentaires (édition/suppression) :**

`src/commentaire/resolveCommentairePourEcriture.ts` — deux changements :
- Branche `indicateurIndividu` → `ensureIndicateurWriteCommentPermission`
- Branche `collection` → `ensureCollectionWriteCommentPermission`

**Niveaux de confiance :**

`src/niveauConfiance/commands/creerNiveauConfiance.ts` — **aucun changement**. Ce handler vérifie uniquement que le principal est auteur du commentaire associé, pas de permission directe sur l'indicateur. C'est le comportement existant et voulu (voir section "Limitations connues" ci-dessous).

---

### 7. Endpoint `/me/permissions`

**Fichier :** `apps/kpilote-api/src/me/queries/listerMesPermissions.ts`

`ACTION_ORDER` passe de `[READ, WRITE]` à `[READ, WRITE_DATA, WRITE_COMMENT]`.

La logique de propagation (READ depuis une collection vers ses indicateurs) n'est pas affectée.

**Fichier :** `apps/kpilote-api/src/permission/queries/loadPrincipalPermissions.ts`

Même mise à jour de `ACTION_ORDER`.

---

### 8. Routes admin des permissions

**Fichiers :** `src/permission/routes.ts`, `src/permission/commands/grantIndicateurPermission.ts`, `src/permission/commands/revokeIndicateurPermission.ts`

Les handlers font un `upsert`/`deleteMany` avec `action: body.action`. Une fois `permissionActionSchema` mis à jour (point 2), ils acceptent nativement `WRITE_DATA` et `WRITE_COMMENT` sans modification de logique.

---

### 9. Webapp — hooks et composants

**Fichier :** `apps/kpilote-webapp/src/queries/mePermissions.ts`

`useCanWriteIndicateur` est supprimé et remplacé par deux hooks :

```ts
export const useCanWriteDataIndicateur = (indicateurId: string): boolean =>
  // permissions.isAdmin OU entry indicateurs[] avec WRITE_DATA

export const useCanWriteCommentIndicateur = (indicateurId: string): boolean =>
  // permissions.isAdmin OU entry indicateurs[] avec WRITE_COMMENT
```

`useCanWriteCollection` est renommé `useCanWriteCommentCollection` :

```ts
export const useCanWriteCommentCollection = (collectionId: string): boolean =>
  // permissions.isAdmin OU entry collections[] avec WRITE_COMMENT
```

**Usages à mettre à jour :**

| Fichier | Changement |
| --- | --- |
| `src/routes/_authenticated/indicateurs/$id.tsx` | `canWrite` → `canWriteData` (bouton import, drag-and-drop) |
| `src/components/indicateurs/commentaires/IndicateurCommentaireConfigProvider.tsx` | injection → `useCanWriteCommentIndicateur` |
| `src/components/collections/CollectionCommentaireConfigProvider.tsx` | injection → `useCanWriteCommentCollection` |
| `src/components/command-palette/useCanImport.ts` | `canWriteIndicateur` → `canWriteDataIndicateur` |

Le composant commun consommant `useCanWrite: () => bool` n'est **pas modifié** — seule l'injection dans chaque provider change.

**Tests à mettre à jour :** `apps/kpilote-webapp/src/queries/mePermissions.test.ts`

Cas à couvrir :
- Admin → `useCanWriteDataIndicateur` et `useCanWriteCommentIndicateur` retournent `true`
- `WRITE_DATA` → `useCanWriteDataIndicateur` retourne `true`, `useCanWriteCommentIndicateur` retourne `false`
- `WRITE_COMMENT` → `useCanWriteCommentIndicateur` retourne `true`, `useCanWriteDataIndicateur` retourne `false`
- `READ` seul → les deux hooks retournent `false`
- Idem pour `useCanWriteCommentCollection`

---

### 10. kpilote-admin — UI des permissions

**Fichier :** `apps/kpilote-admin/src/components/PrincipalPermissions.tsx`

Pour les **indicateurs**, le toggle binaire "Écriture" est remplacé par deux contrôles indépendants :
- **Données** → accorde/révoque `WRITE_DATA`
- **Commentaires** → accorde/révoque `WRITE_COMMENT`

Pour les **collections**, le toggle "Écriture" est simplement renommé "Commentaires" (il accorde/révoque `WRITE_COMMENT`).

**Fichier :** `apps/kpilote-admin/src/api/permissions.ts`

`toggleIndicateurWrite` est scindé en deux fonctions :

```ts
const toggleIndicateurWriteData = (indicateurPublicId: string, active: boolean) =>
  active
    ? revokeIndicateurPermission({ ..., action: 'WRITE_DATA' })
    : grantIndicateurPermission({ ..., action: 'WRITE_DATA' })

const toggleIndicateurWriteComment = (indicateurPublicId: string, active: boolean) =>
  active
    ? revokeIndicateurPermission({ ..., action: 'WRITE_COMMENT' })
    : grantIndicateurPermission({ ..., action: 'WRITE_COMMENT' })
```

---

## Limitations connues (hors périmètre de cette PR)

### Niveaux de confiance et révocation de WRITE_COMMENT

`creerNiveauConfiance.ts` vérifie uniquement que le principal est auteur du commentaire auquel le niveau de confiance est attaché. Il ne vérifie pas si le principal a toujours `WRITE_COMMENT` sur l'indicateur. En conséquence, un principal dont `WRITE_COMMENT` a été révoqué après la création du commentaire peut toujours attacher un niveau de confiance à ce commentaire.

Ce comportement existait déjà avant ce refactor et est documenté dans le code par un commentaire. Une vérification de permission supplémentaire pourrait être ajoutée dans une PR dédiée si le besoin se confirme.

---

## Commentaires en cours d'implémentation

### [Séquence 1] Enum unique vs. deux enums distincts

**Triko :** Se demande s'il ne faudrait pas distinguer deux ENUMs pour `PermissionAction` — un pour les collections (uniquement `READ` + `WRITE_COMMENT`) et un pour les indicateurs (les trois valeurs) — puisque les collections n'ont pas `WRITE_DATA`.

**Avis Claude :** C'est une question légitime. Un enum unique simplifie le schéma Prisma et la validation Zod partagée (un seul `permissionActionSchema`), mais au prix d'un état invalide représentable en base (`WRITE_DATA` sur une collection). Deux enums garantissent l'invalidité par construction — le type lui-même empêche l'erreur. Le contre-argument principal : ça double les routes, les helpers, les schemas Zod partagés, et complique l'UI admin. La décision actuelle compense en documentant l'invariant (tableau des actions par ressource) et en le faisant défendre uniquement par la logique applicative. À trancher si la prolifération de `WRITE_DATA` sur collection devient un risque opérationnel réel.

### [Séquence 2] Seeds — utilisateurs avec permissions partielles

**Triko :** Envisage d'ajouter dans les seeds des utilisateurs qui n'ont que `WRITE_DATA` ou que `WRITE_COMMENT` (sans l'autre), pour pouvoir tester manuellement les cas de permissions partielles.

**Avis Claude :** Bonne idée. Pour l'instant les seeds accordent systématiquement `READ + WRITE_DATA + WRITE_COMMENT` ensemble (via `grantOwnerPermissions`), ce qui ne couvre pas les cas où les deux droits d'écriture sont dissociés — qui est précisément le point de cette PR. Un seed dédié (ex. `user.commentateur@example.com` avec seulement `READ + WRITE_COMMENT` sur quelques indicateurs) permettrait de valider manuellement l'expérience côté webapp et admin sans passer par les tests d'intégration. À faire dans une PR de suivi ou directement dans ce chantier si le besoin de validation manuelle se confirme.

---

### [Séquence 2] Renommage de `resolveIndicateurAndIndividuForWrite`

**Triko :** Suggère de renommer `resolveIndicateurAndIndividuForWrite` en `resolveIndicateurAndIndividuForWriteData` pour être cohérent avec le split.

**Avis Claude :** Cohérent avec la nomenclature adoptée — `resolveIndicateurForWriteData` a été scindé, il est logique que son wrapper `resolveIndicateurAndIndividuForWrite` suive. Le risque est faible : c'est un export unique, utilisé par `valeurAvancement` et `objectifIndicateurIndividu` (mutations de données). Renommer ici clarifierait l'intention sans aucune ambiguïté. À faire si on veut la symétrie complète, sinon le nom actuel reste lisible même sans le suffixe.

---

### [Séquence 2] `resolveIndicateurForWriteComment` non utilisée

**Triko :** Constate que `resolveIndicateurForWriteComment` est exportée mais jamais importée dans le codebase.

**Avis Claude :** Confirmé par grep — seul `resolveIndicateurForWrite.ts` la définit, aucun fichier ne l'importe. La raison : la création de commentaire indicateur passe par `creerIndicateurIndividuCommentaire.ts` qui appelle directement `ensureIndicateurWriteCommentPermission` sans passer par le pipeline `resolveIndicateurForWrite*`. C'est un export mort. Deux options : (1) le supprimer maintenant pour garder le code propre — risque zéro, aucun appelant ; (2) le garder si on anticipe une future mutation qui en aurait besoin. Sans cas d'usage concret, supprimer est la bonne décision.

### [Séquence 3] Factorisation de `toggleIndicateurWriteData` et `toggleIndicateurWriteComment`

**Triko :** Les deux fonctions dans `PrincipalPermissions.tsx` sont quasi-identiques — seule l'action diffère. On peut factoriser ?

**Avis Claude :** Oui, facilement. La forme naturelle serait un helper `makeToggleIndicateurAction` qui prend l'action en paramètre et retourne la fonction :

```ts
const makeToggleIndicateurAction =
  (action: 'WRITE_DATA' | 'WRITE_COMMENT') =>
  (indicateurPublicId: string, active: boolean) =>
    run(() =>
      active
        ? revokeIndicateurPermission({ principalId, indicateurPublicId, action })
        : grantIndicateurPermission({ principalId, indicateurPublicId, action }),
    )

const toggleIndicateurWriteData = makeToggleIndicateurAction('WRITE_DATA')
const toggleIndicateurWriteComment = makeToggleIndicateurAction('WRITE_COMMENT')
```

Le même pattern s'appliquerait à `toggleCollectionWriteComment` si d'autres actions collection apparaissaient. En l'état (3 fonctions proches, logique triviale), la factorisation est optionnelle mais propre — à faire si on veut la cohérence ou si une troisième action venait s'ajouter.

---

## Récapitulatif des fichiers à modifier

| Couche | Fichier | Nature |
| --- | --- | --- |
| BDD | `prisma/schema.prisma` | Remplacer `WRITE` par `WRITE_DATA` + `WRITE_COMMENT` dans l'enum |
| BDD | Migration SQL | DELETE lignes WRITE + `ALTER TYPE` + suppression de `WRITE` |
| BDD | `prisma/seed.ts` | Mettre à jour les deux boucles de permissions (lignes 356 et 827) |
| Shared | `packages/kpilote-shared/src/permission.ts` | Mettre à jour `permissionActionSchema` |
| Shared | `packages/kpilote-shared/src/mePermissions.ts` | Mettre à jour le JSDoc |
| API | `src/indicateur/permissions.ts` | Scinder `ensureIndicateurWritePermission` ; mettre à jour `INDICATEUR_READ_PERMISSIONS` |
| API | `src/indicateur/permissions.test.ts` | Mettre à jour les tests avec les nouvelles actions |
| API | `src/collection/permissions.ts` | Renommer `ensureCollectionWritePermission` ; mettre à jour `COLLECTION_READ_PERMISSIONS` |
| API | `src/indicateur/resolveIndicateurForWrite.ts` | Scinder en `resolveIndicateurForWriteData` + `resolveIndicateurForWriteComment` |
| API | `src/indicateur/resolveIndicateurAndIndividuForWrite.ts` | Appeler `resolveIndicateurForWriteData` |
| API | `src/indicateur/commands/creerIndicateurIndividuCommentaire.ts` | Appeler `ensureIndicateurWriteCommentPermission` |
| API | `src/commentaire/resolveCommentairePourEcriture.ts` | Branches indicateur + collection → nouvelles fonctions |
| API | `src/me/queries/listerMesPermissions.ts` | `ACTION_ORDER` : `[READ, WRITE_DATA, WRITE_COMMENT]` |
| API | `src/permission/queries/loadPrincipalPermissions.ts` | Même mise à jour de `ACTION_ORDER` |
| Webapp | `src/queries/mePermissions.ts` | Scinder `useCanWriteIndicateur` et renommer `useCanWriteCollection` |
| Webapp | `src/queries/mePermissions.test.ts` | Mettre à jour les tests avec les nouvelles actions |
| Webapp | `src/routes/_authenticated/indicateurs/$id.tsx` | `canWrite` → `canWriteData` |
| Webapp | `src/components/indicateurs/commentaires/IndicateurCommentaireConfigProvider.tsx` | Injection → `useCanWriteCommentIndicateur` |
| Webapp | `src/components/collections/CollectionCommentaireConfigProvider.tsx` | Injection → `useCanWriteCommentCollection` |
| Webapp | `src/components/command-palette/useCanImport.ts` | `canWriteIndicateur` → `canWriteDataIndicateur` |
| Admin | `src/components/PrincipalPermissions.tsx` | Toggle indicateur → deux contrôles indépendants ; toggle collection → renommé |
| Admin | `src/api/permissions.ts` | Scinder `toggleIndicateurWrite` en deux fonctions |
