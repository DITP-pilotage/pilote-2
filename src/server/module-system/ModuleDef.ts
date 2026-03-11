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
  TExports extends Record<string, unknown>,
  TCradle extends TExports,
> = {
  name: TName;
  imports: string[];
  exports: (keyof TExports)[];
  register: (
    container: AwilixContainer<RemoveIndexSignature<TCradle>>,
    fn: TypedAsFunction<TCradle>,
  ) => void;
};

const defineModule = <
  TName extends string,
  TExports extends Record<string, unknown>,
  TCradle extends TExports,
>(
  def: ModuleDef<TName, TExports, TCradle>,
): ModuleDef<TName, TExports, TCradle> => def;

const typedAsFunction = <TCradle>(): TypedAsFunction<TCradle> => {
  return asFunction as unknown as TypedAsFunction<TCradle>;
};

export type { ModuleDef, TypedAsFunction };
export { defineModule, typedAsFunction };
