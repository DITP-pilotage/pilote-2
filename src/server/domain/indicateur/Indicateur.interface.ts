export const typesIndicateur = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE', null] as const;
export type TypeIndicateur = typeof typesIndicateur[number];

export default interface Indicateur {
  id: string;
  nom: string;
  type: TypeIndicateur;
  estIndicateurDuBaromètre: boolean;
  description: string | null;
  source: string | null;
  modeDeCalcul: string | null;
}
