import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import FiltresSélectionnésCatégorieStyled from './FiltresSélectionnésCatégorie.styled';

interface FiltresSélectionnésCatégorieProps {
  titre: string;
  filtres: string[];
}

const FiltresSélectionnésCatégorie: FunctionComponent<FiltresSélectionnésCatégorieProps> = ({ titre, filtres }) => {
  const estVide = filtres.length === 0;

  return (
    <FiltresSélectionnésCatégorieStyled>
      <Titre
        baliseHtml='h3'
        className='fr-text--md fr-mb-1v'
      >
        {`${titre} (${estVide ? 'Tous' : filtres.length})`}
      </Titre>
      { !estVide &&
        <ul>
          {filtres.map(filtre => (
            <li
              className='fr-text--sm fr-mb-1v texte-gris'
              key={filtre}
            >
              <span
                aria-hidden='true'
                className='fr-icon-check-line'
              />
              {filtre}
            </li>
          ))}
        </ul>}
    </FiltresSélectionnésCatégorieStyled>
  );
};

export default FiltresSélectionnésCatégorie;
