import Titre from '@/components/_commons/Titre/Titre';
import { ExplicationEtapeIndicateurProps } from './ExplicationEtapeIndicateur.interface';
import ExplicationEtapeIndicateurStyled from './ExplicationEtapeIndicateur.styled';

export default function ExplicationEtapeIndicateur({ titre, texte, numéro }: ExplicationEtapeIndicateurProps) {
  return (
    <ExplicationEtapeIndicateurStyled className="fr-p-3w">
      <span className='explication-indicateur__numero fr-mb-1w fr-text--bold fr-h4'>
        {numéro}
      </span>
      <Titre
        baliseHtml="h3"
        className='fr-h6 fr-mb-1w'
      >
        {titre}
      </Titre>
      <p className='fr-mb-0 fr-text--sm'>
        {texte}
      </p>
    </ExplicationEtapeIndicateurStyled>
  );
}
