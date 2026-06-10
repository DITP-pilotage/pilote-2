import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaMesureIndicateurObjectifRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaMesureIndicateurObjectifRepository";

const INDIC_ID = "IND-003";
const ZONE_ID = "D75";

describe("PrismaMesureIndicateurObjectifRepository", () => {
  let repository: PrismaMesureIndicateurObjectifRepository;

  beforeEach(() => {
    repository = new PrismaMesureIndicateurObjectifRepository({
      prisma: new PrismaPilote(),
    });
  });

  const seedIndicateur = async (
    mailles_applicables: $Enums.Maille[] = [$Enums.Maille.DEPT],
  ) => {
    const chantier = await fixtures.chantierIdentite();
    await fixtures.indicateurIdentite({
      id: INDIC_ID,
      chantier_id: chantier.id,
      mailles_applicables,
    });
  };

  describe("#recupererDernieresValeursCibles", () => {
    it(
      "retourne la dernière vc par couple (zone_id, metric_date)",
      createIntegrationTest(async () => {
        // Given — deux imports pour le même couple, dates_import différentes
        await seedIndicateur();
        const dateImportAncienne = new Date("2025-01-01T10:00:00Z");
        const dateImportRecente = new Date("2025-01-02T10:00:00Z");
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "50",
          date_import: dateImportAncienne,
        });
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "100",
          date_import: dateImportRecente,
        });

        // When
        const result = await repository.recupererDernieresValeursCibles({
          indicId: INDIC_ID,
        });

        // Then — seule la valeur la plus récente est retournée
        expect(result).toEqual([
          {
            territoire_code: "DEPT-75",
            metric_date: "2025-12-31",
            metric_value: 100,
          },
        ]);
      }),
    );

    it(
      "retourne une entrée par couple (zone_id, metric_date) distinct",
      createIntegrationTest(async () => {
        // Given — deux zones et deux dates
        await seedIndicateur();
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: "D75",
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "100",
        });
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: "D13",
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "200",
        });
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: "D75",
          metric_date: "2026-12-31",
          metric_type: "vc",
          metric_value: "150",
        });

        // When
        const result = await repository.recupererDernieresValeursCibles({
          indicId: INDIC_ID,
        });

        // Then
        expect(result).toEqual(
          expect.arrayContaining([
            {
              territoire_code: "DEPT-75",
              metric_date: "2025-12-31",
              metric_value: 100,
            },
            {
              territoire_code: "DEPT-13",
              metric_date: "2025-12-31",
              metric_value: 200,
            },
            {
              territoire_code: "DEPT-75",
              metric_date: "2026-12-31",
              metric_value: 150,
            },
          ]),
        );
        expect(result).toHaveLength(3);
      }),
    );

    it(
      "retourne metric_value null quand la dernière valeur est la string 'null'",
      createIntegrationTest(async () => {
        // Given — import avec valeur numérique, puis import avec 'null' string (plus récent)
        await seedIndicateur();
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "100",
          date_import: new Date("2025-01-01T10:00:00Z"),
        });
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "null",
          date_import: new Date("2025-01-02T10:00:00Z"),
        });

        // When
        const result = await repository.recupererDernieresValeursCibles({
          indicId: INDIC_ID,
        });

        // Then
        expect(result).toEqual([
          {
            territoire_code: "DEPT-75",
            metric_date: "2025-12-31",
            metric_value: null,
          },
        ]);
      }),
    );

    it(
      "ignore les lignes metric_type != 'vc'",
      createIntegrationTest(async () => {
        // Given — une valeur d'avancement (va) et une valeur initiale (vi), pas de vc
        await seedIndicateur();
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "va",
          metric_value: "42",
        });
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "vi",
          metric_value: "10",
        });

        // When
        const result = await repository.recupererDernieresValeursCibles({
          indicId: INDIC_ID,
        });

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "retourne tableau vide si aucune vc pour l'indicateur",
      createIntegrationTest(async () => {
        // When
        const result = await repository.recupererDernieresValeursCibles({
          indicId: INDIC_ID,
        });

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "n'inclut pas les vc d'un autre indicateur",
      createIntegrationTest(async () => {
        // Given — vc pour un autre indic
        await fixtures.mesureIndicateur({
          indic_id: "IND-999",
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "999",
        });

        // When
        const result = await repository.recupererDernieresValeursCibles({
          indicId: INDIC_ID,
        });

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "filtre les zones dont la maille n'est pas dans les mailles applicables",
      createIntegrationTest(async () => {
        // Given — indicateur applicable uniquement en NAT, mais zone_id en DEPT
        await seedIndicateur([$Enums.Maille.NAT]);
        await fixtures.mesureIndicateur({
          indic_id: INDIC_ID,
          zone_id: ZONE_ID,
          metric_date: "2025-12-31",
          metric_type: "vc",
          metric_value: "100",
        });

        // When
        const result = await repository.recupererDernieresValeursCibles({
          indicId: INDIC_ID,
        });

        // Then
        expect(result).toEqual([]);
      }),
    );
  });
});
