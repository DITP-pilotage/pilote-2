# Gestion des permissions — mb-admin

Date : 2026-07-03
Statut : design validé

## Contexte

Les modèles `IndicateurPermission` et `PanierPermission` existent en base
(`apps/mb-api/prisma/schema.prisma`) et le modèle de permissions transverse est
documenté dans `apps/mb-api/docs/architecture/permissions-design.md`. Jusqu'ici
l'attribution des permissions se faisait exclusivement via `prisma/seed.ts` —
aucune API d'administration, aucune IHM. Le doc de design anticipait ce besoin :
« Quand un besoin d'administration émerge (ex. UI admin pour la DITP), on
introduira des commands dédiées ».

Ce spec couvre l'ajout du **write/admin side** : endpoints de gestion dans
`mb-api` + IHM d'administration dans `mb-admin`.

## Rappel du modèle (existant, non modifié)

- Un **`Principal`** est une identité polymorphe : soit un `Utilisateur` (OIDC),
  soit une `ApiKey`, partageant la même PK. C'est lui qui porte les permissions.
- Une permission = une ligne `{ressource}_permission(principalId, {ressource}Id, action)`
  avec **PK composite** `(principalId, resourceId, action)` — pas d'id surrogate.
  Un principal READ+WRITE sur une ressource = deux lignes.
- `PermissionAction ∈ { READ, WRITE }`. Additif, pas de deny.
- Ressources adressées publiquement par `publicId` (`IND-…` / `PAN-…`), FK stocke
  l'UUID `id`. `Indicateur` et `Panier` ont tous deux un champ `nom`.
- **Propagation** : un principal avec READ ou WRITE sur un panier gagne
  automatiquement READ sur les indicateurs du panier. WRITE indicateur est
  strictement direct, jamais propagé.
- `onDelete: Cascade` partout.

## Décisions produit

1. **Modèle mental : par principal.** On gère les permissions dans le contexte de
   l'identité (utilisateur ou clé API). Pas d'écran de sélection de principal.
2. **Point d'entrée : section « Permissions » sur la fiche détail de chaque
   principal**, via un composant panel unique réutilisé.
   - Fiche utilisateur : `routes/_authed/utilisateurs/$id.tsx` (existe déjà).
   - Fiche clé API : `routes/_authed/api-keys/$id.tsx` (**à créer** — n'existe pas
     aujourd'hui, seulement liste + création).
3. **Actions : deux toggles indépendants** READ / WRITE par ressource, fidèles à la
   base (extensible si d'autres droits apparaissent). Indice visuel discret quand
   WRITE est actif (READ implicite par convention « qui écrit peut lire »).
4. **Mutations optimistes immédiates** : chaque toggle = grant/revoke d'une ligne ;
   pas de bouton « Enregistrer ». Rollback + message si l'API échoue.
5. **Ajout via modale de recherche** : on n'affiche jamais tout le catalogue. Une
   `ResourceSearchModal` (onglet Panier / Indicateur, recherche paginée par
   `publicId`/`nom`) permet d'ajouter une ressource à la liste.
6. **Accès hérités affichés en lecture seule** : les indicateurs obtenus par
   propagation panier→indicateur sont listés grisés, tag « hérité · via PAN-XXX »,
   non modifiables. Évite la confusion « pourquoi voit-il cet indicateur ? ».
7. **Sécurité prod : déverrouillage par session.** En environnement `prod`, le
   panel est en lecture seule (toggles / ✕ / ajout désactivés) avec un bandeau,
   jusqu'à ce que l'admin clique « Déverrouiller l'édition en PROD » (confirmation).
   Le déverrouillage persiste pour la session (`sessionStorage`, réinitialisé au
   logout).
8. **Pas de carte sur le hub `fonctionnalites`** — l'accès passe uniquement par les
   fiches.

## Hors périmètre (YAGNI)

- Vue par ressource (« qui a accès à ce panier »).
- Groupes / rôles, permissions négatives (deny), audit / historisation.

Cohérent avec les limitations documentées dans `permissions-design.md`.

## Backend — `apps/mb-api`

### Contrat partagé

Nouveau `packages/mb-shared/src/permission.ts` + entrée `exports` dans
`packages/mb-shared/package.json` :

- `permissionActionSchema = z.enum(['READ', 'WRITE'])` — extrait/partagé avec
  `mePermissions.ts` (source unique).
- `principalPermissionsApiModelSchema` :
  ```ts
  {
    paniers:            { publicId, nom, actions: PermissionAction[] }[]  // directs
    indicateurs:        { publicId, nom, actions: PermissionAction[] }[]  // directs
    indicateursHerites: { publicId, nom, viaPanierPublicId, viaPanierNom }[] // READ propagé, RO
  }
  ```
- `grantPermissionBodySchema = { resourceType: z.enum(['PANIER','INDICATEUR']), resourcePublicId: z.string(), action: permissionActionSchema }`
- Types inférés associés.

### Endpoints

Nouveau dossier `apps/mb-api/src/permission/` (`routes.ts`, `utils.ts`,
`commands/`, `queries/`, tests colocalisés), même pattern que `utilisateur/`.
**Tous** gatés par `middleware: [requireAuthentication]` + `ensurePrincipal(isApiKeyAdmin, …)`
en première instruction. Enregistré dans `app.ts` via `app.route('/', permissionRoutes)`.

- **`GET /permissions?principalId=<uuid>`** → `principalPermissionsApiModel`.
  Charge les permissions directes paniers + indicateurs du principal, groupe par
  ressource (`actions[]`), et calcule les indicateurs hérités en réutilisant la
  logique de propagation de `listerMesPermissions` (un indicateur déjà direct
  n'apparaît pas dans `indicateursHerites`). 404 si `principalId` inexistant.

- **`POST /permissions`** body `{ principalId, resourceType, resourcePublicId, action }`
  → grant **idempotent**. Valide que `resourcePublicId` a le bon préfixe pour
  `resourceType` (`IND-` / `PAN-`), résout `publicId → id`, upsert de la ligne
  (`(principalId, resourceId, action)`). 404 si principal ou ressource introuvable.
  Retourne 200 (que la ligne ait existé ou non).

- **`DELETE /permissions?principalId&resourceType&resourcePublicId&action?`**
  → revoke. Si `action` fourni : supprime cette ligne. Si `action` omis : supprime
  **toutes** les actions de la ressource pour ce principal (bouton ✕). Idempotent
  (204 même si rien à supprimer).

### Recherche admin (bypass visibilité)

Les queries `listIndicateurs` / `listPaniers` appliquent aujourd'hui
`with{Ressource}ReadPermission`, qui filtre par visibilité + permissions du
principal courant. Une clé ADMIN ne verrait donc **pas** les ressources privées
dans la modale de recherche.

→ Ajout d'un bypass admin : quand `isApiKeyAdmin`, les queries de liste
court-circuitent `with*ReadPermission` (retour non filtré PUBLIC + PRIVÉ).
`GET /paniers` reçoit un filtre `recherche` (par `nom`/`publicId`) s'il n'en a pas
déjà un, aligné sur `GET /indicateurs`.

### `GET /api-keys/{id}`

Ajout à `apps/mb-api/src/apiKey/routes.ts` (gaté ADMIN) — nécessaire pour afficher
les métadonnées de la clé sur sa fiche détail (`label`, `role`, `prefix`,
`expiresAt`, `revokedAt`, `lastUsedAt`). Aujourd'hui seuls create / list / revoke
existent.

## Frontend — `apps/mb-admin`

### BFF

Ajouter `permissions` et `paniers` à la regex `SAFE_PATH` de
`src/server/api/router.ts` (sinon le proxy 403).

### Couches data

- `src/api/permissions.ts` : `getPrincipalPermissions(principalId)`,
  `grantPermission(...)`, `revokePermission(...)` (ky via `bffClient`, `schema.parse`).
- `src/api/paniers.ts` : recherche paginée (nouveau). Réutilise l'API `indicateurs`
  existante pour la recherche indicateurs.
- `src/queries/permissions.ts` : `queryOptions` par principal + factories de
  recherche pour la modale.

### Composant panel `components/PrincipalPermissions.tsx`

Props `{ principalId }`. Monté sur les deux fiches :
- `routes/_authed/utilisateurs/$id.tsx` — section sous les infos.
- `routes/_authed/api-keys/$id.tsx` — **nouvelle** fiche (métadonnées + section).

UX :
- Deux sections **Paniers** / **Indicateurs**.
- Ligne directe : `publicId` + `nom` + chips toggle **READ** / **WRITE** + ✕.
  - Toggle chip → grant/revoke optimiste d'une ligne ; ✕ → revoke total ressource.
  - Rollback + message d'erreur si l'API échoue (invalidation React Query).
  - Indice visuel discret « READ implicite » quand WRITE actif.
- Indicateurs hérités : listés grisés sous les directs, tag « hérité · via PAN-XXX »,
  aucun contrôle.
- Bouton **« + Ajouter une permission »** → `ResourceSearchModal` (onglet
  Panier / Indicateur, recherche paginée admin `publicId`/`nom`). Sélection ajoute
  la ressource avec READ par défaut, puis toggles.
- États `EmptyState` (aucune permission) + chargement.

### Modale `components/ResourceSearchModal.tsx`

Recherche paginée (infinite query) sur `paniers` ou `indicateurs` selon l'onglet
actif, affiche `publicId` + `nom`, `onSelect(resource)` renvoie au panel. Exclut
les ressources déjà présentes dans la liste directe.

### Sécurité prod (déverrouillage session)

Hook `useProdEditUnlock()` (persisté `sessionStorage`, purgé au logout) :
- En `prod` et verrouillé : panel en lecture seule, bandeau « Édition verrouillée
  en PROD » + bouton « Déverrouiller l'édition en PROD » (confirmation).
- Une fois déverrouillé : mutations autorisées pour la session, style accent
  rappelant le contexte prod.
- Hors `prod` : toujours éditable.

## Tests

- **Backend** : Vitest colocalisés (routes + commands + queries).
  - grant idempotent (ligne déjà existante → 200, pas de doublon).
  - revoke action unique vs revoke total ressource.
  - résolution `publicId → id` + validation préfixe/type (400/404).
  - bypass admin : liste inclut les ressources PRIVÉ pour une clé ADMIN.
  - 403 pour une clé non-ADMIN sur chaque endpoint.
  - `GET /permissions` : directs groupés + indicateurs hérités calculés, un
    indicateur direct n'apparaît pas comme hérité.
- **Frontend** : pas de plan de tests dédié (convention projet).

## Points de vigilance

- Cohérence avec le read-side `/me/permissions` : la logique de propagation
  panier→indicateur doit rester identique (réutiliser plutôt que redupliquer).
- Ne jamais exposer la clé API réelle côté navigateur (le BFF injecte le Bearer).
- Les endpoints `/permissions` exigent une clé **ADMIN** (403 sinon), surfacé
  proprement dans l'IHM.
