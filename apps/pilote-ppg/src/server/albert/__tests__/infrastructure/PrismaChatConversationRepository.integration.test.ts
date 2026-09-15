import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaChatConversationRepository } from "@/server/albert/infrastructure/PrismaChatConversationRepository";

describe("PrismaChatConversationRepository", () => {
  const prismaPilote = new PrismaPilote();

  const buildRepository = () =>
    new PrismaChatConversationRepository({ prisma: prismaPilote });

  it(
    "save puis recupererParId doit retourner la conversation",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const repository = buildRepository();
      const id = randomUUID();
      const messages = [
        { id: "m1", role: "user", parts: [{ type: "text", text: "hello" }] },
      ];

      // When
      await repository.save({
        id,
        utilisateurId: utilisateur.id,
        titre: "Synthèse Bretagne",
        messages,
        contexte: { jalon: 2025, territoireCode: "REG-53" },
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
        contexte: { jalon: 2025, territoireCode: "REG-53" },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    }),
  );

  it(
    "save refuse de modifier une conversation appartenant à un autre utilisateur",
    createIntegrationTest(async () => {
      // Given
      const utilisateurA = await fixtures.utilisateur({});
      const utilisateurB = await fixtures.utilisateur({});
      const repository = buildRepository();
      const id = randomUUID();
      await repository.save({
        id,
        utilisateurId: utilisateurA.id,
        titre: "conv de A",
        messages: [],
        contexte: null,
      });

      // When / Then
      await expect(
        repository.save({
          id,
          utilisateurId: utilisateurB.id,
          titre: "intrusion",
          messages: [],
          contexte: null,
        }),
      ).rejects.toThrow();

      // Then : la conversation initiale est intacte
      const conversation = await repository.recupererParId({
        id,
        utilisateurId: utilisateurA.id,
      });
      expect(conversation?.titre).toEqual("conv de A");
    }),
  );

  it(
    "listerPourUtilisateur ne renvoie que les conversations de l'utilisateur, tri par updated_at desc, sans le blob messages",
    createIntegrationTest(async () => {
      // Given
      const utilisateurA = await fixtures.utilisateur({});
      const utilisateurB = await fixtures.utilisateur({});
      const repository = buildRepository();

      const idA1 = randomUUID();
      const idA2 = randomUUID();
      await repository.save({
        id: idA1,
        utilisateurId: utilisateurA.id,
        titre: "A-1",
        messages: [],
        contexte: null,
      });
      await repository.save({
        id: idA2,
        utilisateurId: utilisateurA.id,
        titre: "A-2",
        messages: [],
        contexte: null,
      });
      await repository.save({
        id: randomUUID(),
        utilisateurId: utilisateurB.id,
        titre: "B-1",
        messages: [],
        contexte: null,
      });

      // PostgreSQL fige `now()` a l'ouverture de la transaction : les `save()`
      // partagent le meme `updated_at` et l'ordre serait indetermine. On date
      // donc les deux conversations explicitement.
      await prisma.chat_conversation.update({
        where: { id: idA1 },
        data: { updated_at: new Date("2026-01-01T10:00:00Z") },
      });
      await prisma.chat_conversation.update({
        where: { id: idA2 },
        data: { updated_at: new Date("2026-01-02T10:00:00Z") },
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
      await repository.save({
        id,
        utilisateurId: utilisateurA.id,
        titre: "X",
        messages: [],
        contexte: null,
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
      await repository.save({
        id: idAncien,
        utilisateurId: utilisateur.id,
        titre: "ancien",
        messages: [],
        contexte: null,
      });
      await tx.chat_conversation.update({
        where: { id: idAncien },
        data: { updated_at: new Date("2025-01-01") },
      });

      const idRecent = randomUUID();
      await repository.save({
        id: idRecent,
        utilisateurId: utilisateur.id,
        titre: "recent",
        messages: [],
        contexte: null,
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
