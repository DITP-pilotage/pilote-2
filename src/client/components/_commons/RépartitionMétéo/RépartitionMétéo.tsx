import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import RépartitionMétéoProps from '@/components/_commons/RépartitionMétéo/RépartitionMétéo.interface';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';

const météosÀAfficher: Partial<Météo>[] = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'];

export default function RépartitionMétéo({ météos }: RépartitionMétéoProps) {
  return (
    <RépartitionMétéoStyled className='fr-grid-row fr-grid-row--gutters'>
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
}
