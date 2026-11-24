import pLimit from 'p-limit'

import { env } from '@/env'

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

// `Promise.all` lance toutes les Promises simultanément : sur une grande liste,
// ça peut saturer le pool de connexions DB (Prisma en a un limité) ou surcharger
// un service tiers, au point de provoquer des timeouts ou de la contention qui
// ralentit tout.
//
// `withConcurrency` maintient un pool de N slots : une nouvelle tâche ne démarre
// que quand un slot se libère. L'ordre de résolution est préservé (identique à
// `Promise.all`). La valeur par défaut est pilotée par `MAX_ASYNC_CONCURRENCY`
// pour tuner sans toucher au code (utile en staging vs. prod).
//
//   // tâches hétérogènes
//   await withConcurrency([() => fetchUsers(), () => updateFoo()])
//
//   // liste homogène
//   await withConcurrency(items.map((item) => () => process(item)))
//
// Ne pas utiliser sur du calcul pur (synchrone), `yieldToEventLoop` est fait pour ça.
export const withConcurrency = <R>(
  fns: Array<() => Promise<R>>,
  concurrency = env.MAX_ASYNC_CONCURRENCY,
): Promise<R[]> => {
  const limit = pLimit(concurrency)
  return Promise.all(fns.map((fn) => limit(fn)))
}

// Pour lancer un travail tout de suite et ne l'attendre que plus tard, par
// exemple plusieurs appels en parallèle dont on veut les résultats dans l'ordre :
//
//   const premier = awaitLater(fetchA())
//   const second = awaitLater(fetchB())
//   yield await premier // `fetchB` tourne pendant ce temps
//   yield await second
//
// Sans `awaitLater`, si `fetchB` échoue pendant qu'on attend encore `premier`,
// sa promesse est rejetée alors que personne n'a encore écrit `await` dessus.
// Node signale alors un rejet non géré (`unhandledRejection`) et, par défaut
// depuis Node 15, arrête le process : l'API tombe pour une erreur qu'on allait
// traiter quelques instants plus tard.
//
// `awaitLater` branche tout de suite un gestionnaire vide sur la promesse, ce
// qui la marque comme gérée, puis renvoie la promesse d'origine (pas celle de
// `.catch`) : le `await` qui vient plus tard lève toujours l'erreur, et le code
// appelant la traite comme d'habitude. Le gestionnaire vide n'avale donc rien.
//
// Inutile quand on attend la promesse aussitôt, ou quand on passe par
// `Promise.all` / `Promise.allSettled`, qui branchent leurs gestionnaires d'emblée.
export const awaitLater = <T>(promise: Promise<T>): Promise<T> => {
  promise.catch(() => undefined)
  return promise
}
