import {
  ProfilCode,
  profilsDépartementaux,
  profilsRégionaux,
} from '@/server/domain/utilisateur/Utilisateur.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { UtilisateurListeGestion } from '@/server/gestion-utilisateur/domain/UtilisateurListeGestion';

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
}

const recupererLesNomsDesTerritoires = (utilisateur: UtilisateurListeGestion, territoiresListe: Territoire[]): string[] => {
  const mailleUtilisateur = profilsDépartementaux.includes(utilisateur.profil) ?
    'départementale' :
    profilsRégionaux.includes(utilisateur.profil) ? 'régionale' : 'nationale';

  return mailleUtilisateur === 'nationale' ?
    ['Tous les territoire'] :
    territoiresListe.
      filter(territoire => utilisateur.habilitations.lecture.territoires.includes(territoire.code) && territoire.maille === mailleUtilisateur).
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
  };
};
