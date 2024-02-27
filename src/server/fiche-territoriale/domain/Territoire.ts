export class Territoire {
  private readonly _nomAffiché: string;

  private readonly _maille: 'DEPT' | 'REG' | 'NAT';

  private readonly _codeInsee: string;

  private constructor({ nomAffiché, maille, codeInsee }: { nomAffiché: string, maille: 'DEPT' | 'REG' | 'NAT', codeInsee: string }) {
    this._nomAffiché = nomAffiché;
    this._maille = maille;
    this._codeInsee = codeInsee;
  }

  get codeInsee(): string {
    return this._codeInsee;
  }

  get nomAffiché(): string {
    return this._nomAffiché;
  }

  get maille(): 'DEPT' | 'REG' | 'NAT' {
    return this._maille;
  }

  static creerTerritoire({ nomAffiché, maille, codeInsee }: { nomAffiché: string, maille: 'DEPT' | 'REG' | 'NAT', codeInsee: string }) {
    return new Territoire({ nomAffiché, maille, codeInsee });
  }
}
