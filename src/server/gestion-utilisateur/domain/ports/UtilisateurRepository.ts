import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { Utilisateur } from '@/server/gestion-utilisateur/domain/Utilisateur.interface';
import { UtilisateurListeGestion } from '@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface';
import { UtilisateurExportCSV } from '@/server/gestion-utilisateur/domain/UtilisateurExportCSV';
import { InformationChantierUtilisateur } from '@/server/gestion-utilisateur/domain/InformationChantierUtilisateur';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from '@/server/domain/utilisateur/Utilisateur.interface';

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
  recupererComptesInactifs(dateDesactivationMax: Date): Promise<{ id: string, email: string }[]>
  anonymiserAuteurs(auteursAAnonymiserIds: string[], emailAuteurRemplacement: string): Promise<void>
  supprimerListeUtilisateur(utilisateursASupprimerIds: string[]): Promise<void>
  verifierExistenceUtilisateur(email: string): Promise<boolean>
  créerOuMettreÀJour(u: UtilisateurÀCréerOuMettreÀJourSansHabilitation & { habilitations: HabilitationsÀCréerOuMettreÀJourCalculées }, auteurModification: string): Promise<void>
}
