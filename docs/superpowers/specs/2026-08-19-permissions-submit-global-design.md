# Permissions d'un principal : brouillon éditable et enregistrement global

Date : 2026-08-19
Branche : `feat/multi-toggle-component`

## Problème

L'écran `PrincipalPermissions` (kpilote-admin) écrit au serveur à chaque clic. Chaque
bascule d'une case « Données » / « Commentaires », chaque ajout via le Picker et chaque
clic sur la corbeille déclenche immédiatement un `grant` ou un `revoke`.

Deux conséquences :

1. **Aucun brouillon.** En production, où l'écran impose déjà un déverrouillage explicite
   (`useProdEditUnlock`), l'administrateur ne peut pas composer un jeu de permissions puis
   le relire avant de le valider. Chaque clic est définitif.
2. **Une API de composant tordue.** `PermissionSection` reçoit des `WriteToggleSpec`, où
   chaque option transporte son propre `isActive(actions)` et son `onToggle(publicId,
   wasActive)`. Le composant ne reçoit pas une valeur mais une liste de comportements : il
   dérive la valeur par `filter(s => s.isActive(row.actions))`, puis reconstruit un diff
   dans `onValueChange` pour rappeler les bons callbacks. Rien n'y est branchable sur
   react-hook-form.

Le second point est ce qui a déclenché la réflexion. À noter : `MultiToggle` lui-même
n'est pas en cause. Sa signature (`value: TValue[]` / `onValueChange: (v: TValue[]) =>
void`) est exactement celle qu'un `<Controller>` alimente, et c'est déjà la convention du
package — `SegmentedControl` l'utilise et son commentaire mentionne explicitement l'usage
sous `Controller`. Le composant partagé n'a pas besoin d'être modifié.

## Décision

Faire de l'écran un vrai formulaire : les modifications s'accumulent dans un brouillon
local, un bouton « Enregistrer » les envoie en une fois, un bouton « Annuler » les jette.

Cela suppose un endpoint qui accepte un état désiré complet, car l'API actuelle est
strictement unitaire (`POST`/`DELETE` par triplet `principalId` × ressource × action).

## Contrat d'API

### `PUT /permissions`

Remplace l'intégralité des permissions directes d'un principal.

```ts
// packages/kpilote-shared/src/permission.ts
export const replacePrincipalPermissionsBodySchema = z.object({
  principalId: z.string().uuid(),
  collections: z.array(z.object({
    publicId: z.string(),
    actions: z.array(collectionPermissionActionSchema).min(1),
  })),
  indicateurs: z.array(z.object({
    publicId: z.string(),
    actions: z.array(indicateurPermissionActionSchema).min(1),
  })),
})
```

Réponse : `PrincipalPermissionsApiModel`, identique à celle du `GET` et des routes
unitaires.

**Réconciliation totale.** Toute permission directe absente du payload est supprimée.
C'est ce qui permet d'exprimer « retirer une ressource » sans verbe dédié. L'opération est
idempotente.

**Pas d'invariant `READ` côté API.** Un `WRITE_DATA` sans `READ` est accepté. La règle
« une ressource ajoutée est toujours lisible » est une convention de l'écran
d'administration, pas une règle du domaine ; l'API n'a pas à la connaître. Les routes
unitaires existantes l'autorisent déjà, le `PUT` reste cohérent avec elles.

**Héritage hors périmètre.** `indicateursHerites` n'apparaît pas dans le payload : il est
dérivé à la lecture par `loadPrincipalPermissions`, à partir des liens
collection → indicateur. Aucune ligne en base, donc rien à réconcilier. Il reste en
lecture seule dans l'UI.

**Erreurs.** `publicId` inconnu → 404, cohérent avec le `findUniqueOrThrow` des commandes
existantes. Appelant sans clé API `ADMIN` → 403, via `ensurePrincipal(isApiKeyAdmin, …)`.

### Implémentation serveur

`apps/kpilote-api/src/permission/commands/replacePrincipalPermissions.ts`, calqué sur les
commandes voisines : garde `ensurePrincipal`, retour `ResultAsync<…, never>`, appel final à
`loadPrincipalPermissions`. La route utilise `withTransaction`, déjà en place.

1. Résoudre les `publicId` → `id` en deux `findMany` ; un écart de cardinalité signale un
   identifiant inconnu.
2. Dans la transaction : `deleteMany({ principalId })` sur `indicateurPermission` et
   `collectionPermission`, puis `createMany` des lignes voulues.

Le remplacement intégral plutôt qu'un diff fin : les lignes ne portent que
`(principalId, resourceId, action)`, sans identifiant métier ni horodatage à préserver. Un
diff n'achèterait rien qu'une complexité. Le jour où l'on voudra conserver un `created_at`
par permission, c'est ce point qu'il faudra revoir.

Aucune migration : le schéma ne change pas.

Les quatre routes unitaires restent en place — elles sont publiées dans l'OpenAPI.
L'admin cesse simplement de les appeler.

## Front (kpilote-admin)

### Forme du formulaire

Les lignes ne portent que les actions d'écriture. `READ` est implicite et rajouté à la
sérialisation.

```ts
type PermissionRow<TWrite extends string> = {
  publicId: string
  nom: string
  writeActions: TWrite[]
}

type PermissionsFormValues = {
  indicateurs: PermissionRow<IndicateurPermissionWriteActionValue>[]
  collections: PermissionRow<'WRITE_COMMENT'>[]
}
```

`writeActions` est exactement la valeur de `MultiToggle`, donc le branchement est direct,
sans adaptateur ni filtrage :

```tsx
<Controller
  control={control}
  name={`${name}.${index}.writeActions`}
  render={({ field }) => (
    <MultiToggle value={field.value} onValueChange={field.onChange} options={writeActions} />
  )}
/>
```

`WriteToggleSpec` disparaît avec ses `isActive` / `onToggle`. `MultiToggle` n'est pas
modifié.

`toApi()` mappe chaque ligne vers `{ publicId, actions: ['READ', ...writeActions] }`.
C'est le seul endroit où vit l'invariant `READ`.

### Composants

`PermissionSection` devient form-aware et reste dans `kpilote-admin` : elle prend
`control`, `name`, `writeActions: readonly { value, label }[]`, `addControl`, `disabled`,
`extraForRow`, et fait son `useFieldArray` en interne — `append` pour le Picker, `remove`
pour la corbeille. C'est le motif déjà employé par `AdminReferentiels`.

`kpilote-ui` ne garde que le composant plat. Aucun ajout au package.

`PrincipalPermissions` devient l'hôte du formulaire : `useForm` avec `defaultValues`
issus de la query, deux `PermissionSection`, la barre d'action.

### Propriété de l'état

Le formulaire est propriétaire de l'état après le montage. `defaultValues` au premier
rendu, et `reset(toForm(fresh))` **uniquement** dans le `onSuccess` de la mutation.

`refetchOnWindowFocus: false` doit être posé sur `principalPermissionsQueryOptions` :
sans cela, un simple changement de fenêtre refetch la query et fait bouger le cache sous
le formulaire, écrasant silencieusement le brouillon.

### Barre d'action

Affichée dès que `formState.isDirty` : compteur de modifications, `Annuler` (`reset()`
vers les valeurs initiales), `Enregistrer` — libellé `🚨 Enregistrer en Prod` quand
`isProd`, suivant la convention de `CollectionForm`, et désactivé tant que `locked`.

Le verrou PROD porte désormais sur la validation seule, plus sur chaque contrôle : on
compose son brouillon librement, on déverrouille pour valider.

### Retrait de ressource

Retrait sec : `useFieldArray.remove`, la ligne disparaît. Un badge `● nouveau` signale les
lignes ajoutées non encore enregistrées. Pas de soft-remove avec annulation par ligne —
`Annuler` couvre déjà le clic malheureux, et une ressource retirée par erreur se
réajoute par le Picker.

## Hors périmètre

Un `MultiToggleField` pour `ChampMailleApplicable` (apps/pilote-ppg) a été envisagé puis
écarté : `pilote-ppg` ne dépend d'aucun package `kpilote-*`, et cette frontière est
volontaire. Les deux applications gardent leurs composants propres.

## Séquencement

**Séquence 1 — `kpilote-shared` + `kpilote-api`.** Schéma, commande, route, tests
d'intégration. Purement additif : aucune migration, aucune route existante modifiée.
Mergeable seule.

**Séquence 2 — `kpilote-admin`.** Client API, refonte de `PermissionSection`,
`PrincipalPermissions` en formulaire, barre d'action, option de query. Dépend de la
séquence 1.

## Tests

Uniquement côté API. `replacePrincipalPermissions.test.ts`, sur le modèle de
`revokeIndicateurPermission.test.ts` (`integrationTest`, `runAsAdmin`, `fixtures`) :

- remplace l'état complet : une ressource absente du payload disparaît
- ajoute et retire dans le même appel
- idempotent : deux `PUT` identiques donnent le même état
- accepte `WRITE_DATA` sans `READ` — ce test documente la décision et empêche qu'on
  « rétablisse » l'invariant côté API plus tard
- `publicId` inconnu : rejet **et état précédent intact**, ce qui prouve l'atomicité et
  justifie l'endpoint bulk
- appelant non-`ADMIN` : refus
- `indicateursHerites` recalculé après remplacement d'une permission collection

Plus `['/permissions', 'put']` ajouté à la liste `attendu` de `routes.test.ts`.

Pas de plan de tests front.
