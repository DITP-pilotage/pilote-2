export type IndicateurInfo = {
  id: string;
  nom: string;
  territoiresApplicables: string[];
};

export type ChantierAvecIndicateurs = {
  id: string;
  nom: string;
  indicateurs: IndicateurInfo[];
};

export interface ChantierGateway {
  recupererChantiersAccessibles(params: {
    territoireCodes: string[];
  }): Promise<Record<string, ChantierAvecIndicateurs>>;
}
