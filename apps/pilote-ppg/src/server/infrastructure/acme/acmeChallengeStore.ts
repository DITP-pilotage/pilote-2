const store = new Map<string, string>();

export const acmeChallengeStore = {
  set(token: string, keyAuthorization: string): void {
    store.set(token, keyAuthorization);
  },
  get(token: string): string | undefined {
    return store.get(token);
  },
  delete(token: string): boolean {
    return store.delete(token);
  },
  clear(): void {
    store.clear();
  },
  size(): number {
    return store.size;
  },
};
