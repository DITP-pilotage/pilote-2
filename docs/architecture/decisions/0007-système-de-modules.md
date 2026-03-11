# 7. Système de modules

Date : 2026-03-10

## Statut

Accepté

## Contexte

L'application utilisait un conteneur d'injection de dépendances Awilix unique et monolithique. Toutes les dépendances (repositories, use cases, queries, services) étaient enregistrées dans un seul conteneur, ce qui posait plusieurs problèmes :

1. **Pas d'isolation entre domaines** : n'importe quelle partie du code pouvait résoudre n'importe quelle dépendance, sans distinction entre ce qui est interne à un domaine et ce qui est partagé
2. **Pas de contrats explicites** : les dépendances entre domaines étaient implicites — il n'y avait aucun moyen de savoir quelles dépendances un domaine exposait intentionnellement aux autres
3. **Typage faible** : le conteneur unique typait l'ensemble des dépendances comme un seul `Cradle`, rendant difficile la compréhension du périmètre de chaque domaine
4. **Module legacy monolithique** : un module `legacy` concentrait une grande quantité de dépendances historiques sans séparation claire

## Décision

Nous introduisons un système de modules basé sur Awilix. Un module déclare un nom, ses imports, ses exports et ses dépendances internes. Le système garantit à la compilation que les contrats entre modules sont respectés.

### Définir un module

Un module est créé via `defineModule<TExports, TCradle>()(def)` :

- **`TExports`** : les dépendances que ce module rend disponibles aux autres modules
- **`TCradle`** : le conteneur complet du module (inclut les exports et les dépendances internes)
- **`name`** : identifiant unique du module, de type `ModuleName` (union littérale)
- **`imports`** : tableau de `ModuleName[]` — les modules dont on dépend
- **`exports`** : tableau de `(keyof TExports)[]` — les clés rendues visibles aux importateurs
- **`register`** : fonction `(container, helpers) => void` qui enregistre les dépendances dans le conteneur Awilix

`defineModule` est currifié en deux appels : le premier reçoit les types explicites `TExports` et `TCradle`, le second reçoit la définition et infère `TName` depuis `def.name`.

**Module racine (`shared`)** — fournit les dépendances transversales, n'exporte rien :

```typescript
type SharedExports = Record<string, never>;

type SharedCradle = SharedExports & {
  prisma: PrismaPilote;
  transaction: Transaction;
  emailManager: EmailManager;
};

export const sharedModule = defineModule<SharedExports, SharedCradle>()({
  name: "shared",
  imports: [],
  exports: [],
  register: (container, { asModuleFunction }) => {
    container.register({
      prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
      transaction: asClass(PrismaTransaction, { lifetime: Lifetime.SINGLETON }),
      emailManager: asModuleFunction(() =>
        configuration().brevo.disableEmails
          ? new StubEmailManager()
          : new BrevoEmailManager(),
      ).singleton(),
    });
  },
});
```

**Module avec exports (`gestionUtilisateur`)** — expose des queries pour d'autres modules :

```typescript
type GestionUtilisateurExports = {
  activiteComptesQuery: PrismaActiviteComptesQuery;
  utilisateursQuery: PrismaUtilisateursQuery;
};

type GestionUtilisateurCradle = GestionUtilisateurExports & {
  utilisateurRepository: UtilisateurRepository;
  // ... dépendances internes
};

export const gestionUtilisateurModule = defineModule<
  GestionUtilisateurExports,
  GestionUtilisateurCradle
>()({
  name: "gestionUtilisateur",
  imports: ["shared"],
  exports: ["activiteComptesQuery", "utilisateursQuery"],
  register: (container) => {
    container.register({
      activiteComptesQuery: asClass(PrismaActiviteComptesQuery),
      utilisateursQuery: asClass(PrismaUtilisateursQuery),
      // ... autres dépendances internes
    });
  },
});
```

**Module avec imports inter-modules (`rapportsHebdomadaires`)** — consomme les exports d'autres modules et utilise `asModuleClass` :

```typescript
type RapportsHebdomadairesExports = Record<string, never>;

type RapportsHebdomadairesCradle = RapportsHebdomadairesExports & {
  // Importés depuis d'autres modules (injectés automatiquement en phase 2)
  activiteComptesQuery: PrismaActiviteComptesQuery;
  utilisateursQuery: PrismaUtilisateursQuery;
  recupererChantiersQuery: RecupererChantiersApplicablesParTerritoiresQuery;
  // Dépendances propres
  activiteComptesGateway: ActiviteComptesGateway;
  rapportRepository: RapportRepository;
};

export const rapportsHebdomadairesModule = defineModule<
  RapportsHebdomadairesExports,
  RapportsHebdomadairesCradle
>()({
  name: "rapportsHebdomadaires",
  imports: ["shared", "gestionUtilisateur", "chantiers", "indicateurTerritoireValeurEvenement"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      activiteComptesGateway: asModuleClass(GestionUtilisateurActiviteComptesGateway),
      rapportRepository: asModuleClass(PrismaRapportRepository),
      // ...
    });
  },
});
```

### Helpers de registration

Le second argument de `register` fournit deux helpers typés pour enregistrer les dépendances :

**`asModuleClass(MyClass)`** — pour les classes dont le constructeur reçoit un objet de type `ModuleScope<TCradle>` (c'est-à-dire les dépendances partagées + les dépendances du module) :

```typescript
register: (container, { asModuleClass }) => {
  container.register({
    rapportRepository: asModuleClass(PrismaRapportRepository),
  });
};
```

**`asModuleFunction((cradle) => ...)`** — pour les fonctions factory dont le paramètre est typé comme `TCradle` (le cradle du module seul) :

```typescript
register: (container, { asModuleFunction }) => {
  container.register({
    emailManager: asModuleFunction(() =>
      configuration().brevo.disableEmails
        ? new StubEmailManager()
        : new BrevoEmailManager(),
    ).singleton(),
  });
};
```

**`asClass` brut (import Awilix)** — quand la classe n'a pas besoin de dépendances du scope module, ou pour les singletons sans injection :

```typescript
register: (container) => {
  container.register({
    prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
  });
};
```

La différence clé : `asModuleClass` type le constructeur comme `ModuleScope<TCradle>` (shared + module), `asModuleFunction` type le factory comme `TCradle` (module seul), et `asClass` brut n'a aucun typage lié au module.

### Pattern `Inject` pour les classes

Pour déclarer précisément les dépendances d'une classe, chaque module peut définir un type utilitaire `Inject<K>` :

```typescript
// Dans le fichier module du module rapportsHebdomadaires
type Scope = ModuleScope<RapportsHebdomadairesCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

`ModuleScope<TCradle>` est défini comme `SharedDependencies & TCradle` — il représente l'ensemble des dépendances accessibles dans le conteneur du module (dépendances transversales + dépendances propres).

Les classes utilisent ensuite `Inject` pour déclarer uniquement les clés dont elles ont besoin :

```typescript
class PrismaRapportRepository {
  private readonly prisma: PrismaPilote;
  private readonly rapportMapper: RapportMapper;

  constructor({ prisma, rapportMapper }: Inject<"prisma" | "rapportMapper">) {
    this.prisma = prisma;
    this.rapportMapper = rapportMapper;
  }
}
```

Ce pattern permet à chaque classe de ne dépendre que de ce qu'elle utilise réellement, tout en bénéficiant du typage complet du scope du module.

### Utilisation via `getContainer`

Le point d'entrée `src/server/dependances.ts` expose une fonction `getContainer` typée qui donne accès au conteneur de chaque module :

```typescript
import { getContainer } from "@/server/dependances";

// Dans un endpoint ou un handler :
const container = getContainer("rapportsHebdomadaires");
const useCase = container.cradle.envoyerRapportsHebdomadairesUseCase;
```

Le type retourné est un `AwilixContainer` paramétré par le cradle du module demandé, offrant l'autocomplétion et la vérification de type sur les clés disponibles.

## Fonctionnement interne

### Registre des modules

Tous les noms de modules sont déclarés dans une union littérale `ModuleName` :

```typescript
const moduleNames = [
  "shared",
  "authentification",
  "chantiers",
  // ...
  "legacy",
] as const;

type ModuleName = (typeof moduleNames)[number];
```

Ajouter un nouveau module nécessite de l'ajouter à ce tableau. Le fichier `dependances.ts` contient une vérification d'exhaustivité à la compilation :

```typescript
type _AssertExhaustiveModules =
  Exclude<ModuleName, (typeof allModules)[number]["name"]> extends never
    ? true
    : never;
```

Si un `ModuleName` n'a pas de module correspondant dans `allModules`, TypeScript produit une erreur de compilation. Cela garantit que tout module déclaré est effectivement enregistré.

### Démarrage en deux phases (`bootModules`)

La fonction `bootModules` orchestre la création des conteneurs :

```
Phase 1 : Création des conteneurs
┌──────────┐
│  shared   │  ← conteneur racine (imports: [])
└─────┬─────┘
      │ createScope()
      ├───────────────────┬──────────────────┐
┌─────┴──────┐    ┌───────┴───────┐   ┌──────┴───────┐
│  gestion   │    │   chantiers   │   │   rapports   │
│ Utilisat.  │    │               │   │   Hebdo.     │
└────────────┘    └───────────────┘   └──────────────┘

Chaque scope hérite automatiquement des dépendances de shared
(prisma, transaction, emailManager)
```

**Phase 1 — Création des conteneurs** :
- Le module racine (`imports: []`) obtient un conteneur Awilix dédié. Il s'agit du module `shared` qui fournit les dépendances transversales
- Tous les autres modules obtiennent un **scope** du conteneur racine (`createScope()`), héritant ainsi automatiquement des dépendances transversales
- Chaque module enregistre ses propres dépendances via sa fonction `register`

```
Phase 2 : Câblage inter-modules
gestionUtilisateur.exports ───asValue()──> rapportsHebdomadaires
     activiteComptesQuery  ──────────────> activiteComptesQuery
     utilisateursQuery     ──────────────> utilisateursQuery
```

**Phase 2 — Câblage inter-modules** :
- Pour chaque module ayant des imports autres que le module racine, les exports des modules importés sont résolus eagerly puis enregistrés via `asValue()` dans le conteneur du module importateur

### Résolution eager (`asValue`)

La résolution eager en phase 2 est essentielle : elle évite la détection de cycles d'Awilix qui se déclenche quand une clé est re-résolue dans la pile de résolution d'un scope partagé. En résolvant les exports une seule fois et en les injectant comme valeurs brutes, chaque conteneur obtient une copie indépendante de la dépendance.

## Conséquences

### Avantages

- **Isolation** : chaque module a son propre conteneur (scope). Les dépendances internes ne sont pas accessibles depuis l'extérieur
- **Contrats explicites** : les `exports` déclarent explicitement ce qu'un module met à disposition. Les `imports` déclarent explicitement ce dont un module a besoin
- **Type safety** : les types `TExports` et `TCradle` garantissent à la compilation que les exports sont bien enregistrés et que le conteneur contient toutes les dépendances attendues
- **Exhaustivité à la compilation** : le type `_AssertExhaustiveModules` garantit que tout `ModuleName` déclaré est effectivement câblé dans `dependances.ts`
- **Imports typés** : le tableau `imports` utilise `ModuleName[]`, une erreur dans le nom d'un module importé est détectée à la compilation
- **Lisibilité** : en lisant la définition d'un module, on comprend immédiatement son périmètre, ses dépendances externes et ce qu'il expose

### Inconvénients et limitations

- **Tous les modules dépendent de `shared`** : le module racine reste un point central. Si une dépendance transversale doit être ajoutée, elle impacte potentiellement tous les modules
- **Pas de lazy loading** : tous les modules sont instanciés au démarrage de l'application via `bootModules`
- **Détection de cycles limitée** : la résolution eager via `asValue` en phase 2 contourne la détection de cycles d'Awilix. Un cycle entre modules ne sera pas détecté automatiquement
- **Migration progressive** : le module `legacy` contient encore une grande partie des dépendances historiques qui devront être migrées progressivement vers des modules dédiés
