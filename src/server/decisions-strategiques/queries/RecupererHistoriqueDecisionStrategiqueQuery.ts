import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type DecisionStrategiqueHistoriqueItem = {
  chantierId: string;
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurModificationNom: string;
};

export class RecupererHistoriqueDecisionStrategiqueQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(chantierId: string): Promise<DecisionStrategiqueHistoriqueItem[]> {
    const decisions = await this.deps.prisma
      .getInstance()
      .decision_strategique.findMany({
        where: {
          chantier_id: chantierId,
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: { auteur_creation: true, auteur_modification: true },
        orderBy: { date_modification: "desc" },
      });

    return decisions.map((decision) => ({
      chantierId: decision.chantier_id,
      contenu: decision.contenu,
      dateCreation: decision.date_creation.toISOString(),
      dateModification: decision.date_modification.toISOString(),
      auteurCreationNom: decision.auteur_creation
        ? `${decision.auteur_creation.prenom} ${decision.auteur_creation.nom}`
        : "Auteur Inconnu",
      auteurModificationNom: decision.auteur_modification
        ? `${decision.auteur_modification.prenom} ${decision.auteur_modification.nom}`
        : "Auteur Inconnu",
    }));
  }
}
