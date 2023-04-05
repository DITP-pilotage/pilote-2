import { GetServerSidePropsResult } from 'next';
import { GetServerSidePropsContext } from 'next/types';
import PageImportIndicateur from '@/components/PageImportIndicateur/PageImportIndicateur';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { ChantierInformation } from '@/components/PageImportIndicateur/ChantierInformation.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';
import useImportIndicateur from '@/hooks/useImportIndicateur';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

interface NextPageImportIndicateurProps {
  chantierInformation: ChantierInformation
  indicateurs: Indicateur[]
}

type GetServerSideProps = GetServerSidePropsResult<NextPageImportIndicateurProps>;

export async function getServerSideProps({ params }: GetServerSidePropsContext<{ id: Chantier['id'] }>): Promise<GetServerSideProps> {
  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const chantierRepository = dependencies.getChantierRepository();
  const chantier: Chantier = await chantierRepository.getById(params.id);

  const indicateurRepository = dependencies.getIndicateurRepository();
  const indicateurs = await indicateurRepository.récupérerParChantierId(params.id);

  return {
    props: {
      indicateurs,
      chantierInformation: {
        id: chantier.id,
        nom: chantier.nom,
        axe: chantier.axe,
        ppg: chantier.ppg,
      },
    },
  };
}

export default function NextPageImportIndicateur({ chantierInformation, indicateurs }: NextPageImportIndicateurProps) {
  const { détailsIndicateurs } = useImportIndicateur(chantierInformation.id);

  return (
    <PageImportIndicateur
      chantierInformation={chantierInformation}
      détailsIndicateurs={détailsIndicateurs}
      indicateurs={indicateurs}
    />
  );
}
