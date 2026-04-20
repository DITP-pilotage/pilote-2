import { ProfilAPI } from "@/server/authentification/domain/ProfilAPI";
import { HabilitationAuthentitificationAPI } from "@/server/authentification/domain/HabilitationAuthentitificationAPI";

export class UtilisateurAuthentifie {
  private readonly _id: string;

  private readonly _email: string;

  private readonly _profil: ProfilAPI;

  private readonly _habilitations: HabilitationAuthentitificationAPI;

  private readonly _profilAAccèsAuxChantiersBrouillons: boolean;

  private constructor({
    id,
    email,
    profil,
    habilitations,
    profilAAccèsAuxChantiersBrouillons,
  }: {
    id: string;
    email: string;
    profil: ProfilAPI;
    habilitations: HabilitationAuthentitificationAPI;
    profilAAccèsAuxChantiersBrouillons: boolean;
  }) {
    this._id = id;
    this._email = email;
    this._profil = profil;
    this._habilitations = habilitations;
    this._profilAAccèsAuxChantiersBrouillons =
      profilAAccèsAuxChantiersBrouillons;
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get profil(): ProfilAPI {
    return this._profil;
  }

  get habilitations(): HabilitationAuthentitificationAPI {
    return this._habilitations;
  }

  get profilAAccèsAuxChantiersBrouillons(): boolean {
    return this._profilAAccèsAuxChantiersBrouillons;
  }

  peutAccederAuChantier(chantierId: string): boolean {
    return this.habilitations.lecture.chantiers.includes(chantierId);
  }

  peutAccederEnEcritureAuChantier(chantierId: string): boolean {
    return this.habilitations.saisieIndicateur.chantiers.includes(chantierId);
  }

  peutSaisirCommentaireSurChantier(chantierId: string): boolean {
    return this.habilitations.saisieCommentaire.chantiers.includes(chantierId);
  }

  static creerUtilisateurAuthentifie({
    id,
    email,
    profil,
    habilitations,
    profilAAccèsAuxChantiersBrouillons,
  }: {
    id: string;
    email: string;
    profil: ProfilAPI;
    habilitations: HabilitationAuthentitificationAPI;
    profilAAccèsAuxChantiersBrouillons: boolean;
  }): UtilisateurAuthentifie {
    return new UtilisateurAuthentifie({
      id,
      email,
      profil,
      habilitations,
      profilAAccèsAuxChantiersBrouillons,
    });
  }
}
