import { faker } from '@faker-js/faker/locale/fr';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { UtilisateurÀCréerOuMettreÀJour, profils } from './Utilisateur.interface';

export default class UtilisateurÀCréerOuMettreÀJourBuilder {
  private _id: UtilisateurÀCréerOuMettreÀJour['id'];

  private _nom: UtilisateurÀCréerOuMettreÀJour['nom'];

  private _prénom: UtilisateurÀCréerOuMettreÀJour['prénom'];

  private _email: UtilisateurÀCréerOuMettreÀJour['email'];

  private _profil: UtilisateurÀCréerOuMettreÀJour['profil'];

  private _scopes: UtilisateurÀCréerOuMettreÀJour['scopes'];

  constructor() {
    this._id = faker.datatype.uuid();
    this._nom = faker.name.lastName();
    this._prénom = faker.name.firstName();
    this._email = faker.internet.email();
    this._profil = faker.helpers.arrayElement(profils);
    this._scopes = {
      'lecture': this._créerScope(),
      'saisie.commentaire': this._créerScope(),
      'saisie.indicateur': this._créerScope(),
    };
  }

  _créerScope(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []) {
    return {
      chantiers: chantierIds,
      territoires: territoireCodes,
      périmètres: périmètreIds,
    };
  }

  avecEmail(email: UtilisateurÀCréerOuMettreÀJour['email']): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._email = email;
    return this;
  }

  avecProfil(profil: UtilisateurÀCréerOuMettreÀJour['profil']): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._profil = profil;
    return this;
  }

  avecScopeLecture(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._scopes.lecture = this._créerScope(chantierIds, territoireCodes, périmètreIds);
    return this;
  }

  avecScopeSaisieCommentaire(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._scopes['saisie.commentaire'] = this._créerScope(chantierIds, territoireCodes, périmètreIds);
    return this;
  }

  avecScopeSaisieIndicateur(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._scopes['saisie.indicateur'] = this._créerScope(chantierIds, territoireCodes, périmètreIds);
    return this;
  }

  build(): UtilisateurÀCréerOuMettreÀJour {
    return {
      id: this._id,
      nom: this._nom,
      prénom: this._prénom,
      email: this._email,
      profil: this._profil,
      scopes: this._scopes,
    };
  }
}
