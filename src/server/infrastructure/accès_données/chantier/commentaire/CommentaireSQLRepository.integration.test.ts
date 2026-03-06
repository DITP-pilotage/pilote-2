import { $Enums } from "@prisma/client";
import CommentaireSQLRepository, {
  CODES_TYPES_COMMENTAIRES,
} from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import {
  creerCommentairePublie,
  creerCommentaireBrouillon,
} from "@/server/domain/chantier/commentaire/Commentaire";

const TERRITOIRE_CODE = "NAT-FR";
const MAILLE = "NAT";
const CODE_INSEE = "FR";

describe("CommentaireSQLRepository", () => {
  let repository: CommentaireSQLRepository;

  beforeEach(() => {
    repository = new CommentaireSQLRepository();
  });

  describe("#save", () => {
    it(
      "crée un commentaire publié en base",
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
        const commentaire = creerCommentairePublie({
          chantierId: chantier.id,
          territoireCode: TERRITOIRE_CODE,
          type: "risquesEtFreinsÀLever",
          contenu: "Un commentaire publié",
          auteurId: auteur.id,
          date: new Date().toISOString(),
        });

        // When
        await repository.save(commentaire);

        // Then
        const enBase = await getPrisma().commentaire.findUnique({
          where: { id: commentaire.id },
        });
        expect(enBase).toEqual(
          expect.objectContaining({
            id: commentaire.id,
            contenu: "Un commentaire publié",
            type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
            statut: $Enums.statut_publication.PUBLIE,
            auteur_creation_id: auteur.id,
            auteur_modification_id: auteur.id,
          }),
        );
      }),
    );

    it(
      "crée un brouillon en base",
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
        const brouillon = creerCommentaireBrouillon({
          chantierId: chantier.id,
          territoireCode: TERRITOIRE_CODE,
          type: "risquesEtFreinsÀLever",
          contenu: "Un brouillon",
          auteurId: auteur.id,
          date: new Date().toISOString(),
        });

        // When
        await repository.save(brouillon);

        // Then
        const enBase = await getPrisma().commentaire.findUnique({
          where: { id: brouillon.id },
        });
        expect(enBase).toEqual(
          expect.objectContaining({
            statut: $Enums.statut_publication.BROUILLON,
            contenu: "Un brouillon",
          }),
        );
      }),
    );

    it(
      "met à jour le contenu et le statut lors d'un upsert sur un id existant",
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
        const brouillon = creerCommentaireBrouillon({
          chantierId: chantier.id,
          territoireCode: TERRITOIRE_CODE,
          type: "risquesEtFreinsÀLever",
          contenu: "Brouillon initial",
          auteurId: auteur.id,
          date: new Date().toISOString(),
        });
        await repository.save(brouillon);

        // When
        await repository.save({
          ...brouillon,
          contenu: "Brouillon modifié",
          statut: $Enums.statut_publication.PUBLIE,
        });

        // Then
        const enBase = await getPrisma().commentaire.findUnique({
          where: { id: brouillon.id },
        });
        expect(enBase).toEqual(
          expect.objectContaining({
            contenu: "Brouillon modifié",
            statut: $Enums.statut_publication.PUBLIE,
          }),
        );
      }),
    );
  });

  describe("#récupérerLesPlusRécentsGroupésParChantier", () => {
    it(
      "retourne un objet vide quand aucun commentaire publié n'existe",
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
        const result =
          await repository.récupérerLesPlusRécentsGroupésParChantier(
            [chantier.id],
            TERRITOIRE_CODE,
          );

        // Then
        expect(result).toEqual({});
      }),
    );

    it(
      "ne retourne pas les brouillons",
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
          type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
          auteur_creation_id: auteur.id,
          statut: $Enums.statut_publication.BROUILLON,
        });

        // When
        const result =
          await repository.récupérerLesPlusRécentsGroupésParChantier(
            [chantier.id],
            TERRITOIRE_CODE,
          );

        // Then
        expect(result).toEqual({});
      }),
    );

    it(
      "retourne le commentaire publié le plus récent par type et par chantier",
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
          type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
          auteur_creation_id: auteur.id,
          auteur_modification_id: auteur.id,
          contenu: "Ancien commentaire",
          date_modification: new Date("2024-01-01"),
          statut: $Enums.statut_publication.PUBLIE,
        });
        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: TERRITOIRE_CODE,
          maille: MAILLE,
          code_insee: CODE_INSEE,
          type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
          auteur_creation_id: auteur.id,
          auteur_modification_id: auteur.id,
          contenu: "Commentaire récent",
          date_modification: new Date("2025-01-01"),
          statut: $Enums.statut_publication.PUBLIE,
        });

        // When
        const result =
          await repository.récupérerLesPlusRécentsGroupésParChantier(
            [chantier.id],
            TERRITOIRE_CODE,
          );

        // Then
        expect(result).toEqual({
          [chantier.id]: [
            expect.objectContaining({
              contenu: "Commentaire récent",
              type: "risquesEtFreinsÀLever",
              auteur: `${auteur.prenom} ${auteur.nom}`,
            }),
          ],
        });
      }),
    );

    it(
      "retourne les commentaires groupés par chantier",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier1 = await fixtures.chantierIdentite();
        const chantier2 = await fixtures.chantierIdentite();
        for (const chantier of [chantier1, chantier2]) {
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
            type: CODES_TYPES_COMMENTAIRES["risquesEtFreinsÀLever"],
            auteur_creation_id: auteur.id,
            contenu: `Commentaire ${chantier.id}`,
            statut: $Enums.statut_publication.PUBLIE,
          });
        }

        // When
        const result =
          await repository.récupérerLesPlusRécentsGroupésParChantier(
            [chantier1.id, chantier2.id],
            TERRITOIRE_CODE,
          );

        // Then
        expect(result).toEqual({
          [chantier1.id]: [
            expect.objectContaining({ contenu: `Commentaire ${chantier1.id}` }),
          ],
          [chantier2.id]: [
            expect.objectContaining({ contenu: `Commentaire ${chantier2.id}` }),
          ],
        });
      }),
    );
  });
});
