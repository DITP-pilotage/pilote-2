export const typesIndicateur = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE'] as const;
export const typesIndicateurProjetStructurant = ['IMPACT', 'DEPL', 'FINANCIER'] as const;

export type TypeIndicateur = typeof typesIndicateur[number] | typeof typesIndicateurProjetStructurant[number];

export default interface Indicateur {
  id: string;
  nom: string;
  type: TypeIndicateur;
  estIndicateurDuBaromètre: boolean;
  description: string | null;
  source: string | null;
  modeDeCalcul: string | null;
  unité: string | null;
}
