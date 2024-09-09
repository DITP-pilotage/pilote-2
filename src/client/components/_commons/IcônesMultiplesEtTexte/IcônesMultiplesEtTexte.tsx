import { FunctionComponent, ReactNode } from 'react';
import Icône from '@/components/_commons/Icône/Icône';
import IcônesMultiplesEtTexteStyled from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte.styled';

interface IcônesMultiplesEtTexteProps {
  icônesId: string[],
  largeurDesIcônes?: `${number}rem`,
  texteAlternatifPourIcônes?: string,
  children: ReactNode,
}

const IcônesMultiplesEtTexte: FunctionComponent<IcônesMultiplesEtTexteProps> = ({ icônesId, largeurDesIcônes = '3.5rem', texteAlternatifPourIcônes, children }) => {
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
};

export default IcônesMultiplesEtTexte;
