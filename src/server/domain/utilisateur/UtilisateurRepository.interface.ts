import Utilisateur, { UtilisateurÀCréerOuMettreÀJour } from './Utilisateur.interface';

export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJour): Promise<void>
}
