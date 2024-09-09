export const typesVueStatuts = ['BROUILLON_ET_PUBLIE', 'PUBLIE', 'BROUILLON'] as const;
export type TypeVueStatuts = typeof typesVueStatuts[number];

export default interface optionChoixVueStatuts {
  valeur: TypeVueStatuts
  libellé: string
}
