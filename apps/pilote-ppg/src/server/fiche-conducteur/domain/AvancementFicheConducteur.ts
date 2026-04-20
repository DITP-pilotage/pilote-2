export class AvancementFicheConducteur {
  private readonly _annuel: number | null;

  private readonly _minimum: number | null;

  private readonly _mediane: number | null;

  private readonly _maximum: number | null;

  private constructor({
    annuel,
    minimum,
    mediane,
    maximum,
  }: {
    annuel: number | null;
    minimum: number | null;
    mediane: number | null;
    maximum: number | null;
  }) {
    this._annuel = annuel;
    this._minimum = minimum;
    this._mediane = mediane;
    this._maximum = maximum;
  }

  get annuel(): number | null {
    return this._annuel;
  }

  get minimum(): number | null {
    return this._minimum;
  }

  get mediane(): number | null {
    return this._mediane;
  }

  get maximum(): number | null {
    return this._maximum;
  }

  static creerAvancementFicheConducteur({
    annuel,
    minimum,
    mediane,
    maximum,
  }: {
    annuel: number | null;
    minimum: number | null;
    mediane: number | null;
    maximum: number | null;
  }): AvancementFicheConducteur {
    return new AvancementFicheConducteur({
      annuel,
      minimum,
      mediane,
      maximum,
    });
  }
}
