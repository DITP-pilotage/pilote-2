import { Météo } from '@/server/domain/météo/Météo.interface';

export type CartographieDonnéesMétéo = { valeur: Météo, territoireCode: string, estApplicable: boolean | null }[];

