import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';

export type Profil = {
  code: string
  nom: ProfilCode
  chantiers: {
    lecture: {
      tous: boolean
      tousTerritorialisés: boolean
      tousTerritoires: boolean
    },
    saisieCommentaire: {
      tousTerritoires: boolean
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
    lecture: boolean
    modification: boolean
    suppression:  boolean
  },
};
