import { FunctionComponent } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import ExplicationEtapeIndicateurStyled from './ExplicationEtapeIndicateur.styled';

interface ExplicationEtapeIndicateurProps {
  numéro: number,
  titre: string,
  texte: string,
  etapeCourante: number,
}

const ExplicationEtapeIndicateur: FunctionComponent<ExplicationEtapeIndicateurProps> = ({ titre, texte, numéro, etapeCourante }) => {
  return (
    <ExplicationEtapeIndicateurStyled className={`fr-p-3w${etapeCourante === numéro ? ' etape-courante' : '' }`}>
      <span className='explication-indicateur__numero fr-mb-1w fr-text--bold fr-h4'>
        {numéro}
      </span>
      <Titre
        baliseHtml='h3'
        className='fr-h6 fr-mb-1w'
      >
        {titre}
      </Titre>
      <p className='fr-mb-0 fr-text--sm'>
        {texte}
      </p>
    </ExplicationEtapeIndicateurStyled>
  );
};

export default ExplicationEtapeIndicateur;
