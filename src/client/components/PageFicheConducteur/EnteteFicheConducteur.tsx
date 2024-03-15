import { FunctionComponent, PropsWithChildren } from 'react';
import Encart from '@/components/_commons/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';

export const EnteteFicheConducteur: FunctionComponent<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <Encart>
      <div className='flex justify-between'>
        <Titre
          baliseHtml='h2'
          className='fr-h6 fr-mb-0 fr-text-title--blue-france'
        >
          {children}
        </Titre>
        <div className='flex align-center'>
          <BoutonImpression />
        </div>
      </div>
    </Encart>
  );
};
