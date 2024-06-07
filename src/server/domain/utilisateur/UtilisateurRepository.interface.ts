import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from './habilitation/Habilitation.interface';
import Utilisateur, { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from './Utilisateur.interface';


export default interface UtilisateurRepository {
  récupérer(email: string): Promise<Utilisateur | null>
  getById(id: string): Promise<Utilisateur | null>
  récupérerTous(chantierIds: string[], territoireCodes: string[], filtrer?: boolean): Promise<Utilisateur[]>
  supprimer(email: string): Promise<void>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées }, auteurModification: string): Promise<void>
  récupérerExistants(utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées })[]): Promise<Utilisateur['email'][]>
  récupérerNombreUtilisateursSurLeTerritoire(territoireCode: string, maille: MailleInterne): Promise<number>
  récupérerNombreUtilisateursParTerritoires(territoires: Territoire[]): Promise<Record<string, number>>
}
