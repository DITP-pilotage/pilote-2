import { FunctionComponent } from 'react';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import ÉlémentStyled from '@/components/PageUtilisateur/Élément/Élément.styled';

const AucunÉlément: FunctionComponent<{}> = () => {
  return (
    <ÉlémentStyled>
      <IcônesMultiplesEtTexte
        icônesId={['dsfr::close::line']}
        largeurDesIcônes='2rem'
      >
        <span className='libellé'>
          Aucun droit
        </span>
      </IcônesMultiplesEtTexte>
    </ÉlémentStyled>
  );
};

export default AucunÉlément;
