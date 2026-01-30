import { mock, MockProxy } from "jest-mock-extended";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { ActionCompteInactifRepository } from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import { CreerLesActionsComptesInactifsUseCase } from "@/server/gestion-utilisateur/usecases/CreerLesActionsComptesInactifsUseCase";

describe("CreerLesActionsComptesInactifsUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let actionCompteInactifRepository: MockProxy<ActionCompteInactifRepository>;
  let useCase: CreerLesActionsComptesInactifsUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    actionCompteInactifRepository = mock<ActionCompteInactifRepository>();

    useCase = new CreerLesActionsComptesInactifsUseCase({
      utilisateurRepository,
      actionCompteInactifRepository,
    });

    utilisateurRepository.recupererUtilisateurId.mockResolvedValue(
      "auteur-systeme-id",
    );
  });

  it("ne crée aucune action quand aucun utilisateur inactif n'est remonté", async () => {
    // Given
    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsDesactivation: 0,
    });
  });

  it("crée une action DESACTIVATION quand la date de désactivation programmée est atteinte", async () => {
    // Given
    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: "utilisateur.inactif@test.com",
        datePremiereRelanceDesactivation: new Date("2024-12-01"),
        dateDeuxiemeRelanceDesactivation: new Date("2024-12-24"),
        dateDesactivationProgramee: new Date("2024-12-31"),
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        typeAction: "DESACTIVATION",
        statut: "CREEE",
      }),
    );
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsDesactivation: 1,
    });
  });

  it("crée une action PREMIERE_RELANCE quand aucune relance n'a été envoyée", async () => {
    // Given
    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: "utilisateur.sans.relance@test.com",
        datePremiereRelanceDesactivation: null,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        typeAction: "PREMIERE_RELANCE",
        statut: "CREEE",
      }),
    );
    expect(resultat).toEqual({
      actionsPremiereRelance: 1,
      actionsDeuxiemeRelance: 0,
      actionsDesactivation: 0,
    });
  });

  it("crée une action DEUXIEME_RELANCE quand 23+ jours après la première relance", async () => {
    // Given
    const datePremiereRelance = new Date();
    datePremiereRelance.setDate(datePremiereRelance.getDate() - 25);

    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: "utilisateur.relance.j7@test.com",
        datePremiereRelanceDesactivation: datePremiereRelance,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        typeAction: "DEUXIEME_RELANCE",
        statut: "CREEE",
      }),
    );
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 1,
      actionsDesactivation: 0,
    });
  });

  it("ne crée aucune action quand les 23 jours après la première relance ne sont pas écoulés", async () => {
    // Given
    const datePremiereRelance = new Date();
    datePremiereRelance.setDate(datePremiereRelance.getDate() - 10);

    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: "utilisateur.attente@test.com",
        datePremiereRelanceDesactivation: datePremiereRelance,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsDesactivation: 0,
    });
  });

  it("crée les bonnes actions pour un mix de comptes dans des états différents", async () => {
    // Given
    const datePremiereRelanceJ7 = new Date();
    datePremiereRelanceJ7.setDate(datePremiereRelanceJ7.getDate() - 25);

    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: "compte.desactiver@test.com",
        datePremiereRelanceDesactivation: new Date("2024-12-01"),
        dateDeuxiemeRelanceDesactivation: new Date("2024-12-24"),
        dateDesactivationProgramee: new Date("2024-12-31"),
        dateDerniereConnexion: new Date("2023-06-01"),
      },
      {
        email: "compte.mail.j30@test.com",
        datePremiereRelanceDesactivation: null,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
      {
        email: "compte.mail.j7@test.com",
        datePremiereRelanceDesactivation: datePremiereRelanceJ7,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledTimes(3);
    expect(resultat).toEqual({
      actionsPremiereRelance: 1,
      actionsDeuxiemeRelance: 1,
      actionsDesactivation: 1,
    });
  });

  it("continue la création des autres actions si une erreur survient sur une action individuelle", async () => {
    // Given
    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: "compte.en.erreur@test.com",
        datePremiereRelanceDesactivation: null,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
      {
        email: "compte.ok@test.com",
        datePremiereRelanceDesactivation: null,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    actionCompteInactifRepository.sauvegarder
      .mockRejectedValueOnce(new Error("Erreur BDD"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      actionsPremiereRelance: 1,
      actionsDeuxiemeRelance: 0,
      actionsDesactivation: 0,
    });
  });

  it("stoppe si la récupération des comptes inactifs échoue", async () => {
    // Given
    utilisateurRepository.recupererComptesInactifs.mockRejectedValue(
      new Error("Erreur BDD"),
    );

    // When / Then
    await expect(useCase.run()).rejects.toThrow("Erreur BDD");
    expect(actionCompteInactifRepository.sauvegarder).not.toHaveBeenCalled();
  });
});
