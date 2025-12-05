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

    it("retourne les champs id, email, nom, prenom, profilCode, dateDerniereModification", async () => {
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
        dateDerniereModification: null,
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

    it("retourne null pour dateDerniereModification si l'utilisateur n'a aucun rattachement", async () => {
      // Given: un utilisateur sans rattachement
      const utilisateurId = "4ace45dd-f29e-44c5-85a6-18ea6f3afb9d";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "sans-rattachement@example.com",
          nom: "SansRattachement",
          prenom: "Utilisateur",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        },
      });

      // When
      const resultat = await query.run();

      // Then
      const utilisateur = resultat.find((u) => u.id === utilisateurId);
      expect(utilisateur?.dateDerniereModification).toBeNull();
    });

    it("retourne la date de modification des rattachements de l'utilisateur la plus récente pour dateDerniereModification", async () => {
      // Given: un utilisateur avec trois rattachements à des dates différentes
      const utilisateurId = "ce3cbb2c-cadb-438f-8b55-e19dc384bd74";
      const dateAncienne = new Date("2024-05-10T08:00:00Z").toISOString();
      const dateMoyenne = new Date("2024-06-20T12:00:00Z").toISOString();
      const dateRecente = new Date("2024-07-25T16:30:00Z").toISOString();

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "plusieurs-rattachements@example.com",
          nom: "PlusieursRattachements",
          prenom: "Utilisateur",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        },
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          { code: "TEST-02", libelle: "Test 02", groupe: "Test", ordre: 2 },
          { code: "TEST-03", libelle: "Test 03", groupe: "Test", ordre: 3 },
          { code: "TEST-04", libelle: "Test 04", groupe: "Test", ordre: 4 },
        ],
        skipDuplicates: true,
      });

      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: "076e52d0-5d8d-4e95-b032-614c708f32de",
            utilisateur_id: utilisateurId,
            rattachement_code: "TEST-02",
            etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            jalon: 2025,
            created_at: dateAncienne,
            updated_at: dateAncienne,
          },
          {
            id: "be128b9e-081e-4a9d-b7ea-d0e957409640",
            utilisateur_id: utilisateurId,
            rattachement_code: "TEST-03",
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
            created_at: dateMoyenne,
            updated_at: dateRecente,
          },
          {
            id: "8ec5c44f-c121-4d3d-9c80-94c2c7249ce7",
            utilisateur_id: utilisateurId,
            rattachement_code: "TEST-04",
            etape: $Enums.etape_evaluation_enum.INSTRUCTION,
            jalon: 2025,
            created_at: dateMoyenne,
            updated_at: dateMoyenne,
          },
        ],
      });

      // When
      const resultat = await query.run();

      // Then
      const utilisateur = resultat.find((u) => u.id === utilisateurId);
      expect(utilisateur?.dateDerniereModification).toEqual(dateRecente);
    });
  });
});
