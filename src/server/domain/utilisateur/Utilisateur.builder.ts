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

  private _fonction: Utilisateur['fonction'];

  private _habilitations: Utilisateur['habilitations'];

  constructor() {
    this._id = faker.helpers.unique(faker.random.numeric, [4]);
    this._nom = faker.name.lastName();
    this._prénom = faker.name.firstName();
    this._email = faker.internet.email();
    this._profil = faker.helpers.arrayElement(profilsCodes);
    this._dateModification = faker.date.recent(60, '2023-05-01T00:00:00.000Z').toISOString();
    this._auteurModification = faker.name.firstName();
    this._fonction = faker.helpers.arrayElement([faker.lorem.words(6), null]);
    this._habilitations = {
      lecture: { chantiers: [], territoires: [] },
      'saisie.commentaire': { chantiers: [], territoires: [] },
      'saisie.indicateur': { chantiers: [], territoires: [] },
      'utilisateurs.lecture': { chantiers: [], territoires:[] },
      'utilisateurs.modification': { chantiers: [], territoires: [] },
      'utilisateurs.suppression': { chantiers: [], territoires: [] },
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

  avecFonction(fonction: Utilisateur['fonction']) {
    this._fonction = fonction;
    return this;
  }

  avecTerritoireCodesLecture(territoireCodes: string[]) {
    this._habilitations.lecture.territoires = territoireCodes;
    return this;
  }

  avecChantierCodesLecture(chantierCodes: string[]) {
    this._habilitations.lecture.chantiers = chantierCodes;
    return this;
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
      fonction: this._fonction,
      habilitations: this._habilitations,
    };
  }
}
