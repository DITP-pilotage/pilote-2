vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

import { createServer, Server } from "node:http";
import { Session } from "next-auth";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import {
  handleRapportDetaillePdf,
  RapportDetaillePdfDependencies,
} from "@/server/rapport-detaille/handlers/rapportDetaillePdfHandler";
import { createSerialQueue } from "@/server/rapport-detaille/handlers/serialQueue";
import { createSlotLimiter } from "@/server/rapport-detaille/handlers/slotLimiter";
import { VueDEnsembleRapportDetaille } from "@/server/rapport-detaille/rapportDetaille.interface";
import { renderRapportDetaillePdf } from "@/server/rapport-detaille/pdf/generateRapportDetaillePdf";
import { buildTestSession } from "@/server/rapport-detaille/testSession";
import { buildTestChantier } from "@/server/rapport-detaille/testData";
import {
  buildTestChantierDetail,
  buildTestVueDEnsemble,
} from "@/server/rapport-detaille/pdf/testHelpers";

const nationalSession = buildTestSession({
  habilitations: {
    ...buildTestSession().habilitations,
    lecture: {
      ...buildTestSession().habilitations.lecture,
      chantiers: ["A", "B"],
      territoires: ["NAT-FR"],
    },
  },
});

function buildDependencies(
  overrides: Partial<RapportDetaillePdfDependencies> = {},
): RapportDetaillePdfDependencies {
  const chantiers = Array.from({ length: 12 }, (_, index) =>
    buildTestChantier({ id: `C${index}` }),
  );
  return {
    loadVueDEnsemble: vi.fn(async () => buildTestVueDEnsemble({ chantiers })),
    loadChantierDetails: vi.fn(async (lot: ChantierRapportDetailleContrat[]) =>
      lot.map((chantier) =>
        buildTestChantierDetail({ chantierId: chantier.id }),
      ),
    ),
    getHideNonApplicable: vi.fn(async () => false),
    renderPdf: vi.fn(renderRapportDetaillePdf),
    enqueue: createSerialQueue(10),
    slots: createSlotLimiter(20),
    sendDeadlineMs: 600_000,
    loadingTimeoutMs: 60_000,
    abandonedLoads: createSlotLimiter(2),
    abandonedLoadMaxMs: 300_000,
    now: () => new Date("2026-10-01T07:05:00Z"),
    ...overrides,
  };
}

let server: Server;

async function startServer(
  session: Session | null,
  dependencies: RapportDetaillePdfDependencies,
) {
  server = createServer((incoming, response) => {
    const url = new URL(incoming.url ?? "", "http://localhost");
    const query = Object.fromEntries(url.searchParams.entries());
    void handleRapportDetaillePdf({ query }, response, session, dependencies);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return `http://localhost:${port}`;
}

async function startGatedServer(dependencies: RapportDetaillePdfDependencies) {
  const gate = deferred<void>();
  const firstRequestReceived = deferred<void>();
  const firstRequestClosed = deferred<void>();
  server = createServer((incoming, response) => {
    const url = new URL(incoming.url ?? "", "http://localhost");
    const query = Object.fromEntries(url.searchParams.entries());
    firstRequestReceived.resolve();
    response.once("close", () => firstRequestClosed.resolve());
    void gate.promise.then(() =>
      handleRapportDetaillePdf(
        { query },
        response,
        nationalSession,
        dependencies,
      ),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    baseUrl: `http://localhost:${port}`,
    openGate: () => gate.resolve(),
    firstRequestReceived: firstRequestReceived.promise,
    firstRequestClosed: firstRequestClosed.promise,
  };
}

async function request(
  path: string,
  session: Session | null,
  dependencies: RapportDetaillePdfDependencies,
) {
  return fetch(`${await startServer(session, dependencies)}${path}`);
}

function deferred<Value>() {
  let resolve: (value: Value) => void = () => {};
  const promise = new Promise<Value>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

function trackedQueue(maxPending: number) {
  const queue = createSerialQueue(maxPending);
  const runs: Promise<unknown>[] = [];
  const enqueue: RapportDetaillePdfDependencies["enqueue"] = (job) => {
    const run = queue(job);
    runs.push(run.catch(() => undefined));
    return run;
  };
  return {
    enqueue,
    enqueuedCount: () => runs.length,
    idle: () => Promise.all(runs),
  };
}

function gatedDetails(options: { failFirst: boolean }) {
  const gate = deferred<void>();
  const calls: Promise<unknown>[] = [];
  const loadChantierDetails = vi.fn<
    RapportDetaillePdfDependencies["loadChantierDetails"]
  >((lot) => {
    const call =
      options.failFirst && calls.length === 0
        ? Promise.reject(new Error("base indisponible"))
        : gate.promise.then(() =>
            lot.map((chantier) =>
              buildTestChantierDetail({ chantierId: chantier.id }),
            ),
          );
    calls.push(call.catch(() => undefined));
    return call;
  });
  return {
    loadChantierDetails,
    openGate: () => gate.resolve(),
    settled: async () => {
      await Promise.all(calls);
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

const sixtyChantiers = Array.from({ length: 60 }, (_, index) =>
  buildTestChantier({ id: `C${index}` }),
);

const PDF_BYTES = new TextEncoder().encode("%PDF-1.3 test %%EOF");

afterEach(() => {
  server?.closeAllConnections();
  server?.close();
});

describe("handleRapportDetaillePdf", () => {
  it("refuse une requête sans session", async () => {
    const response = await request(
      "/?territoireCode=NAT-FR",
      null,
      buildDependencies(),
    );

    expect(response.status).toBe(401);
  });

  it("refuse un territoire non habilité sans rien charger", async () => {
    const dependencies = buildDependencies();

    const response = await request(
      "/?territoireCode=DEPT-75",
      nationalSession,
      dependencies,
    );

    expect(response.status).toBe(403);
    expect(dependencies.loadVueDEnsemble).not.toHaveBeenCalled();
  });

  it("refuse une requête sans territoire", async () => {
    const response = await request("/", nationalSession, buildDependencies());

    expect(response.status).toBe(400);
  });

  it("envoie la vue d'ensemble sans charger les détails quand detail est absent", async () => {
    const dependencies = buildDependencies();

    const response = await request(
      "/?territoireCode=NAT-FR",
      nationalSession,
      dependencies,
    );
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="rapport-detaille-NAT-FR-2026-10-01.pdf"',
    );
    expect(body.subarray(0, 4).toString()).toBe("%PDF");
    expect(body.subarray(-6).toString()).toContain("%%EOF");
    expect(dependencies.loadChantierDetails).not.toHaveBeenCalled();
  });

  it("charge les détails par lots de 10 dans l'ordre des chantiers", async () => {
    const dependencies = buildDependencies();

    const response = await request(
      "/?territoireCode=NAT-FR&detail=true",
      nationalSession,
      dependencies,
    );
    await response.arrayBuffer();

    expect(response.status).toBe(200);
    const lots = vi
      .mocked(dependencies.loadChantierDetails)
      .mock.calls.map(([lot]) => lot.map((chantier) => chantier.id));
    expect(lots).toEqual([
      ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"],
      ["C10", "C11"],
    ]);
  });

  it("répond 500 quand le chargement échoue avant l'envoi", async () => {
    const response = await request(
      "/?territoireCode=NAT-FR",
      nationalSession,
      buildDependencies({
        loadVueDEnsemble: vi.fn(async () => {
          throw new Error("base indisponible");
        }),
      }),
    );

    expect(response.status).toBe(500);
  });

  it("sert les demandes simultanées l'une après l'autre", async () => {
    const firstRender = deferred<Uint8Array>();
    const renderPdf = vi
      .fn<RapportDetaillePdfDependencies["renderPdf"]>()
      .mockReturnValueOnce(firstRender.promise)
      .mockResolvedValueOnce(PDF_BYTES);
    const queue = trackedQueue(10);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({ renderPdf, enqueue: queue.enqueue }),
    );

    const first = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(renderPdf).toHaveBeenCalledTimes(1));
    const second = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(queue.enqueuedCount()).toBe(2));
    const rendersWhileFirstIsRunning = renderPdf.mock.calls.length;
    firstRender.resolve(PDF_BYTES);
    const responses = await Promise.all([first, second]);

    expect(rendersWhileFirstIsRunning).toBe(1);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(
      responses.map((response) => response.headers.get("content-type")),
    ).toEqual(["application/pdf", "application/pdf"]);
    expect(renderPdf).toHaveBeenCalledTimes(2);
  });

  it("répond 503 quand la file d'attente est pleine", async () => {
    const blockedRender = deferred<Uint8Array>();
    const queue = createSerialQueue(1);
    let enqueued = 0;
    const enqueue: RapportDetaillePdfDependencies["enqueue"] = (job) => {
      enqueued += 1;
      return queue(job);
    };
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({
        enqueue,
        renderPdf: vi.fn(() => blockedRender.promise),
      }),
    );

    const running = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const waiting = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(enqueued).toBe(2));
    const refused = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect(refused.status).toBe(503);
    expect(refused.headers.get("retry-after")).toBe("10");
    blockedRender.resolve(PDF_BYTES);
    await Promise.all([running, waiting]);
  });

  it("envoie le PDF avec sa taille", async () => {
    const response = await request(
      "/?territoireCode=NAT-FR",
      nationalSession,
      buildDependencies({ renderPdf: vi.fn(async () => PDF_BYTES) }),
    );

    expect(response.headers.get("content-length")).toBe(
      String(PDF_BYTES.byteLength),
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PDF_BYTES);
  });

  it("libère la file avant l'envoi, même si le client ne lit pas le PDF", async () => {
    const largePdf = new Uint8Array(64 * 1024 * 1024);
    const renderPdf = vi
      .fn<RapportDetaillePdfDependencies["renderPdf"]>()
      .mockResolvedValueOnce(largePdf)
      .mockResolvedValueOnce(PDF_BYTES);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({ renderPdf, enqueue: createSerialQueue(0) }),
    );

    const unread = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect(unread.status).toBe(200);
    expect(next.status).toBe(200);
  });

  it("répond 500 puis sert la demande suivante quand le rendu échoue", async () => {
    const renderPdf = vi
      .fn<RapportDetaillePdfDependencies["renderPdf"]>()
      .mockRejectedValueOnce(new Error("worker arrêté"))
      .mockResolvedValueOnce(PDF_BYTES);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({ renderPdf }),
    );

    const failed = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect(failed.status).toBe(500);
    expect(next.status).toBe(200);
  });

  it("charge au plus 3 lots de détails à la fois", async () => {
    const chantiers = Array.from({ length: 60 }, (_, index) =>
      buildTestChantier({ id: `C${index}` }),
    );
    let inFlight = 0;
    let maxInFlight = 0;
    const loadChantierDetails = vi.fn(
      async (lot: ChantierRapportDetailleContrat[]) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setImmediate(resolve));
        inFlight -= 1;
        return lot.map((chantier) =>
          buildTestChantierDetail({ chantierId: chantier.id }),
        );
      },
    );

    const response = await request(
      "/?territoireCode=NAT-FR&detail=true",
      nationalSession,
      buildDependencies({
        loadVueDEnsemble: vi.fn(async () =>
          buildTestVueDEnsemble({ chantiers }),
        ),
        loadChantierDetails,
        renderPdf: vi.fn(async () => PDF_BYTES),
      }),
    );

    expect(response.status).toBe(200);
    expect(loadChantierDetails).toHaveBeenCalledTimes(6);
    expect(maxInFlight).toBe(3);
  });

  it("répond 503 tant que les PDF en cours d'envoi occupent toutes les places", async () => {
    const largePdf = new Uint8Array(64 * 1024 * 1024);
    const renderPdf = vi
      .fn<RapportDetaillePdfDependencies["renderPdf"]>()
      .mockResolvedValueOnce(largePdf)
      .mockResolvedValue(PDF_BYTES);
    const slots = createSlotLimiter(1);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({ renderPdf, slots }),
    );

    const unread = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const refused = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await unread.arrayBuffer();
    await vi.waitFor(() => expect(slots.isFull()).toBe(false));
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect(refused.status).toBe(503);
    expect(refused.headers.get("retry-after")).toBe("10");
    expect(next.status).toBe(200);
  });

  it("rend la place d'un client parti avant que sa demande soit traitée", async () => {
    const slots = createSlotLimiter(1);
    const { baseUrl, openGate, firstRequestReceived, firstRequestClosed } =
      await startGatedServer(
        buildDependencies({ renderPdf: vi.fn(async () => PDF_BYTES), slots }),
      );

    const abandoned = new AbortController();
    const gone = fetch(`${baseUrl}/?territoireCode=NAT-FR`, {
      signal: abandoned.signal,
    }).catch(() => null);
    await firstRequestReceived;
    abandoned.abort();
    await gone;
    await firstRequestClosed;
    openGate();
    await vi.waitFor(() => expect(slots.isFull()).toBe(false));
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect(next.status).toBe(200);
  });

  it("ne génère pas le PDF d'un client parti pendant son attente dans la file", async () => {
    const firstRender = deferred<Uint8Array>();
    const loadVueDEnsemble = vi.fn(async () => buildTestVueDEnsemble());
    const renderPdf = vi
      .fn<RapportDetaillePdfDependencies["renderPdf"]>()
      .mockReturnValueOnce(firstRender.promise)
      .mockResolvedValue(PDF_BYTES);
    const queue = trackedQueue(10);
    const slots = createSlotLimiter(2);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({
        loadVueDEnsemble,
        renderPdf,
        enqueue: queue.enqueue,
        slots,
      }),
    );

    const first = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(renderPdf).toHaveBeenCalledTimes(1));
    const abandoned = new AbortController();
    const gone = fetch(`${baseUrl}/?territoireCode=NAT-FR`, {
      signal: abandoned.signal,
    }).catch(() => null);
    await vi.waitFor(() => expect(queue.enqueuedCount()).toBe(2));
    abandoned.abort();
    await gone;
    await vi.waitFor(() => expect(slots.isFull()).toBe(false));
    firstRender.resolve(PDF_BYTES);
    await first;
    await queue.idle();

    expect(loadVueDEnsemble).toHaveBeenCalledTimes(1);
  });

  it("coupe l'envoi d'un PDF qui dépasse le délai total et rend sa place", async () => {
    const largePdf = new Uint8Array(64 * 1024 * 1024);
    const renderPdf = vi
      .fn<RapportDetaillePdfDependencies["renderPdf"]>()
      .mockResolvedValueOnce(largePdf)
      .mockResolvedValue(PDF_BYTES);
    const slots = createSlotLimiter(1);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({ renderPdf, slots, sendDeadlineMs: 50 }),
    );

    const unread = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(slots.isFull()).toBe(false), {
      timeout: 5_000,
    });
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await unread.body?.cancel().catch(() => undefined);

    expect(next.status).toBe(200);
  });

  it("répond 500 et libère la file quand le chargement en base reste bloqué", async () => {
    const loadVueDEnsemble = vi
      .fn<RapportDetaillePdfDependencies["loadVueDEnsemble"]>()
      .mockReturnValueOnce(new Promise(() => {}))
      .mockResolvedValue(buildTestVueDEnsemble());
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({
        loadVueDEnsemble,
        renderPdf: vi.fn(async () => PDF_BYTES),
        loadingTimeoutMs: 50,
      }),
    );

    const stuck = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect(stuck.status).toBe(500);
    expect(next.status).toBe(200);
  });

  it("refuse de nouvelles générations tant que des chargements abandonnés tournent encore", async () => {
    const stuckLoad = deferred<VueDEnsembleRapportDetaille>();
    const loadVueDEnsemble = vi
      .fn<RapportDetaillePdfDependencies["loadVueDEnsemble"]>()
      .mockReturnValueOnce(stuckLoad.promise)
      .mockResolvedValue(buildTestVueDEnsemble());
    const abandonedLoads = createSlotLimiter(1);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({
        loadVueDEnsemble,
        renderPdf: vi.fn(async () => PDF_BYTES),
        loadingTimeoutMs: 20,
        abandonedLoads,
      }),
    );

    const timedOut = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const refused = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    stuckLoad.resolve(buildTestVueDEnsemble());
    await vi.waitFor(() => expect(abandonedLoads.isFull()).toBe(false));
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect([timedOut.status, refused.status, next.status]).toEqual([
      500, 503, 200,
    ]);
  });

  it("refuse une demande en file dont le tour arrive alors que les chargements abandonnés sont au plafond", async () => {
    const stuckLoad = deferred<VueDEnsembleRapportDetaille>();
    const loadVueDEnsemble = vi
      .fn<RapportDetaillePdfDependencies["loadVueDEnsemble"]>()
      .mockReturnValueOnce(stuckLoad.promise)
      .mockResolvedValue(buildTestVueDEnsemble());
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({
        loadVueDEnsemble,
        renderPdf: vi.fn(async () => PDF_BYTES),
        loadingTimeoutMs: 100,
        abandonedLoads: createSlotLimiter(1),
      }),
    );

    const timedOut = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(loadVueDEnsemble).toHaveBeenCalledTimes(1));
    const queued = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const statuses = await Promise.all([timedOut, queued]);
    stuckLoad.resolve(buildTestVueDEnsemble());

    expect(statuses.map((response) => response.status)).toEqual([500, 503]);
    expect(loadVueDEnsemble).toHaveBeenCalledTimes(1);
  });

  it("rend la place d'un chargement abandonné qui ne se termine jamais", async () => {
    const loadVueDEnsemble = vi
      .fn<RapportDetaillePdfDependencies["loadVueDEnsemble"]>()
      .mockReturnValueOnce(new Promise(() => {}))
      .mockResolvedValue(buildTestVueDEnsemble());
    const abandonedLoads = createSlotLimiter(1);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({
        loadVueDEnsemble,
        renderPdf: vi.fn(async () => PDF_BYTES),
        loadingTimeoutMs: 20,
        abandonedLoads,
        abandonedLoadMaxMs: 50,
      }),
    );

    const timedOut = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const refused = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(abandonedLoads.isFull()).toBe(false), {
      timeout: 5_000,
    });
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect([timedOut.status, refused.status, next.status]).toEqual([
      500, 503, 200,
    ]);
  });

  it("ne lance plus de lot de détails après l'échec d'un lot", async () => {
    const details = gatedDetails({ failFirst: true });

    const response = await request(
      "/?territoireCode=NAT-FR&detail=true",
      nationalSession,
      buildDependencies({
        loadVueDEnsemble: vi.fn(async () =>
          buildTestVueDEnsemble({ chantiers: sixtyChantiers }),
        ),
        loadChantierDetails: details.loadChantierDetails,
      }),
    );
    details.openGate();
    await details.settled();

    expect(response.status).toBe(500);
    expect(details.loadChantierDetails).toHaveBeenCalledTimes(3);
  });

  it("ne lance plus de lot de détails après le délai de chargement", async () => {
    const details = gatedDetails({ failFirst: false });

    const response = await request(
      "/?territoireCode=NAT-FR&detail=true",
      nationalSession,
      buildDependencies({
        loadVueDEnsemble: vi.fn(async () =>
          buildTestVueDEnsemble({ chantiers: sixtyChantiers }),
        ),
        loadChantierDetails: details.loadChantierDetails,
        loadingTimeoutMs: 20,
      }),
    );
    details.openGate();
    await details.settled();

    expect(response.status).toBe(500);
    expect(details.loadChantierDetails).toHaveBeenCalledTimes(3);
  });
});
