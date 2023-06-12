export type TypeDeRéforme = 'chantier' | 'projet structurant';

export default interface SélecteurTypeDeRéformeProps {
  typeDeRéformeSélectionné: TypeDeRéforme
  modifierTypeDeRéformeSélectionné: (state: TypeDeRéforme) => void
}
