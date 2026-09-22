import { NextApiRequest, NextApiResponse } from "next";
import { getContainer } from "@/server/dependances";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handle(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  await getContainer("parametrageIndicateur")
    .resolve("importMasseMetadataIndicateurHandler")
    .handle(request)
    .then(() => {
      response.status(200).json({});
    })
    .catch((error: unknown) => {
      response.status(500).json({
        message: error instanceof Error ? error.message : String(error),
      });
    });
}
