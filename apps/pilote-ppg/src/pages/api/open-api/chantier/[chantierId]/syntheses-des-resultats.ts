import { getContainer } from "@/server/dependances";
import { endpointImportOpenApi } from "@/server/app/open-api/endpointOpenApi";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default endpointImportOpenApi({
  source: "open-api/syntheses-des-resultats",
  libelle: "Import des synthèses des résultats",
  recupererHandler: () =>
    getContainer("importSyntheseDesResultats").resolve(
      "importSyntheseDesResultatsAPIHandler",
    ),
});
