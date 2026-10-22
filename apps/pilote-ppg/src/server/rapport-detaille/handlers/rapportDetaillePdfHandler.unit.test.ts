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
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({ renderPdf }),
    );

    const first = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await vi.waitFor(() => expect(renderPdf).toHaveBeenCalledTimes(1));
    const second = fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(renderPdf).toHaveBeenCalledTimes(1);
    firstRender.resolve(PDF_BYTES);
    const responses = await Promise.all([first, second]);

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

  it("charge les lots de détails en parallèle", async () => {
    const chantiers = Array.from({ length: 25 }, (_, index) =>
      buildTestChantier({ id: `C${index}` }),
    );
    const gate = deferred<void>();
    const loadChantierDetails = vi.fn(
      async (lot: ChantierRapportDetailleContrat[]) => {
        await gate.promise;
        return lot.map((chantier) =>
          buildTestChantierDetail({ chantierId: chantier.id }),
        );
      },
    );
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({
        loadVueDEnsemble: vi.fn(async () =>
          buildTestVueDEnsemble({ chantiers }),
        ),
        loadChantierDetails,
        renderPdf: vi.fn(async () => PDF_BYTES),
      }),
    );

    const response = fetch(`${baseUrl}/?territoireCode=NAT-FR&detail=true`);
    await vi.waitFor(() =>
      expect(loadChantierDetails).toHaveBeenCalledTimes(3),
    );
    gate.resolve();

    expect((await response).status).toBe(200);
  });

  it("répond 503 tant que les PDF en cours d'envoi occupent toutes les places", async () => {
    const largePdf = new Uint8Array(64 * 1024 * 1024);
    const renderPdf = vi
      .fn<RapportDetaillePdfDependencies["renderPdf"]>()
      .mockResolvedValueOnce(largePdf)
      .mockResolvedValue(PDF_BYTES);
    const baseUrl = await startServer(
      nationalSession,
      buildDependencies({ renderPdf, slots: createSlotLimiter(1) }),
    );

    const unread = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    const refused = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);
    await unread.arrayBuffer();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const next = await fetch(`${baseUrl}/?territoireCode=NAT-FR`);

    expect(refused.status).toBe(503);
    expect(refused.headers.get("retry-after")).toBe("10");
    expect(next.status).toBe(200);
  });
});
