import { getContainer } from "@/server/dependances";
import RécupérerInformationMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase";
import { prisma } from "@/server/db/prisma";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("RécupérerInformationMetadataIndicateurUseCase", () => {
  let useCase: RécupérerInformationMetadataIndicateurUseCase;

  beforeEach(() => {
    useCase = getContainer("parametrageIndicateur").resolve(
      "récupérerInformationMetadataIndicateurUseCase",
    );
  });

  it("source les valeurs acceptées de zg_applicable depuis metadata_zonegroup, pas depuis metadata_indicateur_valeur_acceptee", async () => {
    // Given
    await prisma.metadata_indicateur.create({
      data: {
        name: "zg_applicable",
        data_type: "text",
        description: "Zone-group applicable",
        est_visible: true,
        alias: "Restriction géographique",
        est_editable: true,
        validation_regex: "",
        validation_regex_error_message: null,
        edit_box_type: "multi-select",
        default_value: null,
        est_obligatoire: false,
        doit_afficher_la_description: false,
        groupe: "METADATA_INDICATEURS",
        bloc_id: null,
        valeurs_acceptees: {
          create: [
            {
              ordre: 1,
              valeur: "ANCIENNE-VALEUR",
              nom: "Ne doit pas apparaître",
              description: "Table figée, ne doit plus être lue",
            },
          ],
        },
      },
    });

    await fixtures.metadataZonegroup({
      zone_group_id: "ZG-ACTIF-TEST",
      zg_name: "Zone active de test",
      zg_desc: "Description de la zone active",
    });
    await fixtures.metadataZonegroup({
      zone_group_id: "ZG-ARCHIVE-TEST",
      zg_name: "Zone archivée de test",
      deleted_at: new Date(),
    });

    // When
    const résultat = await useCase.run();

    // Then
    const infoZgApplicable = résultat.find(
      (info) => info.name === "zg_applicable",
    );
    expect(infoZgApplicable).toBeDefined();
    expect(
      infoZgApplicable?.acceptedValues.map((valeur) => valeur.value),
    ).toEqual(["ZG-ACTIF-TEST"]);
    expect(infoZgApplicable?.acceptedValues[0]).toMatchObject({
      value: "ZG-ACTIF-TEST",
      name: "Zone active de test",
      desc: "Description de la zone active",
    });
  });

  it("source les valeurs acceptées d'une metadata standard depuis metadata_indicateur_valeur_acceptee", async () => {
    // Given
    await prisma.metadata_indicateur.create({
      data: {
        name: "test_metadata_standard",
        data_type: "text",
        description: "Metadata standard",
        est_visible: true,
        alias: "Standard",
        est_editable: true,
        validation_regex: "",
        validation_regex_error_message: null,
        edit_box_type: "multi-select",
        default_value: null,
        est_obligatoire: false,
        doit_afficher_la_description: false,
        groupe: "METADATA_INDICATEURS",
        bloc_id: null,
        valeurs_acceptees: {
          create: [
            { ordre: 2, valeur: "b", nom: "Option B", description: "Deuxième option" },
            { ordre: 1, valeur: "a", nom: "Option A", description: "Première option" },
          ],
        },
      },
    });

    // When
    const résultat = await useCase.run();

    // Then
    const infoStandard = résultat.find(
      (info) => info.name === "test_metadata_standard",
    );
    expect(infoStandard).toBeDefined();
    expect(
      infoStandard?.acceptedValues.map((valeur) => ({
        orderId: valeur.orderId,
        value: valeur.value,
        name: valeur.name,
        desc: valeur.desc,
      })),
    ).toEqual([
      { orderId: 1, value: "a", name: "Option A", desc: "Première option" },
      { orderId: 2, value: "b", name: "Option B", desc: "Deuxième option" },
    ]);
  });
});
