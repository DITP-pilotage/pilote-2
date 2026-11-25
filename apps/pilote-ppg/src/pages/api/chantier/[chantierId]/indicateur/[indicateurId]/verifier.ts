import { NextApiRequest, NextApiResponse } from "next";
import { getContainer } from "@/server/dependances";
import { onlyPost } from "@/server/framework/guards/onlyPost";

export const config = {
  api: {
    bodyParser: false,
  },
};

function handle(req: NextApiRequest, res: NextApiResponse) {
  return getContainer("importIndicateur")
    .resolve("verifierFichierImportIndicateurHandler")
    .handle(req, res);
}

export default onlyPost(handle);
