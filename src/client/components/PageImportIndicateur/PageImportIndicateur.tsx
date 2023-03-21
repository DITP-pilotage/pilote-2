import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';
import PageImportIndicateurSectionImport from './PageImportIndicateurSectionImport/PageImportIndicateurSectionImport';

interface PageImportIndicateurProps {
  chantierInformation: ChantierInformation
}

export default function PageImportIndicateur({ chantierInformation }: PageImportIndicateurProps) {
  return (
    <main>
      <PageImportIndicateurEnTête chantierInformation={chantierInformation} />
      <PageImportIndicateurSectionImport chantierId={chantierInformation.id} />
    </main>
  );
}
