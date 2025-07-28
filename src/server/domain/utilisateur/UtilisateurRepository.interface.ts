import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { HabilitationsÀCréerOuMettreÀJourCalculées } from "./habilitation/Habilitation.interface";
import Utilisateur, {
  UtilisateurÀCréerOuMettreÀJourSansHabilitation,
} from "./Utilisateur.interface";

export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>;
  getById(id: string): Promise<Utilisateur | null>;
  supprimer(email: string): Promise<void>;
  créerOuMettreÀJour(
    u: UtilisateurÀCréerOuMettreÀJourSansHabilitation & {
      habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;
    },
    auteurModification: string,
  ): Promise<void>;
  récupérerExistants(
    utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & {
      habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;
    })[],
  ): Promise<Utilisateur["email"][]>;
  récupérerNombreUtilisateursParTerritoires(
    territoires: Territoire[],
  ): Promise<Record<string, number>>;
}
