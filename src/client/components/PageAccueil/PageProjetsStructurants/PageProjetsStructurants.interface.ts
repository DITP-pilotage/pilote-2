import Ministère from '@/server/domain/ministère/Ministère.interface';
import {
  ProjetStructurantVueDEnsemble,
} from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface PageProjetsStructurantsProps {
  projetsStructurants: ProjetStructurantVueDEnsemble[],
  ministères: Ministère[]
}
