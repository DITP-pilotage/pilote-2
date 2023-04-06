import { Météo } from '@/server/domain/météo/Météo.interface';

type SynthèseDesRésultats = {
  id: string
  contenu: string
  date: string
  auteur: string
  météo: Météo
} | null;

export default SynthèseDesRésultats;
