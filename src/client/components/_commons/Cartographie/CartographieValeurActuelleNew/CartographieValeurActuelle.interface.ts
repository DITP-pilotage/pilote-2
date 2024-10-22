import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnéesValeurActuelle = { valeur: number | null, valeurCible: number | null, codeInsee: CodeInsee, estApplicable: boolean | null,   }[];
