import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import PageImportIndicateurEnTêteStyled from './PageImportIndicateurEnTête.styled';

interface PageImportIndicateurEnTêteProps {
  chantierId: string,
  indicateurId: string
}

export default function PageImportIndicateurEnTête({ chantierId, indicateurId }: PageImportIndicateurEnTêteProps) {
  // eslint-disable-next-line no-console
  console.log(chantierId);
  
  return (
    <PageImportIndicateurEnTêteStyled>
      <div className='fr-container fr-py-4w'>
        <FilAriane
          chemin={[{ nom: 'Chantier', lien: '#' }]}
          libelléPageCourante={`Indicateur ${indicateurId}`}
        />
        <Titre baliseHtml='h1'>
          Hello world
        </Titre>
        <div className='fr-text--xs fr-mb-0'>
          <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
            Axe
          </p>
          <p className='fr-mb-1w fr-text--xs chantier-données-valeur'>
            Chantier axe XXX
          </p>
          <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
            Politique Prioritaire du Gouvernement
          </p>
          <p className='fr-mb-0 fr-text--xs chantier-données-valeur'>
            Chantier ppg XXX
          </p>
        </div>
      </div>
    </PageImportIndicateurEnTêteStyled>
  );
}
