import { randomUUID } from "crypto";
import { PrismaActionCompteInactifRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaActionCompteInactifRepository";
import { ActionCompteInactif } from "@/server/gestion-utilisateur/domain/ActionCompteInactif";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaActionCompteInactifRepository", () => {
  let repository: PrismaActionCompteInactifRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaActionCompteInactifRepository({
      prisma: prismaPilote,
    });
  });

  describe("#sauvegarder", () => {
    it(
      "crée une nouvelle action en base",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const action: ActionCompteInactif = {
          id: randomUUID(),
          utilisateurId: utilisateur.id,
          typeAction: "PREMIERE_RELANCE",
          dateCreation: new Date("2026-01-30"),
          statut: "CREEE",
          dateSucces: null,
          dateDerniereTentative: null,
          nombreTentatives: 0,
          erreur: null,
        };

        // When
        await repository.sauvegarder(action);

        // Then
        const result = await repository.recupererActionsParTypeEtStatut(
          ["PREMIERE_RELANCE"],
          "CREEE",
        );
        expect(result).toEqual([
          expect.objectContaining({
            id: action.id,
            utilisateurId: utilisateur.id,
            typeAction: "PREMIERE_RELANCE",
            statut: "CREEE",
            nombreTentatives: 0,
            erreur: null,
          }),
        ]);
      }),
    );

    it(
      "met à jour une action existante",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const actionId = randomUUID();
        const action: ActionCompteInactif = {
          id: actionId,
          utilisateurId: utilisateur.id,
          typeAction: "DESACTIVATION",
          dateCreation: new Date("2026-01-30"),
          statut: "CREEE",
          dateSucces: null,
          dateDerniereTentative: null,
          nombreTentatives: 0,
          erreur: null,
        };
        await repository.sauvegarder(action);

        // When
        await repository.sauvegarder({
          ...action,
          statut: "ERREUR",
          dateDerniereTentative: new Date("2026-01-30T10:00:00Z"),
          nombreTentatives: 1,
          erreur: "Erreur Keycloak",
        });

        // Then
        const result = await repository.recupererActionsParTypeEtStatut(
          ["DESACTIVATION"],
          "ERREUR",
        );
        expect(result).toEqual([
          expect.objectContaining({
            id: actionId,
            statut: "ERREUR",
            nombreTentatives: 1,
            erreur: "Erreur Keycloak",
          }),
        ]);
      }),
    );
  });

  describe("#recupererActionsParTypeEtStatut", () => {
    it(
      "retourne les actions filtrées par type et statut",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        await fixtures.actionCompteInactif({
          utilisateur_id: utilisateur.id,
          type_action: "PREMIERE_RELANCE",
          statut: "CREEE",
        });
        await fixtures.actionCompteInactif({
          utilisateur_id: utilisateur.id,
          type_action: "DESACTIVATION",
          statut: "CREEE",
        });
        await fixtures.actionCompteInactif({
          utilisateur_id: utilisateur.id,
          type_action: "PREMIERE_RELANCE",
          statut: "SUCCES",
        });

        // When
        const result = await repository.recupererActionsParTypeEtStatut(
          ["PREMIERE_RELANCE", "DEUXIEME_RELANCE"],
          "CREEE",
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            typeAction: "PREMIERE_RELANCE",
            statut: "CREEE",
          }),
        ]);
      }),
    );

    it(
      "retourne un tableau vide quand aucune action ne correspond",
      createIntegrationTest(async () => {
        // When
        const result = await repository.recupererActionsParTypeEtStatut(
          ["DESACTIVATION"],
          "CREEE",
        );

        // Then
        expect(result).toEqual([]);
      }),
    );
  });
});
