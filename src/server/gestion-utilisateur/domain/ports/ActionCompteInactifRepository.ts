import { $Enums } from "@prisma/client";
import { ActionCompteInactif } from "@/server/gestion-utilisateur/domain/ActionCompteInactif";

export interface ActionCompteInactifRepository {
  sauvegarder(action: ActionCompteInactif): Promise<void>;
  recupererActionsParTypeEtStatut(
    typesAction: $Enums.type_action_compte_inactif[],
    statut: $Enums.statut_action_compte_inactif,
  ): Promise<ActionCompteInactif[]>;
}
