import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import assert from "node:assert/strict";
import { useEnv } from "@/client/hooks/useEnv";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Axe from "@/server/domain/axe/Axe.interface";
import Alerte from "@/server/domain/alerte/Alerte";
import { presenterEnAvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { objectEntries } from "@/client/utils/objects/objects";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { Chantier } from "@/server/chantiers/domain/Chantier";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { presenterEnRépartitionsMétéosChantiersContrat } from "@/server/chantiers/app/contrats/RepartitionMeteoChantiersContrat";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration, configurationFeatureFlip } from "@/config";
import { getContainer } from "@/server/dependances";
import { loadAccueilSearchParams } from "@/client/searchParams/accueilSearchParams";
import { PageAccueil } from "@/components/PageAccueil/PageAccueil";
import { PageAccueilLegacy } from "@/components/PageAccueil/PageAccueilLegacy";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { query } = context;
  const session = await auth(context);
  const searchParams = loadAccueilSearchParams(query);

  const pageIndex = searchParams.pageIndex;
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

  const sorting = searchParams.sort;

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

  const [ministères, axes] =
    session.habilitations.lecture.chantiers.length === 0
      ? [[], []]
      : await Promise.all([
          getContainer("legacy")
            .resolve("ministèreRepository")
            .getListePourChantiers(session.habilitations.lecture.chantiers),
          getContainer("legacy")
            .resolve("axeRepository")
            .getListePourChantiers(session.habilitations.lecture.chantiers),
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

  const repartitionMeteosChantiers = await getContainer("legacy")
    .resolve("recupererRepartitionsMeteoChantiersUseCase")
    .run(
      territoireCode,
      filtres,
      axes,
      chantiersAvecAlertes.map((chantierAvecAlerte) => chantierAvecAlerte.id),
    )
    .then(presenterEnRépartitionsMétéosChantiersContrat);

  const avancementsAgrégés = await getContainer("chantiers")
    .resolve("récupérerStatistiquesAvancementChantiersUseCase")
    .run(
      chantiersAvecAlertes.map((chantier) => chantier.id),
      mailleQuery,
      session.habilitations,
      jalon,
    )
    .then(presenterEnAvancementsStatistiquesAccueilContrat);

  const { agregat: donneesTerritoiresAgregees } = await getContainer("legacy")
    .resolve("agregerAvancementsChantiersUseCase")
    .run(
      chantiersAvecAlertes.map((chantier) => chantier.id),
      jalon,
    );

  const moyenneTerritoire =
    donneesTerritoiresAgregees[mailleChantier].territoires[territoireCode]
      .repartition.avancements.annuel.moyenne;
  const avancementsGlobauxTerritoriauxMoyens = objectEntries({
    ...donneesTerritoiresAgregees.regionale.territoires,
    ...donneesTerritoiresAgregees.departementale.territoires,
  }).map(([territoireCodeDonnee, territoire]) => ({
    valeur: territoire.repartition.avancements.global.moyenne,
    valeurAnnuelle: territoire.repartition.avancements.annuel.moyenne,
    territoireCode: territoireCodeDonnee as string,
    estApplicable: true,
  }));

  const nombreTotalChantiersAvecAlertes = chantiersAvecAlertes.length;
  const chantierIds = chantiersAvecAlertes.map((chantier) => chantier.id);

  const chantiersPaginesAvecAlertes = chantiersAvecAlertes.splice(
    (pageIndex - 1) * pageSize,
    pageSize,
  );

  const estVideoAccueilActive = configurationFeatureFlip().videoAccueil;
  const estFicheTerritorialeActive =
    configurationFeatureFlip().ficheTerritoriale;

  const doitAfficherModaleVideoAccueil = await getContainer(
    "gestionUtilisateur",
  )
    .resolve("recupererEtatVisualisationVideoAccueilUseCase")
    .execute(session.user.id);
  const doitAfficherLaModaleInfolettre = await getContainer(
    "gestionUtilisateur",
  )
    .resolve("recupererEtatModaleInscriptionUseCase")
    .execute(session.user.id);

  return {
    props: {
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
      avancementsGlobauxTerritoriauxMoyens,
      repartitionMeteosChantiers,
      doitAfficherModaleVideoAccueil:
        estVideoAccueilActive && !doitAfficherModaleVideoAccueil,
      doitAfficherLaModaleInfolettre,
      doitAfficherLaFicheTerritoriale: estFicheTerritorialeActive,
      moyenneTerritoire,
    },
  };
};

const ChantierLayout = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const ffReorganisationPageAccueil = useEnv(
    "NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL",
  );

  return ffReorganisationPageAccueil ? (
    <PageAccueil {...props} />
  ) : (
    <PageAccueilLegacy {...props} />
  );
};

export default ChantierLayout;
