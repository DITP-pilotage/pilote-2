import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ModifierChantierHandler } from "@/server/metadataChantier/handlers/ModifierChantierHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("ModifierChantierHandler", () => {
  let handler: ModifierChantierHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new ModifierChantierHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "met à jour les champs du chantier",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg();
        const perimetre = await fixtures.metadataPerimetre();
        await fixtures.metadataChantier({
          chantier_id: "CH-010",
          ch_nom: "Ancien nom",
          ch_ppg: ppg.ppg_id,
          ch_per: perimetre.perimetre_id,
        });

        // When
        await handler.execute({
          chantierId: "CH-010",
          chNom: "Nouveau nom",
          chDescr: "Une description",
          chPpg: ppg.ppg_id,
          chTerrito: true,
          chHiddenPilote: true,
          chSaisieAte: $Enums.type_ate.ate,
          chState: $Enums.type_statut.PUBLIE,
          zgApplicable: null,
          porteurIdsNoDAC: ["MIN-01"],
          porteurIdsDAC: [],
          chPer: perimetre.perimetre_id,
          mailleApplicable: ["NAT"],
          chCibleAttendue: true,
          conseillerMail: null,
        });

        // Then
        const chantier = await getPrisma().metadata_chantiers.findUniqueOrThrow(
          {
            where: { chantier_id: "CH-010" },
          },
        );
        expect(chantier.ch_nom).toBe("Nouveau nom");
        expect(chantier.ch_descr).toBe("Une description");
        expect(chantier.ch_territo).toBe(true);
        expect(chantier.ch_hidden_pilote).toBe(true);
        expect(chantier.ch_saisie_ate).toBe($Enums.type_ate.ate);
        expect(chantier.ch_state).toBe($Enums.type_statut.PUBLIE);
        expect(chantier.porteur_ids_noDAC).toEqual(["MIN-01"]);
        expect(chantier.maille_applicable).toEqual(["NAT"]);
        expect(chantier.ch_cible_attendue).toBe(true);
      }),
    );
  });
});
