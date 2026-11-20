import { NextApiRequest, NextApiResponse } from "next";
import { getContainer } from "@/server/dependances";
import { logger } from "@/server/framework/logger";
import { onlyFormationsApiSecret } from "@/server/framework/guards/onlyFormationsApiSecret";
import {
  verifierEnvoi,
  type ErreurEnvoi,
} from "@/server/formations/domain/envoiFormations";
import { importFormationsSchema } from "@/validation/import-formations";

const SOURCE = "open-api/formations";

const refuser = (response: NextApiResponse, erreurs: ErreurEnvoi[]) => {
  logger.warn(
    { categorie: "formation", source: SOURCE, nombreErreurs: erreurs.length },
    "Envoi des formations refusé",
  );
  response.status(400).json({
    message: "L'envoi des formations n'est pas valide.",
    erreurs,
  });
};

// Copilot envoie chaque jour l'état complet de RDV-SP. Tout ou rien : un envoi
// invalide est refusé avant toute écriture.
const handle = async (request: NextApiRequest, response: NextApiResponse) => {
  const validation = importFormationsSchema.safeParse(request.body);
  if (!validation.success) {
    return refuser(
      response,
      validation.error.issues.map((issue) => ({
        chemin: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const erreurs = verifierEnvoi(validation.data);
  if (erreurs.length > 0) {
    return refuser(response, erreurs);
  }

  const resultat = await getContainer("formations")
    .resolve("syncFormationsHandler")
    .execute({ commande: validation.data, maintenant: new Date() });
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

export default onlyFormationsApiSecret(handle);
