import { Transaction } from "@/server/framework/persistence/Transaction";

export class InMemoryTransaction implements Transaction {
  run<T>(scope: () => Promise<T>): Promise<T> {
    return scope();
  }
}
