import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";

export interface ProfilModifieSideEffects {
  executer(profil: ProfilUtilisateur): void;
}
