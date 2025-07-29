import { Utilisateur } from "@/server/chantiers/domain/Utilisateur";

export interface UtilisateurRepository {
  recupererUtilisateursParProfilEtChantierIds: (
    profilCode: string,
    listeChantierIds: string[],
  ) => Promise<Utilisateur[]>;
}
