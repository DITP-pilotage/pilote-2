import { Utilisateur } from "@/server/chantiers/domain/Utilisateur";

export interface UtilisateurRepository {
  recupererUtilisateursParProfilEtChantierIds: (
    profilCodes: string[],
    listeChantierIds: string[],
  ) => Promise<Utilisateur[]>;
}
