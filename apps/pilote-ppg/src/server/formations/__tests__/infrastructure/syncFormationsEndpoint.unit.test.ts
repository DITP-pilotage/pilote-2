import type { NextApiRequest } from "next";
import { syncFormationsEndpoint } from "@/server/formations/infrastructure/open-api/syncFormationsEndpoint";
import { setupRequest, setupResponse } from "@/test/apiTestHelpers";

vi.mock("@/config", () => ({
  configuration: vi.fn(() => ({ logLevel: "warn" })),
}));

const SEANCE = {
  id: 884512,
  motif_id: 2101,
  date_debut: "2026-12-03T09:30:00+01:00",
  duree_minutes: 90,
  animateurs: ["Camille Martin"],
  cancelled_at: null,
  nombre_places_max: 20,
  nombre_inscrits: 12,
  url_inscription:
    "https://rdv.anct.gouv.fr/users/rdv_wizard_step/new?rdv_collectif_id=884512",
};

const ENVOI = {
  motifs: [{ id: 2101, nom: "CAMPUS PILOTE : Introduction à l'outil" }],
  seances: [SEANCE],
};

const requeteAvecCorps = (body: unknown) =>
  ({ ...setupRequest({ method: "PUT" }), body }) as unknown as NextApiRequest;

describe("syncFormationsEndpoint", () => {
  it("refuse un corps absent, sans appeler le handler", async () => {
    // Given
    const handler = { execute: vi.fn() };
    const response = setupResponse();

    // When
    await syncFormationsEndpoint(() => handler)(
      requeteAvecCorps(undefined),
      response,
    );

    // Then
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.status().json).toHaveBeenCalledWith({
      message: "L'envoi des formations n'est pas valide.",
      erreurs: [{ chemin: "", message: expect.any(String) }],
    });
    expect(handler.execute).not.toHaveBeenCalled();
  });

  it("renvoie les compteurs du handler pour un envoi valide", async () => {
    // Given
    const resultat = {
      motifs: { ecrits: 1, retires: 0 },
      seances: { ecrites: 1 },
    };
    const handler = { execute: vi.fn().mockResolvedValue(resultat) };
    const response = setupResponse();
    const corps = {
      ...ENVOI,
      seances: [{ ...SEANCE, visio_url: "https://webconf.example/abc" }],
    };

    // When
    await syncFormationsEndpoint(() => handler)(
      requeteAvecCorps(corps),
      response,
    );

    // Then
    expect(handler.execute).toHaveBeenCalledWith({
      commande: ENVOI,
      maintenant: expect.any(Date),
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.status().json).toHaveBeenCalledWith(resultat);
  });
});
