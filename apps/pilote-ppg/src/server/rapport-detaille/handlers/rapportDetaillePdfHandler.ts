import { ServerResponse } from "node:http";
import { Session } from "next-auth";
import { logger } from "@/server/framework/logger";
import { getContainer } from "@/server/dependances";
import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";
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
import { Territoire } from "@/shared/territoire/Territoire.interface";
import { GenerateParams } from "@/server/rapport-detaille/pdf/generateRapportDetaillePdf";
import { PDF_CHANTIER_DETAILS_BATCH_SIZE } from "@/server/rapport-detaille/batchSize";
import { renderRapportDetaillePdfInWorker } from "@/server/rapport-detaille/pdf/renderRapportDetaillePdfInWorker";
import { formatParisDate } from "@/server/rapport-detaille/pdf/layout";
import {
  createSerialQueue,
  QueueFullError,
} from "@/server/rapport-detaille/handlers/serialQueue";
import {
  createSlotLimiter,
  SlotLimiter,
} from "@/server/rapport-detaille/handlers/slotLimiter";

const MAX_CONCURRENT_DETAILS_BATCHES = 3;
const RETRY_AFTER_SECONDS = 10;
const MAX_PENDING_GENERATIONS = 10;
const MAX_PDF_REQUESTS_IN_FLIGHT = 20;
const SEND_IDLE_TIMEOUT_MS = 60_000;
const SEND_DEADLINE_MS = 600_000;
const LOADING_TIMEOUT_MS = 60_000;
const MAX_ABANDONED_LOADS = 2;
const ABANDONED_LOAD_MAX_MS = 300_000;

class ClientGoneError extends Error {}
class TooManyAbandonedLoadsError extends Error {}

const generationQueue = createSerialQueue(MAX_PENDING_GENERATIONS);
const pdfRequestSlots = createSlotLimiter(MAX_PDF_REQUESTS_IN_FLIGHT);
const abandonedLoadSlots = createSlotLimiter(MAX_ABANDONED_LOADS);

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
  renderPdf: (params: GenerateParams) => Promise<Uint8Array>;
  enqueue: typeof generationQueue;
  slots: SlotLimiter;
  sendDeadlineMs: number;
  loadingTimeoutMs: number;
  abandonedLoads: SlotLimiter;
  abandonedLoadMaxMs: number;
  now: () => Date;
};

export function defaultRapportDetaillePdfDependencies(): RapportDetaillePdfDependencies {
  return {
    loadVueDEnsemble: (context) => loadVueDEnsemble(context),
    loadChantierDetails: (chantiers, context, selectedTerritoire) =>
      loadChantierDetails(chantiers, context, selectedTerritoire),
    getHideNonApplicable: async () => {
      const variables = await getContainer("gestionContenu")
        .resolve("recupererToutesLesVariablesContenuUseCase")
        .run();
      return (
        variables.NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES === true
      );
    },
    renderPdf: renderRapportDetaillePdfInWorker,
    enqueue: generationQueue,
    slots: pdfRequestSlots,
    sendDeadlineMs: SEND_DEADLINE_MS,
    loadingTimeoutMs: LOADING_TIMEOUT_MS,
    abandonedLoads: abandonedLoadSlots,
    abandonedLoadMaxMs: ABANDONED_LOAD_MAX_MS,
    now: () => new Date(),
  };
}

function sendBusy(response: ServerResponse) {
  response.setHeader("Retry-After", String(RETRY_AFTER_SECONDS));
  sendError(response, 503, "Trop de PDF sont en cours de génération");
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
  signal: AbortSignal,
): Promise<ChantierDetail[]> {
  const batches: ChantierRapportDetailleContrat[][] = [];
  for (
    let index = 0;
    index < vue.chantiers.length;
    index += PDF_CHANTIER_DETAILS_BATCH_SIZE
  ) {
    batches.push(
      vue.chantiers.slice(index, index + PDF_CHANTIER_DETAILS_BATCH_SIZE),
    );
  }
  const details: ChantierDetail[][] = [];
  let nextBatch = 0;
  const loadRemainingBatches = async () => {
    while (nextBatch < batches.length && !signal.aborted) {
      const batchIndex = nextBatch;
      nextBatch += 1;
      details[batchIndex] = await dependencies.loadChantierDetails(
        batches[batchIndex],
        context,
        vue.selectedTerritoire,
      );
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_DETAILS_BATCHES, batches.length) },
      loadRemainingBatches,
    ),
  );
  return details.flat();
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
  if (dependencies.abandonedLoads.isFull()) {
    sendBusy(response);
    return;
  }
  const releaseSlot = dependencies.slots.tryAcquire();
  if (!releaseSlot) {
    sendBusy(response);
    return;
  }
  if (response.closed) {
    releaseSlot();
    return;
  }
  response.once("close", releaseSlot);

  let pdf: Uint8Array;
  try {
    pdf = await dependencies.enqueue(async () => {
      if (response.closed) throw new ClientGoneError();
      if (dependencies.abandonedLoads.isFull()) {
        throw new TooManyAbandonedLoadsError();
      }
      return generate(request.query, territoireCode, session, dependencies);
    });
  } catch (error) {
    if (error instanceof ClientGoneError) return;
    if (
      error instanceof QueueFullError ||
      error instanceof TooManyAbandonedLoadsError
    ) {
      sendBusy(response);
      return;
    }
    logger.error(
      { categorie: "rapport", source: "rapportDetaillePdfHandler" },
      `Génération du PDF du rapport détaillé impossible : ${error instanceof Error ? error.message : String(error)}`,
    );
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
  response.setHeader("Content-Length", String(pdf.byteLength));
  response.setTimeout(SEND_IDLE_TIMEOUT_MS, () => response.destroy());
  const deadline = setTimeout(
    () => response.destroy(),
    dependencies.sendDeadlineMs,
  );
  response.once("close", () => clearTimeout(deadline));
  response.end(pdf);
}

function withTimeout<Result>(
  promise: Promise<Result>,
  timeoutMs: number,
  onTimeout: () => void,
): Promise<Result> {
  let timeout: NodeJS.Timeout | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        onTimeout();
        reject(new Error(`Chargement interrompu après ${timeoutMs} ms`));
      }, timeoutMs);
    }),
  ]).finally(() => clearTimeout(timeout));
}

async function loadData(
  context: RapportDetailleContext,
  dependencies: RapportDetaillePdfDependencies,
  stopLoading: AbortController,
) {
  try {
    const vue = await dependencies.loadVueDEnsemble(context);
    const [details, hideNonApplicable] = await Promise.all([
      context.showDetail
        ? loadAllDetails(vue, context, dependencies, stopLoading.signal)
        : Promise.resolve([]),
      dependencies.getHideNonApplicable(),
    ]);
    return { vue, details, hideNonApplicable };
  } catch (error) {
    stopLoading.abort();
    throw error;
  }
}

function holdAbandonedLoadSlot(
  loading: Promise<unknown>,
  dependencies: RapportDetaillePdfDependencies,
) {
  const release = dependencies.abandonedLoads.tryAcquire();
  if (!release) return;
  const forcedRelease = setTimeout(() => {
    logger.warn(
      { categorie: "rapport", source: "rapportDetaillePdfHandler" },
      `Chargement abandonné du PDF du rapport détaillé toujours en cours après ${dependencies.abandonedLoadMaxMs} ms : sa place est rendue`,
    );
    release();
  }, dependencies.abandonedLoadMaxMs);
  const settle = () => {
    clearTimeout(forcedRelease);
    release();
  };
  loading.then(settle, settle);
}

async function generate(
  query: RapportDetailleQuery,
  territoireCode: string,
  session: Session,
  dependencies: RapportDetaillePdfDependencies,
): Promise<Uint8Array> {
  const context = buildRapportDetailleContext(query, territoireCode, session);
  const stopLoading = new AbortController();
  const loading = loadData(context, dependencies, stopLoading);
  const { vue, details, hideNonApplicable } = await withTimeout(
    loading,
    dependencies.loadingTimeoutMs,
    () => {
      stopLoading.abort();
      holdAbandonedLoadSlot(loading, dependencies);
    },
  );
  return dependencies.renderPdf({
    vue,
    details,
    context,
    hideNonApplicable,
    now: dependencies.now(),
  });
}
