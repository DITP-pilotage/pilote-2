export const statutPublie = {
  id: "PUBLIE",
  nom: "Chantiers validés (par défaut)",
  texteInfobulle: null,
};

export const statutBrouillon = {
  id: "BROUILLON",
  nom: "Chantiers en cours de publication",
  texteInfobulle: null,
};

export const statutBrouillonEtPublie = {
  id: "BROUILLON_ET_PUBLIE",
  nom: "Tous les chantiers suivis",
  texteInfobulle: null,
};

export const statutArchive = {
  id: "ARCHIVE",
  nom: "Chantiers précédemment suivis",
  texteInfobulle:
    "Ces chantiers ne sont désormais plus suivis via PILOTE. Leurs données restent consultables mais il n'est plus possible de les mettre à jour.",
};

export const listeStatuts = [
  statutPublie,
  statutBrouillon,
  statutBrouillonEtPublie,
  statutArchive,
];
