type Critère<T> = {
  nomCritère: string;
  condition: (e: T) => boolean;
};

export default class CompteurFiltre<T> {
  constructor(private éléments: T[]) {}

  compter(critères: Critère<T>[]) {
    let ensembles = Object.fromEntries(
      critères.map(critère => [
        critère.nomCritère,
        {
          nomCritère: critère.nomCritère,
          nombre: 0,
        },
      ]),
    );
    
    for (const élément of this.éléments) {
      for (const critère of critères) {
        if (critère.condition(élément)) {
          ensembles[critère.nomCritère].nombre++;
        }
      }
    }

    return ensembles;
  }
}
