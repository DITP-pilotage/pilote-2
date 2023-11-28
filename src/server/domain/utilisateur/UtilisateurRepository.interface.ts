import Utilisateur, { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from './Utilisateur.interface';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from './habilitation/Habilitation.interface';

export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>
  getById(id: string): Promise<Utilisateur | null>
  récupérerTous(chantierIds: string[], territoireCodes: string[], filtrer?: boolean): Promise<Utilisateur[]>
  supprimer(email: string): Promise<void>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées }, auteurModification: string): Promise<void>
  récupérerExistants(utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées })[]): Promise<Utilisateur['email'][]>
}
