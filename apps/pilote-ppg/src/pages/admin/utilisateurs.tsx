import {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { FunctionComponent } from "react";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
import PageAdminUtilisateurs from "@/components/PageAdminUtilisateurs/PageAdminUtilisateurs";
import { ChantierSynthétisé } from "@/shared/chantier/Chantier.interface";
import { getContainer } from "@/server/dependances";
import { Profil } from "@/shared/profil/Profil.interface";
import { PerimetreMinisteriel } from "@/server/gestion-utilisateur/domain/PerimetreMinisteriel";
import type { UtilisateursPage } from "@/server/gestion-utilisateur/usecases/ListUtilisateursPageUseCase";
import { TerritoireAvecNombreUtilisateurs } from "@/server/gestion-utilisateur/domain/Territoire";
import { loadAdminUtilisateursSearchParams } from "@/client/searchParams/adminUtilisateursSearchParams";

type UtilisateurProps = {
  listeChantiers: ChantierSynthétisé[];
  listePerimetresMinisteriel: PerimetreMinisteriel[];
  listePerimetresMinisterielSelectionnable: PerimetreMinisteriel[];
  listeProfils: Profil[];
  listeTerritoiresSelectionnable: TerritoireAvecNombreUtilisateurs[];
  initialPage: UtilisateursPage;
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

  const { q, sort, page, pageSize, ...filters } =
    loadAdminUtilisateursSearchParams(query);

  const perimetresMinisteriels = getContainer("gestionUtilisateur").resolve(
    "recupererPerimetresMinisterielsUseCase",
  );
  const selectablePerimetreIds = [
    ...new Set([
      ...listeChantiers.flatMap((chantier) => chantier.périmètreIds),
      ...session.habilitations.gestionUtilisateur.périmètres,
    ]),
  ];

  const [
    listePerimetresMinisteriel,
    listePerimetresMinisterielSelectionnable,
    listeProfils,
    listeTerritoiresSelectionnable,
    initialPage,
  ] = await Promise.all([
    perimetresMinisteriels.run({ perimetresMinisterielsIds: null }),
    perimetresMinisteriels.run({
      perimetresMinisterielsIds:
        selectablePerimetreIds.length > 0 ? selectablePerimetreIds : null,
    }),
    getContainer("gestionUtilisateur")
      .resolve("recupererListeProfilUseCase")
      .run(),
    getContainer("gestionUtilisateur")
      .resolve("recupererTerritoiresAvecNombreUtilisateursUseCase")
      .run({
        territoireCodes: session.habilitations.gestionUtilisateur.territoires,
      }),
    getContainer("gestionUtilisateur")
      .resolve("listUtilisateursPageUseCase")
      .run({
        filters,
        search: q,
        sorting: sort,
        page,
        pageSize,
        profil: session.profil,
        habilitation: habilitations,
      }),
  ]);

  return {
    props: {
      listeChantiers,
      listePerimetresMinisteriel,
      listeProfils,
      listePerimetresMinisterielSelectionnable,
      listeTerritoiresSelectionnable,
      initialPage,
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
  initialPage,
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
        initialPage={initialPage}
        listeTerritoiresSelectionnable={listeTerritoiresSelectionnable}
      />
    </>
  );
};

export default NextPageUtilisateurs;
