import { HabilitationAuthentitificationAPI } from '@/server/authentification/domain/HabilitationAuthentitificationAPI';

interface HabilitationDisponible {
  chantiers: string[];
  territoires: string[];
  périmètres: string[];
}

interface HabilitationProjetStructurantDisponible {
  projetsStructurants: string[];
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

  private projetStructurantLecture: HabilitationProjetStructurantDisponible = {
    projetsStructurants: [],
  };

  ajouterHabilitationGestionUtilisateur(categorie: 'chantiers' | 'territoires' | 'périmètres', listeHabilitations: string[]) {
    this.gestionUtilisateur[categorie] = listeHabilitations;
    return this;
  }

  ajouterHabilitationSaisieCommentaire(categorie: 'chantiers' | 'territoires' | 'périmètres', listeHabilitations: string[]) {
    this.gestionUtilisateur[categorie] = listeHabilitations;
    return this;
  }

  ajouterHabilitationSaisieIndicateur(categorie: 'chantiers' | 'territoires' | 'périmètres', listeHabilitations: string[]) {
    this.gestionUtilisateur[categorie] = listeHabilitations;
    return this;
  }

  ajouterHabilitationLecture(categorie: 'chantiers' | 'territoires' | 'périmètres', listeHabilitations: string[]) {
    this.gestionUtilisateur[categorie] = listeHabilitations;
    return this;
  }

  ajouterHabilitationProjetStructurantLecture(categorie: 'projetsStructurants', listeHabilitations: string[]) {
    this.projetStructurantLecture[categorie] = listeHabilitations;
    return this;
  }

  build(): HabilitationAuthentitificationAPI {
    return {
      gestionUtilisateur: this.gestionUtilisateur,
      saisieCommentaire: this.saisieCommentaire,
      saisieIndicateur: this.saisieIndicateur,
      lecture: this.lecture,
      'projetsStructurants.lecture': this.projetStructurantLecture,
    };
  }
}
