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

Nous introduisons un système de modules basé sur Awilix, construit autour de trois primitives : `ModuleDef`, `defineModule` et `bootModules`.

### Définition d'un module

Un module est défini par le type `ModuleDef<TName, TExports, TCradle>` :

- **`TName`** : identifiant unique du module (ex. `"shared"`, `"gestionUtilisateur"`)
- **`TExports`** : les dépendances que ce module rend disponibles aux autres modules
- **`TCradle`** : le conteneur complet du module (inclut les exports et les dépendances internes)

```typescript
type ModuleDef<
  TName extends string,
  TExports extends Record<string, unknown>,
  TCradle extends TExports,
> = {
  name: TName;
  imports: string[];
  exports: (keyof TExports)[];
  register: (container: AwilixContainer, fn: TypedAsFunction<TCradle>) => void;
};
```

La fonction `defineModule` est un simple helper d'identité qui assure le typage :

```typescript
const defineModule = <
  TName extends string,
  TExports extends Record<string, unknown>,
  TCradle extends TExports,
>(
  def: ModuleDef<TName, TExports, TCradle>,
): ModuleDef<TName, TExports, TCradle> => def;
```

### Démarrage en deux phases (`bootModules`)

La fonction `bootModules` orchestre la création des conteneurs en deux phases :

**Phase 1 — Création des conteneurs** :
- Le module racine (`imports: []`) obtient un conteneur Awilix dédié. Il s'agit du module `shared` qui fournit les dépendances transversales (Prisma, transactions, email)
- Tous les autres modules obtiennent un **scope** du conteneur racine, héritant ainsi automatiquement des dépendances transversales
- Chaque module enregistre ses propres dépendances via sa fonction `register`

**Phase 2 — Câblage inter-modules** :
- Pour chaque module ayant des imports autres que le module racine, les exports des modules importés sont résolus eagerly puis enregistrés via `asValue` dans le conteneur du module importateur
- La résolution eager (via `asValue`) est essentielle : elle évite la détection de cycles d'Awilix qui se déclenche quand `asFunction` re-résout une clé déjà présente dans la pile de résolution d'un scope partagé

### Exemples concrets

**Module racine (`shared`)** — fournit les dépendances transversales, n'exporte rien :

```typescript
type SharedExports = Record<string, never>;

type SharedCradle = SharedExports & {
  prisma: PrismaPilote;
  transaction: Transaction;
  emailManager: EmailManager;
};

export const sharedModule = defineModule<"shared", SharedExports, SharedCradle>({
  name: "shared",
  imports: [],
  exports: [],
  register: (container, fn) => {
    container.register({
      prisma: asClass(PrismaPilote, { lifetime: Lifetime.SINGLETON }),
      transaction: asClass(PrismaTransaction, { lifetime: Lifetime.SINGLETON }),
      emailManager: fn(() =>
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
  territoireRepository: TerritoireRepository;
  // ... dépendances internes
};

export const gestionUtilisateurModule = defineModule<
  "gestionUtilisateur",
  GestionUtilisateurExports,
  GestionUtilisateurCradle
>({
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

**Module avec imports inter-modules (`rapportsHebdomadaires`)** — consomme les exports de `gestionUtilisateur` :

```typescript
type RapportsHebdomadairesCradle = {
  // Importés depuis gestionUtilisateur (injectés automatiquement en phase 2)
  activiteComptesQuery: PrismaActiviteComptesQuery;
  utilisateursQuery: PrismaUtilisateursQuery;
  // Dépendances propres
  recupererChantiersQuery: RecupererChantiersApplicablesParTerritoiresQuery;
  mesuresIndicateurQuery: RecupererMesuresIndicateurParPeriodeQuery;
};

export const rapportsHebdomadairesModule = defineModule<
  "rapportsHebdomadaires",
  Record<string, never>,
  RapportsHebdomadairesCradle
>({
  name: "rapportsHebdomadaires",
  imports: ["shared", "gestionUtilisateur"],
  exports: [],
  register: (container) => {
    container.register({
      recupererChantiersQuery: asClass(
        RecupererChantiersApplicablesParTerritoiresQuery,
      ),
      mesuresIndicateurQuery: asClass(
        RecupererMesuresIndicateurParPeriodeQuery,
      ),
    });
  },
});
```

### Utilisation via `getContainer`

Le point d'entrée `src/server/dependances.ts` appelle `bootModules` avec la liste de tous les modules et expose une fonction `getContainer` typée :

```typescript
const { getContainer } = bootModules(allModules);

// Usage dans un endpoint ou un handler :
const container = getContainer("rapportsHebdomadaires");
const query = container.resolve("recupererChantiersQuery");
```

## Conséquences

### Avantages

- **Isolation** : chaque module a son propre conteneur (scope). Les dépendances internes ne sont pas accessibles depuis l'extérieur
- **Contrats explicites** : les `exports` déclarent explicitement ce qu'un module met à disposition. Les `imports` déclarent explicitement ce dont un module a besoin
- **Type safety** : les types `TExports` et `TCradle` garantissent à la compilation que les exports sont bien enregistrés et que le conteneur contient toutes les dépendances attendues
- **Lisibilité** : en lisant la définition d'un module, on comprend immédiatement son périmètre, ses dépendances externes et ce qu'il expose

### Inconvénients et limitations

- **Tous les modules dépendent de `shared`** : le module racine reste un point central. Si une dépendance transversale doit être ajoutée, elle impacte potentiellement tous les modules
- **Pas de lazy loading** : tous les modules sont instanciés au démarrage de l'application via `bootModules`
- **Détection de cycles limitée** : la résolution eager via `asValue` en phase 2 contourne la détection de cycles d'Awilix. Un cycle entre modules ne sera pas détecté automatiquement
- **`imports` non typé** : le tableau `imports` est un `string[]`, ce qui signifie qu'une erreur dans le nom d'un module importé n'est détectée qu'au runtime
- **Migration progressive** : le module `legacy` contient encore une grande partie des dépendances historiques qui devront être migrées progressivement vers des modules dédiés
