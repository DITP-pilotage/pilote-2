import Titre from '@/components/_commons/Titre/Titre';
import FiltresSélectionnésCatégorieStyled from './FiltresSélectionnésCatégorie.styled';
import { FiltresSélectionnésCatégorieProps } from './FiltresSélectionnésCatégorie.interface';

export default function FiltresSélectionnésCatégorie({ titre, filtres }: FiltresSélectionnésCatégorieProps) {
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
                aria-hidden="true"
                className='fr-icon-check-line'
              />
              {filtre}
            </li>
          ))}
        </ul>}
    </FiltresSélectionnésCatégorieStyled>
  );
}
