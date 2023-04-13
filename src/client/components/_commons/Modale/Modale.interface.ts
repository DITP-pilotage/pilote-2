import { ReactNode } from 'react';

export default interface ModaleProps {
  children: ReactNode,
  titre: string,
  sousTitre: string,
  libelléBouton: string,
  idHtml: string,
  ouvertureCallback?: () => void,
  fermetureCallback?: () => void
}
