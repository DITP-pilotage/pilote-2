import { getContainer } from "@/server/dependances";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import IndicateurRepository from "@/server/domain/indicateur/IndicateurRepository.interface";
import SynthèseDesRésultatsRepository from "@/server/domain/chantier/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import { DétailsIndicateurs } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { MailleChantierContrat } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import { AgrégateurChantierRapportDetailleParTerritoire } from "@/client/utils/chantier/agrégateurRapportDetaille/agrégateur";
import { objectEntries } from "@/client/utils/objects/objects";
import { AvancementChantierRapportDetaille } from "@/components/PageRapportDétaillé/AvancementChantierRapportDetaille";
import { Commentaire } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import Objectif from "@/server/domain/chantier/objectif/Objectif.interface";
import { DécisionStratégique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { ContexteRapportDetaille } from "@/server/rapport-detaille/contexteRapportDetaille";
import { DetailChantierRapportDetaille } from "@/server/rapport-detaille/rapportDetaille.interface";

export type DependancesDetailsChantiers = {
  statistiquesParChantier: (
    chantierIds: string[],
    maille: MailleInterne,
    habilitations: Habilitations,
    jalon: number,
  ) => Promise<Record<string, AvancementsStatistiques>>;
  indicateursGroupés: IndicateurRepository["récupérerGroupésParChantier"];
  détailsIndicateursGroupés: (
    chantierIds: string[],
    mailleChantier: MailleChantierContrat,
    codeInsee: string,
    jalon: number,
  ) => Promise<Record<string, DétailsIndicateurs>>;
  indicateursPrisEnCompte: IndicateurRepository["recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire"];
  synthèsesGroupées: SynthèseDesRésultatsRepository["récupérerLesPlusRécentesGroupéesParChantier"];
  décisionsGroupées: DécisionStratégiqueRepository["récupérerLesPlusRécentesGroupéesParChantier"];
  commentairesGroupés: (
    chantierIds: string[],
    territoireCode: string,
    habilitations: Habilitations,
  ) => Promise<Record<string, Commentaire[]>>;
  objectifsGroupés: (
    chantierIds: string[],
    habilitations: Habilitations,
  ) => Promise<Record<string, Objectif[]>>;
};

export function dependancesDetailsChantiers(): DependancesDetailsChantiers {
  const indicateurRepository = getContainer("legacy").resolve(
    "indicateurRepository",
  );
  return {
    statistiquesParChantier: (chantierIds, maille, habilitations, jalon) =>
      getContainer("chantiers")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .runParChantier(chantierIds, maille, habilitations, jalon),
    indicateursGroupés: (chantierIds) =>
      indicateurRepository.récupérerGroupésParChantier(chantierIds),
    détailsIndicateursGroupés: async (
      chantierIds,
      mailleChantier,
      codeInsee,
      jalon,
    ) => {
      const datajobsExecution = await getContainer("datajobsExecution")
        .resolve("datajobsExecutionQueries")
        .recupererEtatCourant();
      return indicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
        chantierIds,
        mailleChantier,
        codeInsee,
        jalon,
        new Date(datajobsExecution.derniereDateExecution),
      );
    },
    indicateursPrisEnCompte: (chantierIds) =>
      indicateurRepository.recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
        chantierIds,
      ),
    synthèsesGroupées: (chantierIds, maille, codeInsee) =>
      getContainer("legacy")
        .resolve("synthèseDesRésultatsRepository")
        .récupérerLesPlusRécentesGroupéesParChantier(
          chantierIds,
          maille,
          codeInsee,
        ),
    décisionsGroupées: (chantierIds) =>
      getContainer("legacy")
        .resolve("décisionStratégiqueRepository")
        .récupérerLesPlusRécentesGroupéesParChantier(chantierIds),
    commentairesGroupés: (chantierIds, territoireCode, habilitations) =>
      getContainer("legacy")
        .resolve(
          "récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase",
        )
        .run(chantierIds, territoireCode, habilitations),
    objectifsGroupés: (chantierIds, habilitations) =>
      getContainer("legacy")
        .resolve(
          "récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase",
        )
        .run(chantierIds, habilitations),
  };
}

function calculerAvancement(
  chantier: ChantierRapportDetailleContrat,
  statistiques: AvancementsStatistiques | undefined,
  contexte: ContexteRapportDetaille,
  territoireSélectionné: Territoire,
): AvancementChantierRapportDetaille {
  const agrégat = new AgrégateurChantierRapportDetailleParTerritoire(
    chantier,
  ).agréger();
  const { territoireCode, mailleSelectionnee } = contexte;

  const avancementRégional = (typeTauxAvancement: "global" | "annuel") => {
    const codeRégion =
      territoireSélectionné.maille === "regionale"
        ? territoireCode
        : territoireSélectionné.maille === "departementale"
          ? territoireSélectionné.codeParent
          : null;
    if (!codeRégion) return { moyenne: null, date: null };
    const avancement =
      agrégat.regionale.territoires[codeRégion].répartition.avancements[
        typeTauxAvancement
      ];
    return { moyenne: avancement.avancement, date: avancement.date };
  };

  const avancementDépartemental = (typeTauxAvancement: "global" | "annuel") => {
    if (territoireSélectionné.maille !== "departementale") {
      return { moyenne: null, date: null };
    }
    const avancement =
      agrégat[mailleSelectionnee].territoires[territoireCode].répartition
        .avancements[typeTauxAvancement];
    return { moyenne: avancement.avancement, date: avancement.date };
  };

  return {
    nationale: {
      global: {
        moyenne: agrégat.nationale.répartition.avancements.global.moyenne,
        médiane: statistiques?.médiane ?? null,
        minimum: statistiques?.minimum ?? null,
        maximum: statistiques?.maximum ?? null,
        date: agrégat.nationale.territoires["NAT-FR"].répartition.avancements
          .global.date,
      },
      annuel: {
        moyenne: agrégat.nationale.répartition.avancements.annuel.moyenne,
        date: agrégat.nationale.territoires["NAT-FR"].répartition.avancements
          .annuel.date,
      },
    },
    departementale: {
      global: avancementDépartemental("global"),
      annuel: avancementDépartemental("annuel"),
    },
    regionale: {
      global: avancementRégional("global"),
      annuel: avancementRégional("annuel"),
    },
  };
}

export async function chargerDetailsChantiers(
  chantiers: ChantierRapportDetailleContrat[],
  contexte: ContexteRapportDetaille,
  territoireSélectionné: Territoire,
  dependances: DependancesDetailsChantiers = dependancesDetailsChantiers(),
): Promise<DetailChantierRapportDetaille[]> {
  const chantierIds = chantiers.map((chantier) => chantier.id);
  const { habilitations } = contexte.session;
  const accèsNational = new Habilitation(habilitations).peutAccéderAuTerritoire(
    "NAT-FR",
  );

  const [
    statistiques,
    indicateurs,
    détailsIndicateurs,
    indicateursPrisEnCompte,
    synthèses,
    décisions,
    commentaires,
    objectifs,
  ] = await Promise.all([
    dependances.statistiquesParChantier(
      chantierIds,
      contexte.mailleSelectionnee,
      habilitations,
      contexte.jalon,
    ),
    dependances.indicateursGroupés(chantierIds),
    dependances.détailsIndicateursGroupés(
      chantierIds,
      contexte.mailleChantier,
      contexte.codeInseeSelectionne,
      contexte.jalon,
    ),
    dependances.indicateursPrisEnCompte(chantierIds),
    dependances.synthèsesGroupées(
      chantierIds,
      contexte.mailleChantier,
      contexte.codeInseeSelectionne,
    ),
    accèsNational
      ? dependances.décisionsGroupées(chantierIds)
      : Promise.resolve<Record<string, DécisionStratégique>>({}),
    dependances.commentairesGroupés(
      chantierIds,
      contexte.territoireCode,
      habilitations,
    ),
    dependances.objectifsGroupés(chantierIds, habilitations),
  ]);

  return chantiers.map((chantier) => {
    const territoires = objectEntries(
      chantier.mailles[contexte.mailleSelectionnee],
    );
    return {
      chantierId: chantier.id,
      avancement: calculerAvancement(
        chantier,
        statistiques[chantier.id],
        contexte,
        territoireSélectionné,
      ),
      indicateurs: indicateurs[chantier.id] ?? [],
      détailsIndicateurs: détailsIndicateurs[chantier.id] ?? {},
      synthèseDesRésultats: synthèses[chantier.id] ?? null,
      objectifs: objectifs[chantier.id] ?? [],
      commentaires: commentaires[chantier.id] ?? [],
      décisionStratégique: décisions[chantier.id] ?? null,
      donnéesCartographieAvancement: territoires.map(
        ([territoireCode, territoire]) => ({
          valeur: territoire.avancement.global,
          valeurAnnuelle: territoire.avancement.annuel,
          territoireCode,
          estApplicable: territoire.estApplicable,
        }),
      ),
      donnéesCartographieMétéo: territoires.map(
        ([territoireCode, territoire]) => ({
          valeur: territoire.météo,
          territoireCode,
          estApplicable: territoire.estApplicable,
        }),
      ),
      listeIndicateursPrisEnCompteAvancement: indicateursPrisEnCompte,
    };
  });
}
