import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PrismaPilote } from "@/server/db/PrismaPilote";

const contenuRapportSchema = z.object({
  numero_semaine: z.number().nullable(),
  contenu_rapport: z.object({
    faits_marquants: z.string(),
    alerte: z.string(),
    alertes: z.array(
      z.object({
        nom_alerte: z.string(),
        type_alerte: z.string(),
        date_alerte: z.string(),
        date_fin_alerte: z.string().nullable(),
        territoire_code: z.string(),
      }),
    ),
    nombre_indicateurs_taux_avancement_non_renseignes: z.number(),
    nombre_chantiers_avec_indicateurs_taux_avancement_non_renseignes:
      z.number(),
  }),
});

export type RapportHebdomadaire = {
  id: string;
  periodeDebut: Date;
  periodeFin: Date;
  statutEnvoi: string;
  dateCreation: Date;
  numeroSemaine: number | null;
  contenuRapport: {
    faitsMarquants: string;
    alerte: string;
    alertes: Array<{
      nomAlerte: string;
      typeAlerte: string;
      dateAlerte: string;
      dateFinAlerte: string | null;
      territoireCode: string;
    }>;
    nombreIndicateursTauxAvancementNonRenseignes: number;
    nombreChantiersAvecIndicateursTauxAvancementNonRenseignes: number;
  };
};

export default class RecupererRapportHebdomadaireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    rapportId: string,
    coordinateurId: string,
  ): Promise<RapportHebdomadaire> {
    const rapport = await this.deps.prisma
      .getInstance()
      .rapport_hebdomadaire_coordinateur.findFirst({
        where: {
          id: rapportId,
          coordinateur_id: coordinateurId,
        },
      });

    if (!rapport) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Rapport hebdomadaire non trouvé",
      });
    }

    const rapportValide = contenuRapportSchema.parse({
      numero_semaine: rapport.numero_semaine,
      contenu_rapport: rapport.contenu_rapport,
    });

    return {
      id: rapport.id,
      periodeDebut: rapport.periode_debut,
      periodeFin: rapport.periode_fin,
      statutEnvoi: rapport.statut_envoi,
      dateCreation: rapport.date_creation,
      numeroSemaine: rapportValide.numero_semaine,
      contenuRapport: {
        faitsMarquants: rapportValide.contenu_rapport.faits_marquants,
        alerte: rapportValide.contenu_rapport.alerte,
        alertes: rapportValide.contenu_rapport.alertes.map((alerte) => ({
          nomAlerte: alerte.nom_alerte,
          typeAlerte: alerte.type_alerte,
          dateAlerte: alerte.date_alerte,
          dateFinAlerte: alerte.date_fin_alerte,
          territoireCode: alerte.territoire_code,
        })),
        nombreIndicateursTauxAvancementNonRenseignes:
          rapportValide.contenu_rapport
            .nombre_indicateurs_taux_avancement_non_renseignes,
        nombreChantiersAvecIndicateursTauxAvancementNonRenseignes:
          rapportValide.contenu_rapport
            .nombre_chantiers_avec_indicateurs_taux_avancement_non_renseignes,
      },
    };
  }
}
