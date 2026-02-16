import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ActionCompteInactifRepository } from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import { ActionCompteInactif } from "@/server/gestion-utilisateur/domain/ActionCompteInactif";

export class PrismaActionCompteInactifRepository implements ActionCompteInactifRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async sauvegarder(action: ActionCompteInactif): Promise<void> {
    await this.dependencies.prisma.getInstance().action_compte_inactif.upsert({
      where: { id: action.id },
      create: {
        id: action.id,
        utilisateur_id: action.utilisateurId,
        type_action: action.typeAction,
        date_creation: action.dateCreation,
        statut: action.statut,
      },
      update: {
        statut: action.statut,
        date_succes: action.dateSucces,
        date_derniere_tentative: action.dateDerniereTentative,
        nombre_tentatives: action.nombreTentatives,
        erreur: action.erreur,
      },
    });
  }

  async recupererActionsParTypeEtStatut(params: {
    typesAction: $Enums.type_action_compte_inactif[];
    statut: $Enums.statut_action_compte_inactif;
  }): Promise<ActionCompteInactif[]> {
    const actions = await this.dependencies.prisma
      .getInstance()
      .action_compte_inactif.findMany({
        where: {
          type_action: { in: params.typesAction },
          statut: params.statut,
        },
      });

    return actions.map((action) => ({
      id: action.id,
      utilisateurId: action.utilisateur_id,
      typeAction: action.type_action,
      dateCreation: action.date_creation,
      statut: action.statut,
      dateSucces: action.date_succes,
      dateDerniereTentative: action.date_derniere_tentative,
      nombreTentatives: action.nombre_tentatives,
      erreur: action.erreur,
    }));
  }
}
