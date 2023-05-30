import { Météo } from '@/server/domain/météo/Météo.interface';

type SynthèseDesRésultatsProjetStructurant = {
  id: string
  contenu: string
  date: string
  auteur: string
  météo: Météo
} | null;

export default SynthèseDesRésultatsProjetStructurant;
