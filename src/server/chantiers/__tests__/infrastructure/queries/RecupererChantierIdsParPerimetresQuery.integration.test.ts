import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererChantierIdsParPerimetresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantierIdsParPerimetresQuery";

describe("RecupererChantierIdsParPerimetresQuery", () => {
  let query: RecupererChantierIdsParPerimetresQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererChantierIdsParPerimetresQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne un tableau vide quand perimetreIds est vide",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({ perimetreIds: [] });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne les chantiers PUBLIE par defaut",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        perimetre_ids: ["PER-001"],
        statut: "PUBLIE",
      });

      // When
      const result = await query.execute({ perimetreIds: ["PER-001"] });

      // Then
      expect(result).toEqual([chantier.id]);
    }),
  );

  it(
    "filtre par statut par defaut (ne retourne pas les chantiers BROUILLON)",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        perimetre_ids: ["PER-001"],
        statut: "BROUILLON",
      });

      // When
      const result = await query.execute({ perimetreIds: ["PER-001"] });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "permet de specifier les statuts",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        perimetre_ids: ["PER-001"],
        statut: "BROUILLON",
      });

      // When
      const result = await query.execute({
        perimetreIds: ["PER-001"],
        statuts: [$Enums.type_statut.BROUILLON],
      });

      // Then
      expect(result).toEqual([chantier.id]);
    }),
  );

  it(
    "hasSome - matche si au moins un perimetre correspond",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        perimetre_ids: ["PER-001", "PER-002"],
        statut: "PUBLIE",
      });

      // When
      const result = await query.execute({
        perimetreIds: ["PER-002", "PER-003"],
      });

      // Then
      expect(result).toEqual([chantier.id]);
    }),
  );

  it(
    "retourne plusieurs chantiers",
    createIntegrationTest(async () => {
      // Given
      const chantier1 = await fixtures.chantierIdentite({
        perimetre_ids: ["PER-001"],
        statut: "PUBLIE",
      });
      const chantier2 = await fixtures.chantierIdentite({
        perimetre_ids: ["PER-002"],
        statut: "PUBLIE",
      });

      // When
      const result = await query.execute({
        perimetreIds: ["PER-001", "PER-002"],
      });

      // Then
      expect(result).toContain(chantier1.id);
      expect(result).toContain(chantier2.id);
      expect(result).toHaveLength(2);
    }),
  );

  it(
    "ne retourne pas les chantiers sans perimetre correspondant",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        perimetre_ids: ["PER-001"],
        statut: "PUBLIE",
      });

      // When
      const result = await query.execute({ perimetreIds: ["PER-999"] });

      // Then
      expect(result).toEqual([]);
    }),
  );
});
