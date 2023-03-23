import { ReactNode } from 'react';

export default interface ModaleStyledProps {
  children: ReactNode,
  titre: string,
  sousTitre: string,
  libelléBouton: string,
  idHtml: string,
  setEstAffichée: (valeur: boolean) => void,
}
