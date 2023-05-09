export type Entité = 'chantier' | 'projetStructurant';

export default interface SélecteurEntitéProps {
  entitéSélectionnée: Entité
  modifierEntitéSélectionnée: (state: Entité) => void
}
