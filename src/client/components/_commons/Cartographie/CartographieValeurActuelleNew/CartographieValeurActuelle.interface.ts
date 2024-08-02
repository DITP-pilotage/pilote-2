import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnéesValeurActuelle = { valeur: number | null, codeInsee: CodeInsee, estApplicable: boolean | null,   }[];
