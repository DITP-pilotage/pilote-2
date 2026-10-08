import { NextApiRequest, NextApiResponse } from "next";
import { PiloteError } from "@/shared/errors/pilote-error";
import { logger } from "@/server/framework/logger";

export const errorHandler =
  (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof PiloteError) {
        logger.error(
          {
            categorie: "systeme",
            source: "error-handler",
            statusCode: error.status,
            type: error.type,
          },
          error.message,
        );
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      } else {
        logger.error(
          { categorie: "systeme", source: "error-handler", statusCode: 500 },
          `Erreur interne : ${(error as Error).message}`,
        );
        return res.status(500).json({
          success: false,
          message:
            "Une erreur est survenue, veuillez contacter le support pour plus d'information",
        });
      }
    }
  };
