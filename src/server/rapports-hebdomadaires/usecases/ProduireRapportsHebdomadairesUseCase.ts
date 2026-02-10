import logger from "@/server/infrastructure/Logger";
import {
  ActiviteComptesGateway,
  ProfilTerritorialise,
} from "@/server/rapports-hebdomadaires/domain/ports/ActiviteComptesGateway";
import { CoordinateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/CoordinateurGateway";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import {
  ChantierAvecIndicateurs,
  ChantierGateway,
  getChantiersIndicateursIds,
} from "@/server/rapports-hebdomadaires/domain/ports/ChantierGateway";
import { ActiviteIndicateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/ActiviteVAGateway";
import { calculerPeriodeDernierLundiNeufHeures } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";
import {
  creerRapportHebdomadaire,
  RapportHebdomadaire,
} from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import {
  aDesDroitsSurTerritoire,
  Coordinateur,
  getTerritoiresCoordinateur,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import {
  ActiviteComptes,
  CompteActivite,
  grouperEvenementsParType,
} from "@/server/rapports-hebdomadaires/domain/CompteActivite";
import {
  ActiviteIndicateur,
  grouperEvenements,
  SectionChantier,
  SectionIndicateur,
} from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiers";

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
      activiteIndicateurGateway: ActiviteIndicateurGateway;
    },
  ) {}

  async run(params?: { maintenant?: Date }): Promise<ProduireRapportResult> {
    const maintenant = params?.maintenant ?? new Date();

    const periode = this.calculerEtLoggerPeriode(maintenant);
    const coordinateurs = await this.recupererCoordinateurs();
    const activiteGlobale = await this.recupererDonneesDeReference({ periode });

    return this.produireRapportsPourCoordinateurs({
      coordinateurs,
      activiteGlobale,
      periode,
      maintenant,
    });
  }

  private async creerRapportPourCoordinateur({
    coordinateur,
    activiteGlobale,
    periode,
    maintenant,
  }: {
    coordinateur: Coordinateur;
    activiteGlobale: ActiviteComptes;
    periode: { dateDebut: Date; dateFin: Date };
    maintenant: Date;
  }): Promise<RapportHebdomadaire | null> {
    const { comptesCrees, comptesDesactives } = this.produireSectionComptes({
      coordinateur,
      activiteGlobale,
    });

    const chantiers = await this.produireSectionActivite({
      coordinateur,
      periode,
    });

    const rapport = creerRapportHebdomadaire({
      coordinateur,
      periode,
      comptesCrees,
      comptesDesactives,
      chantiers,
      dateCreation: maintenant,
    });

    if (!rapport) {
      return null;
    }

    await this.deps.rapportRepository.sauvegarder(rapport);

    logger.info("Rapport créé", {
      rapportId: rapport.id,
      coordinateurEmail: coordinateur.email,
      nombreComptesCrees: comptesCrees.length,
      nombreComptesDesactives: comptesDesactives.length,
      nombreChangementsChantiers: chantiers.reduce(
        (total, chantier) => total + chantier.indicateurs.length,
        0,
      ),
    });

    return rapport;
  }

  private construireSectionChantiers({
    activites,
    chantiersAvecIndicateurs,
  }: {
    activites: ActiviteIndicateur[];
    chantiersAvecIndicateurs: Record<string, ChantierAvecIndicateurs>;
  }): SectionChantier[] {
    const coordChantierIds = Object.keys(chantiersAvecIndicateurs);
    const activitesParChantier = new Map<
      string,
      {
        chantier: ChantierAvecIndicateurs;
        indicateurs: Map<string, SectionIndicateur>;
      }
    >();

    for (const activite of activites) {
      let chantierId: string | null = null;
      let indicateurInfo: { id: string; nom: string } | null = null;

      for (const [chantierIdCandidat, chantier] of Object.entries(
        chantiersAvecIndicateurs,
      )) {
        const indicateurTrouve = chantier.indicateurs.find(
          (indicateur) => indicateur.id === activite.indicateur.id,
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
          id: indicateurInfo.id,
          nom: indicateurInfo.nom,
          territoires: [],
        });
      }

      chantierData.indicateurs.get(indicateurInfo.id)!.territoires.push({
        code: activite.territoire.code,
        nom: activite.territoire.nom,
        typeValeur: activite.typeValeur,
        valeur: activite.valeur,
        dateValeur: activite.dateValeur.toISOString(),
        dateEvenement: activite.dateEvenement.toISOString(),
      });
    }

    return Array.from(activitesParChantier.values()).map((data) => ({
      id: data.chantier.id,
      nom: data.chantier.nom,
      indicateurs: Array.from(data.indicateurs.values()),
    }));
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

  private async recupererDonneesDeReference({
    periode: { dateDebut, dateFin },
  }: {
    periode: { dateDebut: Date; dateFin: Date };
  }): Promise<ActiviteComptes> {
    const activiteGlobale =
      await this.deps.activiteComptesGateway.recupererActivite({
        dateDebut,
        dateFin,
        profilCodes: PROFILS_CONCERNES,
      });

    logger.info("Activité globale récupérée", {
      nombreEvenements: activiteGlobale.length,
    });

    return activiteGlobale;
  }

  private async recupererChantiersAccessiblesPourCoordinateur(
    coordinateur: Coordinateur,
  ): Promise<Record<string, ChantierAvecIndicateurs>> {
    return this.deps.chantierGateway.recupererChantiersAccessibles({
      territoireCodes: getTerritoiresCoordinateur(coordinateur),
    });
  }

  private async produireRapportsPourCoordinateurs({
    activiteGlobale,
    coordinateurs,
    maintenant,
    periode,
  }: {
    coordinateurs: Coordinateur[];
    activiteGlobale: ActiviteComptes;
    periode: { dateDebut: Date; dateFin: Date };
    maintenant: Date;
  }): Promise<ProduireRapportResult> {
    let rapportsCrees = 0;
    let coordinateursSansActivite = 0;

    for (const coordinateur of coordinateurs) {
      try {
        const rapport = await this.creerRapportPourCoordinateur({
          coordinateur,
          activiteGlobale,
          periode,
          maintenant,
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

  private produireSectionComptes({
    activiteGlobale,
    coordinateur,
  }: {
    coordinateur: Coordinateur;
    activiteGlobale: ActiviteComptes;
  }): {
    comptesCrees: CompteActivite[];
    comptesDesactives: CompteActivite[];
  } {
    const evenementsFiltres = activiteGlobale.filter((evenement) => {
      if (evenement.compte.email === coordinateur.email) {
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

    return grouperEvenementsParType(evenementsFiltres);
  }

  private async produireSectionActivite({
    coordinateur,
    periode,
  }: {
    coordinateur: Coordinateur;
    periode: { dateDebut: Date; dateFin: Date };
  }): Promise<SectionChantier[]> {
    const chantiersAvecIndicateurs =
      await this.recupererChantiersAccessiblesPourCoordinateur(coordinateur);
    const territoiresCoordinateur = getTerritoiresCoordinateur(coordinateur);
    const chantiers = Object.values(chantiersAvecIndicateurs);
    const indicateurIds = getChantiersIndicateursIds(chantiers);

    const evenementsDansPeriode =
      await this.deps.activiteIndicateurGateway.recupererEvenementsDansPeriode({
        territoireCodes: territoiresCoordinateur,
        indicateurIds,
        periode,
      });

    const indicateurTerritoiresApplicables = new Map<string, Set<string>>();
    for (const chantier of Object.values(chantiersAvecIndicateurs)) {
      for (const indicateur of chantier.indicateurs) {
        indicateurTerritoiresApplicables.set(
          indicateur.id,
          new Set(indicateur.territoiresApplicables),
        );
      }
    }

    const evenementsFiltres = evenementsDansPeriode.filter((evenement) => {
      const applicables =
        indicateurTerritoiresApplicables.get(evenement.indicateur.id) ??
        new Set();

      return applicables.has(evenement.territoire.code);
    });

    const activites = grouperEvenements(evenementsFiltres);

    return this.construireSectionChantiers({
      activites,
      chantiersAvecIndicateurs,
    });
  }
}
