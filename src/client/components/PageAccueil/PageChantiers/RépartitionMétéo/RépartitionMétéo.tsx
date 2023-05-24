import RépartitionMétéoÉlément from '@/components/_commons/RépartitionMétéo/RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import Titre from '@/components/_commons/Titre/Titre';
import { Météo, libellésMétéos } from '@/server/domain/météo/Météo.interface';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';
import RépartitionMétéoProps from './RépartitionMétéo.interface';

const météosÀAfficher: Partial<Météo>[] = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'];

export default function RépartitionMétéo({ météos }: RépartitionMétéoProps) {
  return (
    <RépartitionMétéoStyled>
      <Titre
        baliseHtml="h2"
        className="fr-text--lg"
      >
        Répartition des météos renseignées
      </Titre>
      <ul className='fr-grid-row fr-grid-row--gutters'>
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
      </ul>
    </RépartitionMétéoStyled>
  );
}
