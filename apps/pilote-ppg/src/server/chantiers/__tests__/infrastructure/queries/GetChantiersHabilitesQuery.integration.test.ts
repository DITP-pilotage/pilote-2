import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetChantiersHabilitesQuery } from "@/server/chantiers/infrastructure/queries/GetChantiersHabilitesQuery";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

function habilitationsAvecLecture(chantierIds: string[]): Habilitations {
  const vide = { chantiers: [] as string[], territoires: [], périmètres: [] };
  return {
    lecture: { ...vide, chantiers: chantierIds },
    saisieCommentaire: { ...vide },
    saisieIndicateur: { ...vide },
    responsabilite: { ...vide },
    gestionUtilisateur: { ...vide },
  };
}

describe("GetChantiersHabilitesQuery", () => {
  let query: GetChantiersHabilitesQuery;

  beforeEach(() => {
    query = new GetChantiersHabilitesQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "retourne les IDs des chantiers habilités, publiés et avec ministères",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres: ["MIN-02"],
        statut: $Enums.type_statut.PUBLIE,
      });

      // When
      const result = await query.execute(
        habilitationsAvecLecture(["CH-001", "CH-002"]),
      );

      // Then
      expect(result.sort()).toEqual(["CH-001", "CH-002"]);
    }),
  );

  it(
    "exclut les chantiers non présents dans les habilitations",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres: ["MIN-02"],
        statut: $Enums.type_statut.PUBLIE,
      });

      // When — seul CH-001 est habilité
      const result = await query.execute(
        habilitationsAvecLecture(["CH-001"]),
      );

      // Then
      expect(result).toEqual(["CH-001"]);
    }),
  );

  it(
    "exclut les chantiers avec un statut différent de PUBLIE",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.BROUILLON,
      });
      await fixtures.chantierIdentite({
        id: "CH-003",
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.ARCHIVE,
      });
      await fixtures.chantierIdentite({
        id: "CH-004",
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.SUPPRIME,
      });

      // When
      const result = await query.execute(
        habilitationsAvecLecture(["CH-001", "CH-002", "CH-003", "CH-004"]),
      );

      // Then
      expect(result).toEqual(["CH-001"]);
    }),
  );

  it(
    "exclut les chantiers sans ministères",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        // ministeres vide
        ministeres: [],
        statut: $Enums.type_statut.PUBLIE,
      });

      // When
      const result = await query.execute(
        habilitationsAvecLecture(["CH-001", "CH-002"]),
      );

      // Then
      expect(result).toEqual(["CH-001"]);
    }),
  );

  it(
    "retourne un tableau vide quand aucun chantier ne correspond",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute(
        habilitationsAvecLecture(["CH-INEXISTANT"]),
      );

      // Then
      expect(result).toEqual([]);
    }),
  );
});
