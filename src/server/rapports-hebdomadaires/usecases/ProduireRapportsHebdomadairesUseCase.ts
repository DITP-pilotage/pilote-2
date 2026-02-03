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
  CompteActivite,
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

    const periode = this.calculerEtLoggerPeriode(maintenant);
    const coordinateurs = await this.recupererCoordinateurs();
    const { activiteGlobale, chantiersAvecIndicateurs } =
      await this.recupererDonneesDeReference({ periode, coordinateurs });

    return this.produireRapportsPourCoordinateurs({
      coordinateurs,
      activiteGlobale,
      chantiersAvecIndicateurs,
      periode,
      maintenant,
    });
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
    const { comptesCrees, comptesDesactives } = this.produireSectionComptes({
      coordinateur,
      activiteGlobale,
    });

    const sectionActiviteChantiersVA = await this.produireSectionActiviteVA({
      coordinateur,
      chantiersAvecIndicateurs,
      periode,
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
        (total, chantier) => total + chantier.indicateurs.length,
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

      for (const [chantierIdCandidat, chantier] of Object.entries(
        chantiersAvecIndicateurs,
      )) {
        const indicateurTrouve = chantier.indicateurs.find(
          (indicateur) => indicateur.id === activite.indicateurId,
        );
        if (indicateurTrouve) {
          chantierId = chantierIdCandidat;
          indicateurInfo = indicateurTrouve;
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

  private calculerEtLoggerPeriode(maintenant: Date) {
    const periode = calculerPeriodeDernierLundiNeufHeures({ maintenant });

    logger.info("Phase 1 démarrée", {
      dateExecution: maintenant.toISOString(),
      periodeDebut: periode.dateDebut.toISOString(),
      periodeFin: periode.dateFin.toISOString(),
    });

    return periode;
  }

  private async recupererCoordinateurs(): Promise<Coordinateur[]> {
    const coordinateurs =
      await this.deps.coordinateurGateway.recupererCoordinateurs([
        "COORDINATEUR_REGION",
        "COORDINATEUR_DEPARTEMENT",
      ]);

    logger.info("Coordinateurs récupérés", {
      nombreCoordinateurs: coordinateurs.length,
    });

    return coordinateurs;
  }

  private async recupererDonneesDeReference(params: {
    periode: { dateDebut: Date; dateFin: Date };
    coordinateurs: Coordinateur[];
  }): Promise<{
    activiteGlobale: ActiviteComptes;
    chantiersAvecIndicateurs: Record<string, ChantierAvecIndicateurs>;
  }> {
    const activiteGlobale =
      await this.deps.activiteComptesGateway.recupererActivite({
        dateDebut: params.periode.dateDebut,
        dateFin: params.periode.dateFin,
        profilCodes: PROFILS_CONCERNES,
      });

    logger.info("Activité globale récupérée", {
      nombreEvenements: activiteGlobale.length,
    });

    const tousLesChantierIds = [
      ...new Set(
        params.coordinateurs.flatMap((chantier) => chantier.chantiers),
      ),
    ];

    const chantiersAvecIndicateurs =
      await this.deps.chantierGateway.recupererIndicateursParChantiers(
        tousLesChantierIds,
      );

    return { activiteGlobale, chantiersAvecIndicateurs };
  }

  private async produireRapportsPourCoordinateurs(params: {
    coordinateurs: Coordinateur[];
    activiteGlobale: ActiviteComptes;
    chantiersAvecIndicateurs: Record<string, ChantierAvecIndicateurs>;
    periode: { dateDebut: Date; dateFin: Date };
    maintenant: Date;
  }): Promise<ProduireRapportResult> {
    let rapportsCrees = 0;
    let coordinateursSansActivite = 0;

    for (const coordinateur of params.coordinateurs) {
      try {
        const rapport = await this.creerRapportPourCoordinateur({
          coordinateur,
          activiteGlobale: params.activiteGlobale,
          periode: params.periode,
          maintenant: params.maintenant,
          chantiersAvecIndicateurs: params.chantiersAvecIndicateurs,
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
      dateExecution: params.maintenant,
    };
  }

  private produireSectionComptes(params: {
    coordinateur: Coordinateur;
    activiteGlobale: ActiviteComptes;
  }): {
    comptesCrees: CompteActivite[];
    comptesDesactives: CompteActivite[];
  } {
    const evenementsFiltres = params.activiteGlobale.filter((evenement) => {
      if (evenement.compte.email === params.coordinateur.email) {
        // TODO (CHAN - Rapport) : au final, on exlut ou pas ?
        return false;
      }

      return aDesDroitsSurTerritoire({
        coordinateur: params.coordinateur,
        codesTerritoires: evenement.compte.territoires.flatMap((territoire) => [
          territoire.code,
          ...territoire.enfants.map((enfant) => enfant.code),
        ]),
      });
    });

    return grouperEvenementsParType(evenementsFiltres);
  }

  private async produireSectionActiviteVA(params: {
    coordinateur: Coordinateur;
    chantiersAvecIndicateurs: Record<string, ChantierAvecIndicateurs>;
    periode: { dateDebut: Date; dateFin: Date };
  }): Promise<SectionActiviteChantiersVA> {
    const coordTerritoireCodes = params.coordinateur.territoires.flatMap(
      (territoire) => [
        territoire.code,
        ...territoire.enfants.map((enfant) => enfant.code),
      ],
    );

    const coordChantierIds = params.coordinateur.chantiers;
    const coordIndicateurIds = coordChantierIds.flatMap(
      (chantierId) =>
        params.chantiersAvecIndicateurs[chantierId]?.indicateurs.map(
          (indicateur) => indicateur.id,
        ) || [],
    );

    const [evenementsDansPeriode, evenementsAvantPeriode] = await Promise.all([
      this.deps.activiteVAGateway.recupererEvenementsDansPeriode({
        indicateurIds: coordIndicateurIds,
        territoireCodes: coordTerritoireCodes,
        periode: params.periode,
      }),
      this.deps.activiteVAGateway.recupererDernierEvenementAvantPeriode({
        indicateurIds: coordIndicateurIds,
        territoireCodes: coordTerritoireCodes,
        dateDebut: params.periode.dateDebut,
      }),
    ]);

    const activitesVA = foldEvenementsVA({
      evenementsDansPeriode,
      evenementsAvantPeriode,
    });

    return this.construireSectionChantiersVA({
      activitesVA,
      chantiersAvecIndicateurs: params.chantiersAvecIndicateurs,
      coordChantierIds,
    });
  }
}
