import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { FunctionComponent } from 'react';
import { getServerAuthSession } from '@/server/infrastructure/api/auth/[...nextauth]';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageAdminUtilisateurs from '@/components/PageAdminUtilisateurs/PageAdminUtilisateurs';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { getContainer } from '@/server/dependances';
import { FiltreQueryParams } from '@/server/gestion-utilisateur/app/contrats/FiltreQueryParams';
import { Profil } from '@/server/gestion-utilisateur/domain/Profil';
import { PerimetreMinisteriel } from '@/server/gestion-utilisateur/domain/PerimetreMinisteriel';
import { ProfilCode } from '@/server/gestion-utilisateur/domain/Utilisateur.interface';
import {
  presenterEnUtilisateurListeGestionContrat,
  UtilisateurListeGestionContrat,
} from '@/server/app/contrats/UtilisateurListeGestionContrat';
import { TerritoireAvecNombreUtilisateurs } from '@/server/gestion-utilisateur/domain/Territoire';

type UtilisateurProps = {
  listeChantiers: ChantierSynthétisé[]
  listePerimetresMinisteriel: PerimetreMinisteriel[]
  listePerimetresMinisterielSelectionnable: PerimetreMinisteriel[]
  listeProfils: Profil[]
  listeTerritoiresSelectionnable: TerritoireAvecNombreUtilisateurs[]
  listeUtilisateurs: UtilisateurListeGestionContrat[]
  nombreUtilisateur: number
};

export const getServerSideProps: GetServerSideProps<UtilisateurProps> = async ({
  req,
  res,
  query,
}: GetServerSidePropsContext) => {
  const session = await getServerAuthSession({ req, res });
  const redirigerVersPageAccueil = {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };

  if (!session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = new Habilitation(session.habilitations);
  if (!habilitations.peutConsulterLaListeDesUtilisateurs()) {
    return redirigerVersPageAccueil;
  }

  const listeChantierIdLecture = habilitations.récupérerListeChantiersIdsAccessiblesEnLecture();

  const listeChantiers = await getContainer('gestionUtilisateur').resolve('recupererChantiersSynthetisesUseCase').run({
    listeChantierIdLecture,
  });

  const filtreChantiers = query.chantiers ? (query.chantiers as string).split(',').filter(Boolean) : [];

  const filtresChantiersSupplémentaires = listeChantiers.filter(chantier => chantier.périmètreIds.some(périmètreId => filtreChantiers.includes(périmètreId)));

  const filtres: FiltreQueryParams = {
    territoires: query.territoires ? (query.territoires as string).split(',').filter(Boolean) : [],
    perimetresMinisteriels: query.perimetresMinisteriels ? (query.perimetresMinisteriels as string).split(',').filter(Boolean) : [],
    chantiers: filtreChantiers,
    profils: query.profils ? (query.profils as string || '').split(',').filter(Boolean) as ProfilCode[] : [],
    typeCompte: query.typeCompte ? (query.typeCompte as string).split(',').filter(Boolean) as ('actif' | 'desactive')[] : ['actif', 'desactive'],
    chantiersAssociésAuxPérimètres: filtresChantiersSupplémentaires?.map(chantier => chantier.id) ?? [],
  };

  const pageIndex = Number.parseInt(query.pageIndex as string) || 1;
  const pageSize = Number.parseInt(query.pageSize as string) || 50;

  const sorting = query.sort ? JSON.parse(decodeURIComponent(query.sort as string)) as { id: string, desc: boolean }[] : [{
    id: 'Dernière modification',
    desc: true,
  }];

  const valeurDeLaRecherche = query.q as string || '';

  const listePerimetresMinisteriel = await getContainer('gestionUtilisateur').resolve('recupererPerimetresMinisterielsUseCase').run({
    perimetresMinisterielsIds: filtres.perimetresMinisteriels,
  });

  const listePerimetresMinisterielSelectionnable = await getContainer('gestionUtilisateur').resolve('recupererPerimetresMinisterielsUseCase').run({
    perimetresMinisterielsIds: [],
  });

  const listeProfils = await getContainer('gestionUtilisateur').resolve('recupererListeProfilUseCase').run();

  const [tousLesUtilisateurs, territoiresListe] = await Promise.all([
    getContainer('gestionUtilisateur').resolve('recupererListeUtilisateursUseCase').run({
      sorting: Array.isArray(sorting) ? sorting : [sorting],
      valeurDeLaRecherche: valeurDeLaRecherche,
    }),
    getContainer('gestionUtilisateur').resolve('recupererTousLesTerritoiresUseCase').run(),
  ]);

  const habilitation = new Habilitation(session.habilitations);

  const utilisateursFiltrés = getContainer('gestionUtilisateur').resolve('filtrerListeUtilisateursUseCase').run({
    utilisateurs: tousLesUtilisateurs,
    filtresActifs: filtres,
    profil: session.profil,
    habilitation,
  });

  const listeTerritoiresSelectionnable = await getContainer('gestionUtilisateur').resolve('recupererTerritoiresAvecNombreUtilisateursUseCase').run({ territoireCodes: session.habilitations.gestionUtilisateur.territoires });

  const nombreUtilisateur = utilisateursFiltrés.length;

  return {
    props: {
      listeChantiers,
      listePerimetresMinisteriel,
      listeProfils,
      listePerimetresMinisterielSelectionnable,
      listeTerritoiresSelectionnable,
      listeUtilisateurs: utilisateursFiltrés.splice((pageIndex - 1) * pageSize, pageSize).map(utilisateur => presenterEnUtilisateurListeGestionContrat(utilisateur, territoiresListe)),
      nombreUtilisateur,
    },
  };
};

const NextPageUtilisateurs: FunctionComponent<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  listeChantiers,
  listePerimetresMinisteriel,
  listePerimetresMinisterielSelectionnable,
  listeProfils,
  listeTerritoiresSelectionnable,
  listeUtilisateurs,
  nombreUtilisateur,
}) => {

  return (
    <>
      <Head>
        <title>
          Gestion des comptes - PILOTE
        </title>
      </Head>
      <PageAdminUtilisateurs
        listeChantiers={listeChantiers}
        listePerimetresMinisteriel={listePerimetresMinisteriel}
        listePerimetresMinisterielSelectionnable={listePerimetresMinisterielSelectionnable}
        listeProfils={listeProfils}
        listeTerritoiresSelectionnable={listeTerritoiresSelectionnable}
        listeUtilisateurs={listeUtilisateurs}
        nombreUtilisateur={nombreUtilisateur}
      />
    </>
  );
};

export default NextPageUtilisateurs;
