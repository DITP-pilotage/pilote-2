import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnéesMétéo = { valeur: Météo, codeInsee: CodeInsee, estApplicable: boolean | null }[];

