import IndicateurDescriptionStyled from './IndicateurDescription.styled';

export default function IndicateurDescription() {
  return (
    <IndicateurDescriptionStyled className='fr-px-7w fr-py-2w'>
      <p
        className='fr-text--md sous-titre'
      >
        Description de l'indicateur
      </p>
      <p className='fr-text--xs'>
        Ceci est la description de l’indicateur et des données associées. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas tempor ultricies dictum. Suspendisse sit amet eros vel sem vulputate porta. Cras sed auctor justo, mollis consectetur urna.
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Mode de calcul
      </p>
      <p className='fr-text--xs'>
        Ceci est le mode de calcul de l'indicateur  et des données associées . Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas tempor ultricies dictum. Suspendisse sit amet eros vel sem vulputate porta. Cras sed auctor justo, mollis consectetur urna.
      </p>
      <p className='fr-text--md sous-titre fr-mt-2w'>
        Source
      </p>
      <p className='fr-text--xs'>
        Ceci est la source de l’indicateur et des données associées. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas tempor ultricies dictum. Suspendisse sit amet eros vel sem vulputate porta. Cras sed auctor justo, mollis consectetur urna.
      </p>
    </IndicateurDescriptionStyled>
  );
}
