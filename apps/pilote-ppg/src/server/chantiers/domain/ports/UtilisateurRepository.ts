import { Utilisateur } from "@/server/chantiers/domain/Utilisateur";

export type UtilisateurEnrichi = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  service: string | null;
  service_autre: string | null;
  perimetre_ministeriel: string | null;
  fonction: string | null;
};

export interface UtilisateurRepository {
  recupererUtilisateursParProfilEtChantierIds: (
    profilCodes: string[],
    listeChantierIds: string[],
  ) => Promise<Utilisateur[]>;
  recupererParIds: (ids: string[]) => Promise<Map<string, UtilisateurEnrichi>>;
}
