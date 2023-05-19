import Chantier from '@/server/domain/chantier/Chantier.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface SynthèseDesRésultatsHistoriqueProps {
  réformeId: Chantier['id'] | ProjetStructurant['id'];
}
