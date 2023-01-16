export type Agrégation<T> = {
  [k in keyof T]: T[k][];
};
