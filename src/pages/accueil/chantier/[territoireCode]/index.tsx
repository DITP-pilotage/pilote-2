import { useState } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import assert from "node:assert/strict";
import PageChantiers from "@/components/PageAccueil/PageChantiers/PageChantiers";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { Filtres } from "@/components/PageAccueil/Filtres/Filtres";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { dependencies } from "@/server/infrastructure/Dependencies";
import Axe from "@/server/domain/axe/Axe.interface";
import Alerte from "@/server/domain/alerte/Alerte";
import RécupérerStatistiquesAvancementChantiersUseCase from "@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase";
import { presenterEnAvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { AgrégateurListeChantiersParTerritoire } from "@/client/utils/chantier/agrégateurListeChantiers/agrégateur";
import { objectEntries } from "@/client/utils/objects/objects";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { Chantier } from "@/server/chantiers/domain/Chantier";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { RecupererRepartitionsMeteoChantiersUseCase } from "@/server/chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase";
import { presenterEnRépartitionsMétéosChantiersContrat } from "@/server/chantiers/app/contrats/RepartitionMeteoChantiersContrat";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";
import { ModaleVideoAccueil } from "@/components/PageAccueil/PageChantiers/ModaleVideoAccueil/ModaleVideoAccueil";
import { getContainer } from "@/server/dependances";
import { profilsRégionaux } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import Titre from "@/components/_commons/Titre/Titre";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { PanelMenuNavigation } from "@/components/_commons/PanelMenuNavigation/PanelMenuNavigation";
import { FiltresActifs } from "@/components/PageAccueil/FiltresActifs/FiltresActifs";
import { ModaleInscriptionInfolettre } from "@/components/PageAccueil/PageChantiers/ModaleInscriptionInfoLettre/ModaleInscriptionInfolettre";
import { BoutonNavigationFicheTerritoriale } from "@/components/PageAccueil/BoutonNavigationFicheTerritoriale";
import { BoutonNavigationRapportDetaille } from "@/components/BoutonNavigationRapportDetaille";
import { BoutonExportDesDonnees } from "@/components/PageAccueil/BoutonExportDesDonnees";
import IndexStyled from "./index.styled";

export const getServerSideProps = async ({
  req,
  res,
  query,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  const pageIndex = Number.parseInt(query.pageIndex as string) || 1;
  const pageSize = Number.parseInt(query.pageSize as string) || 50;
  const jalon =
    Number.parseInt(query.jalon as string) ||
    getAnneeDateDeBascule(
      new Date(),
      configuration().dateBasculeAffichageValeursAnneePrecedente,
    );

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

  const mailleQuery =
    (query.maille as "departementale" | "regionale") || "departementale";

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
        destination: `/accueil/chantier/${query.maille === "departementale" ? territoireDept : query.maille === "departementale" ? territoireReg : session.habilitations.lecture.territoires[0]}?maille=${query.maille || "departementale"}`,
      },
    };
  }

  const sorting = query.sort
    ? (JSON.parse(query.sort as string) as { id: string; desc: boolean })
    : {
        id: "avancement",
        desc: false,
      };

  const filtres: FiltreQueryParams = {
    perimetres: query.perimetres
      ? (query.perimetres as string).split(",").filter(Boolean)
      : [],
    axes: query.axes ? (query.axes as string).split(",").filter(Boolean) : [],
    statut:
      query.statut === "BROUILLON_ET_PUBLIE"
        ? ["BROUILLON", "PUBLIE"]
        : !!query.statut
          ? [query.statut as string]
          : ["PUBLIE"],
    meteos: query.meteos
      ? (query.meteos as string).split(",").filter(Boolean)
      : [],
    territorialisation: query.territorialisation
      ? ((query.territorialisation as string)
          .split(",")
          .filter(Boolean) as Maille[])
      : [],
    estBarometre: query.estBarometre === "true",
    valeurDeLaRecherche: query.q as string,
  };

  const filtresAlertes = {
    estEnAlerteTauxAvancementNonCalculé:
      query.estEnAlerteTauxAvancementNonCalculé === "true",
    estEnAlerteÉcart: query.estEnAlerteÉcart === "true",
    estEnAlerteBaisse: query.estEnAlerteBaisse === "true",
    estEnAlerteMétéoNonRenseignée:
      query.estEnAlerteMétéoNonRenseignée === "true",
    estEnAlerteAbscenceTauxAvancementDepartemental:
      query.estEnAlerteAbscenceTauxAvancementDepartemental === "true",
    estEnAlertePossedePropositionsValeurAvancement:
      query.estEnAlertePossedePropositionsValeurAvancement === "true",
  };

  const [ministères, axes] =
    session.habilitations.lecture.chantiers.length === 0
      ? [[], []]
      : await Promise.all([
          dependencies
            .getMinistèreRepository()
            .getListePourChantiers(session.habilitations.lecture.chantiers),
          dependencies
            .getAxeRepository()
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
    );
  const { filtresComptesCalculés } = Chantier.recupererStatistiqueListeChantier(
    chantiers,
    mailleChantier,
    territoireCode,
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
              Alerte.estEnAlerteÉcart(chantierDonnéesTerritoires.écart)) ||
            (filtresAlertes.estEnAlerteBaisse &&
              Alerte.estEnAlerteBaisse(chantierDonnéesTerritoires.tendance)) ||
            (filtresAlertes.estEnAlerteTauxAvancementNonCalculé &&
              Alerte.estEnAlerteTauxAvancementNonCalculé(
                chantierDonnéesTerritoires.avancement.global,
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

  const repartitionMeteosChantiers =
    await new RecupererRepartitionsMeteoChantiersUseCase({
      chantierRepository: dependencies.getChantierRepository(),
    })
      .run(
        territoireCode,
        filtres,
        axes,
        chantiersAvecAlertes.map((chantierAvecAlerte) => chantierAvecAlerte.id),
      )
      .then(presenterEnRépartitionsMétéosChantiersContrat);

  const récupérerStatistiquesChantiersUseCase =
    new RécupérerStatistiquesAvancementChantiersUseCase(
      dependencies.getChantierRepository(),
    );

  const avancementsAgrégés = await récupérerStatistiquesChantiersUseCase
    .run(
      chantiersAvecAlertes.map((chantier) => chantier.id),
      mailleQuery,
      session.habilitations,
    )
    .then(presenterEnAvancementsStatistiquesAccueilContrat);
  const donnéesTerritoiresAgrégées = new AgrégateurListeChantiersParTerritoire(
    chantiersAvecAlertes,
  ).agréger();

  if (avancementsAgrégés) {
    avancementsAgrégés.global.moyenne =
      donnéesTerritoiresAgrégées[mailleChantier].territoires[
        territoireCode
      ].répartition.avancements.global.moyenne;
    avancementsAgrégés.annuel.moyenne =
      donnéesTerritoiresAgrégées[mailleChantier].territoires[
        territoireCode
      ].répartition.avancements.annuel.moyenne;
  }

  const avancementsGlobauxTerritoriauxMoyens = objectEntries({
    ...donnéesTerritoiresAgrégées.regionale.territoires,
    ...donnéesTerritoiresAgrégées.departementale.territoires,
  }).map(([territoireCodeDonnee, territoire]) => ({
    valeur: territoire.répartition.avancements.global.moyenne,
    valeurAnnuelle: territoire.répartition.avancements.annuel.moyenne,
    territoireCode: territoireCodeDonnee as string,
    estApplicable: true,
  }));

  const nombreTotalChantiersAvecAlertes = chantiersAvecAlertes.length;

  const chantiersPaginesAvecAlertes = chantiersAvecAlertes.splice(
    (pageIndex - 1) * pageSize,
    pageSize,
  );

  const estVideoAccueilActive = configuration().featureFlip.videoAccueil;

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
      nombreTotalChantiersAvecAlertes,
      ministères,
      axes,
      territoireCode,
      jalon,
      mailleSelectionnee: mailleGlobalTerritoireSelectionnee,
      mailleQuery,
      filtresComptesCalculés,
      avancementsAgrégés,
      avancementsGlobauxTerritoriauxMoyens,
      repartitionMeteosChantiers,
      doitAfficherModaleVideoAccueil:
        estVideoAccueilActive && !doitAfficherModaleVideoAccueil,
      doitAfficherLaModaleInfolettre,
    },
  };
};

const PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE = new Set([
  ProfilEnum.CABINET_MTFP,
  ProfilEnum.PM_ET_CABINET,
  ProfilEnum.PR,
  ProfilEnum.CABINET_MINISTERIEL,
  ProfilEnum.DIR_ADMIN_CENTRALE,
  ProfilEnum.DROM,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
  ProfilEnum.RESPONSABLE_REGION,
]);

const PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE = new Set(
  profilsRégionaux,
);

const ChantierLayout = ({
  chantiers,
  nombreTotalChantiersAvecAlertes,
  axes,
  ministères,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  repartitionMeteosChantiers,
  jalon,
  doitAfficherModaleVideoAccueil,
  doitAfficherLaModaleInfolettre,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: session } = useSession();

  const estProfilTerritorialise =
    PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(session?.profil || "");
  const estProfilRegionalAutoriseAVoirLaTerritorialisation =
    PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(
      session?.profil || "",
    );
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  const filtresStatut = useQueryState(
    "statut",
    parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
  );
  const chantiersSontArchives = filtresStatut?.includes("ARCHIVE") ?? false;
  const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
    ProfilEnum.RESPONSABLE_DEPARTEMENT,
  ]);
  const estAutoriseAVoirLeSelecteurDeMaille =
    !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(session?.profil || "");

  const pathname = "/accueil/chantier/[territoireCode]";

  return (
    <IndexStyled>
      <Head>
        <title>PILOTE - Piloter l'action publique par les résultats</title>
      </Head>
      <div className="flex">
        <BarreLatérale
          estOuvert={estOuverteBarreLatérale}
          setEstOuvert={setEstOuverteBarreLatérale}
        >
          <BarreLatéraleEncart>
            <Titre
              baliseHtml="h1"
              className={`fr-h2 fr-p-0 fr-mb-3w${chantiersSontArchives ? " titre-gris" : " fr-text-title--blue-france"}`}
            >
              {`${nombreTotalChantiersAvecAlertes} ${nombreTotalChantiersAvecAlertes >= 2 ? "chantiers" : "chantier"}`}
            </Titre>
            <div className="inline-flex flex-column gap-1">
              {estAutoriséAConsulterLaFicheTerritoriale(
                session?.profil || "",
              ) ? (
                <BoutonNavigationFicheTerritoriale
                  territoireCode={territoireCode}
                />
              ) : null}
              <BoutonNavigationRapportDetaille
                territoireCode={territoireCode}
              />
              <BoutonExportDesDonnees territoireCode={territoireCode} />
            </div>
          </BarreLatéraleEncart>
          <section>
            <Filtres
              afficherToutLesFiltres
              axes={axes}
              estProfilRegionalAutoriseAVoirLaTerritorialisation={
                estProfilRegionalAutoriseAVoirLaTerritorialisation
              }
              estProfilTerritorialise={estProfilTerritorialise}
              ministères={ministères}
            />
          </section>
        </BarreLatérale>
        <div className="w-full">
          <div className="horizontal-panel fr-background-blue-france-850 fr-grid-row fr-pt-2w">
            <PanelMenuNavigation
              estAutoriseAVoirLeSelecteurDeMaille={
                estAutoriseAVoirLeSelecteurDeMaille
              }
              mailleQuery={mailleQuery}
              pathname={pathname}
              setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
              territoireCode={territoireCode}
            />
            <FiltresActifs
              axes={axes}
              mailleSelectionnee={mailleSelectionnee}
              ministères={ministères}
            />
          </div>
          <PageChantiers
            avancementsAgrégés={avancementsAgrégés}
            avancementsGlobauxTerritoriauxMoyens={
              avancementsGlobauxTerritoriauxMoyens
            }
            chantiers={chantiers}
            filtresComptesCalculés={filtresComptesCalculés}
            jalon={jalon}
            mailleQuery={mailleQuery}
            ministères={ministères}
            nombreTotalChantiersAvecAlertes={nombreTotalChantiersAvecAlertes}
            repartitionMeteosChantiers={repartitionMeteosChantiers}
            territoireCode={territoireCode}
          />
          {doitAfficherModaleVideoAccueil ? (
            <>
              <ModaleVideoAccueil />
              <div aria-controls="modale-video-accueil" data-fr-opened="true" />
            </>
          ) : null}
          {doitAfficherLaModaleInfolettre ? (
            <>
              <ModaleInscriptionInfolettre />
              <div
                aria-controls="modale-inscription-infolettre"
                data-fr-opened="true"
              />
            </>
          ) : null}
        </div>
      </div>
    </IndexStyled>
  );
};

export default ChantierLayout;
