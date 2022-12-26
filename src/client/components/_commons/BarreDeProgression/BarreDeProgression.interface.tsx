import { Avancement } from '@/server/domain/chantier/ChantierAvancement.interface';

export type BarreDeProgressionTaille = 'petite' | 'grande';
export type BarreDeProgressionVariante = 'primaire' | 'secondaire';
export type BarreDeProgressionFond = 'bleu' | 'gris' | 'blanc';

export default interface BarreDeProgressionProps {
  taille: BarreDeProgressionTaille,
  variante: BarreDeProgressionVariante,
  fond?: BarreDeProgressionFond,
  valeur: Avancement | null,
  afficherLesCurseurs?: boolean,
}
