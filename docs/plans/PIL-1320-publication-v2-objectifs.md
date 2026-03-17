# Plan : Publication V2 pour les Objectifs (PIL-1320)

## Contexte

La mécanique de saisie/édition en brouillon ("PublicationV2") est déjà implémentée pour les `DécisionsStratégiques` et les `Commentaires`. L'objectif est de la généraliser aux `Objectifs` en s'appuyant sur un nouveau router tRPC dédié et une refonte du modèle Prisma.

Les objectifs ont 3 types indépendants : `notreAmbition`, `déjàFait`, `àFaire`. Chaque type dispose de son propre brouillon.

---

## Phase 1 — Prisma : évolution du modèle `objectif`

**Fichier :** `src/database/prisma/schema.prisma`

Modifications du modèle `objectif` :
- Renommer `auteur_id` → `auteur_modification_id`
- Renommer `date` → `date_modification`
- Ajouter `statut statut_publication @default(PUBLIE)`
- Ajouter `auteur_creation_id String? @db.Uuid`
- Ajouter `date_creation DateTime @db.Timestamp`
- Remplacer la relation unique `auteur_objectif` par deux relations nommées (`"objectifs_crees"`, `"objectifs_modifies"`)
- Mettre à jour le modèle `utilisateur` (remplacer `objectifs objectif[]` par les deux relations nommées)

**Migration SQL de reprise des données :**

```sql
ALTER TABLE public.objectif RENAME COLUMN auteur_id TO auteur_modification_id;
ALTER TABLE public.objectif RENAME COLUMN date TO date_modification;
ALTER TABLE public.objectif ADD COLUMN statut public.statut_publication NOT NULL DEFAULT 'PUBLIE';
ALTER TABLE public.objectif ADD COLUMN auteur_creation_id UUID;
ALTER TABLE public.objectif ADD COLUMN date_creation TIMESTAMP;
UPDATE public.objectif SET auteur_creation_id = auteur_modification_id, date_creation = date_modification;
```

Tous les enregistrements existants passent en statut `PUBLIE`, avec `auteur_creation_id = auteur_modification_id` et `date_creation = date_modification`.

---

## Phase 2 — Domaine : types + factory functions + repository interface

**`src/server/domain/chantier/objectif/Objectif.interface.ts`**

Ajouter :
- `ObjectifPublication` — type V2 avec `statut`, `auteurCreationId`, `dateCreation`, `auteurModificationId`, `dateModification`
- `ObjectifPublicationAvecNomAuteur` — même type + `auteurModificationNom: string`

**`src/server/domain/chantier/objectif/Objectif.ts`** (nouveau)

Factory functions (pattern identique à `DécisionStratégique.ts`) :
- `creerObjectifPublie(params)`
- `creerObjectifBrouillon(params)`
- `modifierObjectif(existing, params)`
- `modifierObjectifBrouillon(existing, params)`

**`src/server/domain/chantier/objectif/ObjectifV2Repository.interface.ts`** (nouveau)

```typescript
export default interface ObjectifV2Repository {
  save(objectif: ObjectifPublication): Promise<void>;
  getById(id: string): Promise<ObjectifPublication | null>;
}
```

---

## Phase 3 — Infrastructure : `ObjectifV2SQLRepository`

**`src/server/infrastructure/accès_données/chantier/objectif/ObjectifV2SQLRepository.ts`** (nouveau)

Implémente `ObjectifV2Repository.interface.ts`. Coexiste avec l'`ObjectifSQLRepository` legacy (conservé pour l'import CSV via `ImporterObjectifsUseCase`).

---

## Phase 4 — Queries

Répertoire : `src/server/objectifs/queries/`

| Fichier | Signature | Retour |
|---|---|---|
| `RecupererDerniersObjectifsQuery.ts` | `run(chantierId)` | `Record<TypeObjectif, ObjectifPublicationAvecNomAuteur \| null>` |
| `RecupererBrouillonObjectifQuery.ts` | `run(chantierId, utilisateurId)` | `Record<TypeObjectif, ObjectifPublication \| null>` |
| `RecupererHistoriqueObjectifQuery.ts` | `run(chantierId, type)` | `ObjectifPublicationAvecNomAuteur[]` |

`RecupererDerniersObjectifsQuery` et `RecupererBrouillonObjectifQuery` chargent **tous les types en une seule requête Prisma** (findMany + groupement par type), comme `RecupererBrouillonCommentaireQuery`.

---

## Phase 5 — Use cases

Répertoire : `src/server/objectifs/usecases/`

| Fichier | Pattern |
|---|---|
| `PublierObjectifUseCase.ts` | Crée un enregistrement `PUBLIE` |
| `EnregistrerBrouillonObjectifUseCase.ts` | Crée un enregistrement `BROUILLON` |
| `PublierBrouillonObjectifUseCase.ts` | Passe un `BROUILLON` existant en `PUBLIE` via `getById` |
| `ModifierBrouillonObjectifUseCase.ts` | Modifie un `BROUILLON` existant via `getById` |
| `ModifierObjectifPublieUseCase.ts` | Modifie un `PUBLIE` existant via `getById` |

---

## Phase 6 — Module : renommage + extension

**`src/server/objectifs/module.ts`**

- Renommer `importObjectifModule` → `objectifModule`
- Changer `name: "importObjectif"` → `name: "objectif"`
- Enregistrer les 5 use cases, les 3 queries, et `objectifV2Repository`

**`src/server/dependances.ts`**

- Import `objectifModule` au lieu de `importObjectifModule`
- `objectif: getContainer("objectif")` (remplace `importObjectif: getContainer("importObjectif")`)

---

## Phase 7 — Validation

**`src/validation/objectif.ts`** (nouveau, pattern de `validation/decisionStrategique.ts`)

- `validationObjectifContexte` — `chantierId`, `type`
- `validationObjectifFormulaire` — `contenu` avec limite de caractères
- `validationBrouillonObjectifAPublier` — `brouillonId`
- `validationObjectifAModifier` — `objectifId`

---

## Phase 8 — Router tRPC dédié

**`src/server/infrastructure/api/trpc/routes/objectif.ts`** (nouveau)

5 mutations :
- `publier`
- `enregistrerEnBrouillon`
- `publierUnBrouillon`
- `modifierLeBrouillon`
- `modifier`

2 queries :
- `recupererHistorique(chantierId, type)` — pour le composant `HistoriqueObjectif`
- `recupererDernier(chantierId, type)` — optionnel si besoin côté client

**`src/server/infrastructure/api/trpc/routes/routes.ts`**

- Ajouter `objectif: objectifRouter`
- Supprimer `publication: publicationRouter`

---

## Phase 9 — SSP `[id]/[territoireCode].tsx`

Remplacer l'appel unique `récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase` par **2 appels** dans le `Promise.all` existant :

```typescript
getContainer("objectif").resolve("recupererDerniersObjectifsQuery").run(chantierId),
getContainer("objectif").resolve("recupererBrouillonObjectifQuery").run(chantierId, session.user!.id),
```

Exposer dans les props : `objectifs` (map type→publication) + `objectifsBrouillon` (map type→brouillon).

Mettre à jour `PageChantierServerSideContext.tsx` pour typer les nouveaux champs.

---

## Phase 10 — Frontend

Répertoire : `src/client/components/PageChantier/ObjectifsChantier/` (nouveau sous-répertoire)

**`useObjectifActions.ts`**
- Params : `chantierId`, `type`, `objectif`, `brouillon`
- Retourne `PublicationActions`
- Appelle `api.objectif.*`
- Pattern identique à `useDecisionStrategiqueActions.ts`

**`HistoriqueObjectif.tsx`**
- Appelle `api.objectif.recupererHistorique`
- Pattern identique à `HistoriqueDecisionStrategique.tsx`

**`ObjectifsChantier.tsx`** (refonte)
- Lire `objectifsBrouillon` depuis le contexte SSP
- Pour chaque type : remplacer `<Publication>` (ancien) par `<PublicationSection>` (V2)
- Conserver la structure accordéon existante

---

## Phase 11 — Nettoyage

- Supprimer `src/server/infrastructure/api/trpc/routes/publication.ts`
- Vérifier que l'ancien composant `PublicationChantier/Publication.tsx` n'est plus utilisé (sinon laisser en place)

---

## Périmètre non touché

- `ObjectifSQLRepository` (legacy) — conservé pour l'import CSV
- `ImporterObjectifsUseCase` et `ImportObjectifAPIHandler` — inchangés
- Les routes API d'import objectif — inchangées
