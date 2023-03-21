import PageImportIndicateurEnTête from './PageImportIndicateurEnTête/PageImportIndicateurEnTête';

interface PageImportIndicateurProps {
  chantierId: string,
  indicateurId: string
}

export default function PageImportIndicateur({ chantierId, indicateurId }: PageImportIndicateurProps) {
  return (
    <div>
      <PageImportIndicateurEnTête
        chantierId={chantierId}
        indicateurId={indicateurId}
      />
    </div>
  );
}
