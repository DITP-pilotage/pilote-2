import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";

describe("GetIndicateurContexteQuery", () => {
  let query: GetIndicateurContexteQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetIndicateurContexteQuery({ prisma: prismaPilote });
  });

  it(
    "retourne le contexte de l'indicateur avec les drapeaux d'agrégation",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier de test",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur de test",
        description: "Description de test",
        unite_mesure: "%",
        maille_nat_agregee: true,
        maille_reg_agregee: false,
      });

      // When
      const result = await query.execute({ indicateurId: indicateur.id });

      // Then
      expect(result).toEqual({
        id: indicateur.id,
        nom: "Indicateur de test",
        description: "Description de test",
        uniteMesure: "%",
        chantier: { id: chantier.id, nom: "Chantier de test" },
        mailleNatAgregee: true,
        mailleRegAgregee: false,
      });
    }),
  );

  it(
    "retourne null quand l'indicateur n'existe pas",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({ indicateurId: "IND-INEXISTANT" });

      // Then
      expect(result).toBeNull();
    }),
  );
});
