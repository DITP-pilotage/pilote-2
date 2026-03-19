import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererHistoriqueCommentaireQuery } from "@/server/commentaires/queries/RecupererHistoriqueCommentaireQuery";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";
const TYPE = "commentairesSurLesDonnées" as const;
const TYPE_DB = "commentaires_sur_les_donnees";

describe("RecupererHistoriqueCommentaireQuery", () => {
  let query: RecupererHistoriqueCommentaireQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererHistoriqueCommentaireQuery({ prisma: prismaPilote });
  });

  it(
    "retourne un tableau vide quand aucun commentaire n'existe",
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
      const result = await query.run(chantier.id, TERRITOIRE_CODE, TYPE);

      // Then
      expect(result).toEqual([]);
    }),
  );

  it(
    "retourne les commentaires publiés avec les noms d'auteur",
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
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-01-01"),
        contenu: "Premier commentaire",
      });
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-06-01"),
        date_modification: new Date("2025-06-01"),
        contenu: "Deuxième commentaire",
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          contenu: "Deuxième commentaire",
          auteurCreationNom: "Jean Dupont",
          auteurModificationNom: "Jean Dupont",
        }),
        expect.objectContaining({
          contenu: "Premier commentaire",
          auteurCreationNom: "Jean Dupont",
          auteurModificationNom: "Jean Dupont",
        }),
      ]);
    }),
  );

  it(
    "exclut les brouillons",
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
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Commentaire publié",
        statut: $Enums.statut_publication.PUBLIE,
      });
      // Brouillon ne doit pas apparaître dans l'historique
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Commentaire publié" }),
      ]);
    }),
  );

  it(
    "exclut les commentaires d'un autre type",
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
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Commentaire du bon type",
      });
      // Commentaire d'un autre type ne doit pas apparaître
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: "freins_a_lever",
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Commentaire d'un autre type",
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Commentaire du bon type" }),
      ]);
    }),
  );

  it(
    "retourne les commentaires dans l'ordre décroissant par date_modification",
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
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-01-01"),
        contenu: "Commentaire ancien",
      });
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_modification: new Date("2025-06-01"),
        contenu: "Commentaire récent",
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, TYPE);

      // Then
      expect(result).toEqual([
        expect.objectContaining({ contenu: "Commentaire récent" }),
        expect.objectContaining({ contenu: "Commentaire ancien" }),
      ]);
    }),
  );
});
