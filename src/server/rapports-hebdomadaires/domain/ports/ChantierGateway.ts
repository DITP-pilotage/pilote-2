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

export const getChantiersIndicateursIds = (
  chantiers: ChantierAvecIndicateurs[],
) => {
  return chantiers.flatMap((chantier) =>
    chantier.indicateurs.map((indicateur) => indicateur.id),
  );
};

export interface ChantierGateway {
  recupererChantiersAccessibles(params: {
    territoireCodes: string[];
  }): Promise<Record<string, ChantierAvecIndicateurs>>;
}
