import {
  type AwilixContainer,
  type BuildResolver,
  type BuildResolverOptions,
  type DisposableResolver,
} from "awilix";
import type { SharedDependencies } from "@/server/shared/module";
import type { ModuleName } from "./moduleNames";

type TypedAsFunction<TCradle> = <T>(
  fn: (cradle: TCradle) => T,
) => BuildResolver<T> & DisposableResolver<T>;

type TypedAsClass<TScope> = <T>(
  Type: new (deps: TScope) => T,
  opts?: BuildResolverOptions<T>,
) => BuildResolver<T> & DisposableResolver<T>;

type ModuleScope<TCradle> = SharedDependencies & TCradle;

type ModuleHelpers<TCradle> = {
  asModuleFunction: TypedAsFunction<TCradle>;
  asModuleClass: TypedAsClass<ModuleScope<TCradle>>;
};

type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

type ModuleDef<
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

const defineModule =
  <TExports extends Record<string, unknown>, TCradle extends TExports>() =>
  <TName extends ModuleName>(
    def: ModuleDef<TName, TExports, TCradle>,
  ): ModuleDef<TName, TExports, TCradle> =>
    def;

type NoExports = Record<string, never>;

type ExtractScope<M> =
  M extends ModuleDef<ModuleName, any, infer C> ? ModuleScope<C> : never;

export type {
  ExtractScope,
  ModuleDef,
  ModuleHelpers,
  ModuleScope,
  NoExports,
  TypedAsClass,
  TypedAsFunction,
};
export { defineModule };
