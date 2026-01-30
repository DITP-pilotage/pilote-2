import { mock, MockProxy } from "jest-mock-extended";
import { randomUUID } from "crypto";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import {
  ActionCompteInactif,
  ActionCompteInactifRepository,
} from "@/server/gestion-utilisateur/domain/ports/ActionCompteInactifRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { DesactiverLesComptesInactifsUseCase } from "@/server/gestion-utilisateur/usecases/DesactiverLesComptesInactifsUseCase";
import { baseConfig } from "@/config";

describe("DesactiverLesComptesInactifsUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let actionCompteInactifRepository: MockProxy<ActionCompteInactifRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let contactInfoLettresService: MockProxy<ContactInfoLettresService>;
  let useCase: DesactiverLesComptesInactifsUseCase;

  const AUJOURD_HUI = new Date("2026-01-30T12:00:00Z");
  const AUTEUR_ID_SYSTEME = "auteur-systeme-id";

  const creerAction = (
    overrides: Partial<ActionCompteInactif> = {},
  ): ActionCompteInactif => ({
    id: randomUUID(),
    utilisateurId: "utilisateur.inactif@test.com",
    typeAction: "DESACTIVATION",
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
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    contactInfoLettresService = mock<ContactInfoLettresService>();

    useCase = new DesactiverLesComptesInactifsUseCase({
      utilisateurRepository,
      actionCompteInactifRepository,
      utilisateurIAMRepository,
      tokenAPIInformationRepository,
      contactInfoLettresService,
    });

    utilisateurRepository.recupererUtilisateurId.mockResolvedValue(
      AUTEUR_ID_SYSTEME,
    );
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [],
    );

    baseConfig.set("featureFlip.lienContactBrevo", true);
    baseConfig.set("import.keycloakUrl", "http://keycloak.test");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ne fait rien quand aucune action de désactivation n'est à traiter", async () => {
    // When
    const resultat = await useCase.run();

    // Then
    expect(utilisateurRepository.desactiver).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      comptesDesactives: 0,
      erreurs: 0,
    });
  });

  it("désactive le compte, supprime le contact Brevo, désactive dans Keycloak et supprime les tokens API", async () => {
    // Given
    const action = creerAction({
      utilisateurId: "utilisateur.inactif@test.com",
    });
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [action],
    );

    // When
    await useCase.run();

    // Then
    expect(utilisateurRepository.desactiver).toHaveBeenCalledWith(
      "utilisateur.inactif@test.com",
      AUTEUR_ID_SYSTEME,
    );
    expect(contactInfoLettresService.supprimerContact).toHaveBeenCalledWith(
      "utilisateur.inactif@test.com",
    );
    expect(utilisateurIAMRepository.desactive).toHaveBeenCalledWith(
      "utilisateur.inactif@test.com",
    );
    expect(
      tokenAPIInformationRepository.supprimerTokenAPIInformation,
    ).toHaveBeenCalledWith({ email: "utilisateur.inactif@test.com" });
  });

  it("marque l'action en SUCCES après désactivation réussie", async () => {
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
      comptesDesactives: 1,
      erreurs: 0,
    });
  });

  it("marque l'action en ERREUR avec capture de l'erreur en cas d'échec", async () => {
    // Given
    const action = creerAction();
    actionCompteInactifRepository.recupererActionsParTypeEtStatut.mockResolvedValue(
      [action],
    );
    utilisateurRepository.desactiver.mockRejectedValue(new Error("Erreur BDD"));

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: action.id,
        statut: "ERREUR",
        erreur: "Erreur BDD",
        nombreTentatives: 1,
        dateDerniereTentative: AUJOURD_HUI,
      }),
    );
    expect(resultat).toEqual({
      comptesDesactives: 0,
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
    utilisateurRepository.desactiver
      .mockRejectedValueOnce(new Error("Erreur BDD"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionCompteInactifRepository.sauvegarder).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      comptesDesactives: 1,
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
    utilisateurRepository.desactiver.mockRejectedValue(
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
