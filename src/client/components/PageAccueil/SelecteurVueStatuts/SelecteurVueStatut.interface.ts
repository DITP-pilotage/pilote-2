export const typesVueStatuts = ['BROUILLON_ET_PUBLIE', 'PUBLIE', 'BROUILLON', 'ARCHIVE'] as const;
export type TypeVueStatuts = typeof typesVueStatuts[number];

export default interface optionChoixVueStatuts {
  valeur: TypeVueStatuts
  libellé: string
  position: 'droite' | 'gauche'
  estVisible: boolean
  icone?: string
}
