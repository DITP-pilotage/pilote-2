import { FunctionComponent, MouseEventHandler } from 'react';
import Bouton from '@/components/_commons/Bouton/Bouton';

interface BoutonsAffichageProps {
  afficherVoirPlus: boolean
  afficherVoirMoins: boolean
  déplierLeContenu: MouseEventHandler<HTMLButtonElement>
  replierLeContenu: MouseEventHandler<HTMLButtonElement>
}

const BoutonsAffichage: FunctionComponent<BoutonsAffichageProps> = ({
  afficherVoirPlus,
  afficherVoirMoins,
  déplierLeContenu,
  replierLeContenu,
}) => {

  return (
    <>
      {
        afficherVoirPlus ? (
          <Bouton
            className='fr-btn--sm fr-btn--tertiary-no-outline fr-btn--icon-right fr-icon-arrow-down-s-line fr-p-0 fr-mt-1w'
            label='Voir plus'
            onClick={déplierLeContenu}
          />
        ) : null
      }
      {
        afficherVoirMoins ? (
          <Bouton
            className='fr-btn--sm fr-btn--tertiary-no-outline fr-btn--icon-right fr-icon-arrow-up-s-line fr-p-0 fr-mt-1w'
            label='Voir moins'
            onClick={replierLeContenu}
          />
        ) : null
      }
    </>
  );
};

export default BoutonsAffichage;
