import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ListSeancesAVenirQuery } from "@/server/formations/queries/ListSeancesAVenirQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

const URL_INSCRIPTION =
  "https://rdv.anct.gouv.fr/prendre_rdv?public_link_organisation_id=1453";
const INTRODUCTION = "CAMPUS PILOTE : Introduction à l'outil";

describe("ListSeancesAVenirQuery", () => {
  const maintenant = new Date("2026-11-18T10:00:00Z");
  let query: ListSeancesAVenirQuery;

  beforeEach(() => {
    query = new ListSeancesAVenirQuery({ prisma: new PrismaPilote() });
  });

  it(
    "retourne les séances qui n'ont pas commencé, triées par date, avec leur statut",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({
        id: BigInt(1),
        nom: INTRODUCTION,
        updated_at: new Date("2026-11-18T05:02:00Z"),
      });
      await fixtures.formationSeance({
        id: BigInt(11),
        motif_id: BigInt(1),
        date_debut: new Date("2026-11-20T13:00:00Z"),
        nombre_inscrits: 12,
        nombre_places_max: 20,
        lieu: "Visioconférence",
        animateurs: "Équipe PILOTE",
      });
      await fixtures.formationSeance({
        id: BigInt(12),
        motif_id: BigInt(1),
        date_debut: new Date("2026-11-19T13:00:00Z"),
        nombre_inscrits: 20,
        nombre_places_max: 20,
      });
      await fixtures.formationSeance({
        id: BigInt(13),
        motif_id: BigInt(1),
        date_debut: new Date("2026-11-25T13:00:00Z"),
        date_annulation: new Date("2026-11-15T08:00:00Z"),
      });
      // Séance commencée une minute avant `maintenant` : elle n'est plus à venir
      await fixtures.formationSeance({
        id: BigInt(14),
        motif_id: BigInt(1),
        date_debut: new Date("2026-11-18T09:59:00Z"),
      });

      // When
      const resultat = await query.run({ maintenant });

      // Then
      expect(resultat).toEqual({
        dateImport: "2026-11-18T05:02:00.000Z",
        seances: [
          {
            id: 12,
            formation: INTRODUCTION,
            dateDebut: "2026-11-19T13:00:00.000Z",
            dureeMinutes: 45,
            lieu: null,
            animateurs: null,
            nombreInscrits: 20,
            nombrePlacesMax: 20,
            urlInscription: URL_INSCRIPTION,
            statut: "COMPLETE",
          },
          {
            id: 11,
            formation: INTRODUCTION,
            dateDebut: "2026-11-20T13:00:00.000Z",
            dureeMinutes: 45,
            lieu: "Visioconférence",
            animateurs: "Équipe PILOTE",
            nombreInscrits: 12,
            nombrePlacesMax: 20,
            urlInscription: URL_INSCRIPTION,
            statut: "OUVERTE",
          },
          {
            id: 13,
            formation: INTRODUCTION,
            dateDebut: "2026-11-25T13:00:00.000Z",
            dureeMinutes: 45,
            lieu: null,
            animateurs: null,
            nombreInscrits: 0,
            nombrePlacesMax: null,
            urlInscription: URL_INSCRIPTION,
            statut: "ANNULEE",
          },
        ],
      });
    }),
  );

  it(
    "renvoie une date d'import nulle et aucune séance tant que copilot n'a rien écrit",
    createIntegrationTest(async () => {
      // When
      const resultat = await query.run({ maintenant });

      // Then
      expect(resultat).toEqual({ dateImport: null, seances: [] });
    }),
  );
});
