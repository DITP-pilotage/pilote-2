import Bouton from '@/components/_commons/Bouton/Bouton';
import BoutonsAffichageProps from './BoutonsAffichage.interface';

export default function BoutonsAffichage({ 
  afficherVoirPlus, 
  afficherVoirMoins, 
  déplierLeContenu,
  replierLeContenu,
} : BoutonsAffichageProps) {

  return (
    <>
      {
        !!afficherVoirPlus && 
        <Bouton
          className='fr-btn--sm fr-btn--tertiary-no-outline fr-btn--icon-right fr-icon-arrow-down-s-line fr-p-0 fr-mt-1w'
          label='Voir plus'
          onClick={déplierLeContenu}
        />
      }
      {
        !!afficherVoirMoins && 
        <Bouton
          className='fr-btn--sm fr-btn--tertiary-no-outline fr-btn--icon-right fr-icon-arrow-up-s-line fr-p-0 fr-mt-1w'
          label='Voir moins'
          onClick={replierLeContenu}
        />
      }
    </>
  );
}
