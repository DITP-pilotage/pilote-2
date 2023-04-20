import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';
import PageImportIndicateurSectionImport from './PageImportIndicateurSectionImport/PageImportIndicateurSectionImport';

interface PageImportIndicateurProps {
  chantierInformation: ChantierInformation
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs | null
}

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
