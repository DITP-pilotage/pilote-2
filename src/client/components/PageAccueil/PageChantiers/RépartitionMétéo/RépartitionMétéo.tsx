import { libellésMétéos, Météo, Météo } from '@/server/domain/météo/Météo.interface';
import RépartitionMétéoProps from '@/components/PageAccueil/PageChantiers/RépartitionMétéo/RépartitionMétéo.interface';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';
import météosConstantes from '@/client/constants/météos';
import RépartitionMétéoProps from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéo.interface';

const météosÀAfficher: Partial<Météo>[] = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'];

export default function RépartitionMétéo({ météos }: RépartitionMétéoProps) {
  return (
    <RépartitionMétéoStyled>
      <ul className='fr-grid-row fr-grid-row--gutters'>
        {
          météosÀAfficher.map(météo => (
            <li
              className='fr-col-12 fr-col-sm-6 fr-col-xl-3'
              key={libellésMétéos[météo]}
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
