import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { FunctionComponent } from "react";
import assert from "node:assert/strict";
import { PageChantier } from "@/components/PageChantier/PageChantier";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import { PiloteError } from "@/server/app/error-boundary/pilote-error";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import ChoixTerritoire from "@/components/PageChantier/ChoixTerritoire/ChoixTerritoire";
import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import { convertitEnPondération } from "@/client/utils/ponderation/ponderation";
import { IndicateurPondération } from "@/components/PageChantier/PageChantier.interface";
import { DétailsIndicateurTerritoire } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import { getContainer } from "@/server/dependances";
import { loadBootstrap } from "@/server/app/bootstrap/loadBootstrap";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { loadChantierDetailSearchParams } from "@/client/searchParams/chantierDetailSearchParams";

const redirigeLaPage = (destination: string) => ({
  redirect: {
    destination,
    permanent: true,
  },
});

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { query } = context;
  if (!query?.id) {
    return {
      notFound: true,
    };
  }

  const chantierId = query.id as string;
  const searchParams = loadChantierDetailSearchParams(query);
  const jalon =
    searchParams.jalon ??
    getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );
  const cartographieGaucheIndicateur = searchParams.carteIndG;
  const cartographieDroiteIndicateur = searchParams.carteIndD;

  const session = await auth(context);

  assert(
    query.territoireCode,
    "Le territoire code est obligatoire pour afficher la page d'accueil",
  );
  assert(session, "Vous devez être authentifié pour accéder a cette page");
  assert(session.habilitations, "La session ne dispose d'aucune habilitation");

  const territoireCode = query.territoireCode as string;
  const territoiresCompares = searchParams.territoiresCompares
    ? searchParams.territoiresCompares.split(",").filter(Boolean)
    : [];

  const { maille: mailleTerritoireSelectionnee } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  const mailleQuery = searchParams.maille;

  const mailleSelectionnee =
    mailleTerritoireSelectionnee === "NAT"
      ? mailleQuery
      : mailleTerritoireSelectionnee === "DEPT"
        ? "departementale"
        : "regionale";

  const territoireRepository = getContainer("chantiers").resolve(
    "territoireSQLRepository",
  );
  const territoireSélectionné =
    await territoireRepository.récupérer(territoireCode);

  try {
    const [
      chantier,
      indicateurs,
      syntheseDesResultats,
      syntheseDesResultatsBrouillon,
      commentaires,
      commentairesBrouillon,
      objectifs,
      objectifsBrouillon,
      décisionStratégique,
      brouillonDecisionStrategique,
      détailsIndicateurs,
      bootstrap,
    ] = await Promise.all([
      getContainer("chantiers")
        .resolve("recupererChantierUseCase")
        .run(chantierId, session.habilitations, session.profil, jalon),
      getContainer("chantiers")
        .resolve("indicateurSQLRepository")
        .récupérerParChantierId(chantierId),
      getContainer("importSyntheseDesResultats")
        .resolve("récupérerDerniereSyntheseDesResultatsQuery")
        .run(chantierId, territoireCode),
      getContainer("importSyntheseDesResultats")
        .resolve("recupererDernierBrouillonSyntheseDesResultatsQuery")
        .run(chantierId, territoireCode, session.user!.id),
      getContainer("commentaires")
        .resolve("recupererDernierCommentaireQuery")
        .run(chantierId, territoireCode),
      getContainer("commentaires")
        .resolve("recupererBrouillonCommentaireQuery")
        .run(chantierId, territoireCode, session.user!.id),
      getContainer("objectif")
        .resolve("recupererDerniersObjectifsQuery")
        .run(chantierId),
      getContainer("objectif")
        .resolve("recupererBrouillonObjectifQuery")
        .run(chantierId, session.user!.id),
      getContainer("decisionStrategique")
        .resolve("recupererDerniereDecisionStrategiqueQuery")
        .run(chantierId),
      getContainer("decisionStrategique")
        .resolve("recupererBrouillonDecisionStrategiqueQuery")
        .run(chantierId, session.user!.id),
      getContainer("chantiers")
        .resolve("recupererDetailsIndicateursUseCase")
        .run(
          chantierId,
          territoireCode,
          territoiresCompares,
          session.habilitations,
          jalon,
        ),
      loadBootstrap(session),
    ]);

    const chantierTerritoireSélectionné =
      chantier.mailles[territoireSélectionné.maille ?? "nationale"][
        territoireCode
      ];

    if (
      !chantierTerritoireSélectionné.estApplicable ||
      (!chantier.estTerritorialisé && mailleTerritoireSelectionnee !== "NAT")
    ) {
      const destination =
        mailleTerritoireSelectionnee === "DEPT"
          ? `/chantier/${chantierId}/${territoireSélectionné.codeParent}?maille=regionale`
          : `/chantier/${chantierId}/NAT-FR`;

      return redirigeLaPage(destination);
    }

    const indicateurPondérations =
      !détailsIndicateurs || !territoireSélectionné
        ? []
        : indicateurs
            .sort((indicateurA, indicateurB) =>
              comparerIndicateur(
                indicateurA,
                indicateurB,
                détailsIndicateurs[indicateurA.id][territoireCode]
                  ?.ponderation ?? null,
                détailsIndicateurs[indicateurB.id][territoireCode]
                  ?.ponderation ?? null,
              ),
            )
            .map((indicateur) => ({
              pondération: convertitEnPondération(
                détailsIndicateurs[indicateur.id][territoireCode]?.ponderation,
              ),
              nom: indicateur.nom,
              type: indicateur.type,
            }))
            .filter(
              (indPond): indPond is IndicateurPondération =>
                indPond.pondération !== null && indPond.pondération !== "0",
            );

    const listeResponsablesLocaux =
      chantierTerritoireSélectionné?.responsableLocal ?? [];
    const listeCoordinateursTerritorials =
      chantierTerritoireSélectionné?.coordinateurTerritorial ?? [];

    const listeIndicateurId = indicateurs.map((indicateur) => indicateur.id);

    const detailsIndicateursTerritoire: Record<
      string,
      DétailsIndicateurTerritoire
    > = await getContainer("chantiers")
      .resolve("listerDetailsIndicateurTerritoireUseCase")
      .run(
        listeIndicateurId,
        chantierId,
        session.habilitations,
        session.profil,
        jalon,
      );

    const datajobsExecution = await getContainer("chantiers")
      .resolve("datajobsExecutionQueries")
      .recupererEtatCourant();

    return {
      props: {
        ...bootstrap,
        indicateurs,
        chantierInformations: {
          id: chantier.id,
          nom: chantier.nom,
          estUnChantierDROM: chantier.périmètreIds.includes("PER-018"),
        },
        territoireCode,
        territoiresCompares,
        profil: session.profil,
        mailleSelectionnee,
        mailleQuery,
        syntheseDesResultats,
        syntheseDesResultatsBrouillon,
        commentaires,
        commentairesBrouillon,
        objectifs,
        objectifsBrouillon,
        décisionStratégique,
        brouillonDecisionStrategique,
        détailsIndicateurs,
        detailsIndicateursTerritoire,
        indicateurPondérations,
        chantier,
        listeResponsablesLocaux,
        listeCoordinateursTerritorials,
        jalon,
        cartographieDroiteIndicateur,
        cartographieGaucheIndicateur,
        datajobsExecution,
      },
    };
  } catch (error) {
    if (error instanceof PiloteError && error.status === 403) {
      return { notFound: true };
    } else {
      throw error;
    }
  }
};

const NextPageChantier: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  const { chantierInformations, territoireCode, profil } = props;

  const estUnProfilDROM = profil === ProfilEnum.DROM;
  const estTerritoireNational = territoireCode === "NAT-FR";

  return (
    <pageChantier.ServerSidePropsProvider value={props}>
      <Head>
        <title>
          {`Chantier ${chantierInformations.id.replace("CH-", "")} - ${chantierInformations.nom} - PILOTE`}
        </title>
      </Head>
      {estTerritoireNational &&
      estUnProfilDROM &&
      !chantierInformations.estUnChantierDROM ? (
        <ChoixTerritoire />
      ) : (
        <PageChantier key={territoireCode} />
      )}
    </pageChantier.ServerSidePropsProvider>
  );
};

export default NextPageChantier;
