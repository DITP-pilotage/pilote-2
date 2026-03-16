import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { TypeDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { NOMS_TYPES_DECISION_STRATEGIQUE } from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";

export type DecisionStrategiqueHistoriqueItem = {
  chantierId: string;
  type: TypeDecisionStrategique;
  contenu: string;
  dateCreation: string;
  dateModification: string;
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
        include: { auteur_modification: true },
        orderBy: { date_modification: "desc" },
      });

    return decisions.map((decision) => ({
      chantierId: decision.chantier_id,
      type: NOMS_TYPES_DECISION_STRATEGIQUE[decision.type],
      contenu: decision.contenu,
      dateCreation: decision.date_creation.toISOString(),
      dateModification: decision.date_modification.toISOString(),
      auteurModificationNom: decision.auteur_modification
        ? `${decision.auteur_modification.prenom} ${decision.auteur_modification.nom}`
        : "Auteur Inconnu",
    }));
  }
}
