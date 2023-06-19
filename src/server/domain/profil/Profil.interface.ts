export type Profil = {
  code: string
  nom: string
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
