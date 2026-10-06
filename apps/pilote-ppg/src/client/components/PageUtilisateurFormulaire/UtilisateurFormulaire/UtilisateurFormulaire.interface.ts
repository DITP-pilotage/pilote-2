import { Utilisateur } from "@/shared/utilisateur/Utilisateur.interface";
import { RouterInputs } from "@/server/framework/trpc/trpc.interface";

export interface UtilisateurFormulaireProps {
  utilisateur?: Utilisateur;
  estAutoriseAVoirLeSelecteurApplication: boolean;
  ffCreationCompteArs: boolean;
}

export type UtilisateurFormulaireContainerProps = Pick<
  UtilisateurFormulaireProps,
  "utilisateur"
>;

export type UtilisateurFormInputs = Omit<
  RouterInputs["utilisateur"]["creer"],
  "csrf"
>;
