import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  chantierCommandSchema,
  EnregistrerChantierHandler,
} from "@/server/metadataChantier/handlers/EnregistrerChantierHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";

describe("EnregistrerChantierHandler", () => {
  let handler: EnregistrerChantierHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new EnregistrerChantierHandler({ prisma: prismaPilote });
  });

  describe("execute", () => {
    it(
      "crée un nouveau chantier si l'id n'existe pas",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg();
        const perimetre = await fixtures.metadataPerimetre();
        const porteur = await fixtures.metadataPorteur();

        // When
        await handler.execute({
          chantierId: "CH-099",
          chNom: "Nouveau chantier",
          chDescr: null,
          chPpg: ppg.ppg_id,
          chTerrito: false,
          chSaisieAte: null,
          chState: $Enums.type_statut.BROUILLON,
          zgApplicable: null,
          porteurIdPrincipal: porteur.porteur_id,
          porteurIdsSecondaires: [],
          porteurIdsDAC: [],
          chPer: perimetre.perimetre_id,
          mailleApplicable: ["NAT", "REG", "DEPT"],
          chCibleAttendue: false,
          conseillerMail: null,
        });

        // Then
        const chantier = await getPrisma().metadata_chantiers.findUniqueOrThrow(
          { where: { chantier_id: "CH-099" } },
        );
        expect(chantier.ch_nom).toBe("Nouveau chantier");
        expect(chantier.ch_state).toBe($Enums.type_statut.BROUILLON);
        expect(chantier.maille_applicable).toEqual(["NAT", "REG", "DEPT"]);
      }),
    );

    it(
      "met à jour un chantier existant",
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
          chSaisieAte: $Enums.type_ate.ate,
          chState: $Enums.type_statut.PUBLIE,
          zgApplicable: null,
          porteurIdPrincipal: "MIN-01",
          porteurIdsSecondaires: [],
          porteurIdsDAC: [],
          chPer: perimetre.perimetre_id,
          mailleApplicable: ["NAT"],
          chCibleAttendue: true,
          conseillerMail: null,
        });

        // Then
        const chantier = await getPrisma().metadata_chantiers.findUniqueOrThrow(
          { where: { chantier_id: "CH-010" } },
        );
        expect(chantier.ch_nom).toBe("Nouveau nom");
        expect(chantier.ch_descr).toBe("Une description");
        expect(chantier.ch_territo).toBe(true);
        expect(chantier.ch_saisie_ate).toBe($Enums.type_ate.ate);
        expect(chantier.ch_state).toBe($Enums.type_statut.PUBLIE);
        expect(chantier.porteur_id_principal).toBe("MIN-01");
        expect(chantier.porteur_ids_secondaires).toEqual([]);
        expect(chantier.maille_applicable).toEqual(["NAT"]);
        expect(chantier.ch_cible_attendue).toBe(true);
      }),
    );

    it(
      "enregistre un chantier avec porteur principal et porteurs secondaires",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg();
        const perimetre = await fixtures.metadataPerimetre();

        // When
        await handler.execute({
          chantierId: "CH-099",
          chNom: "Chantier multi-porteurs",
          chDescr: null,
          chPpg: ppg.ppg_id,
          chTerrito: false,
          chSaisieAte: null,
          chState: $Enums.type_statut.BROUILLON,
          zgApplicable: null,
          porteurIdPrincipal: "MIN-01",
          porteurIdsSecondaires: ["MIN-02", "MIN-03"],
          porteurIdsDAC: [],
          chPer: perimetre.perimetre_id,
          mailleApplicable: ["NAT"],
          chCibleAttendue: false,
          conseillerMail: null,
        });

        // Then
        const chantier = await getPrisma().metadata_chantiers.findUniqueOrThrow(
          { where: { chantier_id: "CH-099" } },
        );
        expect(chantier.porteur_id_principal).toBe("MIN-01");
        expect(chantier.porteur_ids_secondaires).toEqual(["MIN-02", "MIN-03"]);
      }),
    );

    it(
      "normalise conseillerMail vide en null",
      createIntegrationTest(async () => {
        // Given
        const ppg = await fixtures.metadataPpg();
        const perimetre = await fixtures.metadataPerimetre();
        const porteur = await fixtures.metadataPorteur();

        // When
        await handler.execute({
          chantierId: "CH-099",
          chNom: "Chantier",
          chDescr: null,
          chPpg: ppg.ppg_id,
          chTerrito: false,
          chSaisieAte: null,
          chState: $Enums.type_statut.BROUILLON,
          zgApplicable: null,
          porteurIdPrincipal: porteur.porteur_id,
          porteurIdsSecondaires: [],
          porteurIdsDAC: [],
          chPer: perimetre.perimetre_id,
          mailleApplicable: ["NAT"],
          chCibleAttendue: false,
          conseillerMail: "" as unknown as null,
        });

        // Then
        const chantier = await getPrisma().metadata_chantiers.findUniqueOrThrow(
          { where: { chantier_id: "CH-099" } },
        );
        expect(chantier.conseiller_mail).toBeNull();
      }),
    );
  });

  const commandeValide = {
    chantierId: "CH-099",
    chNom: "Chantier",
    chDescr: null,
    chPpg: "PPG-01",
    chTerrito: false,
    chSaisieAte: null,
    chState: $Enums.type_statut.BROUILLON,
    zgApplicable: null,
    porteurIdPrincipal: "MIN-01",
    porteurIdsSecondaires: [],
    porteurIdsDAC: [],
    chPer: "PER-01",
    mailleApplicable: ["NAT"] as const,
    chCibleAttendue: false,
    conseillerMail: null,
  };

  it("chantierCommandSchema rejette un porteur principal manquant", () => {
    // Given
    const commande = { ...commandeValide, porteurIdPrincipal: "" };

    // When
    const résultat = chantierCommandSchema.safeParse(commande);

    // Then
    expect(résultat.success).toBe(false);
  });

  it("chantierCommandSchema accepte un porteur principal renseigné", () => {
    // Given
    const commande = commandeValide;

    // When
    const résultat = chantierCommandSchema.safeParse(commande);

    // Then
    expect(résultat.success).toBe(true);
  });
});
