export type ProfilUtilisateur = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  fonction: string | null;
  service: string | null;
  serviceAutre: string | null;
  perimetreMinisteriel: string | null;
};

export function creerProfilUtilisateur(data: {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  fonction: string | null;
  service: string | null;
  serviceAutre: string | null;
  perimetreMinisteriel: string | null;
}): ProfilUtilisateur {
  return {
    id: data.id,
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    fonction: data.fonction,
    service: data.service,
    serviceAutre: data.serviceAutre,
    perimetreMinisteriel: data.perimetreMinisteriel,
  };
}

export function modifierProfilUtilisateur(
  profil: ProfilUtilisateur,
  modifications: {
    nom: string;
    prenom: string;
    fonction: string | null;
    service: string | null;
    serviceAutre: string | null;
    perimetreMinisteriel: string | null;
  },
): ProfilUtilisateur {
  return {
    ...profil,
    nom: modifications.nom,
    prenom: modifications.prenom,
    fonction: modifications.fonction,
    service: modifications.service,
    serviceAutre: modifications.serviceAutre,
    perimetreMinisteriel: modifications.perimetreMinisteriel,
  };
}
