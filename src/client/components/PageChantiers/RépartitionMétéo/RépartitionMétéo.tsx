import Titre from '@/components/_commons/Titre/Titre';
import { récupérerLibelléMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import RépartitionMétéoProps from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéoProps.interface';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';

const météosÀAfficher = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;

export default function RépartitionMétéo({ météos }: RépartitionMétéoProps) {
  return (
    <RépartitionMétéoStyled>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Répartition des météos de la sélection
      </Titre>
      <ul className='fr-grid-row fr-grid-row--gutters'>
        {
          météosÀAfficher.map(météo => (
            <li
              className='fr-col-12 fr-col-sm-6 fr-col-xl-3'
              key={récupérerLibelléMétéo(météo)}
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
