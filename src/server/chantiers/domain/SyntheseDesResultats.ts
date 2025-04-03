import { Météo } from '@/server/chantiers/domain/Meteo';

export type SyntheseDesResultats = {
  id: string
  contenu: string
  date: string
  auteur: string
  météo: Météo
} | null;
