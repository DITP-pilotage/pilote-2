import { getContainer } from "@/server/dependances";
import { endpointImportOpenApi } from "@/server/app/open-api/endpointOpenApi";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default endpointImportOpenApi({
  source: "open-api/decisions-strategiques",
  libelle: "Import des décisions stratégiques",
  recupererHandler: () =>
    getContainer("decisionStrategique").resolve(
      "importDecisionStrategiqueAPIHandler",
    ),
});
