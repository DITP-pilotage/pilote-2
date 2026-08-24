# Design — Feature Flipping (kpilote)

**Date :** 2026-07-15
**Branche :** `feature-flipping`
**Statut :** validé (design), prêt pour plan d'implémentation

## Objectif

Ajouter à kpilote un système de **feature flipping persisté en base**, avec ciblage possible par utilisateur, administrable via `kpilote-admin` et consommable dans `kpilote-webapp` via un hook `useFeatureFlipping(key)`.

Aujourd'hui il n'existe **aucun** feature flipping sur kpilote (l'ancien système `NEXT_PUBLIC_FF_*` / `gestion_contenu` appartient à l'app legacy `pilote-ppg` et n'est pas concerné).

## Périmètre

Le feature flipping traverse **4 packages** :

| Package | Rôle |
|---|---|
| `packages/kpilote-shared` | Modèles Zod partagés (contrats API) |
| `apps/kpilote-api` | 2 tables Prisma + endpoints CQRS (admin + `/me`) + script de création |
| `apps/kpilote-admin` | UI d'admin : onglet, liste, fiche, modal multi-select |
| `apps/kpilote-webapp` | Hook `useFeatureFlipping(key)` de consommation |

**Décision structurante :** la **création** d'un feature flipping se fait **par migration Prisma** (pas d'UI de création). L'admin ne fait que **lister**, **changer l'état**, et **gérer les utilisateurs autorisés**.

---

## 1. Base de données — `apps/kpilote-api/prisma/schema.prisma`

Conventions kpilote-api : modèles **PascalCase**, table SQL en snake_case via `@@map`, colonnes FK `@map(...) @db.Uuid`, IDs `String @id @db.Uuid` (générés côté applicatif / SQL, **pas de `@default`**), join tables à clé composite `@@id([...])` (cf. `PanierResponsable`, `IndicateurResponsable`).

```prisma
enum FeatureFlippingEtat {
  ACTIVE                   // actif pour tout le monde
  ACTIVE_POUR_UTILISATEUR  // actif seulement pour les utilisateurs autorisés
  DESACTIVE                // inactif pour tous
}

model FeatureFlipping {
  id        String              @id @db.Uuid
  key       String              @unique                     // ^[a-z0-9_-]+$
  nom       String
  etat      FeatureFlippingEtat @default(DESACTIVE)
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt      @map("updated_at")

  utilisateursAutorises FeatureFlippingUtilisateur[]

  @@map("feature_flipping")
}

model FeatureFlippingUtilisateur {
  featureFlippingId String   @map("feature_flipping_id") @db.Uuid
  utilisateurId     String   @map("utilisateur_id")      @db.Uuid
  createdAt         DateTime @default(now())             @map("created_at")

  featureFlipping FeatureFlipping @relation(fields: [featureFlippingId], references: [id], onDelete: Cascade)
  utilisateur     Utilisateur     @relation(fields: [utilisateurId],     references: [id], onDelete: Cascade)

  @@id([featureFlippingId, utilisateurId])
  @@index([featureFlippingId])
  @@map("feature_flipping_utilisateur")
}
```

Ajout de la back-relation sur `Utilisateur` :

```prisma
model Utilisateur {
  // …
  featureFlippingsAutorises FeatureFlippingUtilisateur[]
}
```

La **première migration** crée l'enum + les 2 tables. Les **valeurs de FF** (lignes `feature_flipping`) sont insérées par des migrations ultérieures (cf. §5).

---

## 2. Contrats partagés — `packages/kpilote-shared`

Nouveaux fichiers (chacun exporte un `xxxApiModelSchema` Zod + le type inféré, + entrée `exports` dans `package.json`) :

- `src/featureFlipping.ts`
  - `featureFlippingEtatSchema = z.enum(['ACTIVE', 'ACTIVE_POUR_UTILISATEUR', 'DESACTIVE'])`
  - `featureFlippingKeySchema = z.string().regex(/^[a-z0-9_-]+$/)`
  - `featureFlippingApiModelSchema` : `{ id, key, nom, etat }` (item de liste)
  - `featureFlippingDetailApiModelSchema` : `{ id, key, nom, etat, utilisateursAutorises: UtilisateurApiModel[] }` (fiche)
  - `modifierEtatFeatureFlippingBodySchema` : `{ etat: FeatureFlippingEtat }`
  - `remplacerUtilisateursAutorisesBodySchema` : `{ utilisateurIds: z.array(z.string().uuid()) }`
  - liste : `z.array(featureFlippingApiModelSchema)` — **sans pagination** (le nombre de FF reste faible).
- `src/meFeatureFlipping.ts`
  - `meFeatureFlippingApiModelSchema = z.object({ features: z.array(featureFlippingKeySchema) })`

Réutilise `UtilisateurApiModel` de `@pilote/kpilote-shared/utilisateur` pour la liste des autorisés.

---

## 3. API — `apps/kpilote-api`

Pattern CQRS existant : fonctions renvoyant `ResultAsync`, accès Prisma direct via `db()`, routes Hono `createRoute` + `.openapi()`, montées dans `src/app.ts`. Mapper + `include` dans `utils.ts`. **Rappel** ([[project_mbapi_tsconfig_paths]]) : ajouter `"@/featureFlipping/*"` dans `tsconfig.json`.

### Nouvel agrégat `src/featureFlipping/`

- `utils.ts` : `featureFlippingInclude` (`{ utilisateursAutorises: { include: { utilisateur: true } } }`), types `GetPayload`, `toFeatureFlippingApiModel(row)` et `toFeatureFlippingDetailApiModel(row)`.
- `queries/listerFeatureFlippings.ts` → `db().featureFlipping.findMany({ orderBy: { nom: 'asc' } })` → liste.
- `queries/getFeatureFlippingById.ts` → `findUniqueOrThrow` + `include`, → détail (404 `NotFoundError` si absent).
- `commands/modifierEtatFeatureFlipping.ts` → `db().featureFlipping.update({ where: { id }, data: { etat } })`.
- `commands/remplacerUtilisateursAutorises.ts` → réconciliation liste (mirror `remplacerResponsables` de `src/indicateur/commands/upsertIndicateur.ts`) : vérifie que les `utilisateurId` existent (`ValidationError('Utilisateurs inconnus')` sinon), `deleteMany` les retirés, `upsert` les ajoutés via la clé composite. Helper possible : `src/framework/collections/diff.ts`.
- `routes.ts` : `featureFlippingRoutes = createOpenApiHono()` avec :
  - `GET /feature-flipping` → `listerFeatureFlippings`
  - `GET /feature-flipping/:id` → `getFeatureFlippingById`
  - `PATCH /feature-flipping/:id/etat` (`modifierEtatFeatureFlippingBody`) → `modifierEtatFeatureFlipping`
  - `PUT /feature-flipping/:id/utilisateurs` (`remplacerUtilisateursAutorisesBody`) → `remplacerUtilisateursAutorises`
  - Mutations wrappées dans `withTransaction`.
- `openapi.ts` : wrappers de réponses (`succes200`/`erreur400/404`) sur les schémas partagés.
- Montage : `app.route('/', featureFlippingRoutes)` dans `src/app.ts`.

### Consommation dans l'agrégat `me/` existant

- `queries/listerMesFeatureFlippings.ts` : résout les **keys actives** pour l'utilisateur courant (`requireUser().id`) :

  ```
  etat = ACTIVE
  OU (etat = ACTIVE_POUR_UTILISATEUR ET utilisateur ∈ utilisateursAutorises)
  ```

  `DESACTIVE` → exclue. Requête :
  `db().featureFlipping.findMany({ where: { OR: [ { etat: 'ACTIVE' }, { etat: 'ACTIVE_POUR_UTILISATEUR', utilisateursAutorises: { some: { utilisateurId } } } ] }, select: { key: true } })`
  → `{ features: rows.map(r => r.key) }`.
- Nouvelle route dans `src/me/routes.ts` : `GET /me/feature-flipping` (middleware `requireAuthentication`, schéma `meFeatureFlippingApiModelSchema`).

---

## 4. Admin UI — `apps/kpilote-admin`

Stack : Vite + TanStack Router (fichiers → `routeTree.gen.ts`), React Query, client `ky` vers le **BFF** Hono (`/api/*`), Tailwind v4.

- **Carte d'accès** dans `src/routes/_authed/fonctionnalites.tsx` (`<BarCard>` → `navigate({ to: '/feature-flipping' })`).
- **Allowlist BFF** : ajouter `feature-flipping` au regex `SAFE_PATH` de `src/server/api/router.ts` (sinon 403 sur tous les appels FF).
- **Couche accès** : `src/api/featureFlipping.ts` (`ky` + `schema.parse`) et `src/queries/featureFlipping.ts` (`queryOptions` liste + détail, mutations état + utilisateurs).
- **Liste** `src/routes/_authed/feature-flipping/index.tsx` (mirror `api-keys/index.tsx`) : `Table` (key, nom, état). L'**état est modifiable inline** via un `SegmentedControl` 3 valeurs (`ACTIVE` / `ACTIVE_POUR_UTILISATEUR` / `DESACTIVE`) → `PATCH /feature-flipping/:id/etat` + `invalidateQueries`. Ligne cliquable → fiche (`clickableRowProps` + `Link to="/feature-flipping/$id"`).
- **Fiche** `src/routes/_authed/feature-flipping/$id.tsx` (mirror `referentiels/$id.tsx`) :
  - Récap : key, nom, état (le `SegmentedControl` d'état est rappelé ici).
  - Section **utilisateurs autorisés** : liste des autorisés + bouton « Gérer les utilisateurs » ouvrant la modal (§ ci-dessous). Affiche un indicateur discret « n'a d'effet que dans l'état ACTIVE_POUR_UTILISATEUR » quand l'état courant est autre (les données restent éditables).
- **Modal multi-select** (nouveau composant, ex. `src/components/FeatureFlippingUtilisateursModal.tsx`) : **vraie modal à cases à cocher**. Charge tous les utilisateurs (`utilisateursAllQueryOptions`), champ de recherche (filtre client par nom/email), cases cocher/décocher, sélection initialisée avec les autorisés actuels. Validation → `PUT /feature-flipping/:id/utilisateurs` avec la **liste complète** des `utilisateurId` cochés (upsert de toute la liste) + `invalidateQueries` sur la fiche. Base : overlay Radix/`fixed inset-0` comme `IndicateurSearchModal.tsx`, cases via `ui/` existant (`Checkbox` / `TabNav` si sous-onglets).
- Le route tree se régénère via `tsr generate`.

---

## 5. Script de création de FF — `apps/kpilote-api`

Script Node/TS + entrée `package.json` pour scaffolder une **migration Prisma d'insertion** d'un FF, sans écrire de SQL à la main.

```bash
pnpm -F @pilote/kpilote-api ff:creer --key=nouveau_dashboard --nom="Nouveau dashboard"
# option : --etat=DESACTIVE (défaut) | ACTIVE | ACTIVE_POUR_UTILISATEUR
```

Comportement :
1. **Valide** `--key` (`^[a-z0-9_-]+$`) et `--nom` (non vide). Refuse si la key est déjà référencée par une migration existante (scan simple du dossier `prisma/migrations`).
2. Scaffolde une migration vide : `prisma migrate dev --create-only --name ajout_ff_<key>`.
3. **Injecte** dans le `migration.sql` généré :
   ```sql
   INSERT INTO "feature_flipping" ("id", "key", "nom", "etat")
   VALUES (gen_random_uuid(), 'nouveau_dashboard', 'Nouveau dashboard', 'DESACTIVE');
   ```
   (nom de table = `@@map`, `gen_random_uuid()` fourni par Postgres.)
4. Affiche le chemin du fichier généré ; l'auteur relit et committe.

Le FF reste **versionné et rejoué** en dev/prod comme toute migration. Nuance assumée : `--create-only` nécessite une DB up ; on reste dans le flux Prisma standard plutôt que de forger un dossier de migration à la main (plus robuste vis-à-vis du `migration_lock` et de l'ordonnancement).

---

## 6. Consommation webapp — `apps/kpilote-webapp`

Stack identique (Vite + TanStack Router + React Query + `ky`), mais **appel direct kpilote-api** avec Bearer token (pas de BFF de données). Mirror exact de `me/permissions`.

- `src/api/meFeatureFlipping.ts` : `apiClient.get('me/feature-flipping').json()` → `meFeatureFlippingApiModelSchema.parse(...)`.
- `src/queries/meFeatureFlipping.ts` :
  - `meFeatureFlippingQueryOptions()` (`queryKey: ['me', 'feature-flipping']`, `staleTime: DEFAULT_STALE_TIME`).
  - `loadMeFeatureFlipping({ queryClient })` → `ensureQueryData`.
  - **`useFeatureFlipping(key: string): boolean`** : `useSuspenseQuery(meFeatureFlippingQueryOptions())` → `data.features.includes(key)`.
- Prefetch une fois au boundary authentifié : ajouter `loadMeFeatureFlipping(...)` au `Promise.all` du loader `src/routes/_authenticated.tsx`.

Usage type : `const actif = useFeatureFlipping('nouveau_dashboard'); if (!actif) return null`.

---

## Résolution d'état (récapitulatif)

| État du FF | Visible pour |
|---|---|
| `ACTIVE` | Tous les utilisateurs |
| `ACTIVE_POUR_UTILISATEUR` | Uniquement les utilisateurs de `feature_flipping_utilisateur` |
| `DESACTIVE` | Personne |

La liste des utilisateurs autorisés est **toujours modifiable** quel que soit l'état, mais n'a d'effet que dans l'état `ACTIVE_POUR_UTILISATEUR`.

## Hors périmètre (itération 1)

- Pas d'UI de **création/suppression** de FF (création par migration ; suppression par migration si besoin).
- Pas de scopes/rôles sur qui peut administrer les FF au-delà de l'auth admin existante.
- Pas d'historisation des changements d'état.
