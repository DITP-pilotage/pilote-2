import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererDernierCommentaireQuery } from "@/server/commentaires/queries/RecupererDernierCommentaireQuery";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";
const TYPE = "commentairesSurLesDonnées" as const;
const TYPE_DB = "commentaires_sur_les_donnees";

describe("RecupererDernierCommentaireQuery", () => {
  let query: RecupererDernierCommentaireQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererDernierCommentaireQuery({ prisma: prismaPilote });
  });

  it(
    "retourne null pour chaque type quand aucun commentaire publié n'existe",
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
      expect(result[TYPE]).toBeNull();
    }),
  );

  it(
    "retourne null pour un type quand le seul commentaire est un brouillon",
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
      // Seul un brouillon existe
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
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result[TYPE]).toBeNull();
    }),
  );

  it(
    "retourne le dernier commentaire publié par type avec les noms d'auteur",
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
      const commentaire = await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        date_creation: new Date("2025-01-01"),
        date_modification: new Date("2025-06-01"),
        contenu: "Mon commentaire publié",
        statut: $Enums.statut_publication.PUBLIE,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result[TYPE]).toEqual({
        id: commentaire.id,
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        type: TYPE,
        contenu: "Mon commentaire publié",
        statut: $Enums.statut_publication.PUBLIE,
        auteurCreationId: auteur.id,
        dateCreation: new Date("2025-01-01").toISOString(),
        auteurModificationId: auteur.id,
        dateModification: new Date("2025-06-01").toISOString(),
        auteurModificationNom: "Jean Dupont",
      });
    }),
  );

  it(
    "retourne le commentaire le plus récent par type",
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
        contenu: "Ancien commentaire",
      });
      const recent = await fixtures.commentaire({
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
      const result = await query.run(chantier.id, TERRITOIRE_CODE);

      // Then
      expect(result[TYPE]).toEqual(
        expect.objectContaining({
          id: recent.id,
          contenu: "Commentaire récent",
        }),
      );
    }),
  );
});
