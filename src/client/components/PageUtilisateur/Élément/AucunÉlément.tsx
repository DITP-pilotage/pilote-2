import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import ÉlémentStyled from '@/components/PageUtilisateur/Élément/Élément.styled';

export default function AucunÉlément() {
  return (
    <ÉlémentStyled>
      <IcônesMultiplesEtTexte
        icônesId={['dsfr::close-line']}
        largeurDesIcônes='2rem'
      >
        <span className='libellé'>
          Aucun droit
        </span>
      </IcônesMultiplesEtTexte>
    </ÉlémentStyled>
  );
}
