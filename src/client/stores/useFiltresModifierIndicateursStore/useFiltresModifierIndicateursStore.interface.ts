import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';

type Filtre = Chantier['id'] | PérimètreMinistériel['id'] | Territoire['code'];
type FiltreCatégorie = 'chantiers' | 'périmètresMinistériels' | 'territoires';

export type FiltresModifierIndicateursActifs = {
  chantiers: Array<Chantier['id']>,
  chantiersAssociésAuxPérimètres: Array<Chantier['id']>,
  périmètresMinistériels: Array<PérimètreMinistériel['id']>,
  territoires: Array<Territoire['code']>,
};

export default interface FiltresModifierIndicateursStore {
  filtresActifs: FiltresModifierIndicateursActifs,
  actions: {
    modifierÉtatDuFiltre: (filtres: Filtre[], catégorieDeFiltre: FiltreCatégorie, chantiersSynthétisés?: ChantierSynthétisé[]) => void,
    réinitialiser: () => void,
    désactiverFiltre: (filtre: Filtre, catégorieDeFiltre: FiltreCatégorie) => void,
  }
}
