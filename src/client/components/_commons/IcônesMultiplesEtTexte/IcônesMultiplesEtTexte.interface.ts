import { ReactNode } from 'react';

export default interface IcônesMultiplesEtTexteProps {
  icônesId: string[],
  largeurDesIcônes?: `${number}rem`,
  children: ReactNode,
}
