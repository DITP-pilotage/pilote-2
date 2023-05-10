import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next/types';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import PageAccueil from '@/components/PageAccueil/PageAccueil';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  projetsStructurants: ProjetStructurant[]
  ministères: Ministère[]
  axes: Axe[],
  ppgs: Ppg[],
  habilitations: Habilitations
}

export default function NextPageAccueil({ chantiers, projetsStructurants, ministères, axes, ppgs, habilitations }: NextPageAccueilProps) {
  return (
    <PageAccueil
      axes={axes}
      chantiers={chantiers}
      habilitations={habilitations}
      ministères={ministères}
      ppgs={ppgs}
      projetsStructurants={projetsStructurants}
    />
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return { props: {} };
  }
  
  const habilitation =  new Habilitation(session.habilitations);
  const chantierRepository = dependencies.getChantierRepository();
  const chantiers = await chantierRepository.getListe(habilitation);
  const projetsStructurants: ProjetStructurant[] = [
    { 
      id: 'PS-001',
      nom: 'Projet structurant 1',
      tauxAvancement: 95,
      dateTauxAvancement: new Date().toISOString(),
      territoireNom: 'Yvelines',
      maille: 'départementale',
      ministèresIds: ['MIN-001'],
      météo: 'SOLEIL',
    },
    {
      id: 'PS-002',
      nom: 'Projet structurant 2',
      tauxAvancement: 55,
      dateTauxAvancement: new Date().toISOString(),
      territoireNom: 'Yvelines',
      maille: 'départementale',
      ministèresIds: ['MIN-001'],
      météo: 'COUVERT',
    },
  ];

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
      projetsStructurants,
      ministères,
      axes,
      ppgs,
      habilitations: session.habilitations,
    },
  };
}
