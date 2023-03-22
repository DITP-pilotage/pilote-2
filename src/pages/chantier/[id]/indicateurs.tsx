import { GetServerSidePropsResult } from 'next';
import { GetServerSidePropsContext } from 'next/types';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import useImportIndicateur from '@/hooks/useImportIndicateur';

interface NextPageImportIndicateurProps {
  chantierInformation: ChantierInformation
}

type GetServerSideProps = Promise<GetServerSidePropsResult<NextPageImportIndicateurProps>>;

export async function getServerSideProps({ params }: GetServerSidePropsContext<{ id: Chantier['id'] }>): GetServerSideProps {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id);

  return {
    props: {
      chantierInformation: {
        id: chantier.id,
        nom: chantier.nom,
        axe: chantier.axe,
        ppg: chantier.ppg,
      },
    },
  };
}

export default function NextPageImportIndicateur({ chantierInformation }: NextPageImportIndicateurProps) {
  const { détailsIndicateurs } = useImportIndicateur(chantierInformation.id);

  console.log(détailsIndicateurs);
  return (
    <PageImportIndicateur chantierInformation={chantierInformation} />
  );
}
