import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export type Profil = {
  code: ProfilCode
  nom: string
  chantiers: {
    lecture: {
      tous: boolean
      tousTerritorialisés: boolean
      tousTerritoires: boolean,
      brouillons: boolean,
    },
    saisieCommentaire: {
      tousTerritoires: boolean
      saisiePossible: boolean
    },
    saisieIndicateur: {
      tousTerritoires: boolean
    },
  },
  utilisateurs: {
    modificationPossible: boolean
    tousTerritoires:  boolean
    tousChantiers: boolean
  },
};
