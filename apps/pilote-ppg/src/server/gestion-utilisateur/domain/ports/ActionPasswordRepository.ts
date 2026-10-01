import { $Enums } from "@prisma/client";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";

export interface ActionPasswordRepository {
  sauvegarder(action: ActionPassword): Promise<void>;
  recupererActionsParTypeEtStatut(params: {
    typesAction: $Enums.type_action_password[];
    statut: $Enums.statut_action_password;
  }): Promise<ActionPassword[]>;
  annulerActionsEnAttente(utilisateurId: string): Promise<void>;
}
