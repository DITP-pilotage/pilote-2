vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

import { createServer, Server } from "node:http";
import { Session } from "next-auth";
import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import {
  handleRapportDetaillePdf,
  RapportDetaillePdfDependencies,
} from "@/server/rapport-detaille/handlers/rapportDetaillePdfHandler";
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
    now: () => new Date("2026-10-01T07:05:00Z"),
    ...overrides,
  };
}

let server: Server;

async function request(
  path: string,
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
  return fetch(`http://localhost:${port}${path}`);
}

afterEach(() => {
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
});
