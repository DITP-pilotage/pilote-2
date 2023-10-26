import Chantier from '@/server/domain/chantier/Chantier.interface';

type Filtre = Chantier['id'];
type FiltreCatégorie = 'chantiers';

export type FiltresModifierIndicateursActifs = {
  chantiers: Array<Chantier['id']>,
};

export default interface FiltresModifierIndicateursStore {
  filtresActifs: FiltresModifierIndicateursActifs,
  actions: {
    modifierÉtatDuFiltre: (filtres: Filtre[], catégorieDeFiltre: FiltreCatégorie) => void,
    réinitialiser: () => void,
    désactiverFiltre: (filtre: Filtre, catégorieDeFiltre: FiltreCatégorie) => void,
  }
}
