export type UpsertValeurAvancementItem = {
  individu: string;
  date: string;
  valeur: number;
};

export type UpsertIndicateurPayload = {
  nom: string;
  visibilite: "PRIVE" | "PUBLIC";
  referentiels: Array<{
    referentielPublicId: string;
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
