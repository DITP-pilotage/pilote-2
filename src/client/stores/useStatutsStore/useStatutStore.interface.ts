import { TypeStatut } from '@/server/domain/chantier/Chantier.interface';

export const typesVueStatuts = ['BROUILLON_ET_PUBLIE', 'PUBLIE', 'BROUILLON'] as const;
export type TypeVueStatuts = typeof typesVueStatuts[number];

export const CorrespondanceVueStatuts: Record<TypeVueStatuts, TypeStatut[]> = {
  'BROUILLON_ET_PUBLIE': ['BROUILLON', 'PUBLIE'],
  'PUBLIE': ['PUBLIE'],
  'BROUILLON': ['BROUILLON'],
};

export default interface StatutsStore {
  vueStatutsSélectionnée: TypeVueStatuts,
  statutsSélectionnés: TypeStatut[]
  actions: {
    récupérerLaVueSélectionnée: () => TypeVueStatuts,
    recupérerLesStatutsSélectionnés: () => TypeStatut[],
    modifierLaVueSélectionnée: (vueStatuts: TypeVueStatuts) => void,
    modifierLesStatutsSélectionnés: (statuts: TypeStatut[]) => void,
    modifierLaVueSélectionnéeEtLesStatutsAssociés: (vueStatuts: TypeVueStatuts) => void
  },
}
