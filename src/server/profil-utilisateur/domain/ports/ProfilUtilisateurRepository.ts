import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";

export interface ProfilUtilisateurRepository {
  recupererParId(utilisateurId: string): Promise<ProfilUtilisateur>;
  sauvegarder(profil: ProfilUtilisateur): Promise<void>;
}
