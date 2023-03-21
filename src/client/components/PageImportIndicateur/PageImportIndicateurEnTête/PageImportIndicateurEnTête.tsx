import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import PageImportIndicateurEnTêteStyled from './PageImportIndicateurEnTête.styled';

interface PageImportIndicateurEnTêteProps {
  chantierId: string
}

// Le temps qu'il soit utilisé dans la prochaine MR
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PageImportIndicateurEnTête({ chantierId }: PageImportIndicateurEnTêteProps) {
  return (
    <PageImportIndicateurEnTêteStyled>
      <div className='fr-container fr-py-4w'>
        <FilAriane
          chemin={[{ nom: 'Chantier', lien: '#' }]}
          libelléPageCourante='Indicateurs'
        />
        <Titre baliseHtml='h1'>
          Offrir à chaque enfant une éducation culturelle et artistique
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
