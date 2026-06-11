# Spec : Tooltip service/fonction sur les responsables de chantier

## Contexte

La PR #1197 a ajouté un tooltip affichant le service et la fonction des auteurs de publications (commentaires, objectifs, synthèses des résultats, décisions stratégiques, PVA). Le composant `NomUtilisateurAvecTooltip` et l'utilitaire `getServiceLibelle` existent déjà.

Les responsables de chantier (directeurs de projet, responsables locaux, coordinateurs territoriaux) sont aujourd'hui stockés sous forme de deux tableaux parallèles `nom[]` et `email[]` dans `chantier_identite` et `chantier_territoire`. Ces tables ne contiennent pas l'`id` utilisateur — impossible de rejoindre `utilisateur` pour récupérer `service` et `fonction`.

## Objectif

Afficher un tooltip avec le service et la fonction au survol de chaque nom de responsable, pour les trois types : directeurs de projet, responsables locaux, coordinateurs territoriaux.

## Solution

Remplacer les tableaux parallèles `nom[]` + `email[]` par un tableau unique `id[]` dans la couche dbt et le schéma Prisma. L'enrichissement (nom, email, service, fonction) est résolu à la requête dans le repository via un `prisma.utilisateur.findMany` sur les IDs collectés.

---

## 1. Couche dbt — data-management

### 1.1 Modèles intermédiaires

Changer dans les trois modèles : remplacer `ARRAY_AGG(nom ...)` + `ARRAY_AGG(email ...)` par `ARRAY_AGG(utilisateur.id ...)` (même clause `ORDER BY email` conservée pour cohérence).

**`int_responsables_locaux.sql`**
```sql
-- Avant
ARRAY_AGG(resp_locaux.nom ORDER BY resp_locaux.email) AS nom,
ARRAY_AGG(resp_locaux.email ORDER BY resp_locaux.email) AS email,

-- Après
ARRAY_AGG(utilisateur.id::TEXT ORDER BY utilisateur.email) AS ids,
```

**`int_coordinateurs_territoriaux.sql`**
```sql
-- Avant
ARRAY_AGG(INITCAP(utilisateur.prenom) || ' ' || INITCAP(utilisateur.nom) ORDER BY utilisateur.email) AS nom,
ARRAY_AGG(utilisateur.email ORDER BY utilisateur.email) AS email,

-- Après
ARRAY_AGG(utilisateur.id::TEXT ORDER BY utilisateur.email) AS ids,
```

**`int_directeurs_projets.sql`**
```sql
-- Avant
ARRAY_AGG(nom ORDER BY email) AS nom,
ARRAY_AGG(email ORDER BY email) AS email,

-- Après
ARRAY_AGG(utilisateur_id::TEXT ORDER BY email) AS ids,
```
> Note : `int_directeurs_projets` fait un UNION de deux sources ; s'assurer que les deux branches sélectionnent `utilisateur.id`.

### 1.2 Modèles d'exposition

**`chantier_territoire.sql`** — remplacer les 4 colonnes par 2 :
```sql
-- Avant
resp_locaux.nom AS responsables_locaux,
coord_territoriaux.nom AS coordinateurs_territoriaux,
resp_locaux.email AS responsables_locaux_mails,
coord_territoriaux.email AS coordinateurs_territoriaux_mails,

-- Après
resp_locaux.ids AS responsables_locaux_ids,
coord_territoriaux.ids AS coordinateurs_territoriaux_ids,
```

**`chantier_identite.sql`** — remplacer les 2 colonnes par 1 :
```sql
-- Avant
dir_projets.nom AS directeurs_projet,
dir_projets.email AS directeurs_projet_mails,

-- Après
dir_projets.ids AS directeurs_projet_ids,
```

### 1.3 schema.yml (data-management)
Mettre à jour les descriptions de colonnes dans les `schema.yml` des modèles intermédiaires et d'exposition.

---

## 2. Schéma Prisma & migration

### 2.1 Changements dans `schema.prisma`

**`chantier_identite`**
```prisma
// Retirer
directeurs_projet      String[]
directeurs_projet_mails String[]

// Ajouter
directeurs_projet_ids  String[]
```

**`chantier_territoire`**
```prisma
// Retirer
responsables_locaux              String[]
coordinateurs_territoriaux       String[]
responsables_locaux_mails        String[]
coordinateurs_territoriaux_mails String[]

// Ajouter
responsables_locaux_ids          String[]
coordinateurs_territoriaux_ids   String[]
```

### 2.2 Migration SQL
```sql
-- chantier_identite
ALTER TABLE chantier_identite
  DROP COLUMN directeurs_projet,
  DROP COLUMN directeurs_projet_mails,
  ADD COLUMN directeurs_projet_ids TEXT[] NOT NULL DEFAULT '{}';

-- chantier_territoire
ALTER TABLE chantier_territoire
  DROP COLUMN responsables_locaux,
  DROP COLUMN responsables_locaux_mails,
  DROP COLUMN coordinateurs_territoriaux,
  DROP COLUMN coordinateurs_territoriaux_mails,
  ADD COLUMN responsables_locaux_ids TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN coordinateurs_territoriaux_ids TEXT[] NOT NULL DEFAULT '{}';
```

---

## 3. Backend

### 3.1 Types domaine — `PrismaChantier.ts`

Mettre à jour les Pick types :

```typescript
// EntreePrismaChantierIdentite
type EntreePrismaChantierIdentite = Pick<
  chantier_identite,
  | "directeurs_projet_ids"
  // ... autres champs existants
>;

// EntreePrismaChantierTerritoire
type EntreePrismaChantierTerritoire = Pick<
  chantier_territoire,
  | "responsables_locaux_ids"
  | "coordinateurs_territoriaux_ids"
  // ... autres champs existants
>;
```

### 3.2 Contrats — `ChantierRapportDetailleContratV2.ts`

Ajouter `service` et `fonction` aux trois interfaces :

```typescript
export interface DirecteurProjetRapportDetailleContrat {
  nom: string;
  email: string | null;
  service: string | null;
  fonction: string | null;
}

export interface ResponsableLocalRapportDetailleContrat {
  nom: string;
  email: string;
  service: string | null;
  fonction: string | null;
}

export interface CoordinateurTerritorialRapportDetailleContrat {
  nom: string;
  email: string;
  service: string | null;
  fonction: string | null;
}
```

### 3.3 Repository — `PrismaChantierRepository.ts`

**Stratégie d'enrichissement :** après la requête principale, collecter tous les IDs uniques des responsables, faire un `findMany` sur `utilisateur`, construire une Map `id → UtilisateurEnrichi`, puis mapper les résultats.

```typescript
type UtilisateurEnrichi = {
  nom: string;
  prenom: string;
  email: string;
  service: string | null;
  service_autre: string | null;
  perimetre_ministeriel: string | null;
  fonction: string | null;
};

// Dans la méthode de récupération du rapport détaillé :
const allResponsablesIds = [
  ...chantierIdentite.directeurs_projet_ids,
  ...chantierTerritoires.flatMap(t => [
    ...t.responsables_locaux_ids,
    ...t.coordinateurs_territoriaux_ids,
  ]),
];
const uniqueIds = [...new Set(allResponsablesIds)];

const utilisateurs = await this.prisma.utilisateur.findMany({
  where: { id: { in: uniqueIds } },
  select: {
    id: true,
    nom: true,
    prenom: true,
    email: true,
    service: true,
    service_autre: true,
    perimetre_ministeriel: true,
    fonction: true,
  },
});

const utilisateurParId = new Map(
  utilisateurs.map(u => [u.id, u])
);
```

Ensuite, dans les mappers de présentation :

```typescript
const toResponsableContrat = (id: string) => {
  const u = utilisateurParId.get(id);
  if (!u) return null;
  return {
    nom: `${u.prenom} ${u.nom}`,
    email: u.email,
    service: getServiceLibelle(u.perimetre_ministeriel, u.service, u.service_autre),
    fonction: u.fonction ?? null,
  };
};
```

> `getServiceLibelle` se trouve dans `src/utils/referentiel-services.ts`. Elle gère le fallback `service_autre` quand `service === "autre"`.

### 3.4 Contrat CSV — `DonneeChantierContrat.ts`

Pour les exports CSV, nom et email sont reconstruits depuis la Map `utilisateurParId` :

```typescript
// Avant : join des tableaux nom[]
responsables_locaux: donneeChantier.responsablesLocaux?.join(",") ?? "NON_APPLICABLE"
responsable_locaux_mails: donneeChantier.responsablesLocauxMails?.join(",") ?? "NON_APPLICABLE"

// Après : résolution depuis les IDs
responsables_locaux: responsablesLocauxIds
  .map(id => utilisateurParId.get(id))
  .filter(Boolean)
  .map(u => `${u!.prenom} ${u!.nom}`)
  .join(",") || "NON_APPLICABLE"
responsable_locaux_mails: responsablesLocauxIds
  .map(id => utilisateurParId.get(id)?.email)
  .filter(Boolean)
  .join(",") || "NON_APPLICABLE"
```

Même pattern pour `coordinateurs_territoriaux` et `directeurs_projet`.

---

## 4. Frontend

### 4.1 Contrats frontend — `ChantierRapportDetailleContratV2.ts`

Les types frontend reçoivent déjà `service` et `fonction` via le contrat backend mis à jour. Aucun changement supplémentaire côté contrat.

### 4.2 Composant `ResponsablesChantier.tsx`

Remplacer les jointures de noms en string par des listes de `NomUtilisateurAvecTooltip` :

```tsx
// Avant : liste de noms concaténés en string
const libelleNomsDirecteursProjets = listeDirecteursProjets
  .map(d => d.nom)
  .filter(Boolean)
  .join(", ");

// Après : composants avec tooltip
const nomsDirecteursProjets = listeDirecteursProjets.filter(d => d.nom);
```

Dans le JSX, remplacer le passage de `libelleNomsResponsables` (string) par une liste de composants. Cela implique de mettre à jour `ResponsablesLigneChantier` pour accepter soit une liste de composants, soit des objets `{nom, service, fonction}[]`.

### 4.3 Composant `ResponsablesLigneChantier`

Adapter la prop pour recevoir `responsables: { nom: string; service: string | null; fonction: string | null }[]` au lieu de `libelleNomsResponsables: string` :

```tsx
// Affichage des noms avec tooltips, séparés par ", "
{responsables.map((r, i) => (
  <Fragment key={r.nom}>
    <NomUtilisateurAvecTooltip
      nom={r.nom}
      service={r.service}
      fonction={r.fonction}
    />
    {i < responsables.length - 1 && ", "}
  </Fragment>
))}
```

> Le lien `mailto` existant (email groupé) reste inchangé car il utilise les emails séparément.

---

## 5. Données de test

### 5.1 Seed CSV (`tests/seed/public/`)

**`chantier_identite.csv`** : remplacer les colonnes `directeurs_projet` et `directeurs_projet_mails` par `directeurs_projet_ids`.

**`chantier_territoire.csv`** : remplacer les 4 colonnes par `responsables_locaux_ids` et `coordinateurs_territoriaux_ids`.

Les valeurs dans les seeds doivent être des UUIDs valides d'utilisateurs existants dans le seed `utilisateur.csv`.

### 5.2 Tests unitaires et d'intégration

Mettre à jour toutes les fixtures qui construisent des objets `chantier_identite` ou `chantier_territoire` mock pour remplacer `directeurs_projet`/`responsables_locaux` etc. par les nouveaux champs `_ids`.

---

## 6. Documentation API

**`doc/api/pilote-api.yml`** : mettre à jour les schémas de réponse pour remplacer `responsables_locaux` (array de strings) et `responsables_locaux_mails` par les nouveaux champs, et documenter `service` et `fonction` dans les objets responsable.

---

## 7. Fichiers impactés — récapitulatif

| Couche | Fichier | Type de changement |
|---|---|---|
| dbt | `int_responsables_locaux.sql` | Sortir `id` au lieu de `nom`+`email` |
| dbt | `int_coordinateurs_territoriaux.sql` | Sortir `id` au lieu de `nom`+`email` |
| dbt | `int_directeurs_projets.sql` | Sortir `id` au lieu de `nom`+`email` |
| dbt | `chantier_territoire.sql` | Utiliser `ids` à la place des 4 colonnes |
| dbt | `chantier_identite.sql` | Utiliser `ids` à la place des 2 colonnes |
| dbt | `models/intermediate/schema.yml` | Mettre à jour les descriptions |
| dbt | `models/exposition/chantier/schema.yml` | Mettre à jour les descriptions |
| Prisma | `schema.prisma` | Remplacer 6 champs par 3 champs `_ids` |
| Prisma | `migrations/` | Nouvelle migration SQL |
| Backend | `PrismaChantier.ts` | Mettre à jour les Pick types |
| Backend | `PrismaChantierRepository.ts` | Enrichissement utilisateurs post-requête |
| Backend | `ChantierRapportDetailleContratV2.ts` | Ajouter `service`+`fonction` aux interfaces et mappers |
| Backend | `ChantierContrat.ts` | Mettre à jour les mappers |
| Backend | `DonneeChantierContrat.ts` | Résoudre nom/email depuis IDs pour CSV |
| Frontend | `ResponsablesChantier.tsx` | Passer à des objets avec service/fonction |
| Frontend | `ResponsablesLigneChantier` | Accepter `{nom, service, fonction}[]` |
| Tests | `chantier_identite.csv` (seed) | Remplacer colonnes |
| Tests | `chantier_territoire.csv` (seed) | Remplacer colonnes |
| Tests | Fixtures backend | Mettre à jour les mocks |
| Doc | `pilote-api.yml` | Mettre à jour les schémas |

---

## 8. Comportement du tooltip

- Au survol d'un nom de responsable, afficher service et fonction (même rendu que `NomUtilisateurAvecTooltip` des publications).
- Si `service` est `null` → afficher "Non renseigné" (comportement existant du composant).
- Si `fonction` est `null` → afficher "Non renseigné".
- Le lien `mailto` groupé (icône enveloppe) reste inchangé.
- S'applique aux trois types : directeurs de projet, responsables locaux, coordinateurs territoriaux.

---

## 9. Plan d'implémentation

### Étape 1 — dbt : modèles intermédiaires

**Fichiers :** `int_responsables_locaux.sql`, `int_coordinateurs_territoriaux.sql`, `int_directeurs_projets.sql`

Dans chaque modèle, remplacer les deux `ARRAY_AGG` (nom + email) par un seul `ARRAY_AGG(utilisateur.id::TEXT ORDER BY utilisateur.email)` nommé `ids`. Pour `int_directeurs_projets`, les deux branches du UNION doivent toutes les deux sélectionner `utilisateur.id`.

Mettre à jour `models/intermediate/schema.yml` pour refléter la nouvelle colonne `ids`.

**Validation :** requête manuelle sur la vue dbt pour vérifier que les IDs sont des UUIDs valides et que le tableau n'est pas vide sur des chantiers connus.

---

### Étape 2 — dbt : modèles d'exposition

**Fichiers :** `chantier_territoire.sql`, `chantier_identite.sql`

Remplacer les références aux colonnes `nom`/`email` des CTEs intermédiaires par `ids`, et renommer les colonnes de sortie avec le suffixe `_ids`. Mettre à jour `models/exposition/chantier/schema.yml`.

**Validation :** run dbt complet sur l'environnement de dev, vérifier que `chantier_territoire.responsables_locaux_ids` et `chantier_identite.directeurs_projet_ids` sont peuplés.

---

### Étape 3 — Prisma : migration et schema

**Fichier :** `schema.prisma`

Modifier les deux modèles comme décrit en section 2. Générer la migration avec `pnpm database:migration`. Vérifier le SQL généré avant d'appliquer.

**Attention :** la migration supprime 6 colonnes — s'assurer que le dbt run de l'étape 2 est passé avant d'appliquer en staging/prod, sinon les nouvelles colonnes `_ids` seront vides.

---

### Étape 4 — Backend : types domaine

**Fichier :** `src/server/chantiers/domain/PrismaChantier.ts`

Mettre à jour les Pick types `EntreePrismaChantierIdentite` et `EntreePrismaChantierTerritoire` pour remplacer les anciens champs par `directeurs_projet_ids`, `responsables_locaux_ids`, `coordinateurs_territoriaux_ids`.

Le compilateur TypeScript guidera ensuite toutes les erreurs en cascade dans le reste du backend.

---

### Étape 5 — Backend : repository

**Fichier :** `src/server/chantiers/infrastructure/adapters/PrismaChantierRepository.ts`

Trois méthodes sont touchées (lignes ~336, ~861, ~1325) :

1. Mettre à jour les clauses `select` Prisma pour utiliser les nouveaux champs.
2. Dans chaque méthode qui construit un rapport détaillé, ajouter l'enrichissement post-requête (collect IDs → `findMany` utilisateurs → Map).
3. Remplacer les zips `nom[i] + email[i]` par `toResponsableContrat(id)`.

La Map `utilisateurParId` peut être construite une seule fois par appel de méthode et partagée entre les mappers directeurs / responsables / coordinateurs.

---

### Étape 6 — Backend : contrats

**Fichiers :** `ChantierRapportDetailleContratV2.ts`, `ChantierContrat.ts`, `DonneeChantierContrat.ts`

- Ajouter `service: string | null` et `fonction: string | null` aux trois interfaces de contrat (section 3.2).
- Mettre à jour les fonctions de mapping pour appeler `toResponsableContrat(id)` au lieu de zipper les tableaux.
- Dans `DonneeChantierContrat.ts`, reconstruire nom et email depuis la Map pour le CSV (section 3.4).

---

### Étape 7 — Frontend : `ResponsablesLigneChantier`

**Fichier :** `src/client/components/_commons/ResponsablesLigneChantier/ResponsablesLigneChantier.tsx`

Changer la prop `libelleNomsResponsables: string` en `responsables: { nom: string; service: string | null; fonction: string | null }[]`. Remplacer l'affichage du texte par une liste de `NomUtilisateurAvecTooltip` séparés par des virgules. La prop `libelleEmailsResponsables` pour le `mailto` reste inchangée.

---

### Étape 8 — Frontend : `ResponsablesChantier.tsx`

**Fichier :** `src/client/components/PageChantier/ResponsablesChantier/ResponsablesChantier.tsx`

Supprimer les `map(d => d.nom).join(", ")`. Passer directement les listes d'objets `{nom, service, fonction}` à `ResponsablesLigneChantier` en utilisant la nouvelle prop.

---

### Étape 9 — Tests : seeds et fixtures

**Fichiers :** `tests/seed/public/chantier_identite.csv`, `tests/seed/public/chantier_territoire.csv`

Remplacer les en-têtes et valeurs des colonnes supprimées par les nouvelles colonnes `_ids`. Les UUIDs utilisés doivent correspondre à des entrées existantes dans `utilisateur.csv` (ou le seed utilisateur doit être enrichi en conséquence).

Mettre à jour toutes les fixtures TypeScript qui construisent des mocks de `chantier_identite` ou `chantier_territoire` — le compilateur les signalera après l'étape 4.

---

### Étape 10 — Documentation API

**Fichier :** `doc/api/pilote-api.yml`

Mettre à jour les schémas de réponse : supprimer `responsables_locaux` (string[]) et `responsables_locaux_mails`, ajouter `responsables_locaux_ids` (string[]) et documenter les champs `service` et `fonction` dans les objets responsable.

---

### Ordre de déploiement

```
dbt run (étapes 1-2)
  → migration Prisma (étape 3)
    → backend + frontend (étapes 4-8) — déployables ensemble
      → seeds/fixtures (étape 9) — en parallèle des étapes 4-8
        → doc API (étape 10)
```

Les étapes 4 à 9 peuvent être développées en parallèle une fois la migration appliquée en dev, car le compilateur TypeScript assure la cohérence bout en bout.
