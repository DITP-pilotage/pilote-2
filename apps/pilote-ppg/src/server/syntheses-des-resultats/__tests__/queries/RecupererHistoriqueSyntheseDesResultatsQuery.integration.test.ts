import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererHistoriqueSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";

describe("RecupererHistoriqueSyntheseDesResultatsQuery", () => {
  let query: RecupererHistoriqueSyntheseDesResultatsQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererHistoriqueSyntheseDesResultatsQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne un tableau vide quand aucune synthèse n'existe pour ce chantier/territoire",
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
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne toutes les synthèses avec les noms d'auteurs",
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
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-01-01"),
        commentaire: "Première synthèse",
        meteo: "SOLEIL",
      });
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-06-01"),
        date_modification: new Date("2025-06-01"),
        commentaire: "Deuxième synthèse",
        meteo: "NUAGE",
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          contenu: "Deuxième synthèse",
          auteurCreationNom: "Jean Dupont",
          auteurModificationNom: "Jean Dupont",
        }),
        expect.objectContaining({
          contenu: "Première synthèse",
          auteurCreationNom: "Jean Dupont",
          auteurModificationNom: "Jean Dupont",
        }),
      ]);
    }),
  );

  it(
    "exclut les synthèses en brouillon",
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
        commentaire: "Synthèse publiée",
        statut: $Enums.statut_publication.PUBLIE,
      });
      // Brouillon ne doit pas apparaître dans l'historique
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        commentaire: "Brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result).toHaveLength(1);
    }),
  );

  it(
    "retourne les synthèses dans l'ordre décroissant par date_modification",
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
        commentaire: "Synthèse ancienne",
      });
      await fixtures.syntheseDesResultats({
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
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Synthèse récente" }),
        expect.objectContaining({ contenu: "Synthèse ancienne" }),
      ]);
    }),
  );
});
