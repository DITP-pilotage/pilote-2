import { ChangeEventHandler } from 'react';

export default interface BarreDeRechercheProps {
  onChange: ChangeEventHandler<HTMLInputElement>,
  valeur: string
}