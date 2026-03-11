import {
  asFunction,
  type AwilixContainer,
  type BuildResolver,
  type BuildResolverOptions,
  type DisposableResolver,
} from "awilix";
import type { SharedDependencies } from "@/server/shared/module";

type TypedAsFunction<TCradle> = <T>(
  fn: (cradle: TCradle) => T,
) => BuildResolver<T> & DisposableResolver<T>;

type TypedAsClass<TScope> = <T>(
  Type: new (deps: TScope) => T,
  opts?: BuildResolverOptions<T>,
) => BuildResolver<T> & DisposableResolver<T>;

type ModuleScope<TCradle> = SharedDependencies & TCradle;

type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

type ModuleDef<
  TName extends string,
  TImports extends string,
  TExports extends Record<string, unknown>,
  TCradle extends TExports,
> = {
  name: TName;
  imports: TImports[];
  exports: (keyof TExports)[];
  register: (
    container: AwilixContainer<RemoveIndexSignature<TCradle>>,
    fn: TypedAsFunction<TCradle>,
    asModuleClass: TypedAsClass<ModuleScope<TCradle>>,
  ) => void;
};

const defineModule =
  <TExports extends Record<string, unknown>, TCradle extends TExports>() =>
  <TName extends string, TImports extends string>(
    def: ModuleDef<TName, TImports, TExports, TCradle>,
  ): ModuleDef<TName, TImports, TExports, TCradle> =>
    def;

const typedAsFunction = <TCradle>(): TypedAsFunction<TCradle> => {
  return asFunction as unknown as TypedAsFunction<TCradle>;
};

export type { ModuleDef, ModuleScope, TypedAsClass, TypedAsFunction };
export { defineModule, typedAsFunction };
