import type { LanguageModelV4 } from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";

const FENETRE_MS = 60_000;

/**
 * Plafonne le nombre de requêtes lancées sur une fenêtre glissante d'une
 * minute. Les appels sont servis dans l'ordre d'arrivée : un sous-agent lancé
 * en parallèle attend son tour comme les autres.
 */
export function createRateLimiter({
  requetesParMinute,
}: {
  requetesParMinute: number;
}) {
  const horodatages: number[] = [];
  let file: Promise<void> = Promise.resolve();

  const reserverUnCreneau = async (): Promise<void> => {
    const maintenant = Date.now();

    while (
      horodatages.length > 0 &&
      horodatages[0] <= maintenant - FENETRE_MS
    ) {
      horodatages.shift();
    }

    if (horodatages.length < requetesParMinute) {
      horodatages.push(maintenant);
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, horodatages[0] + FENETRE_MS - maintenant),
    );

    return reserverUnCreneau();
  };

  return function attendreSonTour(): Promise<void> {
    file = file.then(reserverUnCreneau);
    return file;
  };
}

/**
 * Bride les appels à l'API Albert pendant les evals.
 *
 * L'API est mutualisée entre les agents de l'État et répond « Too Many
 * Requests » en rafale : un tour d'agent enchaîne plusieurs appels, sous-agents
 * compris, et les trois tentatives du SDK s'épuisent en quelques secondes.
 * `maxConcurrency: 1` ne suffit pas, puisqu'il limite les cas simultanés, pas
 * le débit de requêtes d'un même cas.
 *
 * Un limiteur par module : Vitest isole chaque fichier, la fenêtre repart donc
 * de zéro à chaque suite.
 */
export function rateLimitModel({
  requetesParMinute,
}: {
  requetesParMinute: number;
}) {
  const attendreSonTour = createRateLimiter({ requetesParMinute });

  return (model: LanguageModelV4): LanguageModelV4 =>
    wrapLanguageModel({
      model,
      middleware: {
        specificationVersion: "v4",
        wrapGenerate: async ({ doGenerate }) => {
          await attendreSonTour();
          return doGenerate();
        },
        wrapStream: async ({ doStream }) => {
          await attendreSonTour();
          return doStream();
        },
      },
    });
}
