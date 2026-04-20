import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererBrouillonSyntheseDesResultatsQuery } from "@/server/syntheses-des-resultats/queries/RecupererBrouillonSyntheseDesResultatsQuery";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";

describe("RecupererDernierBrouillonSyntheseDesResultatsQuery", () => {
  let query: RecupererBrouillonSyntheseDesResultatsQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererBrouillonSyntheseDesResultatsQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne null quand aucun brouillon n'existe",
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
    "retourne null quand le brouillon appartient a un autre auteur",
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
        auteur_creation_id: autreAuteur.id,
        auteur_modification_id: autreAuteur.id,
        commentaire: "Brouillon d'un autre auteur",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne le contenu et la meteo du brouillon de l'auteur",
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
        commentaire: "Mon brouillon",
        meteo: "NUAGE",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toEqual({
        id: expect.any(String),
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        auteurCreationId: auteur.id,
        dateCreation: expect.any(String),
        auteurModificationId: auteur.id,
        dateModification: expect.any(String),
        statut: $Enums.statut_publication.BROUILLON,
        contenu: "Mon brouillon",
        meteo: "NUAGE",
      });
    }),
  );

  it(
    "retourne le brouillon le plus recent si plusieurs existent",
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
        commentaire: "Ancien brouillon",
        meteo: "SOLEIL",
        statut: $Enums.statut_publication.BROUILLON,
      });
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        commentaire: "Brouillon recent",
        meteo: "ORAGE",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          contenu: "Brouillon recent",
          meteo: "ORAGE",
        }),
      );
    }),
  );
});
