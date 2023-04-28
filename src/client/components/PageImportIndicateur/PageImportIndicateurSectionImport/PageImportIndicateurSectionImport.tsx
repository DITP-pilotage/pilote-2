import Titre from '@/components/_commons/Titre/Titre';
import Indicateurs from '@/components/PageChantier/Indicateurs/Indicateurs';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';
import { PageImportIndicateurSectionImportProps } from './PageImportIndicateurSectionImport.interface';

export default function PageImportIndicateurSectionImport({
  détailsIndicateurs,
  indicateurs,
}: PageImportIndicateurSectionImportProps) {
  return (
    <PageImportIndicateurSectionImportStyled>
      <div className='fr-container fr-py-3w'>
        <Titre baliseHtml='h2'>
          Indicateurs
        </Titre>
        <Titre baliseHtml='h3'>
          Indicateurs d&apos;impact
        </Titre>
        {
          détailsIndicateurs !== null ? (
            <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
              <div className="fr-col-12">
                <Indicateurs
                  détailsIndicateurs={détailsIndicateurs}
                  estDisponibleALImport
                  indicateurs={indicateurs}
                />
              </div>
            </div>
          ) :
            <p>
              Chargement des indicateurs...
            </p>
        }
      </div>
    </PageImportIndicateurSectionImportStyled>
  );
}
