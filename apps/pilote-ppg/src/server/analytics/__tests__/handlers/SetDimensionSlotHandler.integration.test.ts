import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import {
  SetDimensionSlotHandler,
  setDimensionSlotCommandSchema,
} from "@/server/analytics/handlers/SetDimensionSlotHandler";
import { ConflictError } from "@/shared/errors/conflict-error";
import { createIntegrationTest } from "@/test/createIntegrationTest";

const givenDimensions = async (
  prisma: PilotePrismaClient,
  slots: Record<string, number>,
) => {
  await prisma.analytics_dimension.deleteMany();
  await prisma.analytics_dimension.createMany({
    data: Object.entries(slots).map(([cle, slot]) => ({ cle, slot })),
  });
};

const readDimensions = (prisma: PilotePrismaClient) =>
  prisma.analytics_dimension.findMany({
    select: { cle: true, slot: true },
    orderBy: { cle: "asc" },
  });

describe("SetDimensionSlotHandler", () => {
  let handler: SetDimensionSlotHandler;

  beforeEach(() => {
    handler = new SetDimensionSlotHandler({ prisma: new PrismaPilote() });
  });

  it(
    "configure une dimension qui n'avait pas de numéro",
    createIntegrationTest(async (prisma) => {
      // Given
      await givenDimensions(prisma, {});

      // When
      await handler.execute({ dimension: "profil_pilote", slot: 11 });

      // Then
      expect(await readDimensions(prisma)).toEqual([
        { cle: "profil_pilote", slot: 11 },
      ]);
    }),
  );

  it(
    "change le numéro d'une dimension, et accepte de réenregistrer le même",
    createIntegrationTest(async (prisma) => {
      // Given
      await givenDimensions(prisma, { profil_pilote: 11 });

      // When
      await handler.execute({ dimension: "profil_pilote", slot: 12 });
      await handler.execute({ dimension: "profil_pilote", slot: 12 });

      // Then
      expect(await readDimensions(prisma)).toEqual([
        { cle: "profil_pilote", slot: 12 },
      ]);
    }),
  );

  it(
    "retire le numéro d'une dimension, sans erreur si elle n'en avait plus",
    createIntegrationTest(async (prisma) => {
      // Given
      await givenDimensions(prisma, { environnement: 12, profil_pilote: 11 });

      // When
      await handler.execute({ dimension: "profil_pilote", slot: null });
      await handler.execute({ dimension: "profil_pilote", slot: null });

      // Then
      expect(await readDimensions(prisma)).toEqual([
        { cle: "environnement", slot: 12 },
      ]);
    }),
  );

  it(
    "refuse un numéro déjà porté par une autre dimension, sans rien modifier",
    createIntegrationTest(async (prisma) => {
      // Given
      await givenDimensions(prisma, { conversation_id: 2, profil_pilote: 11 });

      // When
      const execution = handler.execute({
        dimension: "profil_pilote",
        slot: 2,
      });

      // Then
      await expect(execution).rejects.toThrow(
        new ConflictError(
          "Le numéro 2 est déjà utilisé par « conversation_id ».",
        ),
      );
      expect(await readDimensions(prisma)).toEqual([
        { cle: "conversation_id", slot: 2 },
        { cle: "profil_pilote", slot: 11 },
      ]);
    }),
  );

  it(
    "reprend le numéro d'une dimension que l'application n'envoie plus",
    createIntegrationTest(async (prisma) => {
      // Given
      await givenDimensions(prisma, { ancienne_cle: 11 });

      // When
      await handler.execute({ dimension: "profil_pilote", slot: 11 });

      // Then
      expect(await readDimensions(prisma)).toEqual([
        { cle: "profil_pilote", slot: 11 },
      ]);
    }),
  );
});

describe("setDimensionSlotCommandSchema", () => {
  it.each([1, 999, null])("accepte le numéro %s", (slot) => {
    expect(
      setDimensionSlotCommandSchema.safeParse({
        dimension: "profil_pilote",
        slot,
      }).success,
    ).toBe(true);
  });

  it.each([0, -1, 1.5, 1000, "1", undefined])("refuse le numéro %s", (slot) => {
    expect(
      setDimensionSlotCommandSchema.safeParse({
        dimension: "profil_pilote",
        slot,
      }).success,
    ).toBe(false);
  });

  it("refuse une dimension que l'application n'envoie pas", () => {
    expect(
      setDimensionSlotCommandSchema.safeParse({
        dimension: "inconnue",
        slot: 1,
      }).success,
    ).toBe(false);
  });
});
