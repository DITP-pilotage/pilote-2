import { Maille } from '@/server/domain/maille/Maille.interface';

export const typesIndicateur = ['IMPACT', 'DEPL', 'Q_SERV', 'REBOND', 'CONTEXTE'] as const;
export type TypeIndicateur = typeof typesIndicateur[number];

export type IndicateurPondération = Record<Maille, number | null>;

export default interface Indicateur {
  id: string;
  nom: string;
  type: TypeIndicateur;
  estIndicateurDuBaromètre: boolean;
  description: string | null;
  source: string | null;
  modeDeCalcul: string | null;
  pondération: IndicateurPondération;
}
