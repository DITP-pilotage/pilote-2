/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import départements from '@/client/constants/départements.json';
import régions from '@/client/constants/régions.json';
import TerritoiresStore, { TerritoireGéographique } from './useTerritoiresStore.interface';

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
  mailleAssociéeAuTerritoireSélectionné: 'nationale',
  territoiresComparés: [territoireFrance],

  actions: {
    modifierMailleSélectionnée: maille => set({ 
      mailleSélectionnée: maille, 
      territoireSélectionné: territoireFrance, 
      mailleAssociéeAuTerritoireSélectionné: 'nationale', 
      territoiresComparés: [territoireFrance],
    }),

    modifierTerritoireSélectionné: codeInsee => {
      if (codeInsee === 'FR') {
        set({ territoireSélectionné: territoireFrance, mailleAssociéeAuTerritoireSélectionné: 'nationale', territoiresComparés: [territoireFrance] }); 
        return;
      } 

      const territoire = get().actions.récupérerDétailsSurUnTerritoire(codeInsee, get().mailleSélectionnée);

      if (territoire) {
        if (get().mailleSélectionnée === MAILLE_DÉPARTEMENTALE) {
          set({ 
            territoireSélectionné: {
              ...territoire,
              nom: `${territoire.codeInsee} – ${territoire.nom}`,
              territoireParent: get().actions.récupérerDétailsSurUnTerritoire(territoire.codeInseeParent!, 'régionale'),
            },
            mailleAssociéeAuTerritoireSélectionné: MAILLE_DÉPARTEMENTALE,
            territoiresComparés: [territoire],
          });
          return; 
        }
  
        set({ territoireSélectionné: territoire, mailleAssociéeAuTerritoireSélectionné: 'régionale', territoiresComparés: [territoire] });
      }
    },

    récupérerDétailsSurUnTerritoire: (codeInsee, maille) => {
      const territoires = maille === MAILLE_DÉPARTEMENTALE ? get().départements : get().régions;
      return territoires.find(t => t.codeInsee === codeInsee);
    },

    séléctionnerTerritoireÀComparer: territoire => {
      set({ territoiresComparés: [...get().territoiresComparés, territoire] });
    },

    désélectionnerUnTerritoireÀComparer: (territoire: TerritoireGéographique) => {
      const indexTerritoireÀSupprimer = get().territoiresComparés.findIndex(t => t.codeInsee === territoire.codeInsee);
      get().territoiresComparés.splice(indexTerritoireÀSupprimer, 1);
    },

    modifierTerritoiresComparés: codeInsee => {
      const mailleSélectionnée = get().mailleSélectionnée;
      const territoire = get().actions.récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);

      if (territoire) {
        if (get().territoiresComparés.some(territoireSéléctionné => territoireSéléctionné.codeInsee === codeInsee)) {
          get().actions.désélectionnerUnTerritoireÀComparer(territoire);
        } else get().actions.séléctionnerTerritoireÀComparer(territoire);
      }
    },
  },
}));

export const actionsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.actions);
export const départementsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.départements);
export const régionsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.régions);
export const mailleSélectionnéeTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.mailleSélectionnée);
export const mailleAssociéeAuTerritoireSélectionnéTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.mailleAssociéeAuTerritoireSélectionné);
export const territoireSélectionnéTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.territoireSélectionné);
export const territoiresComparésTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.territoiresComparés);
