import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerPorteurHandler } from "@/server/metadataPorteur/handlers/EnregistrerPorteurHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("EnregistrerPorteurHandler", () => {
  let handler: EnregistrerPorteurHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new EnregistrerPorteurHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouveau porteur",
      createIntegrationTest(async () => {
        // When
        await handler.execute({
          porteurId: "99001",
          porteurShort: "TEST",
          porteurName: "Ministère de test",
          porteurDesc: null,
          porteurTypeShort: "MIN",
          porteurDirecteur: null,
          porteurNameShort: "Test",
          porteurPicto: null,
        });

        // Then
        const porteur = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99001" },
        });
        expect(porteur.porteur_name).toBe("Ministère de test");
        expect(porteur.porteur_short).toBe("TEST");
        expect(porteur.porteur_type_short).toBe("MIN");
        expect(porteur.porteur_type_id).toBe("1");
        expect(porteur.deleted_at).toBeNull();
      }),
    );

    it(
      "dénormalise porteur_type_id depuis porteur_type_short",
      createIntegrationTest(async () => {
        // When
        await handler.execute({
          porteurId: "99002",
          porteurShort: "DAC",
          porteurName: "DAC de test",
          porteurDesc: null,
          porteurTypeShort: "DAC",
          porteurDirecteur: "Directeur Test",
          porteurNameShort: null,
          porteurPicto: "remix::earth::fill",
        });

        // Then
        const porteur = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99002" },
        });
        expect(porteur.porteur_type_id).toBe("7");
        expect(porteur.porteur_directeur).toBe("Directeur Test");
        expect(porteur.porteur_picto).toBe("remix::earth::fill");
      }),
    );

    it(
      "met à jour un porteur existant",
      createIntegrationTest(async () => {
        // Given
        await getPrisma().metadata_porteurs.create({
          data: {
            porteur_id: "99003",
            porteur_short: "OLD",
            porteur_name: "Ancien nom",
            porteur_type_short: "MIN",
            porteur_type_id: "1",
          },
        });

        // When
        await handler.execute({
          porteurId: "99003",
          porteurShort: "NEW",
          porteurName: "Nouveau nom",
          porteurDesc: "Une desc",
          porteurTypeShort: "DAC",
          porteurDirecteur: null,
          porteurNameShort: null,
          porteurPicto: null,
        });

        // Then
        const porteur = await getPrisma().metadata_porteurs.findUniqueOrThrow({
          where: { porteur_id: "99003" },
        });
        expect(porteur.porteur_name).toBe("Nouveau nom");
        expect(porteur.porteur_type_short).toBe("DAC");
        expect(porteur.porteur_type_id).toBe("7");
      }),
    );
  });
});
