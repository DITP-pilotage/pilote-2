import {
  type AwilixContainer,
  type BuildResolver,
  type BuildResolverOptions,
  type DisposableResolver,
} from "awilix";
import type { SharedDependencies } from "@/server/shared/module";
import type { ModuleName } from "./moduleNames";

// Typage fort pour `asFunction` d'awilix, infère le cradle du module
export type TypedAsFunction<TCradle> = <T>(
  fn: (cradle: TCradle) => T,
) => BuildResolver<T> & DisposableResolver<T>;

// Typage fort pour `asClass` d'awilix, inclut le scope partagé
export type TypedAsClass<TScope> = <T>(
  Type: new (deps: TScope) => T,
  opts?: BuildResolverOptions<T>,
) => BuildResolver<T> & DisposableResolver<T>;

// Union des dépendances partagées et du cradle propre au module
export type ModuleScope<TCradle> = SharedDependencies & TCradle;

// Objet passé à `register` pour enregistrer des services typés
export type ModuleHelpers<TCradle> = {
  asModuleFunction: TypedAsFunction<TCradle>;
  asModuleClass: TypedAsClass<ModuleScope<TCradle>>;
};

// Retire l'index signature pour ne garder que les clés explicites
// (nécessaire car `AwilixContainer` expose une index signature `[key: string]: any`)
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

// Définition complète d'un module (nom, imports, exports, register)
export type ModuleDef<
  TName extends ModuleName,
  TExports extends Record<string, unknown>,
  TCradle extends TExports,
> = {
  name: TName;
  imports: ModuleName[];
  exports: (keyof TExports)[];
  register: (
    container: AwilixContainer<RemoveIndexSignature<TCradle>>,
    helpers: ModuleHelpers<TCradle>,
  ) => void;
};

// Factory curryfiée pour créer un module avec inférence de types
export const defineModule =
  <TExports extends Record<string, unknown>, TCradle extends TExports>() =>
  <TName extends ModuleName>(
    def: ModuleDef<TName, TExports, TCradle>,
  ): ModuleDef<TName, TExports, TCradle> =>
    def;

// Vérifie que toutes les clés du cradle sont enregistrées
export type VerifyCradle<T> = Record<keyof T, unknown>;

// Type utilitaire pour les modules qui n'exportent rien
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NoExports = {};

// Extrait le scope complet d'un module (shared + cradle)
export type ExtractScope<M> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends ModuleDef<ModuleName, any, infer C> ? ModuleScope<C> : never;
