import { getContainer } from "@/server/dependances";
import { endpointImportOpenApi } from "@/server/app/open-api/endpointOpenApi";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default endpointImportOpenApi({
  source: "open-api/objectifs",
  libelle: "Import des objectifs",
  recupererHandler: () =>
    getContainer("objectif").resolve("importObjectifAPIHandler"),
});
