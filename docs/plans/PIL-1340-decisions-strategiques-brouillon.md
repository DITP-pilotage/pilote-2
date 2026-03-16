# PIL-1340 — Décisions stratégiques : support brouillon

## Contexte

Refactoring des décisions stratégiques pour adopter le même format que les commentaires :
support brouillon/publié, historique, modification d'une publication existante.

**Décisions d'architecture retenues :**
- Backend : nouvelles routes tRPC `decisionStrategique.*` dédiées (pas de réutilisation des routes commentaires)
- Frontend : réutilisation de `CommentaireSection` et des modales commentaires via généricisation
- Pas de suppression de code existant dans cette itération

---

## Phase 1 — Base de données

### 1.1 `src/database/prisma/schema.prisma`

Modifier le modèle `decision_strategique` :

- **Supprimer** : `date DateTime`, `auteur_id String?`, la relation `auteur_decision_strategique`
- **Ajouter** :
  - `statut statut_publication`
  - `auteur_creation_id String? @db.Uuid`
  - `auteur_modification_id String? @db.Uuid`
  - `date_creation DateTime @db.Timestamp`
  - `date_modification DateTime @db.Timestamp`
  - Relations nommées (obligatoires, deux FK vers la même table) :
    ```prisma
    auteur_creation     utilisateur? @relation("decision_auteur_creation", fields: [auteur_creation_id], ...)
    auteur_modification utilisateur? @relation("decision_auteur_modification", fields: [auteur_modification_id], ...)
    ```

### 1.2 Migration

Générer la migration : `npm run database:migration`

---

## Phase 2 — Domaine

### 2.1 `src/server/domain/chantier/decisionStrategique/DecisionStrategique.interface.ts`

- Renommer les types (supprimer accents)
- Aligner `DecisionStrategique` (ex-`DecisionStrategiqueV2`) sur la structure commentaire :
  ```typescript
  type DecisionStrategique = {
    id: string;
    chantierId: string;
    type: TypeDecisionStrategique;
    contenu: string;
    statut: $Enums.statut_publication;
    auteurCreationId: string;
    auteurModificationId: string;
    dateCreation: string;
    dateModification: string;
  }

  type DecisionStrategiqueAvecNomsAuteurs = DecisionStrategique & {
    auteurModificationNom: string;
  }
  ```
- Ne pas supprimer les anciens types pour l'instant

### 2.2 `src/server/domain/chantier/decisionStrategique/DecisionStrategique.ts` _(nouveau)_

4 fonctions miroir de `Commentaire.ts` :

- `creerDecisionStrategiquePubliee({ id, chantierId, type, contenu, auteurCreationId })`
- `creerDecisionStrategiqueBrouillon({ id, chantierId, type, contenu, auteurCreationId })`
- `modifierDecisionStrategique(existante, { contenu, auteurModificationId })`
- `modifierDecisionStrategiqueBrouillon(existante, { contenu, auteurModificationId })`

### 2.3 `src/server/domain/chantier/decisionStrategique/DecisionStrategiqueRepository.interface.ts`

Ajouter sans supprimer l'existant :

- `getById(id: string): Promise<DécisionStratégiqueV2 | null>`

---

## Phase 3 — Infrastructure SQL

### 3.1 `src/server/infrastructure/acces_donnees/chantier/decisionStrategique/DecisionStrategiqueSQLRepository.ts`

Implémenter les nouvelles méthodes :

- `save` : upsert avec tous les nouveaux champs
- `getById` : find unique

---

## Phase 4 — Use Cases & Queries

Tous dans `src/server/usecase/chantier/decisionStrategique/`

### 4.1 Use cases _(5 nouveaux fichiers)_

| Fichier | Fonction domaine appelée |
|---|---|
| `PublierDecisionStrategiqueUseCase.ts` | `creerDecisionStrategiquePubliee` |
| `EnregistrerBrouillonDecisionStrategiqueUseCase.ts` | `creerDecisionStrategiqueBrouillon` |
| `PublierBrouillonDecisionStrategiqueUseCase.ts` | `modifierDecisionStrategique` + statut PUBLIE |
| `ModifierDecisionStrategiquePublieeUseCase.ts` | `modifierDecisionStrategique` |
| `ModifierBrouillonDecisionStrategiqueUseCase.ts` | `modifierDecisionStrategiqueBrouillon` |

Chaque use case : vérifie les habilitations → appelle la fonction domaine → `repository.sauvegarder`.

### 4.2 Queries _(3 nouveaux fichiers)_

Les queries utilisent Prisma directement (pas le repository).

- `RecupererDerniereDecisionStrategiqueQuery.ts` → filtre `statut = PUBLIE`, order `date_modification DESC`, join `utilisateur`
- `RecupererBrouillonDecisionStrategiqueQuery.ts` → filtre `statut = BROUILLON`
- `RecupererHistoriqueDecisionStrategiqueQuery.ts` → filtre `statut = PUBLIE`, order `date_modification DESC`, join `utilisateur`

---

## Phase 5 — Validation & tRPC

### 5.1 `src/validation/decisionStrategique.ts` _(nouveau)_

```typescript
LIMITE_CARACTERES_DECISION_STRATEGIQUE = 5000

validationDecisionStrategiqueFormulaire        // { contenu }
validationDecisionStrategiqueContexte          // { chantierId, type, territoireCode }
validationBrouillonDecisionStrategiqueAPublier // { brouillonId, chantierId, type }
validationDecisionStrategiqueAModifier         // { decisionStrategiqueId, chantierId, type, contenu }
```

### 5.2 `src/server/infrastructure/api/trpc/routes/decisionStrategique.ts` _(nouveau)_

Conteneur DI : `getContainer("decisions-strategiques").resolve(...)`

| Procédure | Type | Use case / Query |
|---|---|---|
| `publier` | mutation | `PublierDecisionStrategiqueUseCase` |
| `enregistrerEnBrouillon` | mutation | `EnregistrerBrouillonDecisionStrategiqueUseCase` |
| `publierUnBrouillon` | mutation | `PublierBrouillonDecisionStrategiqueUseCase` |
| `modifierLeBrouillon` | mutation | `ModifierBrouillonDecisionStrategiqueUseCase` |
| `modifier` | mutation | `ModifierDecisionStrategiquePublieeUseCase` |
| `recupererHistorique` | query | `RecupererHistoriqueDecisionStrategiqueQuery` |

### 5.3 `src/server/infrastructure/api/trpc/routes/routes.ts`

Ajouter `decisionStrategique: decisionStrategiqueRouter`.

---

## Phase 6 — Module DI

### 6.1 `src/server/decisions-strategiques/module.ts`

Enregistrer avec Awilix : les 5 use cases, les 3 queries, mettre à jour `decisionStrategiqueRepository`.

---

## Phase 7 — Frontend : interfaces partagées

### 7.1 `src/client/components/_commons/CommentairesNew/CommentaireSection/Publication.interface.ts` _(nouveau)_

```typescript
export interface PublicationAvecAuteur {
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurModificationNom: string;
}

export interface BrouillonPublication {
  id: string;
  contenu: string;
  dateModification: string;
}

export interface PublicationActions {
  publier: SubmitHandler<{ contenu: string }>;
  enregistrerEnBrouillon: SubmitHandler<{ contenu: string }>;
  publierBrouillon: SubmitHandler<{ contenu: string }>;
  modifierBrouillon: SubmitHandler<{ contenu: string }>;
  modifier: SubmitHandler<{ contenu: string }>;
}
```

---

## Phase 8 — Frontend : généricisation des composants partagés

### 8.1 `Affichage/Affichage.tsx`

- Remplacer `commentaire: CommentaireAvecNomsAuteurs | null` → `commentaire: PublicationAvecAuteur | null`
- `CommentaireAvecNomsAuteurs` est structurellement compatible → zéro breaking change sur les call sites

### 8.2 `ModaleFormulaireCommentaire.tsx`

- Remplacer `type: TypeCommentaireChantier` → `libelle: string` + `consigne: string`
- Remplacer `commentaire: CommentaireAvecNomsAuteurs | null` → `PublicationAvecAuteur | null`
- Remplacer `brouillon?: CommentaireV2 | null` → `BrouillonPublication | null`
- Dans le JSX : `libellesTypesCommentaire[type]` → `libelle`, `consignesEcritureCommentaire[type]` → `consigne`

### 8.3 `BoutonNouveauCommentaire.tsx`

- Supprimer `type: TypeCommentaireChantier` des props et l'appel à `useNouveauCommentaire`
- Ajouter props : `libelle: string`, `consigne: string`, `onPublier`, `onBrouillon`
- Passer `libelle`/`consigne` à `ModaleFormulaireCommentaire`

### 8.4 `BoutonEditerBrouillonCommentaire.tsx`

- Même pattern : supprimer hook interne, ajouter `libelle`, `onPublier`, `onBrouillon`
- Remplacer `brouillon: CommentaireV2` → `BrouillonPublication`
- Remplacer `libellesTypesCommentaire[brouillon!.type]` → `libelle`

### 8.5 `CommentaireSection.tsx`

Nouvelles props :

```typescript
interface CommentaireSectionProps {
  libelle: string;
  publication: PublicationAvecAuteur | null;
  brouillon: BrouillonPublication | null;
  modeEcriture?: boolean;
  actions: PublicationActions;
  historiqueNode?: ReactNode;
}
```

- `libellesTypesCommentaire[type]` → `libelle`
- Passer `actions.publier` / `actions.enregistrerEnBrouillon` à `BoutonNouveauCommentaire`
- Passer `actions.publierBrouillon` / `actions.modifierBrouillon` à `BoutonEditerBrouillonCommentaire`
- Passer `actions.modifier` à `CommentaireFormulaire`
- Remplacer `<HistoriqueCommentaire type={type} />` → `{historiqueNode}`

---

## Phase 9 — Frontend : `CommentaireSectionConnectee`

### 9.1 `CommentaireSectionConnectee.tsx` _(nouveau)_

Wrapper qui porte les hooks commentaires et passe les callbacks à `CommentaireSection`.
Conserve l'interface actuelle pour ne pas casser `Commentaires.tsx` :

```typescript
interface CommentaireSectionConnecteeProps {
  type: TypeCommentaireChantier;
  commentaire: CommentaireAvecNomsAuteurs | null;
  commentaireBrouillon: CommentaireV2 | null;
  modeEcriture?: boolean;
}
```

En interne :
- Appelle `useNouveauCommentaire`, `useEditerBrouillonCommentaire`, `useModifierCommentaire`
- Construit `PublicationActions` depuis les résultats des hooks
- Rend `<CommentaireSection libelle={...} publication={...} brouillon={...} actions={actions} historiqueNode={<HistoriqueCommentaire type={type} />} />`

### 9.2 `Commentaires.tsx`

Remplacer `<CommentaireSection>` → `<CommentaireSectionConnectee>` (interface identique).

---

## Phase 10 — Frontend : décisions stratégiques

### 10.1 Hooks _(3 nouveaux fichiers)_ dans `src/client/components/PageChantier/DecisionsStrategiques/`

- `useNouvelleDecisionStrategique.ts` — appelle `api.decisionStrategique.publier` + `enregistrerEnBrouillon`
- `useEditerBrouillonDecisionStrategique.ts` — appelle `api.decisionStrategique.publierUnBrouillon` + `modifierLeBrouillon`
- `useModifierDecisionStrategique.ts` — appelle `api.decisionStrategique.modifier`

### 10.2 `HistoriqueDecisionStrategique.tsx` _(nouveau)_

Miroir de `HistoriqueCommentaire.tsx`, appelle `api.decisionStrategique.recupererHistorique`.

### 10.3 `DecisionsStrategiques.tsx`

Nouvelles props :

```typescript
{
  decisionStrategique: DecisionStrategiqueAvecNomsAuteurs | null;
  brouillon: DecisionStrategique | null;
  modeEcriture?: boolean;
  estChantierArchive: boolean;
}
```

- Appelle les 3 hooks pour construire `PublicationActions`
- Rend `<CommentaireSection>` avec `libelle`, `publication`, `brouillon`, `actions`, `historiqueNode={<HistoriqueDecisionStrategique />}`

### 10.4 `src/client/constants/libellesDecisionStrategique.ts`

Renommer sans accents, ajouter `consignesEcritureDecisionStrategique`.

### 10.5 Composant parent (page chantier)

- Ajouter le fetch de `decisionStrategique` et `brouillon` via les nouvelles queries (côté serveur)
- Passer les deux en props à `DecisionsStrategiques`

---

## Récapitulatif

| | Créer | Modifier |
|---|---|---|
| **Backend** | 13 | 4 |
| **Frontend partagé** | 2 | 5 |
| **Frontend décisions** | 4 | 2 |

**Ordre d'implémentation recommandé** : phases 1 → 6 (backend complet) puis 7 → 10 (frontend).
