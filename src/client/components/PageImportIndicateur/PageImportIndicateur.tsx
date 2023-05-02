import { PageImportIndicateurProps } from './PageImportIndicateur.interface';
import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';
import PageImportIndicateurExplicationEtapeImport from './PageImportIndicateurExplicationEtapeImport/PageImportIndicateurExplicationEtapeImport';
import PageImportIndicateurSectionImport from './PageImportIndicateurSectionImport/PageImportIndicateurSectionImport';

export default function PageImportIndicateur({ chantierInformation, indicateurs, détailsIndicateurs }: PageImportIndicateurProps) {  
  return (
    <main>
      <PageImportIndicateurEnTête chantierInformation={chantierInformation} />
      <PageImportIndicateurExplicationEtapeImport />
      <PageImportIndicateurSectionImport
        détailsIndicateurs={détailsIndicateurs}
        indicateurs={indicateurs}
      />
    </main>
  );
}
