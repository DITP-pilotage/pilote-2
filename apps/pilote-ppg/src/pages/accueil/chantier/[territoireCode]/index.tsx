import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { TRI_CHANTIERS_PAR_DEFAUT } from "@/server/chantiers/app/contrats/TriChantiers";
import assert from "node:assert/strict";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import { Axe } from "@/shared/axe/Axe.interface";
import { Ministère } from "@/shared/ministere/Ministere.interface";
import { Alerte } from "@/shared/alerte/Alerte";
import { presenterEnAvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { Chantier } from "@/server/chantiers/domain/Chantier";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import { getContainer } from "@/server/dependances";
import { loadBootstrap } from "@/server/app/bootstrap/loadBootstrap";
import { loadAccueilSearchParams } from "@/client/searchParams/accueilSearchParams";
import { PageAccueil } from "@/components/PageAccueil/PageAccueil";
import { estEmailAutoriseAskAITerritoire } from "@/server/albert/emailsAutorisesAskAITerritoire";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { query } = context;
  const session = await auth(context);
  const searchParams = loadAccueilSearchParams(query);

  const page = searchParams.page;
  const pageSize = searchParams.pageSize;
  const jalonParDefaut = getAnneeDateDeBascule(
    new Date(),
    configuration().dateBasculeAffichageValeursAnneePrecedente,
  );
  const jalon = searchParams.jalon ?? jalonParDefaut;

  assert(
    query.territoireCode,
    "Le territoire code est obligatoire pour afficher la page d'accueil",
  );
  assert(session, "Vous devez être authentifié pour accéder a cette page");
  assert(session.habilitations, "La session ne dispose d'aucune habilitation");

  const territoireCode = query.territoireCode as string;

  const territoireDept = session.habilitations.lecture.territoires.find(
    (territoire) => territoire.startsWith("DEPT"),
  );
  const territoireReg = session.habilitations.lecture.territoires.find(
    (territoire) => territoire.startsWith("REG"),
  );

  const { maille: mailleTerritoireSelectionnee } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  const mailleQuery = searchParams.maille;

  const mailleGlobalTerritoireSelectionnee =
    mailleTerritoireSelectionnee === "NAT"
      ? mailleQuery
      : mailleTerritoireSelectionnee === "DEPT"
        ? "departementale"
        : "regionale";

  const mailleChantier =
    mailleTerritoireSelectionnee === "NAT"
      ? "nationale"
      : mailleGlobalTerritoireSelectionnee;

  if (
    (territoireCode === "NAT-FR" &&
      !session.habilitations.lecture.territoires.includes("NAT-FR")) ||
    !session.habilitations.lecture.territoires.includes(territoireCode)
  ) {
    return {
      redirect: {
        statusCode: 302,
        destination: `/accueil/chantier/${searchParams.maille === "departementale" ? (territoireDept ?? session.habilitations.lecture.territoires[0]) : (territoireReg ?? session.habilitations.lecture.territoires[0])}?maille=${searchParams.maille}`,
      },
    };
  }

  const [sorting = TRI_CHANTIERS_PAR_DEFAUT] = searchParams.sort;

  const filtres: FiltreQueryParams = {
    perimetres: searchParams.perimetres,
    axes: searchParams.axes,
    statut:
      searchParams.statut === "BROUILLON_ET_PUBLIE"
        ? ["BROUILLON", "PUBLIE"]
        : searchParams.statut
          ? [searchParams.statut]
          : ["PUBLIE"],
    meteos: searchParams.meteos,
    territorialisation: searchParams.territorialisation,
    estBarometre: searchParams.estBarometre,
    valeurDeLaRecherche: searchParams.q,
  };

  const filtresAlertes = {
    estEnAlerteTauxAvancementNonCalculé:
      searchParams.estEnAlerteTauxAvancementNonCalculé,
    estEnAlerteÉcart: searchParams.estEnAlerteÉcart,
    estEnAlerteBaisse: searchParams.estEnAlerteBaisse,
    estEnAlerteMétéoNonRenseignée: searchParams.estEnAlerteMétéoNonRenseignée,
    estEnAlerteAbscenceTauxAvancementDepartemental:
      searchParams.estEnAlerteAbscenceTauxAvancementDepartemental,
    estEnAlertePossedePropositionsValeurAvancement:
      searchParams.estEnAlertePossedePropositionsValeurAvancement,
  };

  const [
    [ministères, axes],
    doitAfficherModaleVideoAccueil,
    doitAfficherLaModaleInfolettre,
    bootstrap,
  ] = await Promise.all([
    session.habilitations.lecture.chantiers.length === 0
      ? Promise.resolve<[Ministère[], Axe[]]>([[], []])
      : Promise.all([
          getContainer("chantiers")
            .resolve("ministèreSQLRepository")
            .getListePourChantiers(session.habilitations.lecture.chantiers),
          getContainer("chantiers")
            .resolve("axeSQLRepository")
            .getListePourChantiers(session.habilitations.lecture.chantiers),
        ]),
    getContainer("gestionUtilisateur")
      .resolve("recupererEtatVisualisationVideoAccueilUseCase")
      .execute(session.user.id),
    getContainer("gestionUtilisateur")
      .resolve("recupererEtatModaleInscriptionUseCase")
      .execute(session.user.id),
    loadBootstrap(session),
  ]);

  const mapAxes = new Map<string, Axe>(axes.map((axe) => [axe.id, axe]));

  const chantiers = await getContainer("chantiers")
    .resolve("recupererChantiersAccessiblesEnLectureUseCaseV2")
    .run(
      session.habilitations,
      session.profil,
      territoireCode,
      mailleChantier || "departementale",
      ministères,
      mapAxes,
      filtres,
      sorting,
      jalon,
      jalonParDefaut,
    );
  const { filtresComptesCalculés } = Chantier.recupererStatistiqueListeChantier(
    chantiers,
    mailleChantier,
    territoireCode,
  );
  const chantierIdsSansFiltrageAlertes = chantiers.map(
    (chantier) => chantier.id,
  );

  const chantiersAvecAlertes =
    filtresAlertes.estEnAlerteÉcart ||
    filtresAlertes.estEnAlerteBaisse ||
    filtresAlertes.estEnAlerteTauxAvancementNonCalculé ||
    filtresAlertes.estEnAlerteMétéoNonRenseignée ||
    filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental ||
    filtresAlertes.estEnAlertePossedePropositionsValeurAvancement
      ? chantiers.filter((chantier) => {
          const chantierDonnéesTerritoires =
            chantier.mailles[mailleChantier][territoireCode];
          return (
            (filtresAlertes.estEnAlerteÉcart &&
              Alerte.estEnAlerteÉcart(
                chantierDonnéesTerritoires.ecart.jalonParDefaut,
              )) ||
            (filtresAlertes.estEnAlerteBaisse &&
              Alerte.estEnAlerteBaisse(chantierDonnéesTerritoires.tendance)) ||
            (filtresAlertes.estEnAlerteTauxAvancementNonCalculé &&
              Alerte.estEnAlerteTauxAvancementNonCalculé(
                chantierDonnéesTerritoires.avancement.jalonParDefaut,
                chantier.cibleAttendu,
              )) ||
            (filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental &&
              Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
                chantier.aUnTauxAvancementDepartemental,
                chantier.cibleAttendu,
              )) ||
            (filtresAlertes.estEnAlerteMétéoNonRenseignée &&
              Alerte.estEnAlerteMétéoNonRenseignée(
                chantierDonnéesTerritoires.météo,
              )) ||
            (filtresAlertes.estEnAlertePossedePropositionsValeurAvancement &&
              Alerte.estEnAlertePossedePropositionsValeurAvancement(
                chantierDonnéesTerritoires.aUnePropositionsValeurAvancement,
              ))
          );
        })
      : chantiers;

  const chantierIdsAvecAlertes = chantiersAvecAlertes.map(
    (chantier) => chantier.id,
  );

  const [avancementsAgrégés, { agregat: donneesTerritoiresAgregees }] =
    await Promise.all([
      getContainer("chantiers")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .run(chantierIdsAvecAlertes, mailleQuery, session.habilitations, jalon)
        .then(presenterEnAvancementsStatistiquesAccueilContrat),
      getContainer("chantiers")
        .resolve("agregerAvancementsChantiersUseCase")
        .run(chantierIdsAvecAlertes, jalon),
    ]);

  const moyenneTerritoire =
    donneesTerritoiresAgregees[mailleChantier].territoires[territoireCode]
      .repartition.avancements.annuel.moyenne;

  const nombreTotalChantiersAvecAlertes = chantiersAvecAlertes.length;
  const chantierIds = chantierIdsAvecAlertes;

  const chantiersPaginesAvecAlertes = chantiersAvecAlertes.splice(
    page * pageSize,
    pageSize,
  );

  const emailAutoriseAskAITerritoire = estEmailAutoriseAskAITerritoire(
    session.user.email,
  );

  return {
    props: {
      ...bootstrap,
      chantiers: chantiersPaginesAvecAlertes.map((chantier) => {
        // @ts-expect-error
        delete chantier.mailles;
        return chantier;
      }),
      chantierIds,
      chantierIdsSansFiltrageAlertes,
      nombreTotalChantiersAvecAlertes,
      ministères,
      axes,
      territoireCode,
      jalon,
      jalonParDefaut,
      mailleSelectionnee: mailleGlobalTerritoireSelectionnee,
      mailleQuery,
      filtresComptesCalculés,
      avancementsAgrégés,
      aDejaVuVideoAccueil: doitAfficherModaleVideoAccueil,
      doitAfficherLaModaleInfolettre,
      moyenneTerritoire,
      emailAutoriseAskAITerritoire,
    },
  };
};

const ChantierLayout = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  return <PageAccueil {...props} />;
};

export default ChantierLayout;
