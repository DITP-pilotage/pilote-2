import {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import PageAdminUtilisateurs from "@/components/PageAdminUtilisateurs/PageAdminUtilisateurs";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { getContainer } from "@/server/dependances";
import { Profil } from "@/server/gestion-utilisateur/domain/Profil";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import {
  presenterEnUtilisateurListeGestionContrat,
  UtilisateurListeGestionContrat,
} from "@/server/app/contrats/UtilisateurListeGestionContrat";
import { TerritoireAvecNombreUtilisateurs } from "@/server/gestion-utilisateur/domain/Territoire";
import { loadAdminUtilisateursSearchParams } from "@/client/searchParams/adminUtilisateursSearchParams";

type UtilisateurProps = {
  listeChantiers: ChantierSynthétisé[];
  listePerimetresMinisteriel: PerimetreMinisteriel[];
  listePerimetresMinisterielSelectionnable: PerimetreMinisteriel[];
  listeProfils: Profil[];
  listeTerritoiresSelectionnable: TerritoireAvecNombreUtilisateurs[];
  listeUtilisateurs: UtilisateurListeGestionContrat[];
  nombreUtilisateur: number;
};

export const getServerSideProps: GetServerSideProps<UtilisateurProps> = async (
  context: GetServerSidePropsContext,
) => {
  const { query } = context;
  const session = await auth(context);
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
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

  const listeChantierIdLecture =
    habilitations.récupérerListeChantiersIdsAccessiblesEnLecture();

  const listeChantiers = await getContainer("gestionUtilisateur")
    .resolve("recupererChantiersSynthetisesUseCase")
    .run({
      listeChantierIdLecture,
    });

  const searchParams = loadAdminUtilisateursSearchParams(query);

  const filtreChantiers = searchParams.chantiers;

  const filtresChantiersSupplémentaires = listeChantiers.filter((chantier) =>
    chantier.périmètreIds.some((périmètreId) =>
      filtreChantiers.includes(périmètreId),
    ),
  );

  const {
    pageIndex,
    pageSize,
    sort: sorting,
    q: valeurDeLaRecherche,
  } = searchParams;

  const tousLesPerimetresAccessiblesIds = [
    ...new Set([
      ...listeChantiers.flatMap((chantier) => chantier.périmètreIds),
      ...session.habilitations.gestionUtilisateur.périmètres,
    ]),
  ];

  const [
    tousLesPerimetres,
    listeProfils,
    { utilisateurs, totalCount },
    territoiresListe,
    listeTerritoiresSelectionnable,
  ] = await Promise.all([
    getContainer("gestionUtilisateur")
      .resolve("recupererPerimetresMinisterielsUseCase")
      .run({ perimetresMinisterielsIds: tousLesPerimetresAccessiblesIds }),
    getContainer("gestionUtilisateur")
      .resolve("recupererListeProfilUseCase")
      .run(),
    getContainer("gestionUtilisateur")
      .resolve("recupererUtilisateursPaginesUseCase")
      .run({
        sorting: Array.isArray(sorting) ? sorting : [sorting],
        valeurDeLaRecherche,
        filtres: {
          territoires: searchParams.territoires,
          perimetresMinisteriels: searchParams.perimetresMinisteriels,
          chantiers: filtreChantiers,
          chantiersAssociésAuxPérimètres:
            filtresChantiersSupplémentaires?.map((chantier) => chantier.id) ??
            [],
          profils: searchParams.profils,
          typeCompte: searchParams.typeCompte,
        },
        pagination: { pageIndex, pageSize },
        viewerProfil: session.profil,
        viewerHabilitations: session.habilitations,
      }),
    getContainer("gestionUtilisateur")
      .resolve("recupererTousLesTerritoiresUseCase")
      .run(),
    getContainer("gestionUtilisateur")
      .resolve("recupererTerritoiresAvecNombreUtilisateursUseCase")
      .run({
        territoireCodes: session.habilitations.gestionUtilisateur.territoires,
      }),
  ]);

  const listePerimetresMinisteriel =
    searchParams.perimetresMinisteriels.length > 0
      ? tousLesPerimetres.filter((perimetre) =>
          searchParams.perimetresMinisteriels.includes(perimetre.id),
        )
      : tousLesPerimetres;

  const listePerimetresMinisterielSelectionnable = tousLesPerimetres;

  return {
    props: {
      listeChantiers,
      listePerimetresMinisteriel,
      listeProfils,
      listePerimetresMinisterielSelectionnable,
      listeTerritoiresSelectionnable,
      listeUtilisateurs: utilisateurs.map((utilisateur) =>
        presenterEnUtilisateurListeGestionContrat(
          utilisateur,
          territoiresListe,
        ),
      ),
      nombreUtilisateur: totalCount,
    },
  };
};

const NextPageUtilisateurs: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({
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
        <title>Gestion des comptes - PILOTE</title>
      </Head>
      <PageAdminUtilisateurs
        listeChantiers={listeChantiers}
        listePerimetresMinisteriel={listePerimetresMinisteriel}
        listePerimetresMinisterielSelectionnable={
          listePerimetresMinisterielSelectionnable
        }
        listeProfils={listeProfils}
        listeTerritoiresSelectionnable={listeTerritoiresSelectionnable}
        listeUtilisateurs={listeUtilisateurs}
        nombreUtilisateur={nombreUtilisateur}
      />
    </>
  );
};

export default NextPageUtilisateurs;
