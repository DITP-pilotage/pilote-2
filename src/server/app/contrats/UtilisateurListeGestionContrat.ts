import {
  ProfilCode,
  profilsDépartementaux,
  profilsTerritoriaux,
} from '@/server/domain/utilisateur/Utilisateur.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { UtilisateurListeGestion } from '@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface';

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

const recupererLesNomsDesTerritoires = (utilisateur: UtilisateurListeGestion, territoiresListe: Territoire[]): string[] => {
  
  if (!profilsTerritoriaux.includes(utilisateur.profil)) {
    return ['Tous les territoire'];
  }

  const maillesUtilisateur = profilsDépartementaux.includes(utilisateur.profil) ?
    ['departementale', 'nationale'] :
    ['regionale', 'nationale'];

  return territoiresListe.
    filter(territoire => utilisateur.habilitations.lecture.territoires.includes(territoire.code) && maillesUtilisateur.includes(territoire.maille)).
    map(territoire => territoire.nom);
};

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
    listeNomsTerritoires: recupererLesNomsDesTerritoires(utilisateur, territoiresListe),
    statut: utilisateur.dateDesactivation ? 'desactive' : 'actif',
  };
};
