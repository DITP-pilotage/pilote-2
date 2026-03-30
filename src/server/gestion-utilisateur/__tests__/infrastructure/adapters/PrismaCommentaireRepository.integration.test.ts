import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaCommentaireRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaCommentaireRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaCommentaireRepository", () => {
  let prismaCommentaireRepository: PrismaCommentaireRepository;

  beforeEach(() => {
    prismaCommentaireRepository = new PrismaCommentaireRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("#anonymiserAuteurs", () => {
    it(
      "doit anonymiser l'auteur de modification des commentaires saisis par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });

        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_modification_id: auteurNonCible.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const commentaire2 = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const commentaire3 = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });

        // When
        await prismaCommentaireRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const commentairesAnonymises = await tx.commentaire.findMany({
          where: { auteur_modification_id: auteurAnonyme.id },
        });
        expect(commentairesAnonymises).toEqual([
          expect.objectContaining({ id: commentaire2.id }),
          expect.objectContaining({ id: commentaire3.id }),
        ]);
      }),
    );

    it(
      "doit anonymiser l'auteur de création des commentaires saisis par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });

        await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const commentaire2 = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const commentaire3 = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });

        // When
        await prismaCommentaireRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const commentairesAnonymises = await tx.commentaire.findMany({
          where: { auteur_creation_id: auteurAnonyme.id },
        });
        expect(commentairesAnonymises).toEqual([
          expect.objectContaining({ id: commentaire2.id }),
          expect.objectContaining({ id: commentaire3.id }),
        ]);
      }),
    );

    it(
      "doit anonymiser chaque champ auteur indépendamment sans modifier l'autre",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });

        // auteur_creation = auteurASupprimer, auteur_modification = auteurNonCible
        const commentaireCreationCible = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        // auteur_creation = auteurNonCible, auteur_modification = auteurASupprimer
        const commentaireModificationCible = await fixtures.commentaire({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          type: "commentaires_sur_les_donnees",
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurASupprimer.id,
        });

        // When
        await prismaCommentaireRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const commentaires = await tx.commentaire.findMany({
          where: {
            id: {
              in: [
                commentaireCreationCible.id,
                commentaireModificationCible.id,
              ],
            },
          },
        });
        expect(commentaires).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: commentaireCreationCible.id,
              auteur_creation_id: auteurAnonyme.id,
              auteur_modification_id: auteurNonCible.id,
            }),
            expect.objectContaining({
              id: commentaireModificationCible.id,
              auteur_creation_id: auteurNonCible.id,
              auteur_modification_id: auteurAnonyme.id,
            }),
          ]),
        );
      }),
    );
  });
});
