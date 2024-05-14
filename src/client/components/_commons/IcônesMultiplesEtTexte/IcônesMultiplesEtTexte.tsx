import Icône from '@/components/_commons/Icône/Icône';
import IcônesMultiplesEtTexteStyled from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte.styled';
import IcônesMultiplesEtTexteProps from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte.interface';

export default function IcônesMultiplesEtTexte({ icônesId, largeurDesIcônes = '3.5rem', texteAlternatifPourIcônes, children }: IcônesMultiplesEtTexteProps) {
  return (
    <IcônesMultiplesEtTexteStyled largeurDesIcônes={largeurDesIcônes}>
      <span className='icônes fr-pr-1w'>
        {
          icônesId.map(icôneId => (
            <Icône
              id={icôneId}
              key={icôneId}
            />
          ))
        }
        {
          !!texteAlternatifPourIcônes &&
          <span className='fr-sr-only'>
            { texteAlternatifPourIcônes }
          </span>
        }
      </span>
      <div className='fr-text--sm fr-mb-0'>
        { children }
      </div>
    </IcônesMultiplesEtTexteStyled>
  );
}
