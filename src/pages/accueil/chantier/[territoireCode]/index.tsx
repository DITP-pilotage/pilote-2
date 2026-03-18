import { useState } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import assert from "node:assert/strict";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { useEnv } from "@/client/hooks/useEnv";
import PageChantiers from "@/components/PageAccueil/PageChantiers/PageChantiers";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { Filtres } from "@/components/PageAccueil/Filtres/Filtres";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Axe from "@/server/domain/axe/Axe.interface";
import Alerte from "@/server/domain/alerte/Alerte";
import { presenterEnAvancementsStatistiquesAccueilContrat } from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { objectEntries } from "@/client/utils/objects/objects";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { Chantier } from "@/server/chantiers/domain/Chantier";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { presenterEnRépartitionsMétéosChantiersContrat } from "@/server/chantiers/app/contrats/RepartitionMeteoChantiersContrat";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration, configurationFeatureFlip } from "@/config";
import { ModaleVideoAccueil } from "@/components/PageAccueil/PageChantiers/ModaleVideoAccueil/ModaleVideoAccueil";
import { getContainer } from "@/server/dependances";
import { profilsRégionaux } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import Titre from "@/components/_commons/Titre/Titre";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { PanelMenuNavigation } from "@/components/_commons/PanelMenuNavigation/PanelMenuNavigation";
import { FiltresActifs } from "@/components/PageAccueil/FiltresActifs/FiltresActifs";
import { ModaleInscriptionInfolettre } from "@/components/PageAccueil/PageChantiers/ModaleInscriptionInfoLettre/ModaleInscriptionInfolettre";
import { ModaleRenseignerService } from "@/components/PageAccueil/PageChantiers/ModaleRenseignerService/ModaleRenseignerService";
import { BoutonNavigationFicheTerritoriale } from "@/components/PageAccueil/BoutonNavigationFicheTerritoriale";
import { BoutonNavigationRapportDetaille } from "@/components/BoutonNavigationRapportDetaille";
import { BoutonSyntheseTerritoire } from "@/components/PageAccueil/BoutonSyntheseTerritoire";
import { BoutonExportDesDonnees } from "@/components/PageAccueil/BoutonExportDesDonnees";
import { clsxm } from "@/utils/clsxm";
import { loadAccueilSearchParams } from "@/client/searchParams/accueilSearchParams";
import IndexStyled from "./index.styled";

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

  const avancementsAgrégés = await getContainer("legacy")
    .resolve("récupérerStatistiquesAvancementChantiersUseCase")
    .run(
      chantiersAvecAlertes.map((chantier) => chantier.id),
      mailleQuery,
      session.habilitations,
      jalon,
    )
    .then(presenterEnAvancementsStatistiquesAccueilContrat);

  const donneesTerritoiresAgregees = await getContainer("legacy")
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
      doitAfficherLaFicheTerritoriale: estFicheTerritorialeActive,
      moyenneTerritoire,
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
  chantierIds,
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
  doitAfficherLaFicheTerritoriale,
  moyenneTerritoire,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: session } = useSession();

  const estProfilTerritorialise =
    PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(session?.profil || "");
  const estProfilRegionalAutoriseAVoirLaTerritorialisation =
    PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(
      session?.profil || "",
    );

  const profil = useProfilUtilisateurConnecte();
  const monProfilEstDisponible = useEnv("NEXT_PUBLIC_FF_MON_PROFIL");
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");
  const doitAfficherModaleRenseignerService =
    !!monProfilEstDisponible &&
    (profil.service == null || profil.fonction == null);

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [isModaleInfolettreOpen, setIsModaleInfolettreOpen] = useState(
    doitAfficherLaModaleInfolettre,
  );
  const [isModaleVideoAccueilOpen, setIsModaleVideoAccueilOpen] = useState(
    doitAfficherModaleVideoAccueil,
  );
  const [isModaleRenseignerServiceOpen, setIsModaleRenseignerServiceOpen] =
    useState(doitAfficherModaleRenseignerService);

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
              className={clsxm(
                `fr-h2 fr-p-0 fr-mb-3w`,
                chantiersSontArchives
                  ? "titre-gris"
                  : "fr-text-title--blue-france",
              )}
            >
              {`${nombreTotalChantiersAvecAlertes} ${nombreTotalChantiersAvecAlertes >= 2 ? "chantiers" : "chantier"}`}
            </Titre>
            <div className="inline-flex flex-column gap-1">
              {doitAfficherLaFicheTerritoriale &&
              estAutoriséAConsulterLaFicheTerritoriale(
                session?.profil || "",
              ) ? (
                <BoutonNavigationFicheTerritoriale
                  jalon={jalon}
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
            {ffAskAI || session?.profil === ProfilEnum.DITP_ADMIN ? (
              <BoutonSyntheseTerritoire
                territoireCode={territoireCode}
                jalon={jalon}
              />
            ) : null}
          </div>
          <PageChantiers
            avancementsAgrégés={avancementsAgrégés}
            avancementsGlobauxTerritoriauxMoyens={
              avancementsGlobauxTerritoriauxMoyens
            }
            chantierIds={chantierIds}
            chantiers={chantiers}
            filtresComptesCalculés={filtresComptesCalculés}
            jalon={jalon}
            mailleQuery={mailleQuery}
            ministères={ministères}
            nombreTotalChantiersAvecAlertes={nombreTotalChantiersAvecAlertes}
            repartitionMeteosChantiers={repartitionMeteosChantiers}
            territoireCode={territoireCode}
            moyenneTerritoire={moyenneTerritoire}
          />
          <ModaleVideoAccueil
            onOpenChange={setIsModaleVideoAccueilOpen}
            open={isModaleVideoAccueilOpen}
          />
          <ModaleRenseignerService
            onOpenChange={setIsModaleRenseignerServiceOpen}
            open={!isModaleVideoAccueilOpen && isModaleRenseignerServiceOpen}
          />
          <ModaleInscriptionInfolettre
            onOpenChange={setIsModaleInfolettreOpen}
            open={
              !isModaleVideoAccueilOpen &&
              !isModaleRenseignerServiceOpen &&
              isModaleInfolettreOpen
            }
          />
        </div>
      </div>
    </IndexStyled>
  );
};

export default ChantierLayout;
