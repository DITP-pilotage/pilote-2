import { Météo } from '@/server/chantiers/domain/Meteo';

export type CartographieDonnéesMétéo = { valeur: Météo, territoireCode: string, estApplicable: boolean | null }[];
