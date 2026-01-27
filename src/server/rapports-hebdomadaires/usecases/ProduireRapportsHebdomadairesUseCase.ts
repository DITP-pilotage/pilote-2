import logger from "@/server/infrastructure/Logger";
import { ActiviteComptesGateway } from "@/server/rapports-hebdomadaires/domain/ports/ActiviteComptesGateway";
import { CoordinateurGateway } from "@/server/rapports-hebdomadaires/domain/ports/CoordinateurGateway";
import { RapportRepository } from "@/server/rapports-hebdomadaires/domain/ports/RapportRepository";
import { calculerPeriodeDernierLundiNeufHeures } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";
import {
  creerRapportHebdomadaire,
  RapportHebdomadaire,
} from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";
import {
  Coordinateur,
  estDansPerimetreTerritorial,
} from "@/server/rapports-hebdomadaires/domain/Coordinateur";
import {
  ActiviteComptes,
  grouperEvenementsParType,
} from "@/server/rapports-hebdomadaires/domain/CompteActivite";

const PROFILS_CONCERNES = [
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
    },
  ) {}

  async run(): Promise<ProduireRapportResult> {
    const maintenant = new Date();
    const periode = calculerPeriodeDernierLundiNeufHeures({ maintenant });

    logger.info("Phase 1 démarrée", {
      dateExecution: maintenant.toISOString(),
      periodeDebut: periode.dateDebut.toISOString(),
      periodeFin: periode.dateFin.toISOString(),
    });

    const coordinateurs =
      await this.deps.coordinateurGateway.recupererCoordinateurs({
        profils: ["COORDINATEUR_REGION", "COORDINATEUR_DEPARTEMENT"],
      });

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
        logger.error("Erreur lors de la création du rapport", {
          coordinateurEmail: coordinateur.email,
          erreur: error instanceof Error ? error.message : String(error),
        });
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

  private async creerRapportPourCoordinateur(params: {
    coordinateur: Coordinateur;
    activiteGlobale: ActiviteComptes;
    periode: { dateDebut: Date; dateFin: Date };
    maintenant: Date;
  }): Promise<RapportHebdomadaire | null> {
    const { coordinateur, activiteGlobale, periode, maintenant } = params;

    const evenementsFiltres = activiteGlobale.filter((evt) => {
      const codeTerritoire = evt.compte.territoires[0]?.code;
      return estDansPerimetreTerritorial({
        coordinateur,
        codeTerritoireCompte: codeTerritoire,
      });
    });

    const { comptesCrees, comptesDesactives } =
      grouperEvenementsParType(evenementsFiltres);

    if (comptesCrees.length === 0 && comptesDesactives.length === 0) {
      return null;
    }

    const rapport = creerRapportHebdomadaire({
      coordinateur,
      periode,
      comptesCrees,
      comptesDesactives,
      dateCreation: maintenant,
    });

    await this.deps.rapportRepository.sauvegarder(rapport);

    logger.info("Rapport créé", {
      rapportId: rapport.id,
      coordinateurEmail: coordinateur.email,
      nombreComptesCrees: comptesCrees.length,
      nombreComptesDesactives: comptesDesactives.length,
    });

    return rapport;
  }
}
