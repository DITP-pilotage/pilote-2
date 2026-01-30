import { mock, MockProxy } from "jest-mock-extended";
import { randomUUID } from "crypto";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import {
  ActionCompteInactif,
  ActionCompteInactifRepository,
} from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { EnvoyerLesRelancesUseCase } from "@/server/gestion-utilisateur/usecases/EnvoyerLesRelancesUseCase";

describe("EnvoyerLesRelancesUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let actionCompteInactifRepository: MockProxy<ActionCompteInactifRepository>;
  let contactInfoLettresService: MockProxy<ContactInfoLettresService>;
  let useCase: EnvoyerLesRelancesUseCase;

  const AUJOURD_HUI = new Date("2026-01-30T12:00:00Z");

  const creerAction = (
    overrides: Partial<ActionCompteInactif> = {},
  ): ActionCompteInactif => ({
    id: randomUUID(),
    utilisateurId: "utilisateur@test.com",
    typeAction: "PREMIERE_RELANCE",
    dateCreation: new Date("2026-01-30"),
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(AUJOURD_HUI);

    utilisateurRepository = mock<UtilisateurRepository>();
    actionCompteInactifRepository = mock<ActionCompteInactifRepository>();
    contactInfoLettresService = mock<ContactInfoLettresService>();

    useCase = new EnvoyerLesRelancesUseCase({
      utilisateurRepository,
      actionCompteInactifRepository,
      contactInfoLettresService,
    });

    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [],
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ne fait rien quand aucune action de relance n'est à traiter", async () => {
    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      erreurs: 0,
    });
  });

  it("envoie un email J-30 et met à jour la date de première relance pour une action PREMIERE_RELANCE", async () => {
    // Given
    const action = creerAction({
      utilisateurId: "utilisateur.j30@test.com",
      typeAction: "PREMIERE_RELANCE",
    });
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [action],
    );

    // When
    await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: "utilisateur.j30@test.com" }],
      39,
      { joursAvantDesactivation: 30 },
    );
    expect(
      utilisateurRepository.mettreAJourDatePremiereRelanceDesactivation,
    ).toHaveBeenCalledWith("utilisateur.j30@test.com", AUJOURD_HUI);
  });

  it("envoie un email J-7 et met à jour les dates pour une action DEUXIEME_RELANCE", async () => {
    // Given
    const action = creerAction({
      utilisateurId: "utilisateur.j7@test.com",
      typeAction: "DEUXIEME_RELANCE",
    });
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [action],
    );

    // When
    await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: "utilisateur.j7@test.com" }],
      39,
      { joursAvantDesactivation: 7 },
    );
    expect(
      utilisateurRepository.mettreAJourDateDeuxiemeRelanceDesactivation,
    ).toHaveBeenCalledWith("utilisateur.j7@test.com", AUJOURD_HUI);
    expect(
      utilisateurRepository.mettreAJourDateDesactivationProgramee,
    ).toHaveBeenCalledWith(
      "utilisateur.j7@test.com",
      new Date("2026-02-06T12:00:00Z"),
    );
  });

  it("marque l'action en SUCCES après envoi réussi", async () => {
    // Given
    const action = creerAction();
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [action],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: action.id,
        statut: "SUCCES",
        dateSucces: AUJOURD_HUI,
      }),
    );
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 1,
      deuxiemesRelancesEnvoyees: 0,
      erreurs: 0,
    });
  });

  it("marque l'action en ERREUR avec capture de l'erreur en cas d'échec d'envoi", async () => {
    // Given
    const action = creerAction();
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [action],
    );
    contactInfoLettresService.envoieUnEmail.mockRejectedValue(
      new Error("Erreur Brevo"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: action.id,
        statut: "ERREUR",
        erreur: "Erreur Brevo",
        nombreTentatives: 1,
        dateDerniereTentative: AUJOURD_HUI,
      }),
    );
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      erreurs: 1,
    });
  });

  it("continue avec les autres actions malgré une erreur individuelle", async () => {
    // Given
    const actionEnErreur = creerAction({
      utilisateurId: "erreur@test.com",
    });
    const actionOk = creerAction({
      utilisateurId: "ok@test.com",
    });
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [actionEnErreur, actionOk],
    );
    contactInfoLettresService.envoieUnEmail
      .mockRejectedValueOnce(new Error("Erreur Brevo"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 1,
      deuxiemesRelancesEnvoyees: 0,
      erreurs: 1,
    });
  });

  it("incrémente le nombre de tentatives sur une action déjà en erreur", async () => {
    // Given
    const action = creerAction({
      nombreTentatives: 2,
      dateDerniereTentative: new Date("2026-01-29"),
      erreur: "Ancienne erreur",
    });
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [action],
    );
    contactInfoLettresService.envoieUnEmail.mockRejectedValue(
      new Error("Nouvelle erreur"),
    );

    // When
    await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: action.id,
        statut: "ERREUR",
        erreur: "Nouvelle erreur",
        nombreTentatives: 3,
        dateDerniereTentative: AUJOURD_HUI,
      }),
    );
  });
});
