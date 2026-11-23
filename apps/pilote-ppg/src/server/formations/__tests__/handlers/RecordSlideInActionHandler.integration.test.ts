import { randomUUID } from "node:crypto";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import { RecordSlideInActionHandler } from "@/server/formations/handlers/RecordSlideInActionHandler";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("RecordSlideInActionHandler", () => {
  const premierInstant = new Date("2026-11-20T10:00:00Z");
  const deuxiemeInstant = new Date("2026-11-21T10:00:00Z");
  const troisiemeInstant = new Date("2026-11-22T10:00:00Z");
  let handler: RecordSlideInActionHandler;

  beforeEach(() => {
    handler = new RecordSlideInActionHandler({ prisma: new PrismaPilote() });
  });

  const lignesEtat = (prisma: PilotePrismaClient) =>
    prisma.formation_periode_information_utilisateur.findMany({
      select: {
        utilisateur_id: true,
        periode_id: true,
        date_presentation: true,
        date_report: true,
        date_fermeture: true,
      },
    });

  it(
    "enregistre la première présentation sans l'écraser ensuite",
    createIntegrationTest(async (prisma) => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const periode = await fixtures.formationPeriodeInformation();
      const commande = {
        utilisateurId: utilisateur.id,
        periodeId: periode.id,
        action: "PRESENTATION" as const,
      };

      // When
      await handler.execute({ ...commande, maintenant: premierInstant });
      await handler.execute({ ...commande, maintenant: deuxiemeInstant });

      // Then
      expect(await lignesEtat(prisma)).toEqual([
        {
          utilisateur_id: utilisateur.id,
          periode_id: periode.id,
          date_presentation: premierInstant,
          date_report: null,
          date_fermeture: null,
        },
      ]);
    }),
  );

  it(
    "enregistre un report, puis le remplace au report suivant",
    createIntegrationTest(async (prisma) => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const periode = await fixtures.formationPeriodeInformation();
      const commande = { utilisateurId: utilisateur.id, periodeId: periode.id };

      // When
      await handler.execute({
        ...commande,
        action: "PRESENTATION",
        maintenant: premierInstant,
      });
      await handler.execute({
        ...commande,
        action: "REPORT",
        maintenant: deuxiemeInstant,
      });
      await handler.execute({
        ...commande,
        action: "REPORT",
        maintenant: troisiemeInstant,
      });

      // Then
      expect(await lignesEtat(prisma)).toEqual([
        {
          utilisateur_id: utilisateur.id,
          periode_id: periode.id,
          date_presentation: premierInstant,
          date_report: troisiemeInstant,
          date_fermeture: null,
        },
      ]);
    }),
  );

  it(
    "enregistre la fermeture",
    createIntegrationTest(async (prisma) => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const periode = await fixtures.formationPeriodeInformation();
      const commande = { utilisateurId: utilisateur.id, periodeId: periode.id };

      // When
      await handler.execute({
        ...commande,
        action: "PRESENTATION",
        maintenant: premierInstant,
      });
      await handler.execute({
        ...commande,
        action: "FERMETURE",
        maintenant: deuxiemeInstant,
      });

      // Then
      expect(await lignesEtat(prisma)).toEqual([
        {
          utilisateur_id: utilisateur.id,
          periode_id: periode.id,
          date_presentation: premierInstant,
          date_report: null,
          date_fermeture: deuxiemeInstant,
        },
      ]);
    }),
  );

  it(
    "crée la ligne au report quand la présentation n'a pas été enregistrée",
    createIntegrationTest(async (prisma) => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const periode = await fixtures.formationPeriodeInformation();

      // When
      await handler.execute({
        utilisateurId: utilisateur.id,
        periodeId: periode.id,
        action: "REPORT",
        maintenant: premierInstant,
      });

      // Then
      expect(await lignesEtat(prisma)).toEqual([
        {
          utilisateur_id: utilisateur.id,
          periode_id: periode.id,
          date_presentation: premierInstant,
          date_report: premierInstant,
          date_fermeture: null,
        },
      ]);
    }),
  );

  it(
    "refuse une période inconnue",
    createIntegrationTest(async (prisma) => {
      // Given
      const utilisateur = await fixtures.utilisateur();

      // When
      const execution = handler.execute({
        utilisateurId: utilisateur.id,
        periodeId: randomUUID(),
        action: "REPORT",
        maintenant: premierInstant,
      });

      // Then
      await expect(execution).rejects.toThrow(
        "Cette période d'information n'existe pas.",
      );
      expect(await lignesEtat(prisma)).toEqual([]);
    }),
  );
});
