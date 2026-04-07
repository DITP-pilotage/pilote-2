import { NextApiRequest, NextApiResponse } from "next";
import { PiloteError } from "@/server/app/error-boundary/pilote-error";
import Logger from "@/server/infrastructure/Logger";

export const errorHandler =
  (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof PiloteError) {
        Logger.error(
          { categorie: "api", source: "error-handler", statusCode: error.status, type: error.type },
          error.message,
        );
        return res
          .status(error.status)
          .json({ success: false, message: error.message });
      } else {
        Logger.error(
          { categorie: "api", source: "error-handler", statusCode: 500 },
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
