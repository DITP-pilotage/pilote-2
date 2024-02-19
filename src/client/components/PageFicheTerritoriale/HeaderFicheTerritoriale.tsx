import { FunctionComponent } from 'react';
import HeaderFicheTerritorialeStyled from '@/components/PageFicheTerritoriale/HeaderFicheTerritoriale.styled';

const HeaderFicheTerritoriale: FunctionComponent<{}> = () => {
  return (
    <HeaderFicheTerritorialeStyled>
      <header
        className='flex fr-px-4w fr-mb-6w'
        role='banner'
      >
        <p className='fr-logo'>
          Gouvernement
        </p>
        <div className='fr-pt-1w fr-ml-5w'>
          <p className='fr-text--xl fr-text--bold fr-mb-0'>
            PILOTE
          </p>
          <p className='fr-text--sm fr-mb-0'>
            Piloter l’action publique par les résultats
          </p>
        </div>
      </header>
    </HeaderFicheTerritorialeStyled>
  );
};

export default HeaderFicheTerritoriale;
