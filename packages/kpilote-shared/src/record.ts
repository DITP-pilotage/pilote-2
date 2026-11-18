// Les utilitaires d'es-toolkit (`keyBy`, `groupBy`…) renvoient un `Record` ; une signature qui
// attend une `Map` passe par ici plutôt que par `new Map(Object.entries(...))` au milieu d'un algo.
export const toMap = <K extends string, V>(record: Partial<Record<K, V>>): Map<K, V> =>
  new Map(Object.entries(record) as [K, V][])
