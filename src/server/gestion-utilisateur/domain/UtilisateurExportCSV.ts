import { ProfilCode } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { Habilitations } from "./habilitation/Habilitation.interface";

export interface UtilisateurExportCSV {
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
  statut: string;
  dateCreation: string;
  auteurCreation: string;
  perimetreMinisteriel: string | null;
  service: string | null;
  serviceAutre: string | null;
}
