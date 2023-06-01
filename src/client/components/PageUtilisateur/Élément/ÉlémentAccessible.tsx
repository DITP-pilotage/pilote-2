import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import ÉlémentStyled from '@/components/PageUtilisateur/Élément/Élément.styled';

export default function ÉlémentAccessible({ libellé }: { libellé : string }) {
  return (
    <ÉlémentStyled>
      <IcônesMultiplesEtTexte
        icônesId={['dsfr::check-line']}
        largeurDesIcônes='2rem'
      >
        <span className='libellé'>
          {libellé}
        </span>
      </IcônesMultiplesEtTexte>
    </ÉlémentStyled>
  );
}
