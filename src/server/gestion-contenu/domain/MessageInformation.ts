export class MessageInformation {
  private readonly _bandeauTexte: string;

  private readonly _isBandeauActif: boolean;

  private readonly _bandeauType: string;

  private constructor({ bandeauTexte, isBandeauActif, bandeauType }: { bandeauTexte: string, isBandeauActif: boolean, bandeauType: string }) {
    this._bandeauTexte = bandeauTexte;
    this._isBandeauActif = isBandeauActif;
    this._bandeauType = bandeauType;
  }
  
  get bandeauTexte(): string {
    return this._bandeauTexte;
  }

  get isBandeauActif(): boolean {
    return this._isBandeauActif;
  }

  get bandeauType(): string {
    return this._bandeauType;
  }

  static creerMessageInformation({ bandeauTexte, isBandeauActif, bandeauType }: { bandeauTexte: string, isBandeauActif: boolean, bandeauType: string }) {
    return new MessageInformation({ bandeauTexte, isBandeauActif, bandeauType });
  }
}
