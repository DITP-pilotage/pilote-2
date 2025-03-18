import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { UtilisateurListeGestion } from '@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface';
import { recupererLesNomsDesTerritoires } from '@/server/app/RecupererLesNomsDesTerritoiresPourUnUtilisateur';

export interface UtilisateurListeGestionContrat {
  id: string
  email: string
  nom: string
  prénom: string
  fonction: string | null
  dateModification: string
  auteurModification: string
  profil: ProfilCode
  listeNomsTerritoires: string[]
  statut: 'actif' | 'desactive'
}

export const presenterEnUtilisateurListeGestionContrat = (utilisateur: UtilisateurListeGestion, territoiresListe: Territoire[]): UtilisateurListeGestionContrat => {
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    prénom: utilisateur.prénom,
    email: utilisateur.email,
    profil: utilisateur.profil,
    fonction: utilisateur.fonction,
    dateModification: utilisateur.dateModification,
    auteurModification: utilisateur.auteurModification,
    listeNomsTerritoires: recupererLesNomsDesTerritoires(utilisateur.profil, utilisateur.habilitations, territoiresListe),
    statut: utilisateur.dateDesactivation ? 'desactive' : 'actif',
  };
};
