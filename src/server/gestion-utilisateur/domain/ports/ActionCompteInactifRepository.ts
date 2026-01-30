import { $Enums } from "@prisma/client";

export interface ActionCompteInactif {
  id: string;
  utilisateurId: string;
  typeAction: $Enums.type_action_compte_inactif;
  dateCreation: Date;
  statut: $Enums.statut_action_compte_inactif;
  dateSucces: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreur: string | null;
}

export interface ActionCompteInactifRepository {
  sauvegarder(action: ActionCompteInactif): Promise<void>;

  recupererActionsParTypeEtStatut(
    typesAction: $Enums.type_action_compte_inactif[],
    statut: $Enums.statut_action_compte_inactif,
  ): Promise<ActionCompteInactif[]>;
}
