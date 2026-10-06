export interface Transaction {
  run<T>(scope: () => Promise<T>): Promise<T>;
}
