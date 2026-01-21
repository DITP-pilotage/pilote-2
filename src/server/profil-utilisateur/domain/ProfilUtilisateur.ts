export type ProfilUtilisateur = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  fonction: string | null;
};

export function creerProfilUtilisateur(data: {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  fonction: string | null;
}): ProfilUtilisateur {
  return {
    id: data.id,
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    fonction: data.fonction,
  };
}

export function modifierProfilUtilisateur(
  profil: ProfilUtilisateur,
  modifications: { nom: string; prenom: string; fonction: string | null },
): ProfilUtilisateur {
  return {
    ...profil,
    nom: modifications.nom,
    prenom: modifications.prenom,
    fonction: modifications.fonction,
  };
}
