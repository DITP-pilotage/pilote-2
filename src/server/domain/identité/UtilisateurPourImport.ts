import UtilisateurPourIAM from '@/server/domain/identité/UtilisateurPourIAM';

export default class UtilisateurPourImport {
  constructor(
    public readonly nom: string,
    public readonly prénom: string,
    public readonly email: string,
    public readonly motDePasse: string,
    public readonly profilCode: string,
    public readonly chantierIds: string[],
  ) {}

  pourIAM(): UtilisateurPourIAM {
    return new UtilisateurPourIAM(
      this.nom,
      this.prénom,
      this.email,
      this.motDePasse,
    );
  }
}
