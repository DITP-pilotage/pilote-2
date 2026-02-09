import { z } from "zod";
import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";
import { donneValidationInfosBaseUtilisateur } from "@/validation/utilisateur";

export interface UtilisateurFormulaireProps {
  utilisateur?: Utilisateur;
  estAutoriseAVoirLeSelecteurApplication: boolean;
}

export type UtilisateurFormInputs = Omit<
  RouterInputs["utilisateur"]["créer"],
  "csrf"
>;
