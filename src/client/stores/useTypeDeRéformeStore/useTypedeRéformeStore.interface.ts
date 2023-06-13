export type TypeDeRéforme = 'chantier' | 'projet structurant';

export default interface TypeDeRéformeStore {
  typeDeRéformeSélectionnée: TypeDeRéforme
  actions: {
    modifierTypeDeRéformeSélectionnée: () => void
  }
}
