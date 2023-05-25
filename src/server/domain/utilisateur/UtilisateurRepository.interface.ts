import Utilisateur, { UtilisateurÀCréerOuMettreÀJour } from './Utilisateur.interface';

export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>
  récupérerTous(chantierIds: string[]): Promise<Utilisateur[]>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJour): Promise<void>
}
