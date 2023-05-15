import { getServerSession } from 'next-auth/next';
import { GetServerSidePropsContext } from 'next/types';
import Head from 'next/head';
import { dependencies } from '@/server/infrastructure/Dependencies';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import { authOptions } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageAccueil from '@/components/PageAccueil/PageAccueil';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

interface NextPageAccueilProps {
  chantiers: Chantier[]
  projetsStructurants: ProjetStructurant[]
  ministères: Ministère[]
  axes: Axe[],
  ppgs: Ppg[],
}

export default function NextPageAccueil({ chantiers, projetsStructurants, ministères, axes, ppgs }: NextPageAccueilProps) {
  return (
    <>
      <Head>
        <title>
          PILOTE - Piloter l’action publique par les résultats
        </title>
      </Head>
      <PageAccueil
        axes={axes}
        chantiers={chantiers}
        ministères={ministères}
        ppgs={ppgs}
        projetsStructurants={projetsStructurants}
      />
    </>
  );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.habilitations)
    return { props: {} };
  
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
      codeInsee: '78',
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
      codeInsee: '78',
      maille: 'départementale',
      ministèresIds: ['MIN-001'],
      météo: 'COUVERT',
    },
    {
      id: 'PS-003',
      nom: 'Projet structurant 3',
      tauxAvancement: 10,
      dateTauxAvancement: new Date().toISOString(),
      territoireNom: 'Île-de-France',
      codeInsee: '11',
      maille: 'régionale',
      ministèresIds: ['MIN-001'],
      météo: 'COUVERT',
    },
    {
      id: 'PS-004',
      nom: 'Projet structurant 4',
      tauxAvancement: 100,
      dateTauxAvancement: new Date().toISOString(),
      territoireNom: 'Bretagne',
      codeInsee: '53',
      maille: 'régionale',
      ministèresIds: ['MIN-001'],
      météo: 'ORAGE',
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
    },
  };
}
