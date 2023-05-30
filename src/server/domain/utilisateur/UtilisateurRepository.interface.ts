import Utilisateur, { UtilisateurÀCréerOuMettreÀJour } from './Utilisateur.interface';

export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>
  récupérerTous(chantierIds: string[], territoireCodes: string[]): Promise<Utilisateur[]>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJour): Promise<void>
}
