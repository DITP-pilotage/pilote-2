import Head from "next/head";
import { GetServerSideProps } from "next";
import { FunctionComponent } from "react";
import assert from "node:assert/strict";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import PageRapportDétaillé from "@/components/PageRapportDétaillé/PageRapportDétaillé";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { PublicationsGroupéesParChantier } from "@/components/PageRapportDétaillé/PageRapportDétaillé.interface";
import RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/commentaire/RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase";
import RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase from "@/server/usecase/chantier/objectif/RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import DécisionStratégique from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Alerte from "@/server/domain/alerte/Alerte";
import RécupérerStatistiquesAvancementChantiersUseCase from "@/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase";
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
  presenterEnAvancementsStatistiquesAccueilContrat,
} from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { objectEntries } from "@/client/utils/objects/objects";
import Axe from "@/server/domain/axe/Axe.interface";
import { AgrégateurChantierRapportDetailleParTerritoire } from "@/client/utils/chantier/agrégateurRapportDetailleNew/agrégateur";
import { AvancementChantierRapportDetaille } from "@/components/PageRapportDétaillé/AvancementChantierRapportDetaille";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { Chantier } from "@/server/chantiers/domain/Chantier";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { presenterEnRépartitionsMétéosChantiersContrat } from "@/server/chantiers/app/contrats/RepartitionMeteoChantiersContrat";
import { RecupererRepartitionsMeteoChantiersUseCase } from "@/server/chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration, configurationFeatureFlip } from "@/config";
import { getContainer } from "@/server/dependances";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { getInitialContainerWithTransversalDependencies } from "@/server/InitialDependencies";
import { loadRapportDetailleSearchParams } from "@/client/searchParams/accueilSearchParams";

interface NextPageRapportDétailléProps {
  chantiers: ChantierRapportDetailleContrat[];
  ministères: Ministère[];
  axes: Axe[];
  indicateursGroupésParChantier: Record<string, Indicateur[]>;
  détailsIndicateursGroupésParChantier: Record<string, DétailsIndicateurs>;
  publicationsGroupéesParChantier: PublicationsGroupéesParChantier;
  mailleSelectionnee: MailleInterne;
  listeAvancementsStatistiques: {
    id: string;
    avancementChantierRapportDetaille: AvancementChantierRapportDetaille;
  }[];
  territoireCode: string;
  jalon: number;
  filtresComptesCalculés: Record<TypeAlerteChantier, number>;
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  estAutoriseAVoirLesBrouillons: boolean;
  listeDonnéesCartographieAvancement: {
    id: string;
    donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat;
  }[];
  listeDonnéesCartographieMétéo: {
    id: string;
    donnéesCartographieMétéo: CartographieDonnéesMétéo;
  }[];
  listeIndicateursPrisEnCompteAvancement: string[];
  chantiersStatuts: string[];
  moyenneTauxAvancementTerritoire: number | null;
  masquerIndicateursNonApplicables: boolean;
}

const PROFILS_AUTORISE_VOIR_BROUILLONS = new Set([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
]);

export const getServerSideProps: GetServerSideProps<
  NextPageRapportDétailléProps
> = async (context) => {
  const { query } = context;
  const session = await auth(context);
  const searchParams = loadRapportDetailleSearchParams(query);

  assert(query.territoireCode, "Le territoire code est manquant");
  assert(session, "Vous devez être authentifié pour accéder a cette page");
  assert(session.habilitations, "La session ne dispose d'aucune habilitation");
  const territoireCode = query.territoireCode as string;

  const { maille, codeInsee: codeInseeSelectionne } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  const mailleQuery = searchParams.maille;
  const jalonParDefaut = getAnneeDateDeBascule(
    new Date(),
    configuration().dateBasculeAffichageValeursAnneePrecedente,
  );
  const jalon = searchParams.jalon ?? jalonParDefaut;

  const mailleSelectionnee =
    maille === "NAT"
      ? mailleQuery
      : maille === "DEPT"
        ? "departementale"
        : "regionale";

  const mailleChantier = maille === "NAT" ? "nationale" : mailleSelectionnee;

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

  const habilitation = new Habilitation(session.habilitations);

  const territoireRepository = getContainer("legacy").resolve(
    "territoireRepository",
  );
  const territoireSélectionné =
    await territoireRepository.récupérer(territoireCode);

  const sorting = searchParams.sort;

  const mapAxes = new Map<string, Axe>(axes.map((axe) => [axe.id, axe]));

  const chantiers = await getContainer("chantiers")
    .resolve("recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2")
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
      chantierRepository: getContainer("legacy").resolve("chantierRepository"),
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
      getContainer("legacy").resolve("chantierRepository"),
    );

  const listeAvancementsStatistiques: {
    id: string;
    avancementChantierRapportDetaille: AvancementChantierRapportDetaille;
  }[] = [];

  for (const chantier of chantiersAvecAlertes) {
    const avancementsStatistique =
      await récupérerStatistiquesChantiersUseCase.run(
        [chantier.id],
        mailleSelectionnee || "departementale",
        session.habilitations,
        jalon,
      );

    const avancementChantierRapportDetaille =
      new AgrégateurChantierRapportDetailleParTerritoire(chantier).agréger();

    const avancementRégional = (typeTauxAvancement: "global" | "annuel") => {
      if (territoireSélectionné.maille === "regionale") {
        const avancement =
          avancementChantierRapportDetaille.regionale.territoires[
            territoireCode
          ].répartition.avancements[typeTauxAvancement];

        return { moyenne: avancement.avancement, date: avancement.date };
      } else if (
        territoireSélectionné.maille === "departementale" &&
        territoireSélectionné.codeParent
      ) {
        const avancement =
          avancementChantierRapportDetaille.regionale.territoires[
            territoireSélectionné.codeParent
          ].répartition.avancements[typeTauxAvancement];
        return { moyenne: avancement.avancement, date: avancement.date };
      } else {
        return { moyenne: null, date: null };
      }
    };

    const avancementDépartemental = (
      typeTauxAvancement: "global" | "annuel",
    ) => {
      if (territoireSélectionné.maille === "departementale") {
        const avancement =
          avancementChantierRapportDetaille[mailleSelectionnee].territoires[
            territoireCode
          ].répartition.avancements[typeTauxAvancement];
        return { moyenne: avancement.avancement, date: avancement.date };
      }
      return { moyenne: null, date: null };
    };

    listeAvancementsStatistiques.push({
      id: chantier.id,
      avancementChantierRapportDetaille: {
        nationale: {
          global: {
            moyenne:
              avancementChantierRapportDetaille.nationale.répartition
                .avancements.global.moyenne,
            médiane: avancementsStatistique?.médiane ?? null,
            minimum: avancementsStatistique?.minimum ?? null,
            maximum: avancementsStatistique?.maximum ?? null,
            date: avancementChantierRapportDetaille.nationale.territoires[
              "NAT-FR"
            ].répartition.avancements.global.date,
          },
          annuel: {
            moyenne:
              avancementChantierRapportDetaille.nationale.répartition
                .avancements.annuel.moyenne,
            date: avancementChantierRapportDetaille.nationale.territoires[
              "NAT-FR"
            ].répartition.avancements.annuel.date,
          },
        },
        departementale: {
          global: {
            ...avancementDépartemental("global"),
          },
          annuel: {
            ...avancementDépartemental("annuel"),
          },
        },
        regionale: {
          global: {
            ...avancementRégional("global"),
          },
          annuel: {
            ...avancementRégional("annuel"),
          },
        },
      },
    });
  }

  const chantiersIds = chantiers.map((chantier) => chantier.id);

  const indicateursRepository = getContainer("legacy").resolve(
    "indicateurRepository",
  );
  const indicateursGroupésParChantier =
    await indicateursRepository.récupérerGroupésParChantier(chantiersIds);
  const datajobsExecution =
    await getInitialContainerWithTransversalDependencies()
      .resolve("datajobsExecutionQueries")
      .recupererEtatCourant();
  const détailsIndicateursGroupésParChantier =
    await indicateursRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
      chantiersIds,
      mailleChantier,
      codeInseeSelectionne,
      jalon,
      new Date(datajobsExecution.derniereDateExecution),
    );
  const listeIndicateursPrisEnCompteAvancement =
    await indicateursRepository.recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
      chantiersIds,
    );

  const synthèseDesRésultatsRepository = getContainer("legacy").resolve(
    "synthèseDesRésultatsRepository",
  );
  const synthèsesDesRésultatsGroupéesParChantier =
    await synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier(
      chantiersIds,
      mailleChantier,
      codeInseeSelectionne,
    );

  let décisionStratégiquesGroupéesParChantier: Record<
    string,
    DécisionStratégique | null
  > = Object.fromEntries(chantiersIds.map((id) => [id, null]));
  if (habilitation.peutAccéderAuTerritoire("NAT-FR")) {
    const décisionStratégiqueRepository = getContainer("legacy").resolve(
      "décisionStratégiqueRepository",
    );
    décisionStratégiquesGroupéesParChantier =
      await décisionStratégiqueRepository.récupérerLesPlusRécentesGroupéesParChantier(
        chantiersIds,
      );
  }

  const commentairesGroupésParChantier =
    await new RécupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase(
      getContainer("legacy").resolve("commentaireRepository"),
    ).run(chantiersIds, territoireCode, session.habilitations);

  const objectifsGroupésParChantier =
    await new RécupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase(
      getContainer("legacy").resolve("objectifRepository"),
    ).run(chantiersIds, session.habilitations);

  const { filtresComptesCalculés } = Chantier.recupererStatistiqueListeChantier(
    chantiers,
    mailleChantier,
    territoireCode,
  );

  const avancementsAgrégés = await récupérerStatistiquesChantiersUseCase
    .run(
      chantiersAvecAlertes.map((chantier) => chantier.id),
      mailleSelectionnee || "departementale",
      session.habilitations,
      jalon,
    )
    .then(presenterEnAvancementsStatistiquesAccueilContrat);

  const donneesTerritoiresAgregees =
    await new AgregerAvancementsChantiersUseCase({
      chantierRepository: getContainer("legacy").resolve("chantierRepository"),
    }).run(
      chantiersAvecAlertes.map((chantier) => chantier.id),
      jalon,
    );

  const moyenneTauxAvancementTerritoire =
    donneesTerritoiresAgregees[mailleChantier].territoires[territoireCode]
      .repartition.avancements.annuel.moyenne;

  const avancementsGlobauxTerritoriauxMoyens = objectEntries(
    donneesTerritoiresAgregees[mailleSelectionnee || "departementale"]
      .territoires,
  ).map(([territoireCodeSelectionne, territoire]) => ({
    valeur: territoire.repartition.avancements.global.moyenne,
    valeurAnnuelle: territoire.repartition.avancements.annuel.moyenne,
    territoireCode: territoireCodeSelectionne,
    estApplicable: null,
  }));

  const listeDonnéesCartographieAvancement = chantiersAvecAlertes.map(
    (chantier) => ({
      id: chantier.id,
      donnéesCartographieAvancement: objectEntries(
        chantier.mailles[mailleSelectionnee],
      ).map(([territoireCodeDonnee, territoire]) => ({
        valeur: territoire.avancement.global,
        valeurAnnuelle: territoire.avancement.annuel,
        territoireCode: territoireCodeDonnee,
        estApplicable: territoire.estApplicable,
      })),
    }),
  );

  const listeDonnéesCartographieMétéo = chantiersAvecAlertes.map(
    (chantier) => ({
      id: chantier.id,
      donnéesCartographieMétéo: objectEntries(
        chantier.mailles[mailleSelectionnee],
      ).map(([territoireCodeDonnee, territoire]) => ({
        valeur: territoire.météo,
        territoireCode: territoireCodeDonnee,
        estApplicable: territoire.estApplicable,
      })),
    }),
  );

  const estAutoriseAVoirLesBrouillons = PROFILS_AUTORISE_VOIR_BROUILLONS.has(
    session.profil,
  );

  return {
    props: {
      chantiers: chantiersAvecAlertes.map((chantier) => {
        // @ts-expect-error
        delete chantier.mailles;
        return chantier;
      }),
      ministères,
      axes,
      indicateursGroupésParChantier,
      détailsIndicateursGroupésParChantier,
      mailleQuery,
      mailleSelectionnee,
      listeAvancementsStatistiques,
      listeDonnéesCartographieAvancement,
      listeDonnéesCartographieMétéo,
      filtresComptesCalculés,
      avancementsAgrégés,
      territoireCode,
      jalon,
      avancementsGlobauxTerritoriauxMoyens,
      repartitionMeteosChantiers,
      estAutoriseAVoirLesBrouillons,
      publicationsGroupéesParChantier: {
        commentaires: commentairesGroupésParChantier,
        synthèsesDesRésultats: synthèsesDesRésultatsGroupéesParChantier,
        objectifs: objectifsGroupésParChantier,
        décisionStratégique: décisionStratégiquesGroupéesParChantier,
      },
      listeIndicateursPrisEnCompteAvancement,
      chantiersStatuts: filtres.statut,
      moyenneTauxAvancementTerritoire,
      masquerIndicateursNonApplicables:
        configurationFeatureFlip().masquerIndicateursNonApplicables,
    },
  };
};

const NextPageRapportDétaillé: FunctionComponent<
  NextPageRapportDétailléProps
> = ({
  chantiers,
  ministères,
  axes,
  indicateursGroupésParChantier,
  détailsIndicateursGroupésParChantier,
  publicationsGroupéesParChantier,
  mailleSelectionnee,
  listeAvancementsStatistiques,
  filtresComptesCalculés,
  territoireCode,
  jalon,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  estAutoriseAVoirLesBrouillons,
  repartitionMeteosChantiers,
  listeDonnéesCartographieAvancement,
  listeDonnéesCartographieMétéo,
  listeIndicateursPrisEnCompteAvancement,
  chantiersStatuts,
  moyenneTauxAvancementTerritoire,
  masquerIndicateursNonApplicables,
}) => {
  const mapChantierStatistiques = new Map<
    string,
    AvancementChantierRapportDetaille
  >();
  listeAvancementsStatistiques.forEach((itemAvancementsStatistique) => {
    mapChantierStatistiques.set(
      itemAvancementsStatistique.id,
      itemAvancementsStatistique.avancementChantierRapportDetaille,
    );
  });
  const mapDonnéesCartographieAvancement = new Map<
    string,
    AvancementsGlobauxTerritoriauxMoyensContrat
  >();
  listeDonnéesCartographieAvancement.forEach(
    (itemDonnéesCartographieAvancement) => {
      mapDonnéesCartographieAvancement.set(
        itemDonnéesCartographieAvancement.id,
        itemDonnéesCartographieAvancement.donnéesCartographieAvancement,
      );
    },
  );
  const mapDonnéesCartographieMétéo = new Map<
    string,
    CartographieDonnéesMétéo
  >();
  listeDonnéesCartographieMétéo.forEach((itemDonnéesCartographieMétéo) => {
    mapDonnéesCartographieMétéo.set(
      itemDonnéesCartographieMétéo.id,
      itemDonnéesCartographieMétéo.donnéesCartographieMétéo,
    );
  });

  return (
    <>
      <Head>
        <title>Rapport détaillé - PILOTE</title>
      </Head>
      <PageRapportDétaillé
        avancementsAgrégés={avancementsAgrégés}
        avancementsGlobauxTerritoriauxMoyens={
          avancementsGlobauxTerritoriauxMoyens
        }
        axes={axes}
        chantiers={chantiers}
        chantiersSontArchives={chantiersStatuts.includes("ARCHIVE")}
        détailsIndicateursGroupésParChantier={
          détailsIndicateursGroupésParChantier
        }
        estAutoriseAVoirLesBrouillons={estAutoriseAVoirLesBrouillons}
        filtresComptesCalculés={filtresComptesCalculés}
        indicateursGroupésParChantier={indicateursGroupésParChantier}
        jalon={jalon}
        listeIndicateursPrisEnCompteAvancement={
          listeIndicateursPrisEnCompteAvancement
        }
        mailleSelectionnee={mailleSelectionnee}
        mapChantierStatistiques={mapChantierStatistiques}
        mapDonnéesCartographieAvancement={mapDonnéesCartographieAvancement}
        mapDonnéesCartographieMétéo={mapDonnéesCartographieMétéo}
        masquerIndicateursNonApplicables={masquerIndicateursNonApplicables}
        ministères={ministères}
        publicationsGroupéesParChantier={publicationsGroupéesParChantier}
        repartitionMeteosChantiers={repartitionMeteosChantiers}
        territoireCode={territoireCode}
        moyenneTauxAvancementTerritoire={moyenneTauxAvancementTerritoire}
      />
    </>
  );
};

export default NextPageRapportDétaillé;
