import { PageImportIndicateurProps } from './PageImportIndicateur.interface';
import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';
import PageImportIndicateurSectionImport from './PageImportIndicateurSectionImport/PageImportIndicateurSectionImport';

export default function PageImportIndicateur({ chantierInformation, indicateurs, détailsIndicateurs }: PageImportIndicateurProps) {  
  return (
    <main>
      <PageImportIndicateurEnTête chantierInformation={chantierInformation} />
      <PageImportIndicateurSectionImport
        détailsIndicateurs={détailsIndicateurs}
        indicateurs={indicateurs}
      />
    </main>
  );
}
