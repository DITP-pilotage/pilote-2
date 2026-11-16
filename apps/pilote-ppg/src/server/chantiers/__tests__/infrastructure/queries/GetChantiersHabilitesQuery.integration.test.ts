import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetChantiersHabilitesQuery } from "@/server/chantiers/infrastructure/queries/GetChantiersHabilitesQuery";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

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
      const premierChantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      const secondChantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-02"],
        statut: $Enums.type_statut.PUBLIE,
      });

      // When
      const result = await query.execute(
        habilitationsAvecLecture([premierChantier.id, secondChantier.id]),
      );

      // Then
      expect(result.sort()).toEqual(
        [premierChantier.id, secondChantier.id].sort(),
      );
    }),
  );

  it(
    "exclut les chantiers non présents dans les habilitations",
    createIntegrationTest(async () => {
      // Given
      const chantierHabilite = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      await fixtures.chantierIdentite({
        ministeres: ["MIN-02"],
        statut: $Enums.type_statut.PUBLIE,
      });

      // When
      const result = await query.execute(
        habilitationsAvecLecture([chantierHabilite.id]),
      );

      // Then
      expect(result).toEqual([chantierHabilite.id]);
    }),
  );

  it(
    "exclut les chantiers avec un statut différent de PUBLIE",
    createIntegrationTest(async () => {
      // Given
      const chantierPublie = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      const chantierBrouillon = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.BROUILLON,
      });
      const chantierArchive = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.ARCHIVE,
      });
      const chantierSupprime = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.SUPPRIME,
      });

      // When
      const result = await query.execute(
        habilitationsAvecLecture([
          chantierPublie.id,
          chantierBrouillon.id,
          chantierArchive.id,
          chantierSupprime.id,
        ]),
      );

      // Then
      expect(result).toEqual([chantierPublie.id]);
    }),
  );

  it(
    "exclut les chantiers sans ministères",
    createIntegrationTest(async () => {
      // Given
      const chantierAvecMinisteres = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        statut: $Enums.type_statut.PUBLIE,
      });
      const chantierSansMinisteres = await fixtures.chantierIdentite({
        // ministeres vide
        ministeres: [],
        statut: $Enums.type_statut.PUBLIE,
      });

      // When
      const result = await query.execute(
        habilitationsAvecLecture([
          chantierAvecMinisteres.id,
          chantierSansMinisteres.id,
        ]),
      );

      // Then
      expect(result).toEqual([chantierAvecMinisteres.id]);
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
