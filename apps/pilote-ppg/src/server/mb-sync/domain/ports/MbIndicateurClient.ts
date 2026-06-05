export type UpsertIndicateurPayload = {
  nom: string;
  visibilite: "PRIVE" | "PUBLIC";
  referentiels: Array<{
    referentielPublicId: string;
    fonctionAgregation: "SUM" | "AVG" | "NONE";
  }>;
};

export interface MbIndicateurClient {
  upsertIndicateur(id: string, payload: UpsertIndicateurPayload): Promise<void>;
}
