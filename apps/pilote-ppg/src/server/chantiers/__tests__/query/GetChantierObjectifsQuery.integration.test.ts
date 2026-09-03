import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetChantierObjectifsQuery } from "@/server/chantiers/query/GetChantierObjectifsQuery";

describe("GetChantierObjectifsQuery", () => {
  let query: GetChantierObjectifsQuery;

  beforeEach(() => {
    query = new GetChantierObjectifsQuery({ prisma: new PrismaPilote() });
  });

  it(
    "retourne null pour chaque type quand aucun objectif publié n'existe",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();

      // When
      const result = await query.execute(chantier.id);

      // Then
      expect(result).toEqual({
        chantier_id: chantier.id,
        objectifs: {
          notre_ambition: null,
          deja_fait: null,
          a_faire: null,
        },
      });
    }),
  );

  it(
    "retourne null pour un type quand le seul objectif est un brouillon",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: $Enums.type_objectif.notre_ambition,
        contenu: "Brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.execute(chantier.id);

      // Then
      expect(result.objectifs.notre_ambition).toBeNull();
    }),
  );

  it(
    "retourne le dernier objectif publié quand plusieurs objectifs existent pour le même type",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: $Enums.type_objectif.notre_ambition,
        contenu: "Ancien objectif",
        date_modification: new Date("2025-01-01"),
      });
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: $Enums.type_objectif.notre_ambition,
        contenu: "Objectif récent",
        date_modification: new Date("2025-06-01"),
      });

      // When
      const result = await query.execute(chantier.id);

      // Then
      expect(result.objectifs.notre_ambition).toEqual({
        date_publication: new Date("2025-06-01").toISOString(),
        contenu: "Objectif récent",
      });
    }),
  );

  it(
    "retourne les objectifs pour chaque type indépendamment",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: $Enums.type_objectif.notre_ambition,
        contenu: "Notre ambition",
        date_modification: new Date("2025-01-01"),
      });
      await fixtures.objectifChantier({
        chantier_id: chantier.id,
        type: $Enums.type_objectif.deja_fait,
        contenu: "Déjà fait",
        date_modification: new Date("2025-02-01"),
      });

      // When
      const result = await query.execute(chantier.id);

      // Then
      expect(result.objectifs.notre_ambition).toEqual({
        date_publication: new Date("2025-01-01").toISOString(),
        contenu: "Notre ambition",
      });
      expect(result.objectifs.deja_fait).toEqual({
        date_publication: new Date("2025-02-01").toISOString(),
        contenu: "Déjà fait",
      });
      expect(result.objectifs.a_faire).toBeNull();
    }),
  );
});
