import {
  asClass,
  asFunction,
  asValue,
  type AwilixContainer,
  createContainer,
  InjectionMode,
} from "awilix";
import type { ModuleDef, TypedAsClass, TypedAsFunction } from "./ModuleDef";
import type { ModuleName } from "./moduleNames";

// `bootModules` est le point d'entrée du système de modules.
// Il reçoit une liste de définitions de modules et construit le graphe
// de dépendances en deux phases :
//
// Phase 1 — Création des containers :
//   Le module racine (celui sans imports) obtient un container awilix neuf.
//   Chaque autre module obtient un scope (enfant) du container racine, ce qui
//   permet d'hériter des dépendances transverses (prisma, transaction, etc.).
//
// Phase 2 — Câblage des exports inter-modules :
//   Les exports de chaque module importé sont résolus eagerly puis
//   ré-enregistrés comme valeurs simples dans le container consommateur.
//   Cela évite la détection de cycles d'awilix quand `asFunction` tente de
//   ré-résoudre une clé déjà sur la pile de résolution d'un scope partagé.
//
// Le typage est restauré à l'usage via `getContainer`, qui renvoie un
// container correctement typé pour chaque module.

// `any` nécessaire : effacement de type à la frontière du système de modules,
// les types concrets sont restaurés via `getContainer`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyModuleDef = ModuleDef<ModuleName, any, any>;

// `any` nécessaire : inférence conditionnelle qui extrait le cradle d'un ModuleDef,
// le type concret est restauré par le générique de `getContainer`
export type ExtractCradle<M> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends ModuleDef<ModuleName, any, infer C> ? C : never;

export const bootModules = <TModules extends readonly AnyModuleDef[]>(
  modules: [...TModules],
): {
  getContainer: <N extends TModules[number]["name"]>(
    name: N,
  ) => AwilixContainer<ExtractCradle<Extract<TModules[number], { name: N }>>>;
} => {
  const containers = new Map<string, AwilixContainer>();

  // Phase 1 — Création des containers
  // Le module racine (imports: []) obtient un container neuf.
  // Chaque autre module obtient un scope du container racine pour
  // hériter des dépendances transverses (prisma, transaction, etc.).
  const rootModule = modules.find((m) => m.imports.length === 0);
  if (!rootModule) {
    throw new Error(
      "No root module found (a module with empty imports is required)",
    );
  }

  const rootContainer = createContainer({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  const helpers = {
    asModuleFunction: asFunction as unknown as TypedAsFunction<never>,
    asModuleClass: asClass as unknown as TypedAsClass<never>,
  };

  rootModule.register(rootContainer, helpers);
  containers.set(rootModule.name, rootContainer);

  for (const mod of modules) {
    if (mod === rootModule) continue;
    const scope = rootContainer.createScope();
    mod.register(scope, helpers);
    containers.set(mod.name, scope);
  }

  // Phase 2 — Câblage des exports inter-modules via résolution eager.
  // Tous les modules sont déjà enregistrés (Phase 1), donc on résout
  // les exports de manière eager et on les ré-enregistre comme valeurs simples.
  // Cela évite la détection de cycles d'awilix quand `asFunction` tente de
  // ré-résoudre une clé déjà sur la pile de résolution d'un scope partagé.
  for (const mod of modules) {
    if (mod === rootModule) continue;
    const container = containers.get(mod.name)!;

    for (const importName of mod.imports) {
      if (importName === rootModule.name) continue;
      const importedModule = modules.find((m) => m.name === importName);
      if (!importedModule) {
        throw new Error(
          `Module "${mod.name}" imports unknown module "${importName}"`,
        );
      }
      const importedContainer = containers.get(importName)!;

      for (const exportKey of importedModule.exports) {
        container.register({
          [exportKey as string]: asValue(
            importedContainer.resolve(exportKey as string),
          ),
        });
      }
    }
  }

  return {
    getContainer: (name) => {
      const container = containers.get(name);
      if (!container) {
        throw new Error(`Module "${name}" not found`);
      }
      // `any` nécessaire : cast vers le type concret du container,
      // la sûreté est garantie par le générique de `getContainer`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return container as any;
    },
  };
};
