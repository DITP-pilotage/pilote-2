import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import EnTêteChantier from '@/components/_commons/EnTêteChantier/EnTêteChantier';
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
        <div className="fr-mt-2w">
          <EnTêteChantier
            axe={chantierInformation.axe}
            nom={chantierInformation.nom}
            ppg={chantierInformation.ppg}
          />
        </div>
      </div>
    </PageImportIndicateurEnTêteStyled>
  );
}
