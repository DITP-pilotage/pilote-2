import { faker } from '@faker-js/faker/locale/fr';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { UtilisateurÀCréerOuMettreÀJour, profils } from './Utilisateur.interface';

export default class UtilisateurÀCréerOuMettreÀJourBuilder {
  private _nom: UtilisateurÀCréerOuMettreÀJour['nom'];

  private _prénom: UtilisateurÀCréerOuMettreÀJour['prénom'];

  private _email: UtilisateurÀCréerOuMettreÀJour['email'];

  private _profil: UtilisateurÀCréerOuMettreÀJour['profil'];

  private _auteurModification: UtilisateurÀCréerOuMettreÀJour['auteurModification'];

  private _habilitations: UtilisateurÀCréerOuMettreÀJour['habilitations'];

  constructor() {
    this._nom = faker.name.lastName();
    this._prénom = faker.name.firstName();
    this._email = faker.internet.email();
    this._profil = faker.helpers.arrayElement(profils);
    this._auteurModification = 'Seeder';
    this._habilitations = {
      'lecture': this._créerHabilitation(),
      'saisie.commentaire': this._créerHabilitation(),
      'saisie.indicateur': this._créerHabilitation(),
    };
  }

  _créerHabilitation(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []) {
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

  avecHabilitationLecture(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations.lecture = this._créerHabilitation(chantierIds, territoireCodes, périmètreIds);
    return this;
  }

  avecHabilitationsaisieCommentaire(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations['saisie.commentaire'] = this._créerHabilitation(chantierIds, territoireCodes, périmètreIds);
    return this;
  }

  avecHabilitationsaisieIndicateur(chantierIds: Chantier['id'][] = [], territoireCodes: string[] = [], périmètreIds: PérimètreMinistériel['id'][] = []): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations['saisie.indicateur'] = this._créerHabilitation(chantierIds, territoireCodes, périmètreIds);
    return this;
  }

  build(): UtilisateurÀCréerOuMettreÀJour {
    return {
      nom: this._nom,
      prénom: this._prénom,
      email: this._email,
      profil: this._profil,
      auteurModification: this._auteurModification,
      habilitations: this._habilitations,
    };
  }
}
