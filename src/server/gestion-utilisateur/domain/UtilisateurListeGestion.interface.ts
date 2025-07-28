import { Habilitations } from "./habilitation/Habilitation.interface";
import { ProfilCode } from "./Utilisateur.interface";

export interface UtilisateurListeGestion {
  id: string;
  email: string;
  nom: string;
  prénom: string;
  fonction: string | null;
  habilitations: Habilitations;
  dateModification: string;
  auteurModification: string;
  profil: ProfilCode;
  dateDesactivation: string | null;
}
