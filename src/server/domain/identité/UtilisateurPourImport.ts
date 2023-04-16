import assert from 'node:assert/strict';
import UtilisateurPourIAM from '@/server/domain/identité/UtilisateurPourIAM';
import { vérifieCodeProfil } from '@/server/domain/identité/Profil';

export default class UtilisateurPourImport {
  constructor(
    public readonly email: string,
    public readonly nom: string,
    public readonly prénom: string,
    public readonly profilCode: string,
    public readonly chantierIds: string[],
  ) {
    assert(email);
    assert(nom);
    assert(prénom);
    assert(profilCode);
    assert(vérifieCodeProfil(profilCode));
    assert(chantierIds);
  }

  pourIAM(): UtilisateurPourIAM {
    return new UtilisateurPourIAM(
      this.email,
      this.nom,
      this.prénom,
    );
  }

  static fromRecord(record: Record<string, any>): UtilisateurPourImport {
    return new UtilisateurPourImport(
      record.email,
      record.nom,
      record.prénom,
      record.profilCode,
      record.chantierIds,
    );
  }
}
