type Critère<T> = {
  nomCritère: string;
  condition: (e: T) => boolean;
};

export default class CompteurFiltre<T> {
  constructor(private éléments: T[]) {}

  compter(criteres: Critère<T>[]): Record<string, { nomCritère: string, nombre: number }> {
    return Object.fromEntries(
      criteres.map(critere => [
        critere.nomCritère,
        {
          nomCritère: critere.nomCritère,
          nombre: this.éléments.filter(critere.condition).length,
        },
      ]),
    );
  }
}
