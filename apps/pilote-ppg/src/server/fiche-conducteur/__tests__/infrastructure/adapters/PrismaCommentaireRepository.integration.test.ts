import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaCommentaireRepository } from "@/server/fiche-conducteur/infrastructure/adapters/PrismaCommentaireRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaCommentaireRepository", () => {
  let prismaCommentaireRepository: PrismaCommentaireRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    prismaCommentaireRepository = new PrismaCommentaireRepository({
      prisma: prismaPilote,
    });
  });

  describe("#listerObjectifParChantierId", () => {
    it(
      "doit lister les commentaires associé au chantier",
      createIntegrationTest(async (prisma) => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        const autreChantier = await fixtures.chantierIdentite();

        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
        });
        await fixtures.chantierTerritoire({
          id: autreChantier.id,
          territoire_code: "NAT-FR",
          zone_id: "FRANCE",
          code_insee: "FR",
          maille: $Enums.Maille.NAT,
        });

        await prisma.commentaire.createMany({
          data: [
            {
              id: randomUUID(),
              chantier_id: chantier.id,
              type: "freins_a_lever",
              contenu: "contenu OK freins_a_lever",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date(),
              date_modification: new Date(),
              maille: $Enums.Maille.NAT,
              code_insee: "FR",
              territoire_code: "NAT-FR",
            },
            {
              id: randomUUID(),
              chantier_id: chantier.id,
              type: "actions_a_venir",
              contenu: "contenu OK actions_a_venir",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date(),
              date_modification: new Date(),
              maille: $Enums.Maille.NAT,
              code_insee: "FR",
              territoire_code: "NAT-FR",
            },
            // autre chantier, ne doit pas être retourné
            {
              id: randomUUID(),
              chantier_id: autreChantier.id,
              type: "actions_a_venir",
              contenu: "contenu KO chantier_id",
              auteur_creation_id: auteur.id,
              auteur_modification_id: auteur.id,
              date_creation: new Date(),
              date_modification: new Date(),
              maille: $Enums.Maille.NAT,
              code_insee: "FR",
              territoire_code: "NAT-FR",
            },
          ],
        });

        // When
        const listeCommentaireResult =
          await prismaCommentaireRepository.listerCommentaireParChantierId({
            chantierId: chantier.id,
          });

        // Then
        expect(
          listeCommentaireResult.map((commentaire) => commentaire.type),
        ).toIncludeSameMembers(["freins_a_lever", "actions_a_venir"]);
        expect(
          listeCommentaireResult.map((commentaire) => commentaire.contenu),
        ).toIncludeSameMembers([
          "contenu OK freins_a_lever",
          "contenu OK actions_a_venir",
        ]);
      }),
    );
  });
});
