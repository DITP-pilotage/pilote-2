// Node.js exécute tout le JS d'un process sur un seul thread. Tant qu'une
// fonction synchrone tourne (gros calcul, boucle longue), aucune autre
// requête HTTP entrante, aucun callback I/O, aucun timer ne peut être traité
// — la node est "gelée". `await` sur une promesse déjà résolue ne suffit pas
// à débloquer ça : le micro-task continue dans le même "tick" sans rendre la
// main au scheduler.
//
// `setImmediate` planifie un callback sur la **prochaine itération** de
// l'event loop : la node traite d'abord les I/O en attente, puis nous rend
// la main. C'est l'équivalent d'un `yield` coopératif.
//
// À utiliser au milieu d'une boucle de calcul lourd (>100ms cumulés) pour
// éviter qu'elle ne bloque les requêtes concurrentes. Coût : ~1 ms par yield,
// négligeable face à un calcul lourd, prohibitif sur une boucle légère —
// yielder par chunks, pas à chaque itération unitaire.
export const yieldToEventLoop = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))
