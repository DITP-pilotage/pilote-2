export type TypeDeRéforme = 'chantier' | 'projet structurant';

export default interface TypeDeRéformeStore {
  typeDeRéformeSélectionné: TypeDeRéforme
  actions: {
    modifierTypeDeRéformeSélectionné: () => void
  }
}
