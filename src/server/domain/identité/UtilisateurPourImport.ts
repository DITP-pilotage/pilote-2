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
    this.assertNotBlank(email);
    this.assertNotBlank(nom);
    this.assertNotBlank(prénom);
    assert.ok(vérifieCodeProfil(profilCode), `Code inconnu: ${profilCode}`);
    assert.ok(chantierIds);
  }

  private assertNotBlank(field: string): void {
    assert.ok(field, `email: ${this.email}`);
    assert.notStrictEqual('', field, `email: ${this.email}`);
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
