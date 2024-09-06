import { FunctionComponent } from 'react';
import { libellésMétéos, MétéoSaisissable } from '@/server/domain/météo/Météo.interface';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';

export type RépartitionMétéos = Record<MétéoSaisissable, number>;

interface RépartitionMétéoProps {
  météos: RépartitionMétéos;
}

const météosÀAfficher = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;

const RépartitionMétéo : FunctionComponent<RépartitionMétéoProps> = ({ météos }) => {
  return (
    <RépartitionMétéoStyled className='fr-grid-row fr-mx-n3v'>
      {
        météosÀAfficher.map(météo => (
          <li
            className='fr-col-3'
            key={libellésMétéos[météo]}
          >
            <RépartitionMétéoÉlément
              météo={météo}
              nombreDeChantiers={`${météos[météo]}`}
            />
          </li>
        ))
      }
    </RépartitionMétéoStyled>
  );
};

export default RépartitionMétéo;
