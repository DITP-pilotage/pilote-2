import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@/server/framework/logger";
import {
  syncFormationsCommandSchema,
  type SyncFormationsHandler,
} from "@/server/formations/handlers/SyncFormationsHandler";
import { formatValidationErrors } from "./formatValidationErrors";

const SOURCE = "open-api/formations";

// Reçoit l'état complet de RDV-SP envoyé chaque jour par copilot. Tout ou rien :
// un envoi invalide est refusé avant toute écriture.
export const syncFormationsEndpoint =
  (recupererHandler: () => Pick<SyncFormationsHandler, "execute">) =>
  async (request: NextApiRequest, response: NextApiResponse) => {
    const validation = syncFormationsCommandSchema.safeParse(request.body);
    if (!validation.success) {
      const erreurs = formatValidationErrors(validation.error);
      logger.warn(
        {
          categorie: "formation",
          source: SOURCE,
          nombreErreurs: erreurs.length,
        },
        "Envoi des formations refusé",
      );
      response.status(400).json({
        message: "L'envoi des formations n'est pas valide.",
        erreurs,
      });
      return;
    }

    const resultat = await recupererHandler().execute({
      commande: validation.data,
      maintenant: new Date(),
    });
    logger.info(
      {
        categorie: "formation",
        source: SOURCE,
        motifsEcrits: resultat.motifs.ecrits,
        motifsRetires: resultat.motifs.retires,
        seancesEcrites: resultat.seances.ecrites,
      },
      "Synchronisation des formations réussie",
    );
    response.status(200).json(resultat);
  };
