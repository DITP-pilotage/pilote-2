import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaChatConversationRepository } from "@/server/albert/infrastructure/PrismaChatConversationRepository";

describe("PrismaChatConversationRepository", () => {
  const prismaPilote = new PrismaPilote();

  const buildRepository = () =>
    new PrismaChatConversationRepository({ prisma: prismaPilote });

  it(
    "upsert puis recupererParId doit retourner la conversation",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const repository = buildRepository();
      const id = randomUUID();
      const messages = [
        { id: "m1", role: "user", parts: [{ type: "text", text: "hello" }] },
      ];

      // When
      await repository.upsert({
        id,
        utilisateurId: utilisateur.id,
        titre: "Synthèse Bretagne",
        messages,
        territoireCode: "REG-53",
        jalon: 2025,
      });
      const result = await repository.recupererParId({
        id,
        utilisateurId: utilisateur.id,
      });

      // Then
      expect(result).toEqual({
        id,
        utilisateurId: utilisateur.id,
        titre: "Synthèse Bretagne",
        messages,
        territoireCode: "REG-53",
        jalon: 2025,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    }),
  );

  it(
    "listerPourUtilisateur ne renvoie que les conversations de l'utilisateur, tri par updated_at desc, sans le blob messages",
    createIntegrationTest(async () => {
      // Given
      const utilisateurA = await fixtures.utilisateur({});
      const utilisateurB = await fixtures.utilisateur({});
      const repository = buildRepository();

      await repository.upsert({
        id: randomUUID(),
        utilisateurId: utilisateurA.id,
        titre: "A-1",
        messages: [],
        territoireCode: null,
        jalon: null,
      });
      await repository.upsert({
        id: randomUUID(),
        utilisateurId: utilisateurA.id,
        titre: "A-2",
        messages: [],
        territoireCode: null,
        jalon: null,
      });
      await repository.upsert({
        id: randomUUID(),
        utilisateurId: utilisateurB.id,
        titre: "B-1",
        messages: [],
        territoireCode: null,
        jalon: null,
      });

      // When
      const resultats = await repository.listerPourUtilisateur({
        utilisateurId: utilisateurA.id,
        limite: 10,
      });

      // Then
      expect(resultats).toEqual([
        expect.objectContaining({ titre: "A-2" }),
        expect.objectContaining({ titre: "A-1" }),
      ]);
      expect(resultats[0]).not.toHaveProperty("messages");
    }),
  );

  it(
    "supprimer retire la conversation uniquement si elle appartient à l'utilisateur",
    createIntegrationTest(async () => {
      // Given
      const utilisateurA = await fixtures.utilisateur({});
      const utilisateurB = await fixtures.utilisateur({});
      const repository = buildRepository();
      const id = randomUUID();
      await repository.upsert({
        id,
        utilisateurId: utilisateurA.id,
        titre: "X",
        messages: [],
        territoireCode: null,
        jalon: null,
      });

      // When : un autre utilisateur tente de supprimer
      await repository.supprimer({ id, utilisateurId: utilisateurB.id });

      // Then : la conversation existe toujours
      expect(
        await repository.recupererParId({
          id,
          utilisateurId: utilisateurA.id,
        }),
      ).not.toBeNull();

      // When : le propriétaire supprime
      await repository.supprimer({ id, utilisateurId: utilisateurA.id });

      // Then : la conversation est supprimée
      expect(
        await repository.recupererParId({
          id,
          utilisateurId: utilisateurA.id,
        }),
      ).toBeNull();
    }),
  );

  it(
    "supprimerExpirees supprime uniquement ce qui est plus ancien que la date passée",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const repository = buildRepository();

      const idAncien = randomUUID();
      await repository.upsert({
        id: idAncien,
        utilisateurId: utilisateur.id,
        titre: "ancien",
        messages: [],
        territoireCode: null,
        jalon: null,
      });
      await tx.chat_conversation.update({
        where: { id: idAncien },
        data: { updated_at: new Date("2025-01-01") },
      });

      const idRecent = randomUUID();
      await repository.upsert({
        id: idRecent,
        utilisateurId: utilisateur.id,
        titre: "recent",
        messages: [],
        territoireCode: null,
        jalon: null,
      });

      // When
      const nombre = await repository.supprimerExpirees({
        anterieurA: new Date("2025-06-01"),
      });

      // Then
      expect(nombre).toEqual(1);
      expect(
        await repository.recupererParId({
          id: idAncien,
          utilisateurId: utilisateur.id,
        }),
      ).toBeNull();
      expect(
        await repository.recupererParId({
          id: idRecent,
          utilisateurId: utilisateur.id,
        }),
      ).not.toBeNull();
    }),
  );
});
