import { ReactNode } from 'react';

export default interface IcônesMultiplesEtTexteProps {
  icônesId: string[],
  largeurDesIcônes?: `${number}rem`,
  texteAlternatifPourIcônes?: string,
  children: ReactNode,
}
