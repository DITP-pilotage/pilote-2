import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import Utilisateur, {
  ProfilCode,
  profilsDépartementaux,
  profilsRégionaux,
} from '@/server/domain/utilisateur/Utilisateur.interface';

export interface UtilisateurContrat {
  id: string
  nom: string
  prénom: string
  email: string
  profil: ProfilCode
  fonction: string | null
  dateModification: string
  auteurModification: string
  listeNomsTerritoires: string[]
}

const recupererLesNomsDesTerritoires = (utilisateur: Utilisateur, territoiresListe: Territoire[]): string[] => {
  const mailleUtilisateur = profilsDépartementaux.includes(utilisateur.profil) ?
    'départementale' :
    profilsRégionaux.includes(utilisateur.profil) ? 'régionale' : 'nationale';
  
  return mailleUtilisateur === 'nationale' ? 
    ['Tous les territoires'] : 
    territoiresListe.
      filter(territoire => utilisateur.habilitations.lecture.territoires.includes(territoire.code) && territoire.maille === mailleUtilisateur).
      map(territoire => territoire.nom);

};

export const presenterEnUtilisateurContrat = (utilisateur: Utilisateur, territoiresListe: Territoire[]): UtilisateurContrat => {
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
