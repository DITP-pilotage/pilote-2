export type Réforme = 'chantier' | 'projetStructurant';

export default interface SélecteurRéformeStyled {
  réformeSélectionnée: Réforme
  modifierRéformeSélectionnée: (state: Réforme) => void
}
