import { ServerResponse } from "node:http";
import { pipeline } from "node:stream/promises";
import { Session } from "next-auth";
import logger from "@/server/infrastructure/Logger";
import { getContainer } from "@/server/dependances";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { isClientDisconnection } from "@/server/infrastructure/export_csv/ecrireCsvEnStreaming";
import {
  buildRapportDetailleContext,
  RapportDetailleContext,
  RapportDetailleQuery,
} from "@/server/rapport-detaille/rapportDetailleContext";
import { loadVueDEnsemble } from "@/server/rapport-detaille/loadVueDEnsemble";
import { loadChantierDetails } from "@/server/rapport-detaille/loadChantierDetails";
import {
  ChantierDetail,
  VueDEnsembleRapportDetaille,
} from "@/server/rapport-detaille/rapportDetaille.interface";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { generateRapportDetaillePdf } from "@/server/rapport-detaille/pdf/generateRapportDetaillePdf";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";

const DETAILS_BATCH_SIZE = 10;

export type RapportDetaillePdfDependencies = {
  loadVueDEnsemble: (
    context: RapportDetailleContext,
  ) => Promise<VueDEnsembleRapportDetaille>;
  loadChantierDetails: (
    chantiers: ChantierRapportDetailleContrat[],
    context: RapportDetailleContext,
    selectedTerritoire: Territoire,
  ) => Promise<ChantierDetail[]>;
  getHideNonApplicable: () => Promise<boolean>;
  now: () => Date;
};

export function defaultRapportDetaillePdfDependencies(): RapportDetaillePdfDependencies {
  return {
    loadVueDEnsemble: (context) => loadVueDEnsemble(context),
    loadChantierDetails: (chantiers, context, selectedTerritoire) =>
      loadChantierDetails(chantiers, context, selectedTerritoire),
    getHideNonApplicable: async () => {
      const variables = await getContainer("legacy")
        .resolve("recupererToutesLesVariablesContenuUseCase")
        .run();
      return (
        variables.NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES === true
      );
    },
    now: () => new Date(),
  };
}

function sendError(response: ServerResponse, status: number, message: string) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ message }));
}

async function loadAllDetails(
  vue: VueDEnsembleRapportDetaille,
  context: RapportDetailleContext,
  dependencies: RapportDetaillePdfDependencies,
): Promise<ChantierDetail[]> {
  const details: ChantierDetail[] = [];
  for (
    let index = 0;
    index < vue.chantiers.length;
    index += DETAILS_BATCH_SIZE
  ) {
    details.push(
      ...(await dependencies.loadChantierDetails(
        vue.chantiers.slice(index, index + DETAILS_BATCH_SIZE),
        context,
        vue.selectedTerritoire,
      )),
    );
  }
  return details;
}

export async function handleRapportDetaillePdf(
  request: { query: RapportDetailleQuery },
  response: ServerResponse,
  session: Session | null,
  dependencies: RapportDetaillePdfDependencies = defaultRapportDetaillePdfDependencies(),
): Promise<void> {
  if (!session?.habilitations) {
    sendError(response, 401, "Vous devez être authentifié");
    return;
  }
  const { territoireCode } = request.query;
  if (typeof territoireCode !== "string" || territoireCode.length === 0) {
    sendError(response, 400, "Le territoire est manquant");
    return;
  }
  if (
    !new Habilitation(session.habilitations).peutAccéderAuTerritoire(
      territoireCode,
    )
  ) {
    sendError(response, 403, "Territoire non autorisé");
    return;
  }

  let pdf: PDFKit.PDFDocument;
  try {
    const context = buildRapportDetailleContext(
      request.query,
      territoireCode,
      session,
    );
    const vue = await dependencies.loadVueDEnsemble(context);
    const [details, hideNonApplicable] = await Promise.all([
      context.showDetail
        ? loadAllDetails(vue, context, dependencies)
        : Promise.resolve([]),
      dependencies.getHideNonApplicable(),
    ]);
    pdf = await generateRapportDetaillePdf({
      vue,
      details,
      context,
      hideNonApplicable,
      now: dependencies.now(),
    }).getStream();
  } catch (error) {
    logger.error({ error }, "Génération du PDF du rapport détaillé impossible");
    sendError(response, 500, "Erreur lors de la génération du PDF");
    return;
  }

  const date = formatParisDate(dependencies.now(), "YYYY-MM-DD");
  response.statusCode = 200;
  response.setHeader("Content-Type", "application/pdf");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="rapport-detaille-${territoireCode}-${date}.pdf"`,
  );
  try {
    const sending = pipeline(pdf, response);
    pdf.end();
    await sending;
  } catch (error) {
    if (isClientDisconnection(error) || response.destroyed) return;
    logger.error({ error }, "Envoi du PDF du rapport détaillé interrompu");
    response.destroy();
  }
}
