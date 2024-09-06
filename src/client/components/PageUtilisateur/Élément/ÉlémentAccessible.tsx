import { FunctionComponent } from 'react';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import ÉlémentStyled from '@/components/PageUtilisateur/Élément/Élément.styled';

const ÉlémentAccessible: FunctionComponent<{ libellé : string }> = ({ libellé }) => {
  return (
    <ÉlémentStyled>
      <IcônesMultiplesEtTexte
        icônesId={['dsfr::check::line']}
        largeurDesIcônes='2rem'
      >
        {libellé}
      </IcônesMultiplesEtTexte>
    </ÉlémentStyled>
  );
};

export default ÉlémentAccessible;
