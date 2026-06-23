export type UpsertValeurAvancementItem = {
  individu: string;
  date: string;
  valeur: number;
};

export type UpsertIndicateurPayload = {
  nom: string;
  visibilite: "PRIVE" | "PUBLIC";
  unite: "POURCENTAGE" | "ANNEES" | null;
  referentiels: Array<{
    id: string;
    fonctionAgregation: "SUM" | "AVG" | "NONE";
  }>;
};

export interface MbApiClient {
  upsertValeursAvancementBatch(args: {
    indicId: string;
    items: UpsertValeurAvancementItem[];
  }): Promise<number>;
  upsertIndicateur(args: {
    indicId: string;
    payload: UpsertIndicateurPayload;
  }): Promise<void>;
}
