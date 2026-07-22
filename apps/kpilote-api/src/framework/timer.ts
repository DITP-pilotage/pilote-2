// Petit chrono : startTimer() renvoie une closure qui donne le temps écoulé
// (en ms, arrondi) à chaque appel. Encapsule le pattern `performance.now()` de
// départ + différence répété dans les logs de durée.
export const startTimer = (): (() => number) => {
  const startedAt = performance.now()
  return () => Math.round(performance.now() - startedAt)
}
