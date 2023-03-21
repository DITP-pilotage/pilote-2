import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';
import PageImportIndicateurSectionImport from './PageImportIndicateurSectionImport/PageImportIndicateurSectionImport';

interface PageImportIndicateurProps {
  chantierId: string
}

export default function PageImportIndicateur({ chantierId }: PageImportIndicateurProps) {
  return (
    <main>
      <PageImportIndicateurEnTête chantierId={chantierId} />
      <PageImportIndicateurSectionImport chantierId={chantierId} />
    </main>
  );
}
