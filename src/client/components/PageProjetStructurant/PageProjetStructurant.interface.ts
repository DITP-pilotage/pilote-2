import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface PageProjetStructurantProps {
  projetStructurant: ProjetStructurant
  indicateurs: Indicateur[]
}
