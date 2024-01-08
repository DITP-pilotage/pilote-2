import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
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
        <BoutonSousLigné
          classNameSupplémentaires='fr-mt-1w'
          onClick={déplierLeContenu}
          type='button'
        >
          Voir plus
        </BoutonSousLigné>
      }
      {
        !!afficherVoirMoins && 
        <BoutonSousLigné
          classNameSupplémentaires='fr-mt-1w'
          onClick={replierLeContenu}
          type='button'
        >
          Voir moins
        </BoutonSousLigné>
      }
    </>
  );
}
