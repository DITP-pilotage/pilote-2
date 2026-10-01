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
import { RapportDetailleContext } from "@/server/rapport-detaille/rapportDetailleContext";
import { ChantierDetail } from "@/server/rapport-detaille/rapportDetaille.interface";

export type ChantierDetailsDependencies = {
  getStatistiquesByChantier: (
    chantierIds: string[],
    maille: MailleInterne,
    habilitations: Habilitations,
    jalon: number,
  ) => Promise<Record<string, AvancementsStatistiques>>;
  getIndicateursByChantier: IndicateurRepository["récupérerGroupésParChantier"];
  getDétailsIndicateursByChantier: (
    chantierIds: string[],
    chantierMaille: MailleChantierContrat,
    codeInsee: string,
    jalon: number,
  ) => Promise<Record<string, DétailsIndicateurs>>;
  getIndicateursPrisEnCompte: IndicateurRepository["recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire"];
  getSynthèsesByChantier: SynthèseDesRésultatsRepository["récupérerLesPlusRécentesGroupéesParChantier"];
  getDécisionsByChantier: DécisionStratégiqueRepository["récupérerLesPlusRécentesGroupéesParChantier"];
  getCommentairesByChantier: (
    chantierIds: string[],
    territoireCode: string,
    habilitations: Habilitations,
  ) => Promise<Record<string, Commentaire[]>>;
  getObjectifsByChantier: (
    chantierIds: string[],
    habilitations: Habilitations,
  ) => Promise<Record<string, Objectif[]>>;
};

export function defaultChantierDetailsDependencies(): ChantierDetailsDependencies {
  const indicateurRepository = getContainer("legacy").resolve(
    "indicateurRepository",
  );
  return {
    getStatistiquesByChantier: (chantierIds, maille, habilitations, jalon) =>
      getContainer("chantiers")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .runByChantier(chantierIds, maille, habilitations, jalon),
    getIndicateursByChantier: (chantierIds) =>
      indicateurRepository.récupérerGroupésParChantier(chantierIds),
    getDétailsIndicateursByChantier: async (
      chantierIds,
      chantierMaille,
      codeInsee,
      jalon,
    ) => {
      const datajobsExecution = await getContainer("datajobsExecution")
        .resolve("datajobsExecutionQueries")
        .recupererEtatCourant();
      return indicateurRepository.récupérerDétailsGroupésParChantierEtParIndicateur(
        chantierIds,
        chantierMaille,
        codeInsee,
        jalon,
        new Date(datajobsExecution.derniereDateExecution),
      );
    },
    getIndicateursPrisEnCompte: (chantierIds) =>
      indicateurRepository.recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire(
        chantierIds,
      ),
    getSynthèsesByChantier: (chantierIds, maille, codeInsee) =>
      getContainer("legacy")
        .resolve("synthèseDesRésultatsRepository")
        .récupérerLesPlusRécentesGroupéesParChantier(
          chantierIds,
          maille,
          codeInsee,
        ),
    getDécisionsByChantier: (chantierIds) =>
      getContainer("legacy")
        .resolve("décisionStratégiqueRepository")
        .récupérerLesPlusRécentesGroupéesParChantier(chantierIds),
    getCommentairesByChantier: (chantierIds, territoireCode, habilitations) =>
      getContainer("legacy")
        .resolve(
          "récupérerCommentairesLesPlusRécentsParTypeGroupésParChantiersUseCase",
        )
        .run(chantierIds, territoireCode, habilitations),
    getObjectifsByChantier: (chantierIds, habilitations) =>
      getContainer("legacy")
        .resolve(
          "récupérerObjectifsLesPlusRécentsParTypeGroupésParChantiersUseCase",
        )
        .run(chantierIds, habilitations),
  };
}

function computeAvancement(
  chantier: ChantierRapportDetailleContrat,
  statistiques: AvancementsStatistiques | undefined,
  context: RapportDetailleContext,
  selectedTerritoire: Territoire,
): AvancementChantierRapportDetaille {
  const agrégat = new AgrégateurChantierRapportDetailleParTerritoire(
    chantier,
  ).agréger();
  const { territoireCode, selectedMaille } = context;

  const regionalAvancement = (tauxAvancementType: "global" | "annuel") => {
    const régionCode =
      selectedTerritoire.maille === "regionale"
        ? territoireCode
        : selectedTerritoire.maille === "departementale"
          ? selectedTerritoire.codeParent
          : null;
    if (!régionCode) return { moyenne: null, date: null };
    const avancement =
      agrégat.regionale.territoires[régionCode].répartition.avancements[
        tauxAvancementType
      ];
    return { moyenne: avancement.avancement, date: avancement.date };
  };

  const departementalAvancement = (tauxAvancementType: "global" | "annuel") => {
    if (selectedTerritoire.maille !== "departementale") {
      return { moyenne: null, date: null };
    }
    const avancement =
      agrégat[selectedMaille].territoires[territoireCode].répartition
        .avancements[tauxAvancementType];
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
      global: departementalAvancement("global"),
      annuel: departementalAvancement("annuel"),
    },
    regionale: {
      global: regionalAvancement("global"),
      annuel: regionalAvancement("annuel"),
    },
  };
}

export async function loadChantierDetails(
  chantiers: ChantierRapportDetailleContrat[],
  context: RapportDetailleContext,
  selectedTerritoire: Territoire,
  dependencies: ChantierDetailsDependencies = defaultChantierDetailsDependencies(),
): Promise<ChantierDetail[]> {
  const chantierIds = chantiers.map((chantier) => chantier.id);
  const { habilitations } = context.session;
  const hasNationalAccess = new Habilitation(
    habilitations,
  ).peutAccéderAuTerritoire("NAT-FR");

  const [
    statistiquesByChantier,
    indicateursByChantier,
    détailsIndicateursByChantier,
    indicateursPrisEnCompte,
    synthèsesByChantier,
    décisionsByChantier,
    commentairesByChantier,
    objectifsByChantier,
  ] = await Promise.all([
    dependencies.getStatistiquesByChantier(
      chantierIds,
      context.selectedMaille,
      habilitations,
      context.jalon,
    ),
    dependencies.getIndicateursByChantier(chantierIds),
    dependencies.getDétailsIndicateursByChantier(
      chantierIds,
      context.chantierMaille,
      context.selectedCodeInsee,
      context.jalon,
    ),
    dependencies.getIndicateursPrisEnCompte(chantierIds),
    dependencies.getSynthèsesByChantier(
      chantierIds,
      context.chantierMaille,
      context.selectedCodeInsee,
    ),
    hasNationalAccess
      ? dependencies.getDécisionsByChantier(chantierIds)
      : Promise.resolve<Record<string, DécisionStratégique>>({}),
    dependencies.getCommentairesByChantier(
      chantierIds,
      context.territoireCode,
      habilitations,
    ),
    dependencies.getObjectifsByChantier(chantierIds, habilitations),
  ]);

  return chantiers.map((chantier) => {
    const territoires = objectEntries(chantier.mailles[context.selectedMaille]);
    return {
      chantierId: chantier.id,
      avancement: computeAvancement(
        chantier,
        statistiquesByChantier[chantier.id],
        context,
        selectedTerritoire,
      ),
      indicateurs: indicateursByChantier[chantier.id] ?? [],
      détailsIndicateurs: détailsIndicateursByChantier[chantier.id] ?? {},
      synthèseDesRésultats: synthèsesByChantier[chantier.id] ?? null,
      objectifs: objectifsByChantier[chantier.id] ?? [],
      commentaires: commentairesByChantier[chantier.id] ?? [],
      décisionStratégique: décisionsByChantier[chantier.id] ?? null,
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
