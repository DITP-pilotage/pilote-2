import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { RecupererTauxAvancementTerritoireQuery } from "@/server/chantiers/query/RecupererTauxAvancementTerritoireQuery";
import { GetChantiersHabilitesQuery } from "@/server/chantiers/infrastructure/queries/GetChantiersHabilitesQuery";
import { AgregerAvancementsChantiersUseCase } from "@/server/chantiers/usecases/AgregerAvancementsChantiersUseCase";
import { ChantierSQLRepository } from "@/server/chantiers/infrastructure/sql/ChantierSQLRepository";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

const habilitationsSurChantiers = (chantiers: string[]): Habilitations => {
  const habilitation = { chantiers, territoires: ["REG-75"], périmètres: [] };
  return {
    gestionUtilisateur: habilitation,
    lecture: habilitation,
    saisieCommentaire: habilitation,
    saisieIndicateur: habilitation,
    responsabilite: habilitation,
  };
};

const creerChantierAvecTauxSurREG75 = async (
  id: string,
  tauxAvancement: number,
) => {
  await fixtures.chantierIdentite({
    id,
    ministeres: ["MIN-01"],
    statut: "PUBLIE",
  });
  await fixtures.chantierTerritoire({
    id,
    territoire_code: "REG-75",
    code_insee: "75",
    maille: "REG",
    zone_id: "REG-75",
    est_applicable: true,
  });
  await fixtures.chantierTerritoireJalon({
    id,
    territoire_code: "REG-75",
    code_insee: "75",
    maille: "REG",
    zone_id: "REG-75",
    jalon: 2026,
    taux_avancement: tauxAvancement,
  });
};

describe("RecupererTauxAvancementTerritoireQuery", () => {
  let query: RecupererTauxAvancementTerritoireQuery;

  beforeEach(() => {
    const prisma = new PrismaPilote();
    query = new RecupererTauxAvancementTerritoireQuery({
      getChantiersHabilitesQuery: new GetChantiersHabilitesQuery({ prisma }),
      agregerAvancementsChantiersUseCase:
        new AgregerAvancementsChantiersUseCase({
          chantierRepository: new ChantierSQLRepository({ prisma }),
        }),
    });
  });

  it(
    "calcule le taux d'avancement sur les seuls chantiers accessibles à l'utilisateur",
    createIntegrationTest(async () => {
      // Given
      await creerChantierAvecTauxSurREG75("CH-084", 20);
      await creerChantierAvecTauxSurREG75("CH-062", 80);

      // When
      const result = await query.execute({
        territoireCode: "REG-75",
        jalon: 2026,
        habilitations: habilitationsSurChantiers(["CH-084"]),
      });

      // Then
      expect(result).toEqual({
        territoire_code: "REG-75",
        jalon: 2026,
        taux_avancement: 20,
      });
    }),
  );

  it(
    "ne calcule pas de taux d'avancement pour un utilisateur sans chantier accessible",
    createIntegrationTest(async () => {
      // Given
      await creerChantierAvecTauxSurREG75("CH-062", 80);

      // When
      const result = await query.execute({
        territoireCode: "REG-75",
        jalon: 2026,
        habilitations: habilitationsSurChantiers([]),
      });

      // Then
      expect(result).toEqual({
        territoire_code: "REG-75",
        jalon: 2026,
        taux_avancement: null,
      });
    }),
  );
});
