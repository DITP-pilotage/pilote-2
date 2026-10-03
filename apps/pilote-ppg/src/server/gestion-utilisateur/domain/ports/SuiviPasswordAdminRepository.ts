import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

export interface SuiviPasswordAdminRepository {
  recupererParUtilisateur(
    utilisateurId: string,
  ): Promise<SuiviPasswordAdmin | null>;
  sauvegarder(suivi: SuiviPasswordAdmin): Promise<void>;
  recupererDesComptesActifsParProfil(
    profilCode: ProfilCode,
  ): Promise<SuiviPasswordAdmin[]>;
}
