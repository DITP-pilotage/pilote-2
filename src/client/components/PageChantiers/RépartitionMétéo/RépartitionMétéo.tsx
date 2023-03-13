import RépartitionMétéoProps from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéo.interface';
import météosConstantes from '@/client/constants/météos';
import { Météo } from '@/server/domain/météo/Météo.interface';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';

const météosÀAfficher: Partial<Météo>[] = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'];

export default function RépartitionMétéo({ météos }: RépartitionMétéoProps) {
  return (
    <RépartitionMétéoStyled>
      <ul className='fr-grid-row fr-grid-row--gutters'>
        {
          météosÀAfficher.map(météo => (
            <li
              className='fr-col-12 fr-col-sm-6 fr-col-xl-3'
              key={météosConstantes[météo]}
            >
              <RépartitionMétéoÉlément
                météo={météo}
                nombreDeChantiers={`${météos[météo]}`}
              />
            </li>
          ))
        }
      </ul>
    </RépartitionMétéoStyled>
  );
}
