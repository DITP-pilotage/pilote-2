import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerUtilisateursPiloteEval } from "@/server/evaluation/queries/ListerUtilisateursPiloteEval";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerUtilisateursPiloteEval", () => {
  let query: ListerUtilisateursPiloteEval;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerUtilisateursPiloteEval({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne uniquement les utilisateurs ayant PILOTE_EVAL dans applications_accessibles",
      createIntegrationTest(async () => {
        // Given
        const utilisateur1 = await fixtures.utilisateur({
          email: "utilisateur1@example.com",
          nom: "Dupont",
          prenom: "Alice",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        });

        await fixtures.utilisateur({
          email: "utilisateur2@example.com",
          nom: "Martin",
          prenom: "Bernard",
          profilCode: "PREFET_DEPARTEMENT",
          applications_accessibles: [
            $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
          ],
        });

        await fixtures.utilisateur({
          email: "utilisateur3@example.com",
          nom: "Durand",
          prenom: "Claire",
          profilCode: "PREFET_DEPARTEMENT",
          applications_accessibles: [$Enums.application_accessible.PILOTE],
        });

        const utilisateur4 = await fixtures.utilisateur({
          email: "utilisateur4@example.com",
          nom: "Lefebvre",
          prenom: "David",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toHaveLength(2);
        expect(resultat).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ email: utilisateur1.email }),
            expect.objectContaining({ email: utilisateur4.email }),
          ]),
        );
        expect(resultat).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({ email: "utilisateur2@example.com" }),
            expect.objectContaining({ email: "utilisateur3@example.com" }),
          ]),
        );
      }),
    );

    it(
      "retourne les champs id, email, nom, prenom, profilCode, dateDerniereModification",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          email: "test@example.com",
          nom: "Test",
          prenom: "Utilisateur",
          profilCode: "DITP_ADMIN",
          fonction: "Responsable",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toHaveLength(1);
        expect(resultat[0]).toEqual({
          id: utilisateur.id,
          email: "test@example.com",
          nom: "Test",
          prenom: "Utilisateur",
          profilCode: "DITP_ADMIN",
          dateDerniereModification: null,
        });
        expect(resultat[0]).not.toHaveProperty("fonction");
        expect(resultat[0]).not.toHaveProperty("date_creation");
      }),
    );

    it(
      "exclut les utilisateurs désactivés",
      createIntegrationTest(async () => {
        // Given
        const utilisateurActif = await fixtures.utilisateur({
          email: "actif@example.com",
          nom: "Actif",
          prenom: "Utilisateur",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        });

        await fixtures.utilisateur({
          email: "desactive@example.com",
          nom: "Desactive",
          prenom: "Utilisateur",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
          date_desactivation: new Date(),
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toHaveLength(1);
        expect(resultat[0].email).toBe(utilisateurActif.email);
      }),
    );

    it(
      "retourne un tableau vide si aucun utilisateur n'a accès à PILOTE_EVAL",
      createIntegrationTest(async () => {
        // Given
        await fixtures.utilisateur({
          email: "pilote-seulement@example.com",
          nom: "PiloteSeulement",
          prenom: "Utilisateur",
          applications_accessibles: [$Enums.application_accessible.PILOTE],
        });

        // When
        const resultat = await query.run();

        // Then
        expect(resultat).toEqual([]);
      }),
    );

    it(
      "retourne null pour dateDerniereModification si l'utilisateur n'a aucun rattachement",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          email: "sans-rattachement@example.com",
          nom: "SansRattachement",
          prenom: "Utilisateur",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        });

        // When
        const resultat = await query.run();

        // Then
        const utilisateurResult = resultat.find((u) => u.id === utilisateur.id);
        expect(utilisateurResult?.dateDerniereModification).toBeNull();
      }),
    );

    it(
      "retourne la date de modification des rattachements de l'utilisateur la plus récente pour dateDerniereModification",
      createIntegrationTest(async () => {
        // Given
        const dateAncienne = new Date("2024-05-10T08:00:00Z").toISOString();
        const dateMoyenne = new Date("2024-06-20T12:00:00Z").toISOString();
        const dateRecente = new Date("2024-07-25T16:30:00Z").toISOString();

        const utilisateur = await fixtures.utilisateur({
          email: "plusieurs-rattachements@example.com",
          nom: "PlusieursRattachements",
          prenom: "Utilisateur",
          applications_accessibles: [$Enums.application_accessible.PILOTE_EVAL],
        });

        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();
        const rattachement3 = await fixtures.rattachement();

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          jalon: 2025,
          created_at: dateAncienne,
          updated_at: dateAncienne,
        });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
          created_at: dateMoyenne,
          updated_at: dateRecente,
        });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement3.code,
          etape: $Enums.etape_evaluation_enum.INSTRUCTION,
          jalon: 2025,
          created_at: dateMoyenne,
          updated_at: dateMoyenne,
        });

        // When
        const resultat = await query.run();

        // Then
        const utilisateurResult = resultat.find((u) => u.id === utilisateur.id);
        expect(utilisateurResult?.dateDerniereModification).toEqual(
          dateRecente,
        );
      }),
    );
  });
});
