import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetEvolutionIndicateurTerritoireQuery } from "@/server/chantiers/query/GetEvolutionIndicateurTerritoireQuery";

const TERRITOIRE_CODE = "DEPT-75";

describe("GetEvolutionIndicateurTerritoireQuery", () => {
  let query: GetEvolutionIndicateurTerritoireQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetEvolutionIndicateurTerritoireQuery({ prisma: prismaPilote });
  });

  it(
    "retourne les points d'évolution triés par date croissante, avec le taux d'avancement jalon quand disponible",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: "DEPT",
        code_insee: "75",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: "DEPT",
        code_insee: "75",
        evolution_avancement: [
          { date: "2024-06-01", valeur: 30 },
          { date: "2024-01-01", valeur: 10 },
          {
            date: "2024-03-01",
            valeur: 20,
            // taux_avancement_mandat est réellement présent dans la colonne JSON
            // mais ne doit jamais fuiter dans la sortie de la query
            taux_avancement_jalon: 99,
            taux_avancement_mandat: 88,
          },
        ],
      });

      // When
      const result = await query.execute({
        indicateurId: indicateur.id,
        territoireCode: TERRITOIRE_CODE,
      });

      // Then
      expect(result).toEqual([
        { date: "01/2024", valeur: 10, taux_avancement_jalon: null },
        { date: "03/2024", valeur: 20, taux_avancement_jalon: 99 },
        { date: "06/2024", valeur: 30, taux_avancement_jalon: null },
      ]);
    }),
  );

  it(
    "retourne un tableau vide quand la colonne evolution_avancement est nulle",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: "DEPT",
        code_insee: "75",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
      });
      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: "DEPT",
        code_insee: "75",
      });

      // When
      const result = await query.execute({
        indicateurId: indicateur.id,
        territoireCode: TERRITOIRE_CODE,
      });

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne un tableau vide quand aucune ligne n'existe pour ce couple",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({
        indicateurId: "IND-INEXISTANT",
        territoireCode: TERRITOIRE_CODE,
      });

      // Then
      expect(result).toEqual([]);
    }),
  );
});
