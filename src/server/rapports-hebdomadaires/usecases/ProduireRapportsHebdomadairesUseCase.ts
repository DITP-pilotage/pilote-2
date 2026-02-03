import logger from "@/server/infrastructure/Logger";
import {
  ActiviteComptesGateway,
  ProfilTerritorialise,
} from "@/server/rapports-hebdomadaires/domain/ports/ActiviteComptesGateway";
import { CoordinateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/CoordinateurGateway";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import {
  ChantierGateway,
  ChantierAvecIndicateurs,
} from "@/server/rapports-hebdomadaires/domain/ports/ChantierGateway";
import { ActiviteVAGateway } from "@/server/rapports-hebdomadaires/domain/ports/ActiviteVAGateway";
import { calculerPeriodeDernierLundiNeufHeures } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";
import {
  creerRapportHebdomadaire,
  RapportHebdomadaire,
} from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import {
  Coordinateur,
  aDesDroitsSurTerritoire,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import {
  ActiviteComptes,
  grouperEvenementsParType,
} from "@/server/rapports-hebdomadaires/domain/CompteActivite";
import {
  foldEvenementsVA,
  SectionActiviteChantiersVA,
  ActiviteIndicateurVA,
  SectionIndicateurVA,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";

const PROFILS_CONCERNES: ProfilTerritorialise[] = [
  "COORDINATEUR_REGION",
  "COORDINATEUR_DEPARTEMENT",
  "PREFET_REGION",
  "PREFET_DEPARTEMENT",
  "SERVICES_DECONCENTRES_REGION",
  "SERVICES_DECONCENTRES_DEPARTEMENT",
];

type ProduireRapportResult = {
  rapportsCrees: number;
  coordinateursSansActivite: number;
  dateExecution: Date;
};

export class ProduireRapportsHebdomadairesUseCase {
  constructor(
    private readonly deps: {
      activiteComptesGateway: ActiviteComptesGateway;
      coordinateurGateway: CoordinateurGateway;
      rapportRepository: RapportRepository;
      chantierGateway: ChantierGateway;
      activiteVAGateway: ActiviteVAGateway;
    },
  ) {}

  async run(params?: { maintenant?: Date }): Promise<ProduireRapportResult> {
    const maintenant = params?.maintenant ?? new Date();
    const periode = calculerPeriodeDernierLundiNeufHeures({ maintenant });

    logger.info("Phase 1 démarrée", {
      dateExecution: maintenant.toISOString(),
      periodeDebut: periode.dateDebut.toISOString(),
      periodeFin: periode.dateFin.toISOString(),
    });

    const coordinateurs =
      await this.deps.coordinateurGateway.recupererCoordinateurs([
        "COORDINATEUR_REGION",
        "COORDINATEUR_DEPARTEMENT",
      ]);

    logger.info("Coordinateurs récupérés", {
      nombreCoordinateurs: coordinateurs.length,
    });

    const activiteGlobale =
      await this.deps.activiteComptesGateway.recupererActivite({
        dateDebut: periode.dateDebut,
        dateFin: periode.dateFin,
        profilCodes: PROFILS_CONCERNES,
      });

    logger.info("Activité globale récupérée", {
      nombreEvenements: activiteGlobale.length,
    });

    const tousLesChantierIds = [
      ...new Set(coordinateurs.flatMap((chantier) => chantier.chantiers)),
    ];

    const chantiersAvecIndicateurs =
      await this.deps.chantierGateway.recupererIndicateursParChantiers(
        tousLesChantierIds,
      );

    let rapportsCrees = 0;
    let coordinateursSansActivite = 0;

    for (const coordinateur of coordinateurs) {
      try {
        const rapport = await this.creerRapportPourCoordinateur({
          coordinateur,
          activiteGlobale,
          periode,
          maintenant,
          chantiersAvecIndicateurs,
        });

        if (rapport) {
          rapportsCrees++;
        } else {
          coordinateursSansActivite++;
        }
      } catch (error) {
        logger.error(
          {
            coordinateurEmail: coordinateur.email,
            erreur: error instanceof Error ? error.message : String(error),
          },
          "Erreur lors de la création du rapport",
        );
      }
    }

    logger.info("Phase 1 terminée", {
      rapportsCrees,
      coordinateursSansActivite,
    });

    return {
      rapportsCrees,
      coordinateursSansActivite,
      dateExecution: maintenant,
    };
  }

  private async creerRapportPourCoordinateur({
    coordinateur,
    activiteGlobale,
    periode,
    maintenant,
    chantiersAvecIndicateurs,
  }: {
    coordinateur: Coordinateur;
    activiteGlobale: ActiviteComptes;
    periode: { dateDebut: Date; dateFin: Date };
    maintenant: Date;
    chantiersAvecIndicateurs: Record<string, ChantierAvecIndicateurs>;
  }): Promise<RapportHebdomadaire | null> {
    const evenementsFiltres = activiteGlobale.filter((evenement) => {
      if (evenement.compte.email === coordinateur.email) {
        // TODO (CHAN - Rapport) : au final, on exlut ou pas ?
        return false;
      }

      return aDesDroitsSurTerritoire({
        coordinateur,
        codesTerritoires: evenement.compte.territoires.flatMap((territoire) => [
          territoire.code,
          ...territoire.enfants.map((enfant) => enfant.code),
        ]),
      });
    });

    const { comptesCrees, comptesDesactives } =
      grouperEvenementsParType(evenementsFiltres);

    const coordTerritoireCodes = coordinateur.territoires.flatMap((t) => [
      t.code,
      ...t.enfants.map((e) => e.code),
    ]);

    const coordChantierIds = coordinateur.chantiers;
    const coordIndicateurIds = coordChantierIds.flatMap(
      (cid) =>
        chantiersAvecIndicateurs[cid]?.indicateurs.map((i) => i.id) || [],
    );

    const evenementsDansPeriode =
      await this.deps.activiteVAGateway.recupererEvenementsDansPeriode({
        indicateurIds: coordIndicateurIds,
        territoireCodes: coordTerritoireCodes,
        periode,
      });

    const evenementsAvantPeriode =
      await this.deps.activiteVAGateway.recupererDernierEvenementAvantPeriode({
        indicateurIds: coordIndicateurIds,
        territoireCodes: coordTerritoireCodes,
        dateDebut: periode.dateDebut,
      });

    const activitesVA = foldEvenementsVA({
      evenementsDansPeriode,
      evenementsAvantPeriode,
    });

    const sectionActiviteChantiersVA = this.construireSectionChantiersVA({
      activitesVA,
      chantiersAvecIndicateurs,
      coordChantierIds,
    });

    const hasAccountActivity =
      comptesCrees.length > 0 || comptesDesactives.length > 0;
    const hasVAActivity = sectionActiviteChantiersVA.chantiers.length > 0;

    if (!hasAccountActivity && !hasVAActivity) {
      return null;
    }

    const rapport = creerRapportHebdomadaire({
      coordinateur,
      periode,
      comptesCrees,
      comptesDesactives,
      sectionActiviteChantiersVA,
      dateCreation: maintenant,
    });

    await this.deps.rapportRepository.sauvegarder(rapport);

    logger.info("Rapport créé", {
      rapportId: rapport.id,
      coordinateurEmail: coordinateur.email,
      nombreComptesCrees: comptesCrees.length,
      nombreComptesDesactives: comptesDesactives.length,
      nombreChangementsVA: sectionActiviteChantiersVA.chantiers.reduce(
        (sum, c) => sum + c.indicateurs.length,
        0,
      ),
    });

    return rapport;
  }

  private construireSectionChantiersVA(params: {
    activitesVA: ActiviteIndicateurVA[];
    chantiersAvecIndicateurs: Record<string, ChantierAvecIndicateurs>;
    coordChantierIds: string[];
  }): SectionActiviteChantiersVA {
    const { activitesVA, chantiersAvecIndicateurs, coordChantierIds } = params;

    const activitesParChantier = new Map<
      string,
      {
        chantier: ChantierAvecIndicateurs;
        indicateurs: Map<string, SectionIndicateurVA>;
      }
    >();

    for (const activite of activitesVA) {
      let chantierId: string | null = null;
      let indicateurInfo: { id: string; nom: string } | null = null;

      for (const [cid, chantier] of Object.entries(chantiersAvecIndicateurs)) {
        const indic = chantier.indicateurs.find(
          (i) => i.id === activite.indicateurId,
        );
        if (indic) {
          chantierId = cid;
          indicateurInfo = indic;
          break;
        }
      }

      if (!chantierId || !indicateurInfo) continue;
      if (!coordChantierIds.includes(chantierId)) continue;

      const chantier = chantiersAvecIndicateurs[chantierId];

      if (!activitesParChantier.has(chantierId)) {
        activitesParChantier.set(chantierId, {
          chantier,
          indicateurs: new Map(),
        });
      }

      const chantierData = activitesParChantier.get(chantierId)!;

      if (!chantierData.indicateurs.has(indicateurInfo.id)) {
        chantierData.indicateurs.set(indicateurInfo.id, {
          indicateur: indicateurInfo,
          territoires: [],
        });
      }

      chantierData.indicateurs.get(indicateurInfo.id)!.territoires.push({
        territoire: {
          code: activite.territoireCode,
          nom: activite.territoireNom,
        },
        valeurAvant: activite.valeurAvant,
        valeurApres: activite.valeurApres,
        dateChangement: activite.dateChangement.toISOString(),
      });
    }

    return {
      chantiers: Array.from(activitesParChantier.values()).map((data) => ({
        chantier: { id: data.chantier.id, nom: data.chantier.nom },
        indicateurs: Array.from(data.indicateurs.values()),
      })),
    };
  }
}
