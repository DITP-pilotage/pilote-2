import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import SynthèseDesRésultatsProjetStructurant from './SynthèseDesRésultats.interface';

export default interface SynthèseDesRésultatsProjetStructurantRepository {
  récupérerLaPlusRécente(projetStructurantId: ProjetStructurant['id']): Promise<SynthèseDesRésultatsProjetStructurant>
}
