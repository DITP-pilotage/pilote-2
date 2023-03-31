import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next/types';
import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import { Scope } from '@/server/domain/identité/Habilitation';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  ministères: Ministère[]
  axes: Axe[],
  ppg: Ppg[]
}

export default function NextPageAccueil({ chantiers, ministères, axes, ppg }: NextPageAccueilProps) {
  return (
    <PageChantiers
      axes={axes}
      chantiers={chantiers}
      ministères={ministères}
      ppg={ppg}
    />
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req as any, context.res as any, authOptions as any);
  if (!session) {
    return { props: {} };
  }

  let scope: Scope = 'lecture';

  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe(session.habilitation, scope);

  let axes: Axe[] = [];
  let ppgs: Ppg[] = [];
  let ministères: Ministère[] = [];

  if (chantiers.length > 0) {
    const ministèreRepository = dependencies.getMinistèreRepository();
    ministères = await ministèreRepository.getListePourChantiers(chantiers);

    const axeRepository = dependencies.getAxeRepository();
    axes = await axeRepository.getListePourChantiers(chantiers);

    const ppgRepository = dependencies.getPpgRepository();
    ppgs = await ppgRepository.getListePourChantiers(chantiers);
  }

  return {
    props: {
      chantiers,
      ministères,
      axes: axes,
      ppg: ppgs,
    },
  };
}
