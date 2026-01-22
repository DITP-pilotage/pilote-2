import { EmailManager } from "@/server/infrastructure/email-manager";
import { EnvoieEmailService } from "@/server/rapports-hebdomadaires/domain/ports/EnvoieEmailService";
import { RapportHebdomadaire } from "@/server/rapports-hebdomadaires/domain/RapportHebdomadaire";

const TEMPLATE_ID_RAPPORT_COORDINATEURS = 5;

interface Dependencies {
  emailManager: EmailManager;
}

export class BrevoEnvoieEmailService implements EnvoieEmailService {
  constructor(private readonly deps: Dependencies) {}

  async envoyerRapportHebdomadaire(params: {
    rapport: RapportHebdomadaire;
  }): Promise<void> {
    const { rapport } = params;

    const templateParams = {
      prenom: rapport.coordinateur.prenom,
      nom: rapport.coordinateur.nom,
      territoire: rapport.coordinateur.territoire.nom,
      dateDebut: this.formatDateFr(rapport.periode.dateDebut),
      dateFin: this.formatDateTimeFr(rapport.periode.dateFin),
      comptesCreés: rapport.sectionActiviteComptes.comptesCreés.map((c) => ({
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
        profil: c.profil,
        territoires:
          c.territoires.length > 0
            ? c.territoires.map((t) => t.nom).join(", ")
            : undefined,
      })),
      comptesDésactivés: rapport.sectionActiviteComptes.comptesDésactivés.map(
        (c) => ({
          nom: c.nom,
          prenom: c.prenom,
          email: c.email,
          profil: c.profil,
          territoires:
            c.territoires.length > 0
              ? c.territoires.map((t) => t.nom).join(", ")
              : undefined,
        }),
      ),
    };

    await this.deps.emailManager.sendTransactionalEmail(
      [{ email: rapport.coordinateur.email }],
      TEMPLATE_ID_RAPPORT_COORDINATEURS,
      templateParams,
    );
  }

  private formatDateFr(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
  }

  private formatDateTimeFr(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  }
}
