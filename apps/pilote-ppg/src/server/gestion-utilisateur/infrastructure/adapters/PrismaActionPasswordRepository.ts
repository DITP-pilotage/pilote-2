import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";

const ERREUR_ANNULATION = "Annulée : mot de passe changé";

export class PrismaActionPasswordRepository implements ActionPasswordRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async sauvegarder(action: ActionPassword): Promise<void> {
    await this.dependencies.prisma.getInstance().action_password.upsert({
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
    typesAction: $Enums.type_action_password[];
    statut: $Enums.statut_action_password;
  }): Promise<ActionPassword[]> {
    const actions = await this.dependencies.prisma
      .getInstance()
      .action_password.findMany({
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

  async annulerActionsEnAttente(utilisateurId: string): Promise<void> {
    await this.dependencies.prisma.getInstance().action_password.updateMany({
      where: { utilisateur_id: utilisateurId, statut: "CREEE" },
      data: {
        statut: "ECHEC",
        erreur: ERREUR_ANNULATION,
        date_derniere_tentative: new Date(),
      },
    });
  }
}
