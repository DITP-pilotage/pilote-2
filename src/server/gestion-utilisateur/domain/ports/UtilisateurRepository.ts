import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { Utilisateur, UtilisateurÀCréerOuMettreÀJourSansHabilitation } from '@/server/gestion-utilisateur/domain/Utilisateur';
import { UtilisateurListeGestion } from '@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface';
import { UtilisateurExportCSV } from '@/server/gestion-utilisateur/domain/UtilisateurExportCSV';
import { InformationChantierUtilisateur } from '@/server/gestion-utilisateur/domain/InformationChantierUtilisateur';

export interface UtilisateurRepository {
  récupérer(email: string, listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[]): Promise<Utilisateur | null>
  récupérerNombreUtilisateursParTerritoires(territoires: Territoire[]): Promise<Record<string, number>>
  desactiver(email: string, auteurId: string): Promise<void>
  reactiver(email: string, auteurId: string): Promise<void>
  recupererTous({ sorting, valeurDeLaRecherche, listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }: { sorting: { id: string, desc: boolean }[], valeurDeLaRecherche: string, listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[] }): Promise<UtilisateurListeGestion[]>
  recupererPourExports({ valeurDeLaRecherche, listeTerritoiresCodes, listePerimetresMinisteriels, listeInformationsChantiersUtilisateurs }: { valeurDeLaRecherche: string, listeTerritoiresCodes: string[], listePerimetresMinisteriels: string[], listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[] }): Promise<UtilisateurExportCSV[]>
  recupererEtatVisualisationVideoAccueil(utilisateurId: string): Promise<boolean>
  desactiverVideoAccueil(utilisateurId: string, dateVisualisation: Date): Promise<void> 
  reinitialiserEtatVisualisationVideoAccueil(email: string): Promise<void>
  getById(id: string): Promise<Utilisateur | null>
  supprimer(email: string): Promise<void>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées }, auteurModification: string): Promise<void>
  récupérerExistants(utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées })[]): Promise<Utilisateur['email'][]>
}
