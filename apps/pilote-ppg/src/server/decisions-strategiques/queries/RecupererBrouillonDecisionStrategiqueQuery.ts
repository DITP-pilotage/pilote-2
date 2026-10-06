import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { DecisionStrategiqueV2 } from "@/shared/chantier/decisionStrategique/DecisionStrategique.interface";

export class RecupererBrouillonDecisionStrategiqueQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    utilisateurId: string,
  ): Promise<DecisionStrategiqueV2 | null> {
    const brouillon = await this.deps.prisma
      .getInstance()
      .decision_strategique.findFirst({
        where: {
          chantier_id: chantierId,
          statut: $Enums.statut_publication.BROUILLON,
          auteur_modification_id: utilisateurId,
        },
        orderBy: { date_modification: "desc" },
      });

    if (!brouillon) return null;

    return {
      id: brouillon.id,
      chantierId: brouillon.chantier_id,
      contenu: brouillon.contenu,
      statut: brouillon.statut,
      auteurCreationId: brouillon.auteur_creation_id ?? "",
      dateCreation: brouillon.date_creation.toISOString(),
      auteurModificationId: brouillon.auteur_modification_id ?? "",
      dateModification: brouillon.date_modification.toISOString(),
    };
  }
}
