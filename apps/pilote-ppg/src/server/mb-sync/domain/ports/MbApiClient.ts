export type UpsertValeurAvancementItem = {
  individu: string;
  date: string;
  valeur: number;
};

export type UpsertObjectifIndicateurItem = {
  individu: string;
  dateCible: string;
  valeurCible: number;
};

export type DeleteObjectifIndicateurItem = {
  individu: string;
  dateCible: string;
};

export type UpsertIndicateurPayload = {
  nom: string;
  visibilite: "PRIVE" | "PUBLIC";
  unite: "POURCENTAGE" | "ANNEES" | null;
  referentiels: Array<{
    referentielPublicId: string;
    fonctionAgregation: "SUM" | "AVG" | "NONE";
  }>;
};

export type DeleteValeurAvancementItem = {
  individu: string;
  date: string;
};

export interface MbApiClient {
  upsertValeursAvancementBatch(args: {
    indicId: string;
    items: UpsertValeurAvancementItem[];
  }): Promise<number>;
  deleteValeursAvancement(args: {
    indicId: string;
    items: DeleteValeurAvancementItem[];
  }): Promise<number>;
  upsertIndicateur(args: {
    indicId: string;
    payload: UpsertIndicateurPayload;
  }): Promise<void>;
  upsertObjectifsIndicateurBatch(args: {
    indicId: string;
    items: UpsertObjectifIndicateurItem[];
  }): Promise<number>;
  deleteObjectifIndicateur(args: {
    indicId: string;
    item: DeleteObjectifIndicateurItem;
  }): Promise<void>;
}
