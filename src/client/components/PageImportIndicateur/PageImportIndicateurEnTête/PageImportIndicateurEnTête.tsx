import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import PageImportIndicateurEnTêteStyled from './PageImportIndicateurEnTête.styled';
import PageImportIndicateurEnTêteProps from './PageImportIndicateurEnTête.interface';

export default function PageImportIndicateurEnTête({ chantierInformation }: PageImportIndicateurEnTêteProps) {
  return (
    <PageImportIndicateurEnTêteStyled>
      <div className='fr-container fr-py-4w'>
        <FilAriane
          chemin={[{ nom: 'Chantier', lien: `/chantier/${chantierInformation.id}` }]}
          libelléPageCourante='Indicateurs'
        />
        <Titre
          baliseHtml='h1'
          className='fr-h2 fr-mt-2w fr-mb-1w'
        >
          { chantierInformation.nom }
        </Titre>
      </div>
    </PageImportIndicateurEnTêteStyled>
  );
}
