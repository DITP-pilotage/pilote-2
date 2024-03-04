import { Territoire } from '@/server/fiche-territoriale/domain/Territoire';

export class TerritoireBuilder {
  private nomAffiché: string = 'Un territoire';

  private maille: 'DEPT' | 'REG' | 'NAT' = 'DEPT';

  private codeInsee: string = '34';

  public withNomAffiché(nomAffiché: string): TerritoireBuilder {
    this.nomAffiché = nomAffiché;
    return this;
  }

  public withMaille(maille: 'DEPT' | 'REG' | 'NAT'): TerritoireBuilder {
    this.maille = maille;
    return this;
  }

  withCodeInsee(codeInsee: string) {
    this.codeInsee = codeInsee;
    return this;
  }

  public build(): Territoire {
    return Territoire.creerTerritoire({ nomAffiché: this.nomAffiché, maille: this.maille, codeInsee: this.codeInsee });
  }
}
