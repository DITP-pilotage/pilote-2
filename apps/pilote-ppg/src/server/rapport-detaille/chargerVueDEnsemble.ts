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
  aUnFiltreAlerte,
  ContexteRapportDetaille,
} from "@/server/rapport-detaille/contexteRapportDetaille";
import {
  ChantierRapportDetailleSansMailles,
  VueDEnsembleRapportDetaille,
} from "@/server/rapport-detaille/rapportDetaille.interface";

const PROFILS_AUTORISE_VOIR_BROUILLONS = new Set<string>([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
]);

export type DependancesVueDEnsemble = {
  ministèresEtAxes: (
    chantierIds: string[],
  ) => Promise<{ ministères: Ministère[]; axes: Axe[] }>;
  territoire: (territoireCode: string) => Promise<Territoire>;
  chantiers: (
    contexte: ContexteRapportDetaille,
    ministères: Ministère[],
    axes: Axe[],
  ) => Promise<ChantierRapportDetailleContrat[]>;
  répartitionMétéos: (
    territoireCode: string,
    filtres: FiltreQueryParams,
    axes: Axe[],
    chantierIds: string[],
  ) => Promise<RepartitionMeteoContrat>;
  statistiquesAgrégées: (
    chantierIds: string[],
    contexte: ContexteRapportDetaille,
  ) => Promise<AvancementsStatistiques>;
  avancementsTerritoires: (
    chantierIds: string[],
    contexte: ContexteRapportDetaille,
  ) => Promise<{
    moyenneTauxAvancementTerritoire: number | null;
    avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  }>;
};

export function restreindreHabilitationsAuxChantiers(
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

export function dependancesVueDEnsemble(): DependancesVueDEnsemble {
  return {
    ministèresEtAxes: async (chantierIds) => {
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
    chantiers: (contexte, ministères, axes) =>
      getContainer("chantiers")
        .resolve(
          "recupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2",
        )
        .run(
          contexte.session.habilitations,
          contexte.session.profil,
          contexte.territoireCode,
          contexte.mailleChantier,
          ministères,
          new Map(axes.map((axe) => [axe.id, axe])),
          contexte.filtres,
          contexte.sorting,
          contexte.jalon,
          contexte.jalonParDefaut,
        ),
    répartitionMétéos: (territoireCode, filtres, axes, chantierIds) =>
      getContainer("legacy")
        .resolve("recupererRepartitionsMeteoChantiersUseCase")
        .run(territoireCode, filtres, axes, chantierIds)
        .then(presenterEnRépartitionsMétéosChantiersContrat),
    statistiquesAgrégées: (chantierIds, contexte) =>
      getContainer("chantiers")
        .resolve("récupérerStatistiquesAvancementChantiersUseCase")
        .run(
          chantierIds,
          contexte.mailleSelectionnee,
          contexte.session.habilitations,
          contexte.jalon,
        ),
    avancementsTerritoires: async (chantierIds, contexte) => {
      const { agregat } = await getContainer("legacy")
        .resolve("agregerAvancementsChantiersUseCase")
        .run(chantierIds, contexte.jalon);
      return {
        moyenneTauxAvancementTerritoire:
          agregat[contexte.mailleChantier].territoires[contexte.territoireCode]
            .repartition.avancements.annuel.moyenne,
        avancementsGlobauxTerritoriauxMoyens: objectEntries(
          agregat[contexte.mailleSelectionnee].territoires,
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

function filtrerParAlertes(
  chantiers: ChantierRapportDetailleContrat[],
  contexte: ContexteRapportDetaille,
): ChantierRapportDetailleContrat[] {
  const { filtresAlertes, mailleChantier, territoireCode } = contexte;
  if (!aUnFiltreAlerte(filtresAlertes)) return chantiers;

  return chantiers.filter((chantier) => {
    const donnéesTerritoire = chantier.mailles[mailleChantier][territoireCode];
    return (
      (filtresAlertes.estEnAlerteÉcart &&
        Alerte.estEnAlerteÉcart(donnéesTerritoire.ecart.jalonParDefaut)) ||
      (filtresAlertes.estEnAlerteBaisse &&
        Alerte.estEnAlerteBaisse(donnéesTerritoire.tendance)) ||
      (filtresAlertes.estEnAlerteTauxAvancementNonCalculé &&
        Alerte.estEnAlerteTauxAvancementNonCalculé(
          donnéesTerritoire.avancement.global,
          chantier.cibleAttendu,
        )) ||
      (filtresAlertes.estEnAlerteAbscenceTauxAvancementDepartemental &&
        Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
          chantier.aUnTauxAvancementDepartemental,
          chantier.cibleAttendu,
        )) ||
      (filtresAlertes.estEnAlerteMétéoNonRenseignée &&
        Alerte.estEnAlerteMétéoNonRenseignée(donnéesTerritoire.météo)) ||
      (filtresAlertes.estEnAlertePossedePropositionsValeurAvancement &&
        Alerte.estEnAlertePossedePropositionsValeurAvancement(
          donnéesTerritoire.aUnePropositionsValeurAvancement,
        ))
    );
  });
}

export async function chargerChantiersFiltres(
  contexte: ContexteRapportDetaille,
  dependances: DependancesVueDEnsemble = dependancesVueDEnsemble(),
) {
  const [{ ministères, axes }, territoireSélectionné] = await Promise.all([
    dependances.ministèresEtAxes(
      contexte.session.habilitations.lecture.chantiers,
    ),
    dependances.territoire(contexte.territoireCode),
  ]);
  const tousLesChantiers = await dependances.chantiers(
    contexte,
    ministères,
    axes,
  );
  return {
    ministères,
    axes,
    territoireSélectionné,
    tousLesChantiers,
    chantiers: filtrerParAlertes(tousLesChantiers, contexte),
  };
}

export async function chargerChantiersParIds(
  chantierIds: string[],
  contexte: ContexteRapportDetaille,
  dependances: DependancesVueDEnsemble = dependancesVueDEnsemble(),
) {
  const contexteRestreint: ContexteRapportDetaille = {
    ...contexte,
    session: {
      ...contexte.session,
      habilitations: restreindreHabilitationsAuxChantiers(
        contexte.session.habilitations,
        chantierIds,
      ),
    },
  };
  const { chantiers, territoireSélectionné } = await chargerChantiersFiltres(
    contexteRestreint,
    dependances,
  );
  return { chantiers, territoireSélectionné };
}

export async function chargerVueDEnsemble(
  contexte: ContexteRapportDetaille,
  dependances: DependancesVueDEnsemble = dependancesVueDEnsemble(),
): Promise<VueDEnsembleRapportDetaille> {
  const {
    ministères,
    axes,
    territoireSélectionné,
    tousLesChantiers,
    chantiers,
  } = await chargerChantiersFiltres(contexte, dependances);
  const chantierIds = chantiers.map((chantier) => chantier.id);

  const [repartitionMeteosChantiers, statistiques, avancementsTerritoires] =
    await Promise.all([
      dependances.répartitionMétéos(
        contexte.territoireCode,
        contexte.filtres,
        axes,
        chantierIds,
      ),
      dependances.statistiquesAgrégées(chantierIds, contexte),
      dependances.avancementsTerritoires(chantierIds, contexte),
    ]);

  const { filtresComptesCalculés } = Chantier.recupererStatistiqueListeChantier(
    tousLesChantiers,
    contexte.mailleChantier,
    contexte.territoireCode,
  );

  return {
    chantiers,
    ministères,
    axes,
    territoireSélectionné,
    filtresComptesCalculés,
    avancementsAgrégés:
      presenterEnAvancementsStatistiquesAccueilContrat(statistiques),
    repartitionMeteosChantiers,
    ...avancementsTerritoires,
    estAutoriseAVoirLesBrouillons: PROFILS_AUTORISE_VOIR_BROUILLONS.has(
      contexte.session.profil,
    ),
    chantiersSontArchives: contexte.filtres.statut.includes("ARCHIVE"),
  };
}

export function sansMailles(
  chantier: ChantierRapportDetailleContrat,
): ChantierRapportDetailleSansMailles {
  const { mailles: _mailles, ...reste } = chantier;
  return reste;
}
