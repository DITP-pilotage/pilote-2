import { $Enums } from "@prisma/client";
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
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

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
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toEqual({
        id: synthese.id,
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        contenu: "Ma synthèse",
        meteo: "SOLEIL",
        auteurCreationId: auteur.id,
        dateCreation: new Date("2025-01-01").toISOString(),
        auteurModificationId: auteur.id,
        dateModification: new Date("2025-06-01").toISOString(),
        statut: $Enums.statut_publication.PUBLIE,
        auteurCreationNom: "Jean Dupont",
        auteurModificationNom: "Jean Dupont",
        dateDernierBrouillon: null,
      });
    }),
  );

  it(
    "retourne null quand la seule synthèse est un brouillon",
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
      // Seule une synthèse en BROUILLON existe
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
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne la date du brouillon s'il existe",
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
        commentaire: "Synthèse publiée",
        statut: $Enums.statut_publication.PUBLIE,
      });
      const brouillon = await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        commentaire: "Brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          dateDernierBrouillon: brouillon.date_modification.toISOString(),
        }),
      );
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
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          id: synthèseLaPlusRécente.id,
          contenu: "Synthèse récente",
        }),
      );
    }),
  );

  it(
    "retourne null pour dateDernierBrouillon quand le brouillon appartient à un autre auteur",
    createIntegrationTest(async () => {
      // Given
      const auteur = await fixtures.utilisateur();
      const autreAuteur = await fixtures.utilisateur();
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
        commentaire: "Synthèse publiée",
        statut: $Enums.statut_publication.PUBLIE,
      });
      // Le brouillon le plus récent appartient à autreAuteur
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: autreAuteur.id,
        auteur_modification_id: autreAuteur.id,
        date_modification: new Date("2025-06-01"),
        commentaire: "Brouillon d'un autre auteur",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          dateDernierBrouillon: null,
        }),
      );
    }),
  );
});
