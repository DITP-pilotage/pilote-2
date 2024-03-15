import { faker } from '@faker-js/faker/locale/fr';
import Utilisateur, { profilsCodes } from './Utilisateur.interface';

export default class UtilisateurBuilder {
  private _id: Utilisateur['id'];

  private _nom: Utilisateur['nom'];

  private _prénom: Utilisateur['prénom'];

  private _email: Utilisateur['email'];

  private _profil: Utilisateur['profil'];

  private _dateModification: Utilisateur['dateModification'];

  private _auteurModification: Utilisateur['auteurModification'];

  private _dateCreation: Utilisateur['dateCreation'];

  private _auteurCreation: Utilisateur['auteurCreation'];

  private _fonction: Utilisateur['fonction'];

  private _habilitations: Utilisateur['habilitations'];

  private _saisieCommentaire: Utilisateur['saisieCommentaire'];

  private _saisieIndicateur: Utilisateur['saisieIndicateur'];

  constructor() {
    this._id = faker.helpers.unique(faker.random.numeric, [10]);
    this._nom = faker.name.lastName();
    this._prénom = faker.name.firstName();
    this._email = faker.internet.email();
    this._profil = faker.helpers.arrayElement(profilsCodes);
    this._dateModification = faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString();
    this._auteurModification = faker.name.firstName();
    this._dateCreation = faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString();
    this._auteurCreation = faker.name.firstName();
    this._fonction = faker.helpers.arrayElement([faker.lorem.words(6), null]);
    this._saisieCommentaire = faker.datatype.boolean();
    this._saisieIndicateur = faker.datatype.boolean();
    this._habilitations = {
      lecture: { chantiers: [], territoires: [], périmètres: [] },
      'saisieCommentaire': { chantiers: [], territoires: [], périmètres: [] },
      'saisieIndicateur': { chantiers: [], territoires: [], périmètres: [] },
      'utilisateurs.lecture': { chantiers: [], territoires:[], périmètres: [] },
      'utilisateurs.modification': { chantiers: [], territoires: [], périmètres: [] },
      'utilisateurs.suppression': { chantiers: [], territoires: [], périmètres: [] },
      'projetsStructurants.lecture': { projetsStructurants: [] },
    };
  }

  avecId(id: Utilisateur['id']) {
    this._id = id;
    return this;
  }

  avecNom(nom: Utilisateur['nom']) {
    this._nom = nom;
    return this;
  }

  avecPrénom(prénom: Utilisateur['prénom']) {
    this._prénom = prénom;
    return this;
  }

  avecEmail(email: Utilisateur['email']) {
    this._email = email;
    return this;
  }

  avecProfil(profil: Utilisateur['profil']) {
    this._profil = profil;
    return this;
  }

  avecDateModification(dateModification: Utilisateur['dateModification']) {
    this._dateModification = dateModification;
    return this;
  }

  avecAuteurModification(auteurModification: Utilisateur['auteurModification']) {
    this._auteurModification = auteurModification;
    return this;
  }

  avecDateCreation(dateCreation: Utilisateur['dateCreation']) {
    this._dateCreation = dateCreation;
    return this;
  }

  avecAuteurCreation(auteurCreation: Utilisateur['auteurCreation']) {
    this._auteurCreation = auteurCreation;
    return this;
  }

  avecFonction(fonction: Utilisateur['fonction']) {
    this._fonction = fonction;
    return this;
  }

  avecTerritoireCodesLecture(territoireCodes: string[]) {
    this._habilitations.lecture.territoires = territoireCodes;
    return this;
  }

  avecChantierIdsLecture(chantierIds: string[]) {
    this._habilitations.lecture.chantiers = chantierIds;
    return this;
  }

  avecPérimètreIdsLecture(périmètresIds: string[]) {
    this._habilitations.lecture.périmètres = périmètresIds;
    return this;
  }

  avecSaisieIndicateur(saisieIndicateur: boolean) {
    this._saisieIndicateur = saisieIndicateur;
  }

  avecSaisieCommentaire(saisieCommentaire: boolean) {
    this._saisieCommentaire = saisieCommentaire;
  }

  build(): Utilisateur {
    return {
      id: this._id,
      nom: this._nom,
      prénom: this._prénom,
      email: this._email,
      profil: this._profil,
      dateModification: this._dateModification,
      auteurModification: this._auteurModification,
      dateCreation: this._dateCreation,
      auteurCreation: this._auteurCreation,
      fonction: this._fonction,
      saisieCommentaire: this._saisieCommentaire,
      saisieIndicateur: this._saisieIndicateur,
      habilitations: this._habilitations,
    };
  }
}
