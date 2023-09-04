import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import SynthèseDesRésultatsProjetStructurant from './SynthèseDesRésultats.interface';

export default interface SynthèseDesRésultatsProjetStructurantRepository {
  récupérerLaPlusRécente(projetStructurantId: ProjetStructurant['id']): Promise<SynthèseDesRésultatsProjetStructurant>
  récupérerToutesLesMétéosLesPlusRécentes(): Promise<{ projetStructurantId: string, météo: Météo }[]>
  créer(projetStructurantId: string, id: string, contenu: string, auteur: string, météo: Météo, date: Date): Promise<SynthèseDesRésultatsProjetStructurant>
  récupérerHistorique(projetStructurantId: string): Promise<SynthèseDesRésultatsProjetStructurant[]>
}
