import { FunctionComponent } from 'react';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import { ChantierInformations } from '@/client/components/PageImportIndicateur/ChantierInformation.interface';
import PageImportIndicateurEnTêteStyled from './PageImportIndicateurEnTête.styled';

interface PageImportIndicateurEnTêteProps {
  chantierInformations: ChantierInformations
}

const PageImportIndicateurEnTête: FunctionComponent<PageImportIndicateurEnTêteProps> = ({ chantierInformations }) => {
  return (
    <PageImportIndicateurEnTêteStyled>
      <div className='fr-container fr-py-4w'>
        <FilAriane
          chemin={[{ nom: 'Chantier', lien: `/chantier/${chantierInformations.id}` }]}
          libelléPageCourante='Indicateurs'
        />
        <Titre
          baliseHtml='h1'
          className='fr-h2 fr-mt-2w fr-mb-1w'
        >
          { chantierInformations.nom }
        </Titre>
      </div>
    </PageImportIndicateurEnTêteStyled>
  );
};

export default PageImportIndicateurEnTête;
