import { getContainer } from "@/server/dependances";
import { endpointImportOpenApi } from "@/server/app/open-api/endpointOpenApi";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default endpointImportOpenApi({
  source: "open-api/commentaires",
  libelle: "Import des commentaires",
  recupererHandler: () =>
    getContainer("commentaires").resolve("importCommentaireAPIHandler"),
});
