import {
  $Enums,
  decision_strategique as DécisionStratégiquePrisma,
  type_decision_strategique as TypeDécisionStratégiquePrisma,
} from "@prisma/client";
import {
  DecisionStrategiqueV2,
  DécisionStratégique,
  TypeDecisionStrategique,
} from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const NOMS_TYPES_DÉCISION_STRATÉGIQUE: Record<
  string,
  TypeDecisionStrategique
> = {
  suivi_des_decisions: "suiviDesDécisionsStratégiques",
};

export const CODES_TYPES_DÉCISION_STRATÉGIQUE: Record<
  TypeDecisionStrategique,
  TypeDécisionStratégiquePrisma
> = {
  suiviDesDécisionsStratégiques: "suivi_des_decisions",
};

export default class DécisionStratégiqueSQLRepository implements DécisionStratégiqueRepository {
  private prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  get prisma() {
    return this.prismaClient.getInstance();
  }

  async getById(id: string): Promise<DecisionStrategiqueV2 | null> {
    const decision = await this.prisma.decision_strategique.findUnique({
      where: { id },
    });

    if (!decision) return null;

    return {
      id: decision.id,
      chantierId: decision.chantier_id,
      type: NOMS_TYPES_DÉCISION_STRATÉGIQUE[decision.type],
      contenu: decision.contenu,
      statut: decision.statut,
      auteurCreationId: decision.auteur_creation_id ?? "",
      auteurModificationId: decision.auteur_modification_id ?? "",
      dateCreation: decision.date_creation.toISOString(),
      dateModification: decision.date_modification.toISOString(),
    };
  }

  async save(decision: DecisionStrategiqueV2): Promise<void> {
    await this.prisma.decision_strategique.upsert({
      where: { id: decision.id },
      create: {
        id: decision.id,
        chantier_id: decision.chantierId,
        type: CODES_TYPES_DÉCISION_STRATÉGIQUE[decision.type],
        contenu: decision.contenu,
        statut: decision.statut,
        auteur_creation_id: decision.auteurCreationId,
        auteur_modification_id: decision.auteurModificationId,
        date_creation: new Date(decision.dateCreation),
        date_modification: new Date(decision.dateModification),
      },
      update: {
        contenu: decision.contenu,
        statut: decision.statut,
        auteur_modification_id: decision.auteurModificationId,
        date_modification: new Date(decision.dateModification),
      },
    });
  }

  async récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<string, DécisionStratégique>> {
    const décisionsStratégiques = await this.prisma.$queryRaw<
      (DécisionStratégiquePrisma & {
        prenom_auteur: string | null;
        nom_auteur: string | null;
      })[]
    >`
        SELECT d.*, u.prenom as prenom_auteur, u.nom as nom_auteur
        FROM decision_strategique d
          LEFT JOIN utilisateur u ON u.id = d.auteur_modification_id
          INNER JOIN (
            SELECT chantier_id, MAX(date_modification) as maxdate
            FROM decision_strategique
            WHERE chantier_id = ANY (${chantiersIds})
              AND statut = ${$Enums.statut_publication.PUBLIE}::"statut_publication"
            GROUP BY chantier_id
          ) d_recents
          ON d.date_modification = d_recents.maxdate
          AND d.chantier_id = d_recents.chantier_id
        WHERE d.statut = ${$Enums.statut_publication.PUBLIE}::"statut_publication"
    `;

    return Object.fromEntries(
      décisionsStratégiques.map((décisionStratégique) => [
        décisionStratégique.chantier_id,
        {
          id: décisionStratégique.id,
          type: NOMS_TYPES_DÉCISION_STRATÉGIQUE[décisionStratégique.type],
          contenu: décisionStratégique.contenu,
          date: décisionStratégique.date_modification.toISOString(),
          auteur: décisionStratégique.auteur_modification_id
            ? `${décisionStratégique.prenom_auteur} ${décisionStratégique.nom_auteur}`
            : "Auteur Inconnu",
        },
      ]),
    );
  }
}
