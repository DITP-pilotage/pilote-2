export type UpsertItem = {
  individu: string;
  date: string;
  valeur: number;
};

export interface MbApiClient {
  upsertBatch(indicateurId: string, items: UpsertItem[]): Promise<number>;
}
