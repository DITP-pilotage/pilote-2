/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import TerritoiresStore from './useTerritoiresStore.interface';

const MAILLE_DÉPARTEMENTALE = 'départementale';

const useTerritoiresStore = create<TerritoiresStore>((set, get) => ({
  départements: [],
  régions: [],
  mailleSélectionnée: MAILLE_DÉPARTEMENTALE,
  territoireSélectionné: null,
  territoires: [],
  territoiresAccessiblesEnLecture: [],
  territoiresComparés: [],
  maillesAccessiblesEnLecture: [],
  actions: {

    initialiserLesTerritoires: territoires => {
      if (get().territoires.length > 0) {
        return;
      }

      const territoiresAccessiblesEnLecture = territoires.filter(territoire => territoire.accèsLecture === true);

      set({
        territoires,
        départements: territoires.filter(territoire => territoire.maille === 'départementale'),
        régions: territoires.filter(territoire => territoire.maille === 'régionale'),
        territoiresAccessiblesEnLecture: territoiresAccessiblesEnLecture,
        maillesAccessiblesEnLecture: [...new Set(territoiresAccessiblesEnLecture.map(territoire => territoire.maille))],
      });
    },

    initialiserLeTerritoireSélectionnéParDéfaut: () => {
      if (get().territoireSélectionné) {
        return;
      }

      const territoireNational = get().territoiresAccessiblesEnLecture.find(territoire => territoire.maille === 'nationale');
      const premierTerritoireRégional = get().territoiresAccessiblesEnLecture.find(territoire => territoire.maille === 'régionale');
      const premierTerritoireDépartemental = get().territoiresAccessiblesEnLecture.find(territoire => territoire.maille === 'départementale');

      const territoireSélectionné = territoireNational ?? premierTerritoireRégional ?? premierTerritoireDépartemental;

      if (territoireSélectionné) {
        set({ mailleSélectionnée: territoireSélectionné.maille === 'régionale' ? 'régionale' : 'départementale' });
        get().actions.modifierTerritoireSélectionné(territoireSélectionné.code);
      }
    },

    modifierMailleSélectionnée: maille => {
      const territoire = get().territoiresAccessiblesEnLecture.find(t => t.maille === 'nationale') ?? get().territoiresAccessiblesEnLecture.find(t => t.maille === maille)!;
      get().actions.modifierTerritoireSélectionné(territoire.code);

      set({ mailleSélectionnée: maille });
    },

    modifierTerritoireSélectionné: territoireCode => {
      const territoire = get().territoiresAccessiblesEnLecture.find(t => t.code === territoireCode)!;

      set({
        territoireSélectionné: territoire,
        territoiresComparés: [territoire],
      });
    },

    récupérerDétailsSurUnTerritoireAvecCodeInsee: codeInsee => {
      if (codeInsee === 'FR') {
        return get().actions.récupérerDétailsSurUnTerritoire('NAT-FR');
      }
      
      if (get().mailleSélectionnée === 'régionale') {
        return get().actions.récupérerDétailsSurUnTerritoire(`REG-${codeInsee}`);
      }

      return get().actions.récupérerDétailsSurUnTerritoire(`DEPT-${codeInsee}`);
    },

    récupérerDétailsSurUnTerritoire: territoireCode => {
      return get().territoires.find(t => t.code === territoireCode)!;
    },

    modifierTerritoiresComparés: territoireCode => {
      const territoiresComparésInitiaux = get().territoiresComparés.some(t => t.code === 'NAT-FR') ? [] : get().territoiresComparés;
      const territoireExisteDansTerritoiresComparés = territoiresComparésInitiaux.some(t => t.code === territoireCode);
      const récupérerDétailsDuTerritoire = get().actions.récupérerDétailsSurUnTerritoire(territoireCode);

      const territoiresComparés = territoireExisteDansTerritoiresComparés ? territoiresComparésInitiaux.filter(t => t.code !== territoireCode) : [...territoiresComparésInitiaux, récupérerDétailsDuTerritoire];
      set({ territoiresComparés });
    },

    récupérerCodesInseeDépartementsAssociésÀLaRégion: (codeInsee: CodeInsee, maille: MailleInterne) => {
      if (maille === 'départementale') return [];
      return get().départements.filter(département =>
        département.codeParent === (get().régions.find(région => région.codeInsee === codeInsee))?.code,
      ).map(département => département.codeInsee);
    },

    récupérerCodesDépartementsAssociésÀLaRégion: (code: string) => {
      return get().départements.filter(département =>
        département.codeParent === (get().régions.find(région => région.code === code))?.code,
      ).map(département => département.code);
    },
    
    récupérerTousLesCodesTerritoires: () => {
      return [...get().départements.map(d => d.code), ...get().régions.map(r => r.code), 'NAT-FR'];
    },
  },
}));

export const actionsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.actions);
export const départementsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.départements);
export const régionsTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.régions);
export const territoiresTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.territoires);
export const mailleSélectionnéeTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.mailleSélectionnée);
export const territoireSélectionnéTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.territoireSélectionné);
export const territoiresComparésTerritoiresStore = () => useTerritoiresStore(étatActuel => étatActuel.territoiresComparés);
export const territoiresAccessiblesEnLectureStore = () => useTerritoiresStore(étatActuel => étatActuel.territoiresAccessiblesEnLecture);
export const maillesAccessiblesEnLectureStore = () => useTerritoiresStore(étatActuel => étatActuel.maillesAccessiblesEnLecture);

