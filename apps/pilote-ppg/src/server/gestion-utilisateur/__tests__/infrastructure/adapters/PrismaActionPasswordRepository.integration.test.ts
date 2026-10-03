import { randomUUID } from "crypto";
import { PrismaActionPasswordRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaActionPasswordRepository";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaActionPasswordRepository", () => {
  let repository: PrismaActionPasswordRepository;
  const prismaPilote = new PrismaPilote();

  const creerAction = (
    overrides: Partial<ActionPassword> = {},
  ): ActionPassword => ({
    id: randomUUID(),
    utilisateurId: randomUUID(),
    typeAction: "PREMIERE_RELANCE",
    dateCreation: new Date("2026-10-01"),
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
    ...overrides,
  });

  beforeEach(() => {
    repository = new PrismaActionPasswordRepository({ prisma: prismaPilote });
  });

  describe("#sauvegarder", () => {
    it(
      "crée une nouvelle action en base",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const action = creerAction({ utilisateurId: utilisateur.id });

        // When
        await repository.sauvegarder(action);

        // Then
        const result = await prismaPilote
          .getInstance()
          .action_password.findMany();
        expect(result).toEqual([
          expect.objectContaining({
            id: action.id,
            utilisateur_id: utilisateur.id,
            type_action: "PREMIERE_RELANCE",
            statut: "CREEE",
            nombre_tentatives: 0,
            erreur: null,
          }),
        ]);
      }),
    );

    it(
      "met à jour le statut d'une action existante",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const action = creerAction({ utilisateurId: utilisateur.id });
        await repository.sauvegarder(action);

        // When
        await repository.sauvegarder({
          ...action,
          statut: "ECHEC",
          nombreTentatives: 1,
          dateDerniereTentative: new Date("2026-10-02"),
          erreur: "Brevo indisponible",
        });

        // Then
        const result = await prismaPilote
          .getInstance()
          .action_password.findMany();
        expect(result).toEqual([
          expect.objectContaining({
            id: action.id,
            statut: "ECHEC",
            nombre_tentatives: 1,
            date_derniere_tentative: new Date("2026-10-02"),
            erreur: "Brevo indisponible",
          }),
        ]);
      }),
    );
  });

  describe("#recupererActionsParTypeEtStatut", () => {
    it(
      "retourne les actions des types demandés au statut demandé",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const relance = creerAction({ utilisateurId: utilisateur.id });
        const expiration = creerAction({
          utilisateurId: utilisateur.id,
          typeAction: "EXPIRATION",
        });
        const relanceEnSucces = creerAction({
          utilisateurId: utilisateur.id,
          statut: "SUCCES",
        });
        await repository.sauvegarder(relance);
        await repository.sauvegarder(expiration);
        await repository.sauvegarder(relanceEnSucces);

        // When
        const result = await repository.recupererActionsParTypeEtStatut({
          typesAction: ["PREMIERE_RELANCE"],
          statut: "CREEE",
        });

        // Then
        expect(result).toEqual([relance]);
      }),
    );
  });

  describe("#annulerActionsEnAttente", () => {
    it(
      "passe en échec les actions CREEE de l'utilisateur et laisse les autres",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const autreUtilisateur = await fixtures.utilisateur();
        const actionEnAttente = creerAction({ utilisateurId: utilisateur.id });
        const actionEnSucces = creerAction({
          utilisateurId: utilisateur.id,
          statut: "SUCCES",
        });
        const actionAutreUtilisateur = creerAction({
          utilisateurId: autreUtilisateur.id,
        });
        await repository.sauvegarder(actionEnAttente);
        await repository.sauvegarder(actionEnSucces);
        await repository.sauvegarder(actionAutreUtilisateur);

        // When
        await repository.annulerActionsEnAttente(utilisateur.id);

        // Then
        const result = await prismaPilote
          .getInstance()
          .action_password.findMany({ orderBy: { date_creation: "asc" } });
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: actionEnAttente.id,
              statut: "ECHEC",
              erreur: "Annulée : mot de passe changé",
            }),
            expect.objectContaining({
              id: actionEnSucces.id,
              statut: "SUCCES",
            }),
            expect.objectContaining({
              id: actionAutreUtilisateur.id,
              statut: "CREEE",
            }),
          ]),
        );
      }),
    );
  });
});
