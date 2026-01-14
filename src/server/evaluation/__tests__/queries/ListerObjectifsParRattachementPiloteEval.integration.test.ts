import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerObjectifsParRattachementPiloteEval } from "@/server/evaluation/queries/ListerObjectifsParRattachementPiloteEval";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerObjectifsParRattachementPiloteEval", () => {
  let query: ListerObjectifsParRattachementPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerObjectifsParRattachementPiloteEval({
      prisma: prismaPilote,
    });
  });

  describe("run", () => {
    it(
      "retourne les objectifs groupés par rattachement pour un jalon donné",
      createIntegrationTest(async () => {
        // Given
        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();

        await fixtures.objectif({
          libelle: "Objectif 1 - Jalon 2025",
          jalon: 2025,
          rattachement_code: rattachement1.code,
        });
        await fixtures.objectif({
          libelle: "Objectif 2 - Jalon 2025",
          jalon: 2025,
          rattachement_code: rattachement1.code,
        });
        await fixtures.objectif({
          libelle: "Objectif 3 - Jalon 2025",
          jalon: 2025,
          rattachement_code: rattachement2.code,
        });
        await fixtures.objectif({
          libelle: "Objectif 4 - Jalon 2026",
          jalon: 2026,
          rattachement_code: rattachement1.code,
        });

        // When
        const resultat = await query.run({ jalon: 2025 });

        // Then
        expect(Object.keys(resultat)).toHaveLength(2);
        expect(resultat[rattachement1.code]).toHaveLength(2);
        expect(resultat[rattachement2.code]).toHaveLength(1);
      }),
    );

    it(
      "retourne uniquement les champs id et libelle pour chaque objectif",
      createIntegrationTest(async () => {
        // Given
        const rattachement = await fixtures.rattachement();

        const objectif = await fixtures.objectif({
          libelle: "Objectif test",
          descriptif: "Description de l'objectif",
          indicateur_cible: "Indicateur cible",
          jalon: 2025,
          rattachement_code: rattachement.code,
        });

        // When
        const resultat = await query.run({ jalon: 2025 });

        // Then
        expect(resultat[rattachement.code]).toHaveLength(1);
        expect(resultat[rattachement.code][0]).toEqual({
          id: objectif.id,
          libelle: "Objectif test",
        });
      }),
    );

    it(
      "retourne un objet vide si aucun objectif pour le jalon donné",
      createIntegrationTest(async () => {
        // Given
        const rattachement = await fixtures.rattachement();

        await fixtures.objectif({
          libelle: "Objectif 2026",
          jalon: 2026,
          rattachement_code: rattachement.code,
        });

        // When
        const resultat = await query.run({ jalon: 2025 });

        // Then
        expect(resultat).toEqual({});
      }),
    );
  });
});
