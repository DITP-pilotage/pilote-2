import { BarreDeProgressionVariante } from '@/components/_commons/BarreDeProgression/BarreDeProgression.interface';

export enum TypeDeCurseur {
  MINIMUM = 'minimum',
  MÉDIANE = 'médiane',
  MAXIMUM = 'maximum',
}

export default interface BarreDeProgressionCurseurProps {
  valeur: number,
  typeDeCurseur: TypeDeCurseur,
  variante: BarreDeProgressionVariante,
}
