import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { ListerUtilisateursPiloteEval } from "@/server/evaluation/queries/ListerUtilisateursPiloteEval";

describe("ListerUtilisateursPiloteEval", () => {
  let query: ListerUtilisateursPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerUtilisateursPiloteEval({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("retourne uniquement les utilisateurs ayant PILOTE_EVAL dans applications_accessibles", async () => {
      // Given
      const utilisateur1Id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const utilisateur2Id = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
      const utilisateur3Id = "c3d4e5f6-a7b8-9012-cdef-123456789012";
      const utilisateur4Id = "d4e5f6a7-b8c9-0123-def0-123456789013";

      await prisma.utilisateur.create({
        data: {
          id: utilisateur1Id,
          email: "utilisateur1@example.com",
          nom: "Dupont",
          prenom: "Alice",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateur2Id,
          email: "utilisateur2@example.com",
          nom: "Martin",
          prenom: "Bernard",
          date_creation: new Date(),
          profilCode: "PREFET_DEPARTEMENT",
          applications_accessibles: [
            $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
          ],
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateur3Id,
          email: "utilisateur3@example.com",
          nom: "Durand",
          prenom: "Claire",
          date_creation: new Date(),
          profilCode: "PREFET_DEPARTEMENT",
          applications_accessibles: [$Enums.application_accessible.PILOTE],
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateur4Id,
          email: "utilisateur4@example.com",
          nom: "Lefebvre",
          prenom: "David",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        },
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(2);
      expect(resultat).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "utilisateur1@example.com" }),
          expect.objectContaining({ email: "utilisateur4@example.com" }),
        ]),
      );
      expect(resultat).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "utilisateur2@example.com" }),
          expect.objectContaining({ email: "utilisateur3@example.com" }),
        ]),
      );
    });

    it("retourne les champs id, email, nom, prenom, profilCode", async () => {
      // Given
      const utilisateurId = "e5f6a7b8-c9d0-1234-ef01-234567890123";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test@example.com",
          nom: "Test",
          prenom: "Utilisateur",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          fonction: "Responsable",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        },
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(1);
      expect(resultat[0]).toEqual({
        id: utilisateurId,
        email: "test@example.com",
        nom: "Test",
        prenom: "Utilisateur",
        profilCode: "DITP_ADMIN",
      });
      expect(resultat[0]).not.toHaveProperty("fonction");
      expect(resultat[0]).not.toHaveProperty("date_creation");
    });

    it("exclut les utilisateurs désactivés", async () => {
      // Given
      const utilisateurActifId = "f6a7b8c9-d0e1-2345-f012-345678901234";
      const utilisateurDesactiveId = "a7b8c9d0-e1f2-3456-0123-456789012345";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurActifId,
          email: "actif@example.com",
          nom: "Actif",
          prenom: "Utilisateur",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurDesactiveId,
          email: "desactive@example.com",
          nom: "Desactive",
          prenom: "Utilisateur",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
          date_desactivation: new Date(),
        },
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toHaveLength(1);
      expect(resultat[0].email).toBe("actif@example.com");
    });

    it("retourne un tableau vide si aucun utilisateur n'a accès à PILOTE_EVAL", async () => {
      // Given
      const utilisateurId = "e1f2a3b4-c5d6-7890-4567-890123456789";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "pilote-seulement@example.com",
          nom: "PiloteSeulement",
          prenom: "Utilisateur",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          applications_accessibles: [$Enums.application_accessible.PILOTE],
        },
      });

      // When
      const resultat = await query.run();

      // Then
      expect(resultat).toEqual([]);
    });
  });
});
