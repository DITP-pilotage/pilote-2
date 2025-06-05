export class Utilisateur {
  private readonly _email: string;

  private readonly _nom: string;

  private readonly _prenom: string;

  private readonly _listeChantiers: string[];

  private constructor({
    email,
    nom,
    prenom,
    listeChantiers,
  }: {
    email: string,
    nom: string,
    prenom: string,
    listeChantiers: string[]
  }) {
    this._email = email;
    this._nom = nom;
    this._prenom = prenom;
    this._listeChantiers = listeChantiers;
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
    email,
    nom,
    prenom,
    listeChantiers,
  }: {
    email: string,
    nom: string,
    prenom: string,
    listeChantiers: string[]
  }) {
    return new Utilisateur({
      email: email,
      nom: nom,
      prenom: prenom,
      listeChantiers: listeChantiers,
    });
  }
}
