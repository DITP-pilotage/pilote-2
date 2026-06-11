import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getServiceLibelle } from "@/utils/referentiel-services";

export type DecisionStrategiqueHistoriqueItem = {
  chantierId: string;
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurCreationService: string | null;
  auteurCreationFonction: string | null;
  auteurModificationNom: string;
  auteurModificationService: string | null;
  auteurModificationFonction: string | null;
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
      auteurCreationNom: `${decision.auteur_creation.prenom} ${decision.auteur_creation.nom}`,
      auteurCreationService: getServiceLibelle(
        decision.auteur_creation.perimetre_ministeriel,
        decision.auteur_creation.service,
        decision.auteur_creation.service_autre,
      ),
      auteurCreationFonction: decision.auteur_creation.fonction,
      auteurModificationNom: `${decision.auteur_modification.prenom} ${decision.auteur_modification.nom}`,
      auteurModificationService: getServiceLibelle(
        decision.auteur_modification.perimetre_ministeriel,
        decision.auteur_modification.service,
        decision.auteur_modification.service_autre,
      ),
      auteurModificationFonction: decision.auteur_modification.fonction,
    }));
  }
}
