/* eslint-disable react-hooks/rules-of-hooks */
import { create } from 'zustand';
import LargeurDÉcranStore, { PointDeRuptureÉcran, pointsDeRuptureÉcran } from './useLargeurDÉcranStore.interface';

const useLargeurDÉcranStore = create<LargeurDÉcranStore>((set) => ({
  pointDeRupture: null,
  actions: {
    modifierLargeurDÉcran: pointDeRupture => set({ pointDeRupture: pointDeRupture }),
  },
}));

export const actionsLargeurDÉcranStore = () => useLargeurDÉcranStore(étatActuel => étatActuel.actions);
export const largeurDÉcranStore = () => useLargeurDÉcranStore(étatActuel => étatActuel.pointDeRupture);

export const estLargeurDÉcranActuelleMoinsLargeQue = (pointDeRupture: PointDeRuptureÉcran) => {
  return useLargeurDÉcranStore(étatActuel => {
    const pointDeRuptureActuel = étatActuel.pointDeRupture;
    const rang = pointDeRupture ? pointsDeRuptureÉcran.indexOf(pointDeRupture) : null;
    const rangActuel = pointDeRuptureActuel ? pointsDeRuptureÉcran.indexOf(pointDeRuptureActuel) : null;
    if (rangActuel === null || rang === null) {
      return false;
    }
    return rangActuel <= rang;
  });
};
