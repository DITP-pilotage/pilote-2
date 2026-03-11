import {
  asFunction,
  type AwilixContainer,
  type BuildResolver,
  type DisposableResolver,
} from "awilix";

type TypedAsFunction<TCradle> = <T>(
  fn: (cradle: TCradle) => T,
) => BuildResolver<T> & DisposableResolver<T>;

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

export type { ModuleDef, TypedAsFunction };
export { defineModule, typedAsFunction };
