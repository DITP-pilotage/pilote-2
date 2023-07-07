import { ReactNode } from 'react';

export default interface PageImprimableConteneurProps {
  children: ReactNode,
  entête?: ReactNode,
  piedDePage?: ReactNode,
  pageDeGarde?: ReactNode,
}
