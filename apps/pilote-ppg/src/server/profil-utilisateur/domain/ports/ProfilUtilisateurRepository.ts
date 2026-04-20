import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";

export interface ProfilUtilisateurRepository {
  recupererParId(utilisateurId: string): Promise<ProfilUtilisateur>;
  sauvegarder(params: {
    profil: ProfilUtilisateur;
    auteurId: string;
  }): Promise<void>;
}
