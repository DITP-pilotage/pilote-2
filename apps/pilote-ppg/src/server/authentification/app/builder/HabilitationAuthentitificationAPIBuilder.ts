import { HabilitationAuthentitificationAPI } from "@/server/authentification/domain/HabilitationAuthentitificationAPI";

interface HabilitationDisponible {
  chantiers: string[];
  territoires: string[];
  périmètres: string[];
}

export class HabilitationAuthentitificationAPIBuilder {
  private gestionUtilisateur: HabilitationDisponible = {
    chantiers: [],
    territoires: [],
    périmètres: [],
  };

  private saisieCommentaire: HabilitationDisponible = {
    chantiers: [],
    territoires: [],
    périmètres: [],
  };

  private saisieIndicateur: HabilitationDisponible = {
    chantiers: [],
    territoires: [],
    périmètres: [],
  };

  private lecture: HabilitationDisponible = {
    chantiers: [],
    territoires: [],
    périmètres: [],
  };

  private responsabilite: HabilitationDisponible = {
    chantiers: [],
    territoires: [],
    périmètres: [],
  };

  ajouterHabilitationLecture(
    categorie: "chantiers" | "territoires" | "périmètres",
    listeHabilitations: string[],
  ) {
    this.gestionUtilisateur[categorie] = listeHabilitations;
    return this;
  }

  build(): HabilitationAuthentitificationAPI {
    return {
      gestionUtilisateur: this.gestionUtilisateur,
      saisieCommentaire: this.saisieCommentaire,
      saisieIndicateur: this.saisieIndicateur,
      lecture: this.lecture,
      responsabilite: this.responsabilite,
    };
  }
}
