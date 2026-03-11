# Analyse de l'injection de dépendances (DI) dans PILOTE

## Contexte

Le projet PILOTE comporte deux systèmes d'injection de dépendances qui coexistent :

1. **Legacy** : un singleton `Dependencies` instancié manuellement (`src/server/infrastructure/Dependencies.ts`)
2. **Awilix** : des containers par domaine métier (`src/server/dependances.ts` + `src/server/<module>/container.ts`)

L'objectif est de supprimer le système legacy pour tout migrer vers Awilix.

---

## 1. Système legacy : `Dependencies` singleton

### Fonctionnement

Un objet singleton exporté (`export const dependencies = new Dependencies()`) qui instancie tous les repositories et services dans son constructeur, et les expose via des getters :

```ts
// src/server/infrastructure/Dependencies.ts
class Dependencies {
  private readonly _chantierRepository: ChantierRepository;
  constructor() {
    this._chantierRepository = new ChantierSQLRepository();
    // ...
  }
  getChantierRepository(): ChantierRepository {
    return this._chantierRepository;
  }
}
export const dependencies = new Dependencies();
```

### Dépendances exposées (24 getters)

| Getter | Interface | Implémentation |
|--------|-----------|----------------|
| `getChantierRepository()` | `ChantierRepository` | `ChantierSQLRepository` |
| `getAxeRepository()` | `AxeRepository` | `AxeSQLRepository` |
| `getSynthèseDesRésultatsRepository()` | `SynthèseDesRésultatsRepository` | `SynthèseDesRésultatsSQLRepository` |
| `getMinistèreRepository()` | `MinistèreRepository` | `MinistèreSQLRepository` |
| `getIndicateurRepository()` | `IndicateurRepository` | `IndicateurSQLRepository` |
| `getCommentaireRepository()` | `CommentaireRepository` | `CommentaireSQLRepository` |
| `getObjectifRepository()` | `ObjectifRepository` | `ObjectifSQLRepository` |
| `getDécisionStratégiqueRepository()` | `DécisionStratégiqueRepository` | `DécisionStratégiqueSQLRepository` |
| `getUtilisateurRepository()` | `UtilisateurRepository` | `UtilisateurSQLRepository` |
| `getAuthentificationUtilisateurRepository()` | `AuthentificationUtilisateurRepository` | `PrismaUtilisateurRepository` |
| `getAuthentificationProfilRepository()` | `AuthentificationProfilRepository` | `PrismaProfilRepository` |
| `getTerritoireRepository()` | `TerritoireRepository` | `TerritoireSQLRepository` |
| `getFicheTerritorialeTerritoireRepository()` | `FicheTerritorialeTerritoireRepository` | `PrismaTerritoireRepository` |
| `getFicheTerritorialeChantierRepository()` | `FicheTerritorialeChantierRepository` | `PrismaChantierRepository` |
| `getFicheTerritorialeIndicateurRepository()` | `FicheTerritorialeIndicateurRepository` | `PrismaFicheTerritorialeIndicateurRepository` |
| `getFicheTerritorialeSyntheseDesResultatsRepository()` | `FicheTerritorialeSyntheseDesResultatsRepository` | `PrismaSyntheseDesResultatsRepository` |
| `getFicheTerritorialeMinistereRepository()` | `FicheTerritorialeMinistereRepository` | `PrismaMinistereRepository` |
| `getChantierIndicateurRepository()` | `ChantierIndicateurRepository` | `PrismaChantierIndicateurRepository` |
| `getProfilRepository()` | `ProfilRepository` | `ProfilSQLRepository` |
| `getRapportRepository()` | `RapportRepository` | `PrismaRapportRepository` |
| `getImportIndicateurRepository()` | `ImportIndicateurRepository` | `PrismaIndicateurRepository` |
| `getGestionContenuRepository()` | `GestionContenuRepository` | `PrismaGestionContenuRepository` |
| `getTokenAPIService()` | `TokenAPIService` | `TokenAPIJWTService` |
| `getTokenAPIInformationRepository()` | `TokenAPIInformationRepository` | `PrismaTokenAPIInformationRepository` |

### Points d'utilisation (23 fichiers)

#### Routes tRPC (6 fichiers)
- `src/server/infrastructure/api/trpc/routes/gestionContenu.ts` → `getGestionContenuRepository()`
- `src/server/infrastructure/api/trpc/routes/utilisateur.ts` → `getProfilRepository()` (x4)
- `src/server/infrastructure/api/trpc/routes/profil.ts` → `getProfilRepository()`
- `src/server/infrastructure/api/trpc/routes/gestionTokenAPI.ts` → `getTokenAPIService()`, `getTokenAPIInformationRepository()`, `getAuthentificationUtilisateurRepository()`
- `src/server/infrastructure/api/trpc/routes/territoire.ts` → `getTerritoireRepository()`, `getUtilisateurRepository()`
- `src/server/infrastructure/api/trpc/routes/publication.ts` → `getCommentaireRepository()`, `getObjectifRepository()`, `getDécisionStratégiqueRepository()`

#### Open API endpoints (6 fichiers)
- `src/pages/api/open-api/chantier/[chantierId]/commentaires.ts`
- `src/pages/api/open-api/chantier/[chantierId]/objectifs.ts`
- `src/pages/api/open-api/chantier/[chantierId]/decisions-strategiques.ts`
- `src/pages/api/open-api/chantier/[chantierId]/donnees.ts`
- `src/pages/api/open-api/chantier/[chantierId]/syntheses-des-resultats.ts`
- `src/pages/api/open-api/chantier/[chantierId]/indicateur/[indicateurId]/donnees.ts`

Tous ces fichiers utilisent le pattern : `dependencies.getUtilisateurRepository()`, `getTokenAPIInformationRepository()`, `getAuthentificationProfilRepository()`

#### Pages `getServerSideProps` (5 fichiers)
- `src/pages/chantier/[id]/[territoireCode].tsx`
- `src/pages/chantier/[id]/indicateurs.tsx`
- `src/pages/accueil/chantier/[territoireCode]/index.tsx`
- `src/pages/accueil/chantier/[territoireCode]/rapport-detaille.tsx`

#### Pages admin (3 fichiers)
- `src/pages/admin/utilisateur/[id]/index.tsx`
- `src/pages/admin/utilisateur/[id]/modifier.tsx`
- `src/pages/admin/gestion-token-api.tsx`
- `src/pages/admin/message-information.tsx`

#### Handlers d'infrastructure (2 fichiers)
- `src/server/fiche-territoriale/infrastructure/handlers/FicheTerritorialeHandler.ts`
- `src/server/chantiers/infrastructure/handlers/ListerIndicateursHandler.ts`

#### Authentification (1 fichier)
- `src/server/infrastructure/api/auth/[...nextauth].tsx` (import dynamique)

### Faiblesses

1. **Pas de gestion de cycle de vie** : toutes les instances sont créées au démarrage, pas de lazy loading
2. **Impossible de substituer les implémentations** : les dépendances sont hardcodées dans le constructeur → pas de remplacement pour les tests
3. **Couplage fort** : les consommateurs importent directement le singleton, rendant les tests unitaires difficiles
4. **Use cases instanciés manuellement** : les consumers de `dependencies` font `new CréerUnCommentaireUseCase(dependencies.getCommentaireRepository())` — la composition du use case est faite par le consommateur, pas par le container
5. **Pas d'injection automatique** : chaque nouvelle dépendance nécessite un champ privé + getter + instanciation dans le constructeur
6. **Double instanciation** : certains repositories (ex: `UtilisateurRepository`, `TerritoireRepository`) existent à la fois dans `Dependencies.ts` ET dans des containers Awilix, créant potentiellement 2 instances différentes du même service

---

## 2. Système Awilix : containers par domaine

### Architecture

```
initial-container.ts          → crée le container racine (prisma, transaction)
       ↓
InitialDependencies.ts        → ajoute les dépendances transversales
       ↓
dependances.ts                → compose tous les containers domaine
       ↓
<module>/container.ts         → container spécifique au domaine
```

### Container racine (`initial-container.ts`)

```ts
createContainer<InitialDependencies>({
  injectionMode: InjectionMode.PROXY,
  strict: true,
});
// Registrations: prisma (SINGLETON), transaction (SINGLETON)
```

### Dépendances transversales (`InitialDependencies.ts`)

```ts
type InitialDependencies = {
  prisma: PrismaPilote;
  transaction: Transaction;
} & TransversalDependencies;

interface TransversalDependencies {
  indicateurTerritoireValeurEvenementRepository;
  datajobsExecutionQueries;
  emailManager;  // singleton, Brevo ou Stub selon config
}
```

### Containers domaine (18 containers)

| Container | Module | Nb registrations |
|-----------|--------|-----------------|
| `authentification` | `src/server/authentification/` | 1 |
| `chantiers` | `src/server/chantiers/` | ~20 |
| `ficheConducteur` | `src/server/fiche-conducteur/` | ~11 |
| `gestionUtilisateur` | `src/server/gestion-utilisateur/` | ~38 |
| `importIndicateur` | `src/server/import-indicateur/` | ~12 |
| `parametrageIndicateur` | `src/server/parametrage-indicateur/` | ~13 |
| `indicateurTerritoireValeurEvenement` | `src/server/indicateur-territoire-valeur-evenement/` | ~8 |
| `piloteEval` | `src/server/evaluation/` | ~29 |
| `importCommentaire` | `src/server/commentaires/` | ~3 |
| `importDecisionStrategique` | `src/server/decisions-strategiques/` | ~3 |
| `importObjectif` | `src/server/objectifs/` | ~3 |
| `importSyntheseDesResultats` | `src/server/syntheses-des-resultats/` | ~7 |
| `habilitationsCoordinateur` | `src/server/habilitations-coordinateur/` | ~2 |
| `profilUtilisateur` | `src/server/profil-utilisateur/` | ~4 |
| `rapportsHebdomadaires` | `src/server/rapports-hebdomadaires/` | ~15 |
| `albert` | `src/server/albert/` | ~7 |
| `parametrageNouveautes` | `src/server/parametrage-nouveautes/` | ~4 |
| `parametrageCentreAide` | `src/server/parametrage-centre-aide/` | ~5 |

### Pattern d'un container domaine

```ts
// src/server/<module>/container.ts
export type ModuleDependencies = {
  fooRepository: FooRepository;
  barUseCase: BarUseCase;
};

export const getModuleContainer = (
  initialContainer: AwilixContainer<InitialDependencies>,
): AwilixContainer<ModuleDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<ModuleDependencies>().register({
    fooRepository: asClass(PrismaFooRepository),
    barUseCase: asClass(BarUseCase),
  });
};
```

### Pattern de consommation

```ts
// Dans une route tRPC ou un handler
import { getContainer } from "@/server/dependances";

const result = getContainer("chantiers")
  .resolve("recupererChantiersAccessiblesEnLectureUseCaseV2")
  .run(/* ... */);
```

### Cycle de vie des containers (`dependances.ts`)

- **Production** : containers créés une seule fois et mis en cache dans `global.__container`
- **Développement** : containers recréés à chaque chargement de module (pour le hot reload)

### Forces

1. **Injection automatique** : les classes déclarent leurs dépendances dans le constructeur et Awilix les résout automatiquement (mode PROXY)
2. **Séparation par domaine** : chaque module a son propre container, isolant les responsabilités
3. **Substitution facile** : possibilité de remplacer les implémentations (ex: `StubEmailManager` vs `BrevoEmailManager`)
4. **Gestion de cycle de vie** : support des singletons, scoped, et transient via les lifetime d'Awilix
5. **Use cases composés par le container** : le câblage repository → use case est fait automatiquement
6. **Type-safe** : chaque container a un type `ModuleDependencies` qui définit ses clés et types

### Faiblesses

1. **Pas de type-safety au `resolve()`** : `container.resolve("foo")` retourne `any` si mal typé, risque d'erreur runtime
2. **Strings magiques** : les noms de dépendances sont des strings (`"recupererChantiersAccessiblesEnLectureUseCaseV2"`) — pas d'autocomplétion garantie
3. **Prolifération de containers** : 18 containers avec parfois peu de registrations (2-3) — la granularité est peut-être trop fine pour certains modules
4. **Duplication entre containers** : certains repositories (ex: `PrismaChantierRepository`, `PrismaTerritoireRepository`) sont enregistrés dans plusieurs containers indépendamment

---

## 3. Zones de coexistence et conflits

### Fichiers mixtes (legacy + Awilix)

Certains fichiers utilisent les **deux** systèmes simultanément :

- **`src/pages/accueil/chantier/[territoireCode]/index.tsx`** : `dependencies.getMinistèreRepository()` et `dependencies.getAxeRepository()` pour les données de filtrage, mais `getContainer("chantiers").resolve(...)` pour les chantiers
- **`src/server/infrastructure/api/trpc/routes/gestionTokenAPI.ts`** : `getContainer("gestionUtilisateur")` pour les habilitations, `dependencies.getTokenAPIService()` pour le reste

### Pattern problématique dans le legacy : use cases instanciés manuellement

Dans les routes tRPC et les handlers, le pattern legacy force le consommateur à câbler les use cases :

```ts
// publication.ts - pattern legacy
new CréerUnCommentaireUseCase(dependencies.getCommentaireRepository())
```

Avec Awilix, ce câblage est fait automatiquement :

```ts
// pattern Awilix
getContainer("commentaires").resolve("creerCommentaireUseCase")
```

### Interfaces et implémentations dupliquées

Certaines interfaces existent dans le legacy (`src/server/domain/`) ET dans les modules Awilix (`src/server/<module>/domain/ports/`), parfois avec des noms différents pour la même chose :
- `ChantierRepository` legacy vs `ChantierRepository` dans `src/server/chantiers/domain/ports/`
- `IndicateurRepository` legacy vs `IndicateurRepository` dans `src/server/chantiers/domain/ports/`

---

## 4. Inventaire des dépendances legacy à migrer

Pour chaque getter du singleton, voici le container Awilix cible naturel :

| Getter legacy | Container Awilix cible | Déjà dans ce container ? |
|---------------|----------------------|--------------------------|
| `getChantierRepository()` | `chantiers` | Oui (`chantierRepository`) |
| `getAxeRepository()` | `chantiers` ou nouveau | Non |
| `getSynthèseDesRésultatsRepository()` | `importSyntheseDesResultats` | Oui (via différente impl) |
| `getMinistèreRepository()` | `chantiers` | Oui (`ministereRepository`) |
| `getIndicateurRepository()` | `chantiers` ou `parametrageIndicateur` | Oui (différentes impl) |
| `getCommentaireRepository()` | `importCommentaire` | Oui |
| `getObjectifRepository()` | `importObjectif` | Oui |
| `getDécisionStratégiqueRepository()` | `importDecisionStrategique` | Oui |
| `getUtilisateurRepository()` | `gestionUtilisateur` | Oui |
| `getAuthentificationUtilisateurRepository()` | `authentification` | Oui |
| `getAuthentificationProfilRepository()` | À créer dans `authentification` | Non |
| `getTerritoireRepository()` | `chantiers` | Oui (`territoireRepository`) |
| `getFicheTerritorialeTerritoireRepository()` | Nouveau `ficheTerritoriale` ou existant | Non |
| `getFicheTerritorialeChantierRepository()` | Nouveau `ficheTerritoriale` ou existant | Non |
| `getFicheTerritorialeIndicateurRepository()` | Nouveau `ficheTerritoriale` ou existant | Non |
| `getFicheTerritorialeSyntheseDesResultatsRepository()` | Nouveau `ficheTerritoriale` ou existant | Non |
| `getFicheTerritorialeMinistereRepository()` | Nouveau `ficheTerritoriale` ou existant | Non |
| `getChantierIndicateurRepository()` | `chantiers` | Oui |
| `getProfilRepository()` | `gestionUtilisateur` ou `authentification` | À vérifier |
| `getRapportRepository()` | `importIndicateur` | À vérifier |
| `getImportIndicateurRepository()` | `importIndicateur` | Oui |
| `getGestionContenuRepository()` | Nouveau `gestionContenu` ou existant | Non |
| `getTokenAPIService()` | `authentification` | Non |
| `getTokenAPIInformationRepository()` | `authentification` | Non |

### Dépendances non encore migrées vers Awilix

Les principales lacunes concernent :
1. **Fiche territoriale** : 5 repositories (territoire, chantier, indicateur, synthese, ministere) — pas de container `ficheTerritoriale` dédié
2. **Authentification** : `ProfilRepository`, `TokenAPIService`, `TokenAPIInformationRepository` manquent dans le container
3. **Gestion contenu** : pas de container existant
4. **Axe** : `AxeRepository` n'existe dans aucun container
5. **Profil** : `ProfilSQLRepository` n'est dans aucun container

---

## 5. Plan de migration : étape 1

### Objectif

Remplacer le singleton `Dependencies` par un container Awilix `legacy`, avec les **mêmes implémentations**. Remplacement purement mécanique, aucun changement de comportement.

### Ce qu'on fait

1. Créer `src/server/legacy/container.ts` qui enregistre les 24 dépendances avec les mêmes implémentations que `Dependencies.ts`
2. Enregistrer ce container dans `dependances.ts` sous la clé `legacy`
3. Remplacer mécaniquement dans les 23 fichiers consommateurs :

```ts
// Avant
import { dependencies } from "@/server/infrastructure/Dependencies";
dependencies.getCommentaireRepository()

// Après
import { getContainer } from "@/server/dependances";
getContainer("legacy").resolve("commentaireRepository")
```

4. Supprimer `src/server/infrastructure/Dependencies.ts`

### Ce qu'on ne fait pas

- On ne déplace pas de dépendances vers d'autres containers
- On ne change pas les implémentations (on garde les `*SQLRepository` du legacy tels quels)
- On ne migre pas les use cases instanciés manuellement (`new CréerUnCommentaireUseCase(...)`)
- On ne crée pas de nouveaux containers domaine

### Points d'attention

- **`[...nextauth].tsx`** : utilise un `await import(...)` dynamique pour charger `dependencies` — à remplacer par `getContainer("legacy")`
- **`TokenAPIJWTService`** : instancié avec `configuration().tokenAPI.secret` dans le constructeur de `Dependencies` — utiliser `asFunction` dans le container legacy pour reproduire le même câblage
- **Aucun changement d'implémentation** : on garde `ChantierSQLRepository`, `AxeSQLRepository`, etc. exactement comme dans `Dependencies.ts`

### Étapes futures (hors scope)

Une fois le `legacyContainer` en place, on pourra itérer pour :
- Migrer progressivement chaque dépendance du `legacyContainer` vers son container domaine
- Créer les containers manquants (`ficheTerritoriale`, `gestionContenu`, etc.)
- Migrer les use cases legacy vers les modules domaine
- Supprimer le `legacyContainer` quand il est vide
