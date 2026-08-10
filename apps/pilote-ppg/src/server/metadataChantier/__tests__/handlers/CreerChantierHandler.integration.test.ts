import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { CreerChantierHandler } from "@/server/metadataChantier/handlers/CreerChantierHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("CreerChantierHandler", () => {
  let handler: CreerChantierHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new CreerChantierHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouveau chantier avec les champs fournis",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg();
        const perimetre = await fixtures.metadataPerimetre();

        // When
        await handler.execute({
          chantierId: "CH-099",
          chNom: "Nouveau chantier",
          chDescr: null,
          chPpg: ppg.ppg_id,
          chTerrito: false,
          chHiddenPilote: false,
          chSaisieAte: null,
          chState: $Enums.type_statut.BROUILLON,
          zgApplicable: null,
          porteurIdsNoDAC: [],
          porteurIdsDAC: [],
          chPer: perimetre.perimetre_id,
          mailleApplicable: ["NAT", "REG", "DEPT"],
          chCibleAttendue: false,
          conseillerMail: null,
        });

        // Then
        const chantier = await getPrisma().metadata_chantiers.findUniqueOrThrow(
          {
            where: { chantier_id: "CH-099" },
          },
        );
        expect(chantier.ch_nom).toBe("Nouveau chantier");
        expect(chantier.ch_ppg).toBe(ppg.ppg_id);
        expect(chantier.ch_per).toBe(perimetre.perimetre_id);
        expect(chantier.ch_state).toBe($Enums.type_statut.BROUILLON);
        expect(chantier.maille_applicable).toEqual(["NAT", "REG", "DEPT"]);
      }),
    );
  });
});
