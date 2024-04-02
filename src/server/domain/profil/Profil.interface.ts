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
  projetsStructurants: {
    lecture: {
      tousPérimètres: boolean
      mêmePérimètresQueChantiers: boolean
      tousTerritoires: boolean
      mêmeTerritoiresQueChantiers: boolean
    },
  },
  utilisateurs: {
    modificationPossible: boolean
    tousTerritoires:  boolean
    tousChantiers: boolean
  },
};
