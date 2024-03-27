import { faker } from '@faker-js/faker/locale/fr';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { UtilisateurÀCréerOuMettreÀJour, profilsCodes } from './Utilisateur.interface';

export default class UtilisateurÀCréerOuMettreÀJourBuilder {
  private _nom: UtilisateurÀCréerOuMettreÀJour['nom'];

  private _prénom: UtilisateurÀCréerOuMettreÀJour['prénom'];

  private _email: UtilisateurÀCréerOuMettreÀJour['email'];

  private _profil: UtilisateurÀCréerOuMettreÀJour['profil'];

  private _habilitations: UtilisateurÀCréerOuMettreÀJour['habilitations'];

  private _fonction: UtilisateurÀCréerOuMettreÀJour['fonction'];

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

  avecSaisieIndicateur(saisieIndicateur: UtilisateurÀCréerOuMettreÀJour['saisieIndicateur']): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._saisieIndicateur = saisieIndicateur;
    return this;
  }

  avecSaisieCommentaire(saisieCommentaire: UtilisateurÀCréerOuMettreÀJour['saisieCommentaire']): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._saisieCommentaire = saisieCommentaire;
    return this;
  }

  avecGestionUtilisateur(gestionUtilisateur: UtilisateurÀCréerOuMettreÀJour['saisieCommentaire']): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._gestionUtilisateur = gestionUtilisateur;
    return this;
  }

  private _avecHabilitationLectureChantiers(chantierIds: Chantier['id'][]): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations.lecture.chantiers = chantierIds;
    return this;
  }

  private _avecHabilitationLectureTerritoires(terrioiresCodes: Territoire['code'][]): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations.lecture.territoires = terrioiresCodes;
    return this;
  }

  private _avecHabilitationLecturePérimètres(périmètresIds: PérimètreMinistériel['id'][]): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations.lecture.périmètres = périmètresIds;
    return this;
  }

  avecHabilitationsLecture(territoiresCodes?: Territoire['code'][], chantierIds?: Chantier['id'][], périmètresIds?: PérimètreMinistériel['id'][]) {
    if (territoiresCodes)
      this._avecHabilitationLectureTerritoires(territoiresCodes);

    if (chantierIds)
      this._avecHabilitationLectureChantiers(chantierIds);

    if (périmètresIds)
      this._avecHabilitationLecturePérimètres(périmètresIds);
    
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
