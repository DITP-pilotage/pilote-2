import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';

type Filtre = Territoire['code'] | PérimètreMinistériel['id'] | Chantier['id'];
type FiltreCatégorie = 'territoires' | 'périmètresMinistériels' | 'chantiers';

export type FiltresUtilisateursActifs = {
  territoires: Array<Territoire['code']>,
  périmètresMinistériels: Array<PérimètreMinistériel['id']>,
  chantiers: Array<Chantier['id']>,
};

export default interface FiltresUtilisateursStore {
  filtresActifs: FiltresUtilisateursActifs,
  actions: {
    modifierÉtatDuFiltre: (filtres: Filtre[], catégorieDeFiltre: FiltreCatégorie) => void,
    réinitialiser: () => void,
    désactiverFiltre: (filtre: Filtre, catégorieDeFiltre: FiltreCatégorie) => void,
  }
}
