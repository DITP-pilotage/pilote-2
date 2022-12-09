import { ChangeEventHandler } from 'react';

export default interface BarreDeRechercheProps {
  changementDeLaRechercheCallback: ChangeEventHandler<HTMLInputElement>,
  valeur?: string
}
