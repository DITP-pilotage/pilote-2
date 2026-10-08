import { Profil } from "@/shared/profil/Profil.interface";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

export interface ProfilRepository {
  récupérerTous(): Promise<Profil[]>;
  récupérer(profilCode: ProfilCode): Promise<Profil | null>;
}
