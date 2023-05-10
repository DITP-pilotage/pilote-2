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
  mailleAssociéeAuTerritoireSélectionné: 'nationale',
  territoiresComparés: [],
  aÉtéInitialisé: false,
  territoiresAccessiblesEnLecture: [],
  actions: {
    modifierMailleSélectionnée: maille => set({
      mailleSélectionnée: maille,
      territoireSélectionné: territoireFrance,
      mailleAssociéeAuTerritoireSélectionné: 'nationale',
      territoiresComparés: [],
    }),

    territoireEstUneRégion: territoireCode => {
      return territoireCode.includes('REG-');
    },

    territoireEstUnDépartement: territoireCode => {
      return territoireCode.includes('DEPT-');
    },

    territoireEstNational: territoireCode => {
      return territoireCode === 'NAT-FR';
    },

    extraireCodeInsee: territoireCode => {
      return territoireCode.split('-')[1];
    },

    générerCodeTerritoire: (maille, codeInsee) => {
      if (maille === 'départementale')
        return 'DEPT-' + codeInsee;
      if (maille === 'régionale')
        return 'REG-' + codeInsee;
      if (maille === 'nationale')
        return 'NAT-' + codeInsee;
      return '';
    },

    initialiserValeursParDéfaut: territoiresHabilitationLecture => {
      if (!get().aÉtéInitialisé) {
        set({
          territoiresAccessiblesEnLecture: [...territoiresHabilitationLecture.REG.territoires, ...territoiresHabilitationLecture.NAT.territoires, ...territoiresHabilitationLecture.DEPT.territoires],
          aÉtéInitialisé: true,
        });

        const { territoireEstUneRégion, territoireEstUnDépartement, territoireEstNational, extraireCodeInsee } = get().actions;
        const territoiresAccessiblesEnLecture = get().territoiresAccessiblesEnLecture;

        const nationalAccessibleEnLecture = territoiresAccessiblesEnLecture.filter(territoireCode => territoireEstNational(territoireCode));
        const régionsAccessiblesEnLecture = territoiresAccessiblesEnLecture.filter(territoireCode => territoireEstUneRégion(territoireCode));
        const départementsAccessiblesEnLecture = territoiresAccessiblesEnLecture.filter(territoireCode => territoireEstUnDépartement(territoireCode));

        if (nationalAccessibleEnLecture.length > 0) {
          set({ mailleSélectionnée: 'départementale' });
        } else if (régionsAccessiblesEnLecture.length > 0) {
          set({ mailleSélectionnée: 'régionale' });
          get().actions.modifierTerritoireSélectionné(extraireCodeInsee(régionsAccessiblesEnLecture[0]));
        } else if (départementsAccessiblesEnLecture.length > 0) {
          set({ mailleSélectionnée: 'départementale' });
          get().actions.modifierTerritoireSélectionné(extraireCodeInsee(départementsAccessiblesEnLecture[0]));
        }
      }
    },

    modifierTerritoireSélectionné: codeInsee => {
      if (codeInsee === 'FR') {
        set({ territoireSélectionné: territoireFrance, mailleAssociéeAuTerritoireSélectionné: 'nationale', territoiresComparés: [] });
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
            territoiresComparés: [{ ...territoire, nom: `${territoire.codeInsee} – ${territoire.nom}` }],
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
      if (get().mailleSélectionnée === MAILLE_DÉPARTEMENTALE) {
        set({ territoiresComparés: [
          ...get().territoiresComparés,
          { ...territoire, nom: `${territoire.codeInsee} – ${territoire.nom}` },
        ] });
        return;
      }
      set({ territoiresComparés: [...get().territoiresComparés, territoire] });
    },

    désélectionnerUnTerritoireÀComparer: territoire => {
      const nouveauxTerritoiresComparés = get().territoiresComparés.filter(t => t.codeInsee !== territoire.codeInsee);
      set({ territoiresComparés: nouveauxTerritoiresComparés });
    },

    modifierTerritoiresComparés: codeInsee => {
      const mailleSélectionnée = get().mailleSélectionnée;
      const territoire = get().actions.récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);

      if (territoire) {
        if (get().territoiresComparés.some(territoireSéléctionné => territoireSéléctionné.codeInsee === codeInsee)) {
          get().actions.désélectionnerUnTerritoireÀComparer(territoire);
          return;
        }
        get().actions.séléctionnerTerritoireÀComparer(territoire);
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
export const territoiresAccessiblesEnLectureStore = () => useTerritoiresStore(étatActuel => étatActuel.territoiresAccessiblesEnLecture);
