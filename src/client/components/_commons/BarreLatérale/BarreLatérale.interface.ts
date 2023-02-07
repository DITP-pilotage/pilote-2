import { ReactNode } from 'react';

export default interface BarreLatéraleProps {
  estOuvert: boolean,
  setEstOuvert: (state: boolean) => void,
  children: ReactNode,
}
