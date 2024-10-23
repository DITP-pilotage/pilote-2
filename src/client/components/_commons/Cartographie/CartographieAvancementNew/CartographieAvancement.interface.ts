import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnéesAvancement = { 
  valeur: number | null
  valeurAnnuelle: number | null
  codeInsee: CodeInsee
  estApplicable: boolean | null 
}[];
