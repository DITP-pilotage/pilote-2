import { ProfilUtilisateur } from "@/server/profil-utilisateur/domain/ProfilUtilisateur";

export interface ProfilUtilisateurRepository {
  recupererParId(utilisateurId: string): Promise<ProfilUtilisateur | null>;
  modifierProfil(
    utilisateurId: string,
    data: { nom: string; prenom: string; fonction: string | null },
  ): Promise<void>;
}
