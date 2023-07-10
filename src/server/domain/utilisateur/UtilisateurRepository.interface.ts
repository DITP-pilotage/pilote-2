import Utilisateur, { UtilisateurÀCréerOuMettreÀJour } from './Utilisateur.interface';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from './habilitation/Habilitation.interface';

export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>
  getById(id: string): Promise<Utilisateur | null>
  récupérerTous(chantierIds: string[], territoireCodes: string[]): Promise<Utilisateur[]>
  supprimer(email: string): Promise<void>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJour & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées }, auteurModification: string): Promise<void>
}
