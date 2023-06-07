import { GetServerSidePropsContext } from 'next';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import RécupérerChantiersUseCase from '@/server/usecase/chantier/RécupérerChantiersUseCase';
import RécupérerPérimètresMinistérielsUseCase from '@/server/usecase/périmètreMinistériel/RécupérerPérimètresMinistérielsUseCase';
import MultiSelect from '@/components/_commons/MultiSelect/MultiSelect';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';

interface NextPageCréerUtilisateurProps {
  chantiers: Record<Chantier['id'], {
    nom: Chantier['nom']
    estTerritorialisé: Chantier['estTerritorialisé']
    périmètreMinistérielId: Chantier['périmètreIds'][number] | null
  }>
  périmètresMinistériels: PérimètreMinistériel[]
}

export default function NextPageCréerUtilisateur({ chantiers, périmètresMinistériels } : NextPageCréerUtilisateurProps) {
  return (
    <div className='fr-container'>
      <div className='fr-grid-row fr-m-5w'>
        <div className='fr-col'>
          <MultiSelectTerritoire />
        </div>
      </div>
    </div>
  );
  // return (
  //   <NextPageCréerUtilisateur
  //     chantiers={chantiers}
  //     périmètresMinistériels={périmètresMinistériels}
  //   />
  // );
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };

  const session = await getServerAuthSession({ req, res });

  if (!session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = new Habilitation(session.habilitations);

  if (!habilitations.peutCréerUnUtilisateur()) {
    return redirigerVersPageAccueil;
  }

  const chantiersExistants = await new RécupérerChantiersUseCase().run();

  let chantiers: NextPageCréerUtilisateurProps['chantiers'] = {};

  chantiersExistants.forEach(chantier => {
    chantiers[chantier.id] = {
      nom: chantier.nom,
      estTerritorialisé: chantier.estTerritorialisé,
      périmètreMinistérielId: chantier.périmètreIds?.[0] || null,
    };
  });

  const périmètresMinistériels =  await new RécupérerPérimètresMinistérielsUseCase().run(chantiersExistants.map(c => c.périmètreIds?.[0] ?? ''));

  return {
    props: {
      périmètresMinistériels,
      chantiers,
    },
  };
}
