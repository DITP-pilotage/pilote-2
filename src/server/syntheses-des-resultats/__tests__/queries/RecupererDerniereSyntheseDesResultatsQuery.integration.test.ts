import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererDerniereSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererDerniereSyntheseDesResultatsQuery";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";

describe("RecupererDerniereSyntheseDesResultatsQuery", () => {
  let query: RecupererDerniereSyntheseDesResultatsQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererDerniereSyntheseDesResultatsQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne null quand aucune synthèse n'existe pour ce chantier/territoire",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne la synthèse V2 complète avec les noms d'auteur",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur({
        nom: "Dupont",
        prenom: "Jean",
      });
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });
      const synthese = await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-06-01"),
        commentaire: "Ma synthèse",
        meteo: "SOLEIL",
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result).toEqual({
        id: synthese.id,
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        contenu: "Ma synthèse",
        météo: "SOLEIL",
        auteur_creation_id: auteur.id,
        date_creation: new Date("2025-01-01").toISOString(),
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01").toISOString(),
        auteur_creation_nom: "Jean Dupont",
        auteur_modification_nom: "Jean Dupont",
      });
    }),
  );

  it(
    "retourne la synthèse la plus récente par date_modification",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });

      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-01-01"),
        commentaire: "Ancienne synthèse",
      });
      const synthèseLaPlusRécente = await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        commentaire: "Synthèse récente",
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          id: synthèseLaPlusRécente.id,
          contenu: "Synthèse récente",
        }),
      );
    }),
  );
});
