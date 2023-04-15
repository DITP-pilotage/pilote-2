import assert from 'node:assert/strict';
import UtilisateurPourIAM from '@/server/domain/identité/UtilisateurPourIAM';
import { vérifieCodeProfil } from '@/server/domain/identité/Profil';

export default class UtilisateurPourImport {
  constructor(
    public readonly nom: string,
    public readonly prénom: string,
    public readonly email: string,
    public readonly profilCode: string,
    public readonly chantierIds: string[],
  ) {
    assert(nom);
    assert(prénom);
    assert(email);
    assert(profilCode);
    assert(vérifieCodeProfil(profilCode));
    assert(chantierIds);
  }

  pourIAM(): UtilisateurPourIAM {
    return new UtilisateurPourIAM(
      this.nom,
      this.prénom,
      this.email,
    );
  }
}
