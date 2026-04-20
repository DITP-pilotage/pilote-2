import { Transaction } from "@/server/db/Transaction";

export class InMemoryTransaction implements Transaction {
  run<T>(scope: () => Promise<T>): Promise<T> {
    return scope();
  }
}
