import { ChangeEventHandler } from 'react';

export default interface TableauBarreDeRechercheProps {
  changementDeLaRechercheGénéraleCallback: ChangeEventHandler<HTMLInputElement>,
  valeur: string
}