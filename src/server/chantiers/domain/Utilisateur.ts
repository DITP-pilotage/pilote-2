export class Utilisateur {
  private readonly _id: string;

  private readonly _email: string;

  private readonly _nom: string;

  private readonly _prenom: string;

  private readonly _listeChantiers: string[];

  private constructor({
    id,
    email,
    nom,
    prenom,
    listeChantiers,
  }: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    listeChantiers: string[];
  }) {
    this._id = id;
    this._email = email;
    this._nom = nom;
    this._prenom = prenom;
    this._listeChantiers = listeChantiers;
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get nom(): string {
    return this._nom;
  }

  get prenom(): string {
    return this._prenom;
  }

  get listeChantiers(): string[] {
    return this._listeChantiers;
  }

  static creerUtilisateur({
    id,
    email,
    nom,
    prenom,
    listeChantiers,
  }: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    listeChantiers: string[];
  }) {
    return new Utilisateur({
      id: id,
      email: email,
      nom: nom,
      prenom: prenom,
      listeChantiers: listeChantiers,
    });
  }
}
