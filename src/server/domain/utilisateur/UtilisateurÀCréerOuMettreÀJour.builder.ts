import { faker } from "@faker-js/faker/locale/fr";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { HabilitationsÀCréerOuMettreÀJourCalculées } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import {
  ApplicationAccessible,
  profilsCodes,
  UtilisateurÀCréerOuMettreÀJour,
} from "./Utilisateur.interface";

export default class UtilisateurÀCréerOuMettreÀJourBuilder {
  private readonly _nom: UtilisateurÀCréerOuMettreÀJour["nom"];

  private readonly _prénom: UtilisateurÀCréerOuMettreÀJour["prénom"];

  private _email: UtilisateurÀCréerOuMettreÀJour["email"];

  private _profil: UtilisateurÀCréerOuMettreÀJour["profil"];

  private readonly _habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;

  private readonly _fonction: UtilisateurÀCréerOuMettreÀJour["fonction"];

  private _saisieIndicateur: UtilisateurÀCréerOuMettreÀJour["saisieIndicateur"];

  private _gestionUtilisateur: UtilisateurÀCréerOuMettreÀJour["gestionUtilisateur"];

  constructor() {
    this._nom = faker.name.lastName();
    this._prénom = faker.name.firstName();
    this._email = faker.internet.email();
    this._profil = faker.helpers.arrayElement(profilsCodes);
    this._fonction = "fonction";
    this._saisieIndicateur = faker.datatype.boolean();
    this._gestionUtilisateur = faker.datatype.boolean();
    this._habilitations = {
      lecture: {
        chantiers: [],
        périmètres: [],
        territoires: [],
      },
      gestionUtilisateur: {
        chantiers: [],
        périmètres: [],
        territoires: [],
      },
      saisieIndicateur: {
        chantiers: [],
        périmètres: [],
        territoires: [],
      },
      responsabilite: {
        chantiers: [],
        périmètres: [],
        territoires: [],
      },
      saisieCommentaire: {
        chantiers: [],
        périmètres: [],
        territoires: [],
      },
    };
  }

  avecEmail(
    email: UtilisateurÀCréerOuMettreÀJour["email"],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._email = email;
    return this;
  }

  avecProfil(
    profil: UtilisateurÀCréerOuMettreÀJour["profil"],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._profil = profil;
    return this;
  }

  avecSaisieIndicateur(
    saisieIndicateur: UtilisateurÀCréerOuMettreÀJour["saisieIndicateur"],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._saisieIndicateur = saisieIndicateur;
    return this;
  }

  avecGestionUtilisateur(
    gestionUtilisateur: UtilisateurÀCréerOuMettreÀJour["gestionUtilisateur"],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._gestionUtilisateur = gestionUtilisateur;
    return this;
  }

  private _avecHabilitationLectureChantiers(
    chantierIds: Chantier["id"][],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations.lecture.chantiers = chantierIds;
    return this;
  }

  private _avecHabilitationLectureTerritoires(
    terrioiresCodes: Territoire["code"][],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations.lecture.territoires = terrioiresCodes;
    return this;
  }

  private _avecHabilitationLecturePérimètres(
    périmètresIds: PérimètreMinistériel["id"][],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    this._habilitations.lecture.périmètres = périmètresIds;
    return this;
  }

  avecHabilitationsLecture(
    territoiresCodes?: Territoire["code"][],
    chantierIds?: Chantier["id"][],
    périmètresIds?: PérimètreMinistériel["id"][],
  ) {
    if (territoiresCodes)
      this._avecHabilitationLectureTerritoires(territoiresCodes);

    if (chantierIds) this._avecHabilitationLectureChantiers(chantierIds);

    if (périmètresIds) this._avecHabilitationLecturePérimètres(périmètresIds);

    return this;
  }

  avecResponsabiliteChantiers(
    chantierIds?: Chantier["id"][],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    if (chantierIds) {
      this._habilitations.responsabilite.chantiers = chantierIds;
    }
    return this;
  }

  avecResponsabiliteSaisieCommentaire(
    chantierIds?: Chantier["id"][],
  ): UtilisateurÀCréerOuMettreÀJourBuilder {
    if (chantierIds) {
      this._habilitations.saisieCommentaire.chantiers = chantierIds;
    }
    return this;
  }

  build() {
    return {
      nom: this._nom,
      prénom: this._prénom,
      email: this._email,
      profil: this._profil,
      fonction: this._fonction,
      saisieIndicateur: this._saisieIndicateur,
      gestionUtilisateur: this._gestionUtilisateur,
      applicationsAccessibles: [ApplicationAccessible.PILOTE],
      habilitations: this._habilitations,
    };
  }
}
