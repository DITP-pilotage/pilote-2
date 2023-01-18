import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { pictosMétéos } from '@/components/_commons/PictoMétéo/PictoMétéo';
import RépartitonMétéoProps, { CompteurMétéos } from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéoProps.interface';
import {
  agrégerDonnéesTerritoires,
  réduireDonnéesTerritoires,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';

const météosÀAfficher = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;

export default function RépartitionMétéo({ chantiers }: RépartitonMétéoProps) {

  const compteursMétéos = useMemo(() => (
    réduireDonnéesTerritoires<CompteurMétéos>(
      agrégerDonnéesTerritoires(chantiers.map(chantier => chantier.mailles)),
      (territoiresAgrégés) => {
        const météos = territoiresAgrégés.météo;
        return {
          'NON_RENSEIGNEE': météos.filter(météo => météo === 'NON_RENSEIGNEE').length,
          'ORAGE': météos.filter(météo => météo === 'ORAGE').length,
          'COUVERT': météos.filter(météo => météo === 'COUVERT').length,
          'NUAGE': météos.filter(météo => météo === 'NUAGE').length,
          'SOLEIL': météos.filter(météo => météo === 'SOLEIL').length,
          'NON_NECESSAIRE': météos.filter(météo => météo === 'NON_NECESSAIRE').length,
        };
      },
      {
        'NON_RENSEIGNEE': 0,
        'ORAGE': 0,
        'COUVERT': 0,
        'NUAGE': 0,
        'SOLEIL': 0,
        'NON_NECESSAIRE': 0,
      },
    )
  ), [chantiers]);

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
              className='fr-col-3'
              key={pictosMétéos[météo].nom}
            >
              <RépartitionMétéoÉlément
                météo={pictosMétéos[météo]}
                nombreDeChantiers={`${compteursMétéos.nationale.FR[météo]}`}
              />
            </li>
          ))
        }
      </ul>
    </RépartitionMétéoStyled>
  );
}
