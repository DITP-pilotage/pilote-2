export type TypeDeRéforme = 'chantier' | 'projetStructurant';

export default interface SélecteurTypeDeRéformeProps {
  typeDeRéformeSélectionné: TypeDeRéforme
  modifierTypeDeRéformeSélectionné: (state: TypeDeRéforme) => void
}
