# Permissions — design transverse

Date : 2026-06-04
Statut : implémenté

## Contexte

mb-api expose plusieurs ressources métier (indicateurs, collections, à terme :
référentiels, individus, widgets) que tout principal authentifié n'a pas
forcément le droit de voir ou modifier. Ce document décrit le **modèle de
permissions transverse** utilisé pour ces ressources, les invariants qu'il
garantit, et les conventions à respecter pour étendre le modèle à une nouvelle
ressource.

Le besoin produit qui a déclenché la formalisation : permettre des
collections d'indicateurs privés (visibles uniquement par certains principals)
sans dupliquer la mécanique déjà en place pour les indicateurs eux-mêmes.

## Modèle

### Principal

Toute identité authentifiée — utilisateur OIDC ou clé API — est représentée
par une ligne dans `principal`. Les tables `utilisateur` et `api_key` ont leur
PK qui référence `principal.id`. C'est cette identité unique qui porte les
permissions, indépendamment du canal d'authentification.

```
Principal (id: UUID)
├── Utilisateur (1-1)
└── ApiKey (1-1)
```

### Visibilité

Chaque ressource « sécurisée » porte une colonne `visibilite: Visibilite` avec
deux valeurs :

- `PUBLIC` — accessible en lecture (READ) à tout principal authentifié, sans
  permission explicite.
- `PRIVE` — accessible uniquement aux principals avec une permission explicite
  sur la ressource.

C'est la sémantique appliquée aujourd'hui aux indicateurs et aux collections. Les
ressources sans concept de visibilité (référentiels, widgets, individus en v0)
restent ouvertes à tout principal authentifié.

### Permissions

Pour chaque ressource sécurisée, une table de jonction
`{ressource}_permission(principal_id, {ressource}_id, action)` matérialise
les droits explicites :

- PK composite `(principal_id, {ressource}_id, action)` — un principal peut
  avoir plusieurs actions sur une ressource (typiquement READ et WRITE).
- Index sur `{ressource}_id` (lookups inverses fréquents).
- Index sur `principal_id` quand la table est utilisée pour des `where`
  filtrés par principal (cas collections/indicateurs : la PK couvre déjà ce
  cas via son ordre, donc pas d'index supplémentaire nécessaire).
- FK avec `ON DELETE CASCADE` sur les deux côtés.

### Actions

```
PermissionAction ∈ { READ, WRITE }
```

- `READ` : autorise la lecture (queries `list*`, `get*ByPublicId`).
- `WRITE` : autorise la modification (commands `upsert*`, `delete*`). **WRITE
  n'implique pas READ par la sémantique de l'enum**, mais par convention, les
  helpers `with*ReadPermission` acceptent les deux actions comme valant un
  READ (un principal qui peut écrire peut lire). Voir constantes
  `INDICATEUR_PERMISSIONS_GRANTING_READ` / `COLLECTION_PERMISSIONS_GRANTING_READ`.

## Helpers

### `with{Ressource}ReadPermission(where, principalId)`

Compose un `Prisma.{Ressource}WhereInput` avec la clause de filtrage par
permission. Pattern systématique :

```ts
({ AND: [where, { OR: [
  { visibilite: 'PUBLIC' },
  { permissions: { some: { principalId, action: { in: [READ, WRITE] } } } },
  // ... éventuelles branches de propagation (voir ci-dessous)
] }] })
```

Appliqué dans **toutes** les queries de lecture (`list*`, `get*ByPublicId`).
Aucune query de lecture sécurisée ne doit accéder à `db().{ressource}` sans
passer par ce helper.

### `ensure{Ressource}WritePermission({ principalId, ...id })`

Renvoie un `ResultAsync<void, never>` qui throw `ForbiddenError` si le
principal n'a pas la permission WRITE explicite sur la ressource. Appliqué au
début de toute command (`upsert`, `delete`).

Le WRITE est strictement direct : il ne se propage **jamais** depuis une autre
ressource (cf. invariant ci-dessous).

## Propagation collection → indicateur

Cas particulier explicite : un principal qui a READ ou WRITE sur une collection
gagne **automatiquement** READ sur tous les indicateurs qui composent le
collection. Le helper `withIndicateurReadPermission` ajoute donc une troisième
branche OR :

```ts
{ collections: { some: { collection: { permissions: { some: { principalId, action: { in: [READ, WRITE] } } } } } } }
```

**Pourquoi cette direction (collection → indicateur, pas indicateur → collection) :**
la collection est une « vue » composée, c'est un cas d'usage explicite de
partage groupé. Permettre à un destinataire de collection de consulter les
indicateurs qu'il contient est attendu et naturel. L'inverse (accès à un
indicateur ⇒ accès à toutes les collections qui le citent) n'aurait pas de sens.

**Pourquoi READ uniquement, pas WRITE :** une collection est un container — le
fait de pouvoir gérer une collection (ajouter/retirer des indicateurs) ne doit
**pas** permettre de modifier les valeurs ou la définition des indicateurs
eux-mêmes. La distinction container vs contenu est portée par la sémantique
des permissions : `WRITE` sur collection = modifier la collection, pas son contenu.

## Invariants

1. **Toute query de lecture sur une ressource sécurisée passe par
   `with{Ressource}ReadPermission`.** Aucune exception : si une nouvelle
   query est ajoutée, elle doit appliquer ce helper, sinon elle expose des
   données sans contrôle d'accès.

2. **Toute command sur une ressource sécurisée appelle
   `ensure{Ressource}WritePermission` en première instruction.** Pas
   d'écriture sans WRITE explicite.

3. **WRITE est strictement direct, jamais propagé.** Si on étend la
   propagation à d'autres ressources (ex. catégorie ⇒ indicateurs), elle se
   limite à READ. La propagation WRITE introduirait des escalations de
   privilèges indirectes très difficiles à raisonner.

4. **Les routes protégées par permissions DOIVENT exiger `requireAuthentication`
   en middleware.** Le helper `requireCurrentPrincipalId()` throw
   `UnauthorizedError` sinon — c'est la garantie qu'on n'exécute jamais une
   query permissionnée avec un principal nul.

5. **PUBLIC vs PRIVE est une propriété de la ressource, pas du contenu.**
   Le contenu d'une ressource publique peut inclure des éléments privés (rare
   mais possible) : la visibilité du conteneur ne « rend » pas son contenu
   public. La propagation collection → indicateur est l'inverse — elle propage la
   visibilité du conteneur vers son contenu, ce qui est explicite et
   sémantiquement justifié.

## Performance

Les helpers `with*ReadPermission` introduisent un OR avec une sous-requête
`permissions.some`. Pour rester performant :

- Index sur `{ressource}_permission.principal_id` (ou couverture par la PK
  composite si l'ordre est `(principal_id, ...)`, ce qui est le cas).
- Quand on ajoute une branche de propagation traversant N-N (ex. collections via
  `collection_indicateur` puis `collection_permission`), l'index `collection_permission(principal_id)`
  devient critique — la profondeur du `some.some` ne permet pas à PostgreSQL
  de l'inférer sans aide.
- Le pattern actuel (≤ 3 branches OR par helper) reste OK jusqu'à quelques
  millions de lignes par table. Si on dépasse, envisager une projection
  matérialisée des permissions effectives par principal.

## Pas d'API de gestion des permissions

L'attribution des permissions est aujourd'hui exclusivement gérée via
`prisma/seed.ts`. Pas d'endpoints `POST /permissions/...`. Quand un besoin
d'administration émerge (ex. UI admin pour la DITP), on introduira des
commands dédiées en suivant le pattern existant des autres commands
(neverthrow, `ensure*WritePermission` sur la ressource gestionnaire, etc.).

## Comment étendre à une nouvelle ressource

Pour ajouter le modèle de permissions à une nouvelle ressource `Foo` :

1. **Schéma Prisma** : ajouter `visibilite: Visibilite` sur `Foo`, créer
   `FooPermission(principalId, fooId, action)` avec PK composite, index sur
   `fooId`, relation inverse sur `Principal`.
2. **Migration** : suivre le pattern de
   `20260521120000_add_indicateur_visibilite` (colonne nullable → backfill →
   NOT NULL) et `20260512120000_add_principal_and_permissions` (création
   table + FK).
3. **Helpers** : créer `src/foo/permissions.ts` avec `withFooReadPermission`
   et `ensureFooWritePermission`.
4. **Queries / commands** : appliquer les helpers partout. Aucune exception.
5. **Routes** : middleware `requireAuthentication` obligatoire.
6. **Fixtures** : étendre `fixtures.foo` avec `visibilite` + `permissions`,
   et étendre `fixtures.apiKey` / `fixtures.utilisateur` avec
   `fooPermissions`.
7. **Tests** : tests d'intégration sur la liste/détail avec PUBLIC, PRIVE
   avec permission, PRIVE sans permission.
8. **Propagation éventuelle** : si la ressource agrège d'autres ressources
   sécurisées, décider explicitement de la propagation READ et la documenter
   ici.

## Limitations connues

- **Pas de notion de groupe / rôle.** Les permissions sont attribuées
  principal par principal. Pour un usage large, on passera par un système
  de groupes (`PrincipalGroup` + `GroupPermission`) — pas avant qu'un cas
  d'usage métier l'exige.
- **Pas d'héritage hiérarchique.** Une collection de collections, ou un référentiel
  parent qui propage à ses enfants, n'existe pas. À traiter au cas par cas
  si le besoin émerge.
- **Pas de permissions négatives (deny).** Le modèle est purement additif :
  on accorde, on ne retire pas explicitement.
- **Pas d'audit / pas d'historisation des changements de permission.** À
  ajouter si la conformité l'exige.
