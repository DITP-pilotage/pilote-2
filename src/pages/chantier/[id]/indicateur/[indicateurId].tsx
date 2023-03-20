import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface NextPageImportIndicateurProps {
  chantierId: string,
  indicateurId: string
}

export async function getServerSideProps({ params }: { params: { id: Chantier['id'], indicateurId: string } }) {
  return {
    props: {
      chantierId: params.id,
      indicateurId: params.indicateurId,
    },
  };
}

export default function NextPageImportIndicateur({ chantierId, indicateurId }: NextPageImportIndicateurProps) {
  return (
    <PageImportIndicateur
      chantierId={chantierId}
      indicateurId={indicateurId}
    />
  );
}
