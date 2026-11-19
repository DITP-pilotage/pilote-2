import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { ListPeriodesInformationQuery } from "@/server/formations/queries/ListPeriodesInformationQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("ListPeriodesInformationQuery", () => {
  const maintenant = new Date("2026-11-18T10:00:00Z");
  let query: ListPeriodesInformationQuery;

  beforeEach(() => {
    query = new ListPeriodesInformationQuery({ prisma: new PrismaPilote() });
  });

  it(
    "retourne les périodes de la plus récente à la plus ancienne, avec statut et formations, et les formations disponibles",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1), nom: "A formation" });
      await fixtures.formationMotif({ id: BigInt(2), nom: "B formation" });
      await fixtures.formationMotif({
        id: BigInt(3),
        nom: "C supprimée",
        date_suppression: new Date("2026-11-10T00:00:00Z"),
      });
      await fixtures.formationSeance({
        motif_id: BigInt(1),
        date_debut: new Date("2026-11-20T13:00:00Z"),
      });
      // Seule séance à venir du motif 2, et elle est annulée
      await fixtures.formationSeance({
        motif_id: BigInt(2),
        date_debut: new Date("2026-11-21T13:00:00Z"),
        date_annulation: new Date("2026-11-15T08:00:00Z"),
      });
      // Le motif 3 est supprimé dans RDV-SP, le motif 99 n'existe plus dans formation_motif
      const enCours = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-03T00:00:00Z"),
        date_fin: new Date("2026-11-30T00:00:00Z"),
        motifIds: [BigInt(1), BigInt(3), BigInt(99)],
      });
      const aVenir = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-01T00:00:00Z"),
        date_fin: new Date("2026-12-31T00:00:00Z"),
        motifIds: [BigInt(2)],
      });
      const supprimee = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-20T00:00:00Z"),
        date_fin: new Date("2026-12-10T00:00:00Z"),
        deleted_at: new Date("2026-11-15T08:00:00Z"),
        motifIds: [BigInt(1)],
      });

      // When
      const resultat = await query.run({ maintenant });

      // Then
      expect(resultat).toEqual({
        periodes: [
          {
            id: aVenir.id,
            dateDebut: "2026-12-01",
            dateFin: "2026-12-31",
            statut: "A_VENIR",
            motifs: [{ id: 2, nom: "B formation", retireeDeRdvSp: false }],
          },
          {
            id: supprimee.id,
            dateDebut: "2026-11-20",
            dateFin: "2026-12-10",
            statut: "SUPPRIMEE",
            motifs: [{ id: 1, nom: "A formation", retireeDeRdvSp: false }],
          },
          {
            id: enCours.id,
            dateDebut: "2026-11-03",
            dateFin: "2026-11-30",
            statut: "EN_COURS",
            motifs: [
              { id: 1, nom: "A formation", retireeDeRdvSp: false },
              { id: 3, nom: "C supprimée", retireeDeRdvSp: true },
              { id: 99, nom: null, retireeDeRdvSp: true },
            ],
          },
        ],
        motifsDisponibles: [
          { id: 1, nom: "A formation", aDesSeancesAVenir: true },
          { id: 2, nom: "B formation", aDesSeancesAVenir: false },
        ],
      });
    }),
  );
});
