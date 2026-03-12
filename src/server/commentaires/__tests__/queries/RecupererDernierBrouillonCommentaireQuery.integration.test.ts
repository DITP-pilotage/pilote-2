import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererBrouillonCommentaireQuery } from "@/server/commentaires/queries/RecupererBrouillonCommentaireQuery";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";
const TYPE = "commentairesSurLesDonnées" as const;
const TYPE_DB = "commentaires_sur_les_donnees";

describe("RecupererBrouillonCommentaireQuery", () => {
  let query: RecupererBrouillonCommentaireQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new RecupererBrouillonCommentaireQuery({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne null pour tous les types quand aucun brouillon n'existe",
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
      expect(Object.values(result).every((v) => v === null)).toBe(true);
    }),
  );

  it(
    "retourne null pour un type quand le brouillon appartient à un autre auteur",
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
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: autreAuteur.id,
        auteur_modification_id: autreAuteur.id,
        contenu: "Brouillon d'un autre auteur",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result[TYPE]).toBeNull();
    }),
  );

  it(
    "retourne le brouillon de l'auteur pour le bon type",
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
      const brouillon = await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        type: TYPE_DB,
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Mon brouillon",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result[TYPE]).toEqual({
        id: brouillon.id,
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        type: TYPE,
        contenu: "Mon brouillon",
        statut: $Enums.statut_publication.BROUILLON,
        auteurCreationId: auteur.id,
        dateCreation: expect.any(String),
        auteurModificationId: auteur.id,
        dateModification: expect.any(String),
      });
    }),
  );

  it(
    "retourne le brouillon le plus récent par type si plusieurs existent",
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
        contenu: "Ancien brouillon",
        statut: $Enums.statut_publication.BROUILLON,
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
        contenu: "Brouillon récent",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result[TYPE]).toEqual(
        expect.objectContaining({ contenu: "Brouillon récent" }),
      );
    }),
  );

  it(
    "retourne les brouillons pour chaque type indépendamment",
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
        contenu: "Brouillon type A",
        statut: $Enums.statut_publication.BROUILLON,
      });
      await fixtures.commentaire({
        chantier_id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        // type différent : freins_a_lever
        type: "freins_a_lever",
        auteur_creation_id: auteur.id,
        auteur_modification_id: auteur.id,
        contenu: "Brouillon type B",
        statut: $Enums.statut_publication.BROUILLON,
      });

      // When
      const result = await query.run(chantier.id, TERRITOIRE_CODE, auteur.id);

      // Then
      expect(result[TYPE]).toEqual(
        expect.objectContaining({ contenu: "Brouillon type A" }),
      );
      expect(result["risquesEtFreinsÀLever"]).toEqual(
        expect.objectContaining({ contenu: "Brouillon type B" }),
      );
    }),
  );
});
