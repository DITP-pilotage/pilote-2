import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';

interface NextPageImportIndicateurProps {
  chantierId: string
}

export async function getServerSideProps({ params }: { params: { id: Chantier['id'] } }) {
  return {
    props: {
      chantierId: params.id,
    },
  };
}

export default function NextPageImportIndicateur({ chantierId }: NextPageImportIndicateurProps) {
  return (
    <PageImportIndicateur chantierId={chantierId} />
  );
}
