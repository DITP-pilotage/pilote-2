import {
  PageImportIndicateurSectionRessource,
} from '@/components/PageImportIndicateur/PageImportIndicateurSectionRessource/PageImportIndicateurSectionRessource';
import { PageImportIndicateurProps } from './PageImportIndicateur.interface';
import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';
import PageImportIndicateurExplicationEtapeImport
  from './PageImportIndicateurExplicationEtapeImport/PageImportIndicateurExplicationEtapeImport';
import PageImportIndicateurSectionImport from './PageImportIndicateurSectionImport/PageImportIndicateurSectionImport';

export default function PageImportIndicateur({
  chantierInformations,
  indicateurs,
  rapport,
}: PageImportIndicateurProps) {
  return (
    <main>
      <PageImportIndicateurEnTête chantierInformations={chantierInformations} />
      <PageImportIndicateurExplicationEtapeImport />
      <PageImportIndicateurSectionImport
        indicateurs={indicateurs}
        rapport={rapport}
      />
      <PageImportIndicateurSectionRessource />
    </main>
  );
}

