export class AvancementFicheConducteur {
  private readonly _global: number | null;

  private readonly _annuel: number | null;

  private readonly _minimum: number | null;

  private readonly _mediane: number | null;

  private readonly _maximum: number | null;

  private constructor({ global, annuel, minimum, mediane, maximum }: {
    global: number | null,
    annuel: number | null,
    minimum: number | null,
    mediane: number | null,
    maximum: number | null
  }) {
    this._global = global;
    this._annuel = annuel;
    this._minimum = minimum;
    this._mediane = mediane;
    this._maximum = maximum;
  }

  get global(): number | null {
    return this._global;
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

  static creerAvancementFicheConducteur({ global, annuel, minimum, mediane, maximum }: {
    global: number | null,
    annuel: number | null,
    minimum: number | null,
    mediane: number | null,
    maximum: number | null
  }): AvancementFicheConducteur {
    return new AvancementFicheConducteur({ global, annuel, minimum, mediane, maximum });
  }
}
