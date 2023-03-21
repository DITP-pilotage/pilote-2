import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import PageImportIndicateurEnTêteStyled from './PageImportIndicateurEnTête.styled';

interface PageImportIndicateurEnTêteProps {
  chantierInformation: ChantierInformation
}

export default function PageImportIndicateurEnTête({ chantierInformation }: PageImportIndicateurEnTêteProps) {
  return (
    <PageImportIndicateurEnTêteStyled>
      <div className='fr-container fr-py-4w'>
        <FilAriane
          chemin={[{ nom: 'Chantier', lien: `/chantier/${chantierInformation.id}` }]}
          libelléPageCourante='Indicateurs'
        />
        <Titre baliseHtml='h1'>
          {chantierInformation.nom}
        </Titre>
        <div className='fr-text--xs fr-mb-0'>
          <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
            Axe
          </p>
          <p className='fr-mb-1w fr-text--xs chantier-données-valeur'>
            {chantierInformation.axe}
          </p>
          <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
            Politique Prioritaire du Gouvernement
          </p>
          <p className='fr-mb-0 fr-text--xs chantier-données-valeur'>
            {chantierInformation.ppg}
          </p>
        </div>
      </div>
    </PageImportIndicateurEnTêteStyled>
  );
}
