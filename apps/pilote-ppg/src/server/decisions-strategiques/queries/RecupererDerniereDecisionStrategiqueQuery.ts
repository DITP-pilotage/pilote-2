import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { DecisionStrategiqueV2AvecNomsAuteurs } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";

export class RecupererDerniereDecisionStrategiqueQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
  ): Promise<DecisionStrategiqueV2AvecNomsAuteurs | null> {
    const decision = await this.deps.prisma
      .getInstance()
      .decision_strategique.findFirst({
        where: {
          chantier_id: chantierId,
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: { auteur_creation: true, auteur_modification: true },
        orderBy: { date_modification: "desc" },
      });

    if (!decision) return null;

    return {
      id: decision.id,
      chantierId: decision.chantier_id,
      contenu: decision.contenu,
      statut: decision.statut,
      auteurCreationId: decision.auteur_creation_id,
      dateCreation: decision.date_creation.toISOString(),
      auteurModificationId: decision.auteur_modification_id,
      dateModification: decision.date_modification.toISOString(),
      auteurCreationNom: `${decision.auteur_creation.prenom} ${decision.auteur_creation.nom}`,
      auteurModificationNom: `${decision.auteur_modification.prenom} ${decision.auteur_modification.nom}`,
    };
  }
}
