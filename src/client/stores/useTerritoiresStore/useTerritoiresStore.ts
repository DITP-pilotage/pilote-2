/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import TerritoiresStore from './useTerritoiresStore.interface';

const territoireFrance = {
  tracéSVG: '',
  nom: 'France',
  codeInsee: 'FR',
};

const MAILLE_DÉPARTEMENTALE = 'départementale';

const useTerritoiresStore = create<TerritoiresStore>((set, get) => ({
  départements,
  régions,
  mailleSélectionnée: MAILLE_DÉPARTEMENTALE,
  territoireSélectionné: territoireFrance,

  actions: {
    modifierMailleSélectionnée: maille => set({ mailleSélectionnée: maille, territoireSélectionné: territoireFrance }),

    modifierTerritoireSélectionné: codeInsee => {
      if (codeInsee === 'FR') {
        set({ territoireSélectionné: territoireFrance }); 
        return;
      } 

      const territoire = get().actions.récupérerDétailsSurUnTerritoire(codeInsee, get().mailleSélectionnée);

      if (territoire) {
        if (get().mailleSélectionnée === 'départementale') {
          set({ 
            territoireSélectionné: {
              ...territoire,
              nom: `${territoire.codeInsee} – ${territoire.nom}`,
              territoireParent: get().actions.récupérerDétailsSurUnTerritoire(territoire.codeInseeParent!, 'régionale'),
            }, 
          });
          return; 
        }
  
        set({ territoireSélectionné: territoire });
      }
    },

    récupérerDétailsSurUnTerritoire: (codeInsee, maille) => {
      const territoires = maille === MAILLE_DÉPARTEMENTALE ? get().départements : get().régions;
      return territoires.find(t => t.codeInsee === codeInsee);
    },
  },
}));

export const actionsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.actions);
export const départementsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.départements);
export const régionsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.régions);
export const mailleSélectionnéeTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.mailleSélectionnée);
export const territoireSélectionnéTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.territoireSélectionné);
