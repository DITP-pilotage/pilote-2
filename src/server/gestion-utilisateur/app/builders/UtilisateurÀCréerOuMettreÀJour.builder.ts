import { faker } from '@faker-js/faker/locale/fr';
import { profilsCodes, UtilisateurÀCréerOuMettreÀJour } from '@/server/gestion-utilisateur/domain/Utilisateur.interface';

export default class UtilisateurÀCréerOuMettreÀJourBuilder {
  private readonly _nom: UtilisateurÀCréerOuMettreÀJour['nom'];

  private readonly _prénom: UtilisateurÀCréerOuMettreÀJour['prénom'];

  private _email: UtilisateurÀCréerOuMettreÀJour['email'];

  private _profil: UtilisateurÀCréerOuMettreÀJour['profil'];

  private readonly _habilitations: UtilisateurÀCréerOuMettreÀJour['habilitations'];

  private readonly _fonction: UtilisateurÀCréerOuMettreÀJour['fonction'];

  private _saisieIndicateur: UtilisateurÀCréerOuMettreÀJour['saisieIndicateur'];

  private _saisieCommentaire: UtilisateurÀCréerOuMettreÀJour['saisieCommentaire'];

  private _gestionUtilisateur: UtilisateurÀCréerOuMettreÀJour['gestionUtilisateur'];

  constructor() {
    this._nom = faker.name.lastName();
    this._prénom = faker.name.firstName();
    this._email = faker.internet.email();
    this._profil = faker.helpers.arrayElement(profilsCodes);
    this._fonction = 'fonction';
    this._saisieIndicateur = faker.datatype.boolean();
    this._saisieCommentaire = faker.datatype.boolean();
    this._gestionUtilisateur = faker.datatype.boolean();
    this._habilitations = {
      lecture: {
        chantiers: [],
        périmètres: [],
        territoires: [],
      },
      responsabilite: {
        chantiers: [],
      },
    };
  }

  avecProfil(profil: UtilisateurÀCréerOuMettreÀJour['profil']): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._profil = profil;
    return this;
  }

  build(): UtilisateurÀCréerOuMettreÀJour {
    return {
      nom: this._nom,
      prénom: this._prénom,
      email: this._email,
      profil: this._profil,
      fonction: this._fonction,
      saisieIndicateur: this._saisieIndicateur,
      saisieCommentaire: this._saisieCommentaire,
      gestionUtilisateur: this._gestionUtilisateur,
      habilitations: this._habilitations,
    };
  }
}
