import { FunctionComponent } from 'react';
import { Etape } from '@/server/app/contrats/EtapeContrat';
import DescriptionEtapesStyled from './DescriptionEtapes.styled';

export const DescriptionEtapes: FunctionComponent<{
  etapes: Etape[]
}> = ({ etapes }) => {
  return (
    <DescriptionEtapesStyled>
      <ol className='c-stepper'>
        {
          etapes.map((etape, index) => {
            return (
              <li
                className='c-stepper__item fr-text'
                data-step={index + 1}
                key={index}
              >
                <p className='fr-text fr-text--lg fr-text--bold fr-mb-0'>
                  {etape.titre}
                </p>
                <p className='fr-text'>
                  {etape.texte}
                </p>
              </li>
            );
          })
        }
      </ol>
    </DescriptionEtapesStyled>
  );
};
