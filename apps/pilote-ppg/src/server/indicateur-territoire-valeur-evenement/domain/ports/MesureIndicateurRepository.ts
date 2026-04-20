export type MesureIndicateur = {
  indicId: string;
  territoireCode: string;
  dateValeur: Date;
  valeur: string;
  auteurId: string;
};

export interface MesureIndicateurRepository {
  enregistrer(mesureIndicateur: MesureIndicateur): Promise<void>;
}
