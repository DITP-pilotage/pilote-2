import {
  asFunction,
  asValue,
  type AwilixContainer,
  createContainer,
  InjectionMode,
} from "awilix";
import type { ModuleDef, TypedAsFunction } from "./ModuleDef";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModuleDef = ModuleDef<string, any, any>;

const bootModules = (
  modules: AnyModuleDef[],
): { getContainer: (name: string) => AwilixContainer } => {
  const containers = new Map<string, AwilixContainer>();

  // Phase 1 — create containers
  // The root module (imports: []) gets a fresh container.
  // Every other module gets a scope of the root container so that
  // prisma / transaction / transversal deps are inherited.
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

  const fn = asFunction as unknown as TypedAsFunction<never>;

  rootModule.register(rootContainer, fn);
  containers.set(rootModule.name, rootContainer);

  for (const mod of modules) {
    if (mod === rootModule) continue;
    const scope = rootContainer.createScope();
    mod.register(scope, fn);
    containers.set(mod.name, scope);
  }

  // Phase 2 — wire cross-module exports via eager resolution.
  // All modules are already registered (Phase 1), so we can resolve
  // exports eagerly and register them as plain values.  This avoids
  // awilix's cycle detection which fires when asFunction re-resolves
  // a key that is already on the resolution stack of a shared scope.
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
    getContainer: (name: string) => {
      const container = containers.get(name);
      if (!container) {
        throw new Error(`Module "${name}" not found`);
      }
      return container;
    },
  };
};

export { bootModules };
export type { AnyModuleDef };
