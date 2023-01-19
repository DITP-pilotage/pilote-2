import { useMemo } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import { pictosMétéos } from '@/components/_commons/PictoMétéo/PictoMétéo';
import RépartitonMétéoProps from '@/components/PageChantiers/RépartitionMétéo/RépartitionMétéoProps.interface';
import compterLesMétéosÀPartirDeChantiers from '@/client/utils/chantier/météo/compterLesMétéosÀPartirDeChantiers';
import { périmètreGéographique as périmètreGéographiqueStore } from '@/stores/useNiveauDeMailleStore/useNiveauDeMailleStore';
import RépartitionMétéoÉlément from './RépartitionMétéoÉlément/RépartitionMétéoÉlément';
import RépartitionMétéoStyled from './RépartitionMétéo.styled';

const météosÀAfficher = ['ORAGE', 'NUAGE', 'COUVERT', 'SOLEIL'] as const;

export default function RépartitionMétéo({ chantiers }: RépartitonMétéoProps) {

  const compteursMétéos = useMemo(() => compterLesMétéosÀPartirDeChantiers(chantiers), [chantiers]);
  const périmètreGéographique = périmètreGéographiqueStore();

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
                nombreDeChantiers={`${compteursMétéos[périmètreGéographique.maille][périmètreGéographique.codeInsee][météo]}`}
              />
            </li>
          ))
        }
      </ul>
    </RépartitionMétéoStyled>
  );
}
