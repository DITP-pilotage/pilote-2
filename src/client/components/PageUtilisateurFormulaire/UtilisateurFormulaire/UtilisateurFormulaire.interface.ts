import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";

export interface UtilisateurFormulaireProps {
  utilisateur?: Utilisateur;
  estAutoriseAVoirLeSelecteurApplication: boolean;
}

export type UtilisateurFormInputs = Omit<
  RouterInputs["utilisateur"]["créer"],
  "csrf"
>;
