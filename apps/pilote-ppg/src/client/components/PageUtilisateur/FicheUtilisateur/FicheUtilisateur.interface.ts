import { Chantier } from "@/shared/chantier/Chantier.interface";
import { PérimètreMinistériel } from "@/shared/perimetreMinisteriel/PerimetreMinisteriel.interface";
import { Territoire } from "@/shared/territoire/Territoire.interface";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

export default interface FicheUtilisateurProps {
  utilisateur: {
    nom: string;
    prénom: string;
    email: string;
    profil: ProfilCode;
    dateModification?: string;
    auteurModification?: string;
    dateDesactivation?: string | null;
    fonction: string | null;
    saisieIndicateur?: boolean;
    gestionUtilisateur?: boolean;
    habilitations?: {
      lecture?: {
        chantiers?: Chantier["id"][];
        territoires?: Territoire["code"][];
        périmètres?: PérimètreMinistériel["id"][];
      };
      saisieIndicateur?: {
        chantiers?: Chantier["id"][];
        périmètres?: PérimètreMinistériel["id"][];
      };
      saisieCommentaire?: {
        chantiers?: Chantier["id"][];
        périmètres?: PérimètreMinistériel["id"][];
      };
      responsabilite?: {
        chantiers?: Chantier["id"][];
        périmètres?: PérimètreMinistériel["id"][];
      };
    };
  };
}
