import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";

describe("GetChantiersQuery — view en_difficulte", () => {
  const query = new GetChantiersQuery({ prisma: new PrismaPilote() });

  const semerChantierOrageux = async ({
    ecartMandat,
    ecartJalon,
  }: {
    ecartMandat: number | null;
    ecartJalon: number | null;
  }) => {
    await fixtures.chantierIdentite({
      id: "CH-001",
      ministeres_acronymes: ["MIN-01"],
      statut: "PUBLIE",
    });
    await fixtures.chantierTerritoire({
      id: "CH-001",
      territoire_code: "DEPT-29",
      code_insee: "29",
      maille: "DEPT",
      zone_id: "DEPT-29",
      est_applicable: true,
      meteo: "ORAGE",
      ecart: ecartMandat,
    });
    await fixtures.chantierTerritoireJalon({
      id: "CH-001",
      territoire_code: "DEPT-29",
      code_insee: "29",
      maille: "DEPT",
      zone_id: "DEPT-29",
      jalon: 2026,
      ecart: ecartJalon,
    });
  };

  it(
    "remonte un chantier en difficulté dont seul l'écart mandat est <= -10",
    createIntegrationTest(async () => {
      // Given
      await semerChantierOrageux({ ecartMandat: -20, ecartJalon: -5 });

      // When
      const [resultat] = await query.execute({
        territoireCodes: ["DEPT-29"],
        jalon: 2026,
        view: "en_difficulte",
      });

      // Then
      expect(resultat.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          ecart: -5,
          est_en_retard: false,
          est_en_difficulte: true,
        }),
      ]);
    }),
  );

  it(
    "remonte un chantier en difficulté dont l'écart du jalon n'est pas calculé",
    createIntegrationTest(async () => {
      // Given
      await semerChantierOrageux({ ecartMandat: -20, ecartJalon: null });

      // When
      const [resultat] = await query.execute({
        territoireCodes: ["DEPT-29"],
        jalon: 2026,
        view: "en_difficulte",
      });

      // Then
      expect(resultat.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          ecart: null,
          est_en_retard: false,
          est_en_difficulte: true,
        }),
      ]);
    }),
  );

  it(
    "ne remonte pas un chantier en retard au jalon, même si l'écart mandat ne l'est pas",
    createIntegrationTest(async () => {
      // Given
      await semerChantierOrageux({ ecartMandat: -5, ecartJalon: -15 });

      // When
      const [resultat] = await query.execute({
        territoireCodes: ["DEPT-29"],
        jalon: 2026,
        view: "en_difficulte",
      });

      // Then
      expect(resultat.chantiers).toEqual([]);
    }),
  );
});
