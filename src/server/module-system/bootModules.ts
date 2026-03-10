import {
  asFunction,
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

  // Phase 2 — wire cross-module exports via lazy resolvers.
  // No-op for now: every module has exports: [].

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
