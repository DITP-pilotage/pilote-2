import { getContainer } from "@/server/dependances";
import Alerte from "@/server/domain/alerte/Alerte";
import Axe from "@/server/domain/axe/Axe.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { Chantier } from "@/server/chantiers/domain/Chantier";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  presenterEnAvancementsStatistiquesAccueilContrat,
} from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { presenterEnRépartitionsMétéosChantiersContrat } from "@/server/chantiers/app/contrats/RepartitionMeteoChantiersContrat";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import {
  hasAlerteFilter,
  RapportDetailleContext,
} from "@/server/rapport-detaille/rapportDetailleContext";
import { VueDEnsembleRapportDetaille } from "@/server/rapport-detaille/rapportDetaille.interface";

const PROFILS_ALLOWED_TO_SEE_BROUILLONS = new Set<string>([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
]);

export type VueDEnsembleDependencies = {
  getMinistèresAndAxes: (
    chantierIds: string[],
  ) => Promise<{ ministères: Ministère[]; axes: Axe[] }>;
  territoire: (territoireCode: string) => Promise<Territoire>;
  chantiers: (
    context: RapportDetailleContext,
    ministères: Ministère[],
    axes: Axe[],
  ) => Promise<ChantierRapportDetailleContrat[]>;
  getRépartitionMétéos: (
    territoireCode: string,
    filters: FiltreQueryParams,
    axes: Axe[],
    chantierIds: string[],
  ) => Promise<RepartitionMeteoContrat>;
  getAvancementsStatistiques: (
    chantierIds: string[],
    context: RapportDetailleContext,
  ) => Promise<AvancementsStatistiques>;
  getTerritoiresAvancements: (
    chantierIds: string[],
    context: RapportDetailleContext,
  ) => Promise<{
    moyenneTauxAvancementTerritoire: number | null;
    avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  }>;
};

export function restrictHabilitationsToChantiers(
  habilitations: Habilitations,
  chantierIds: string[],
): Habilitations {
  return {
    ...habilitations,
    lecture: {
      ...habilitations.lecture,
      chantiers: habilitations.lecture.chantiers.filter((chantierId) =>
        chantierIds.includes(chantierId),
      ),
    },
  };
}

export function defaultVueDEnsembleDependencies(): VueDEnsembleDependencies {
  return {
    getMinistèresAndAxes: async (chantierIds) => {
      if (chantierIds.length === 0) return { ministères: [], axes: [] };
      const [ministères, axes] = await Promise.all([
        getContainer("legacy")
          .resolve("ministèreRepository")
          .getListePourChantiers(chantierIds),
        getContainer("legacy")
          .resolve("axeRepository")
          .getListePourChantiers(chantierIds),
      ]);
      return { ministères, axes };
    },
    territoire: (territoireCode) =>
      getContainer("legacy")
        .resolve("territoireRepository")
        .récupérer(territoireCode),
    chantiers: (context, ministères, axes) =>
      getContainer("chantiers")
        .resolve(
          "recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2",
        )
        .run(
          context.session.habilitations,
          context.session.profil,
          context.territoireCode,
          context.chantierMaille,
          ministères,
          new Map(axes.map((axe) => [axe.id, axe])),
          context.filters,
          context.sorting,
          context.jalon,
          context.defaultJalon,
        ),
    getRépartitionMétéos: (territoireCode, filters, axes, chantierIds) =>
      getContainer("legacy")
        .resolve("recupererRepartitionsMeteoChantiersUseCase")
        .run(territoireCode, filters, axes, chantierIds)
        .then(presenterEnRépartitionsMétéosChantiersContrat),
    getAvancementsStatistiques: (chantierIds, context) =>
      getContainer("chantiers")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .run(
          chantierIds,
          context.selectedMaille,
          context.session.habilitations,
          context.jalon,
        ),
    getTerritoiresAvancements: async (chantierIds, context) => {
      const { agregat } = await getContainer("legacy")
        .resolve("agregerAvancementsChantiersUseCase")
        .run(chantierIds, context.jalon);
      return {
        moyenneTauxAvancementTerritoire:
          agregat[context.chantierMaille].territoires[context.territoireCode]
            .repartition.avancements.annuel.moyenne,
        avancementsGlobauxTerritoriauxMoyens: objectEntries(
          agregat[context.selectedMaille].territoires,
        ).map(([territoireCode, territoire]) => ({
          valeur: territoire.repartition.avancements.global.moyenne,
          valeurAnnuelle: territoire.repartition.avancements.annuel.moyenne,
          territoireCode,
          estApplicable: null,
        })),
      };
    },
  };
}

function filterByAlertes(
  chantiers: ChantierRapportDetailleContrat[],
  context: RapportDetailleContext,
): ChantierRapportDetailleContrat[] {
  const { alerteFilters, chantierMaille, territoireCode } = context;
  if (!hasAlerteFilter(alerteFilters)) return chantiers;

  return chantiers.filter((chantier) => {
    const territoireData = chantier.mailles[chantierMaille][territoireCode];
    return (
      (alerteFilters.estEnAlerteÉcart &&
        Alerte.estEnAlerteÉcart(territoireData.ecart.jalonParDefaut)) ||
      (alerteFilters.estEnAlerteBaisse &&
        Alerte.estEnAlerteBaisse(territoireData.tendance)) ||
      (alerteFilters.estEnAlerteTauxAvancementNonCalculé &&
        Alerte.estEnAlerteTauxAvancementNonCalculé(
          territoireData.avancement.global,
          chantier.cibleAttendu,
        )) ||
      (alerteFilters.estEnAlerteAbscenceTauxAvancementDepartemental &&
        Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
          chantier.aUnTauxAvancementDepartemental,
          chantier.cibleAttendu,
        )) ||
      (alerteFilters.estEnAlerteMétéoNonRenseignée &&
        Alerte.estEnAlerteMétéoNonRenseignée(territoireData.météo)) ||
      (alerteFilters.estEnAlertePossedePropositionsValeurAvancement &&
        Alerte.estEnAlertePossedePropositionsValeurAvancement(
          territoireData.aUnePropositionsValeurAvancement,
        ))
    );
  });
}

export async function loadFilteredChantiers(
  context: RapportDetailleContext,
  dependencies: VueDEnsembleDependencies = defaultVueDEnsembleDependencies(),
) {
  const [{ ministères, axes }, selectedTerritoire] = await Promise.all([
    dependencies.getMinistèresAndAxes(
      context.session.habilitations.lecture.chantiers,
    ),
    dependencies.territoire(context.territoireCode),
  ]);
  const allChantiers = await dependencies.chantiers(context, ministères, axes);
  return {
    ministères,
    axes,
    selectedTerritoire,
    allChantiers,
    chantiers: filterByAlertes(allChantiers, context),
  };
}

export async function loadChantiersByIds(
  chantierIds: string[],
  context: RapportDetailleContext,
  dependencies: VueDEnsembleDependencies = defaultVueDEnsembleDependencies(),
) {
  const restrictedContext: RapportDetailleContext = {
    ...context,
    session: {
      ...context.session,
      habilitations: restrictHabilitationsToChantiers(
        context.session.habilitations,
        chantierIds,
      ),
    },
  };
  const { chantiers, selectedTerritoire } = await loadFilteredChantiers(
    restrictedContext,
    dependencies,
  );
  return { chantiers, selectedTerritoire };
}

export async function loadVueDEnsemble(
  context: RapportDetailleContext,
  dependencies: VueDEnsembleDependencies = defaultVueDEnsembleDependencies(),
): Promise<VueDEnsembleRapportDetaille> {
  const { ministères, axes, selectedTerritoire, allChantiers, chantiers } =
    await loadFilteredChantiers(context, dependencies);
  const chantierIds = chantiers.map((chantier) => chantier.id);

  const [repartitionMeteosChantiers, statistiques, getTerritoiresAvancements] =
    await Promise.all([
      dependencies.getRépartitionMétéos(
        context.territoireCode,
        context.filters,
        axes,
        chantierIds,
      ),
      dependencies.getAvancementsStatistiques(chantierIds, context),
      dependencies.getTerritoiresAvancements(chantierIds, context),
    ]);

  const { filtresComptesCalculés } = Chantier.recupererStatistiqueListeChantier(
    allChantiers,
    context.chantierMaille,
    context.territoireCode,
  );

  return {
    chantiers,
    ministères,
    axes,
    selectedTerritoire,
    filtresComptesCalculés,
    avancementsAgrégés:
      presenterEnAvancementsStatistiquesAccueilContrat(statistiques),
    repartitionMeteosChantiers,
    ...getTerritoiresAvancements,
    estAutoriseAVoirLesBrouillons: PROFILS_ALLOWED_TO_SEE_BROUILLONS.has(
      context.session.profil,
    ),
    chantiersSontArchives: context.filters.statut.includes("ARCHIVE"),
  };
}
