import { Territoire } from '@/server/fiche-territoriale/domain/Territoire';

export class TerritoireBuilder {
  private _nomAffiché: string = 'Un territoire';

  public withNomAffiché(nomAffiché: string): TerritoireBuilder {
    this._nomAffiché = nomAffiché;
    return this;
  }

  public build(): Territoire {
    return Territoire.creerTerritoire({ nomAffiché: this._nomAffiché });
  }
}
