import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaTransaction } from "@/server/framework/persistence/PrismaTransaction";
import { SavePeriodeInformationHandler } from "@/server/formations/handlers/SavePeriodeInformationHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("SavePeriodeInformationHandler", () => {
  const maintenant = new Date("2026-11-18T10:00:00Z");
  let handler: SavePeriodeInformationHandler;

  beforeEach(() => {
    handler = new SavePeriodeInformationHandler({
      prisma: new PrismaPilote(),
      transaction: new PrismaTransaction(),
    });
  });

  it(
    "crée une période avec ses formations",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });

      // When
      const resultat = await handler.execute({
        commande: {
          id: null,
          dateDebut: "2026-12-01",
          dateFin: "2026-12-31",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        id: expect.any(String),
        periodesRemplacees: [],
      });
      expect(
        await prisma.formation_periode_information.findMany({
          select: {
            id: true,
            date_debut: true,
            date_fin: true,
            deleted_at: true,
          },
        }),
      ).toEqual([
        {
          id: resultat.id,
          date_debut: new Date("2026-12-01T00:00:00Z"),
          date_fin: new Date("2026-12-31T00:00:00Z"),
          deleted_at: null,
        },
      ]);
      expect(
        await prisma.formation_periode_information_motif.findMany({
          select: { periode_id: true, motif_id: true },
        }),
      ).toEqual([{ periode_id: resultat.id, motif_id: BigInt(1) }]);
    }),
  );

  it(
    "remplace les périodes qu'elle chevauche, bornes comprises, en les supprimant",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      const enCours = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-03T00:00:00Z"),
        date_fin: new Date("2026-11-30T00:00:00Z"),
      });
      const englobee = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-01T00:00:00Z"),
        date_fin: new Date("2026-12-10T00:00:00Z"),
      });
      const commenceLeJourDeLaFin = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-15T00:00:00Z"),
        date_fin: new Date("2026-12-31T00:00:00Z"),
      });

      // When
      const resultat = await handler.execute({
        commande: {
          id: null,
          dateDebut: "2026-11-30",
          dateFin: "2026-12-15",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      expect(resultat.periodesRemplacees).toEqual([
        { dateDebut: "2026-11-03", dateFin: "2026-11-30" },
        { dateDebut: "2026-12-01", dateFin: "2026-12-10" },
        { dateDebut: "2026-12-15", dateFin: "2026-12-31" },
      ]);
      expect(
        await prisma.formation_periode_information.findMany({
          select: { id: true, deleted_at: true },
          orderBy: { date_debut: "asc" },
        }),
      ).toEqual([
        { id: enCours.id, deleted_at: maintenant },
        { id: resultat.id, deleted_at: null },
        { id: englobee.id, deleted_at: maintenant },
        { id: commenceLeJourDeLaFin.id, deleted_at: maintenant },
      ]);
    }),
  );

  it(
    "laisse les périodes accolées et une période déjà supprimée telles quelles",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      const finitLaVeille = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-19T00:00:00Z"),
        date_fin: new Date("2026-11-29T00:00:00Z"),
      });
      const accolee = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-16T00:00:00Z"),
        date_fin: new Date("2026-12-31T00:00:00Z"),
      });
      const dejaSupprimee = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-01T00:00:00Z"),
        date_fin: new Date("2026-12-10T00:00:00Z"),
        deleted_at: new Date("2026-11-10T08:00:00Z"),
      });

      // When
      const resultat = await handler.execute({
        commande: {
          id: null,
          dateDebut: "2026-11-30",
          dateFin: "2026-12-15",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      expect(resultat.periodesRemplacees).toEqual([]);
      expect(
        await prisma.formation_periode_information.findMany({
          where: {
            id: { in: [finitLaVeille.id, accolee.id, dejaSupprimee.id] },
          },
          select: { id: true, deleted_at: true },
          orderBy: { date_debut: "asc" },
        }),
      ).toEqual([
        { id: finitLaVeille.id, deleted_at: null },
        {
          id: dejaSupprimee.id,
          deleted_at: new Date("2026-11-10T08:00:00Z"),
        },
        { id: accolee.id, deleted_at: null },
      ]);
    }),
  );

  it(
    "modifie une période en gardant ses dates, sans se remplacer elle-même, et remplace ses formations",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      await fixtures.formationMotif({ id: BigInt(2) });
      const periode = await fixtures.formationPeriodeInformation({
        motifIds: [BigInt(1)],
      });

      // When
      const resultat = await handler.execute({
        commande: {
          id: periode.id,
          dateDebut: "2026-12-01",
          dateFin: "2026-12-31",
          motifIds: [2],
        },
        maintenant,
      });

      // Then
      expect(resultat).toEqual({ id: periode.id, periodesRemplacees: [] });
      expect(
        await prisma.formation_periode_information.findMany({
          select: { id: true, deleted_at: true },
        }),
      ).toEqual([{ id: periode.id, deleted_at: null }]);
      expect(
        await prisma.formation_periode_information_motif.findMany({
          select: { periode_id: true, motif_id: true },
        }),
      ).toEqual([{ periode_id: periode.id, motif_id: BigInt(2) }]);
    }),
  );

  it(
    "prolonge une période en cours sans changer son début, en remplaçant la période à venir qu'elle chevauche",
    createIntegrationTest(async (prisma) => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      const enCours = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-03T00:00:00Z"),
        date_fin: new Date("2026-11-30T00:00:00Z"),
        motifIds: [BigInt(1)],
      });
      const aVenir = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-12-01T00:00:00Z"),
        date_fin: new Date("2026-12-31T00:00:00Z"),
      });

      // When
      const resultat = await handler.execute({
        commande: {
          id: enCours.id,
          dateDebut: "2026-11-03",
          dateFin: "2026-12-15",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      expect(resultat).toEqual({
        id: enCours.id,
        periodesRemplacees: [
          { dateDebut: "2026-12-01", dateFin: "2026-12-31" },
        ],
      });
      expect(
        await prisma.formation_periode_information.findMany({
          select: { id: true, date_fin: true, deleted_at: true },
          orderBy: { date_debut: "asc" },
        }),
      ).toEqual([
        {
          id: enCours.id,
          date_fin: new Date("2026-12-15T00:00:00Z"),
          deleted_at: null,
        },
        {
          id: aVenir.id,
          date_fin: new Date("2026-12-31T00:00:00Z"),
          deleted_at: maintenant,
        },
      ]);
    }),
  );

  it(
    "refuse de changer le début d'une période en cours",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      const enCours = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-11-03T00:00:00Z"),
        date_fin: new Date("2026-11-30T00:00:00Z"),
        motifIds: [BigInt(1)],
      });

      // When
      const execution = handler.execute({
        commande: {
          id: enCours.id,
          dateDebut: "2026-11-04",
          dateFin: "2026-11-30",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "La date de début d'une période en cours ne se modifie plus.",
      );
    }),
  );

  it(
    "refuse une période qui commence dans le passé",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });

      // When
      const execution = handler.execute({
        commande: {
          id: null,
          dateDebut: "2026-11-17",
          dateFin: "2026-12-15",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "La date de début ne peut pas être passée.",
      );
    }),
  );

  it(
    "refuse de modifier une période passée",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      const periode = await fixtures.formationPeriodeInformation({
        date_debut: new Date("2026-10-01T00:00:00Z"),
        date_fin: new Date("2026-10-31T00:00:00Z"),
        motifIds: [BigInt(1)],
      });

      // When
      const execution = handler.execute({
        commande: {
          id: periode.id,
          dateDebut: "2026-10-01",
          dateFin: "2026-10-31",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "Une période passée ne se modifie plus.",
      );
    }),
  );

  it(
    "refuse de modifier une période supprimée",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: BigInt(1) });
      const periode = await fixtures.formationPeriodeInformation({
        deleted_at: new Date("2026-11-10T08:00:00Z"),
        motifIds: [BigInt(1)],
      });

      // When
      const execution = handler.execute({
        commande: {
          id: periode.id,
          dateDebut: "2026-12-01",
          dateFin: "2026-12-31",
          motifIds: [1],
        },
        maintenant,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "Une période supprimée ne se modifie plus.",
      );
    }),
  );
});
