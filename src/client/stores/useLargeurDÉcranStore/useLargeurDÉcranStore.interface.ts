export const pointsDeRuptureÉcran = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type PointDeRuptureÉcran = typeof pointsDeRuptureÉcran[number];

export default interface LargeurDÉcranStore {
  pointDeRupture: PointDeRuptureÉcran | null,
  actions: {
    modifierLargeurDÉcran: (largeurDÉcran: PointDeRuptureÉcran | null) => void,
  },
}
