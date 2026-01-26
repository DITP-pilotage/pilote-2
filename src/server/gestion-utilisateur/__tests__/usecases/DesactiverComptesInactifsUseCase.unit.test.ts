import { mock, MockProxy } from "jest-mock-extended";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { DesactiverComptesInactifsUseCase } from "@/server/gestion-utilisateur/usecases/DesactiverComptesInactifsUseCase";
import { baseConfig } from "@/config";

describe("DesactiverComptesInactifsUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let tokenAPIInformationRepository: MockProxy<TokenAPIInformationRepository>;
  let contactInfoLettresService: MockProxy<ContactInfoLettresService>;

  let desactiverComptesInactifsUseCase: DesactiverComptesInactifsUseCase;

  const AUTEUR_ID_SYSTEME = "auteur-systeme-id";

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    tokenAPIInformationRepository = mock<TokenAPIInformationRepository>();
    contactInfoLettresService = mock<ContactInfoLettresService>();

    desactiverComptesInactifsUseCase = new DesactiverComptesInactifsUseCase({
      utilisateurRepository,
      utilisateurIAMRepository,
      tokenAPIInformationRepository,
      contactInfoLettresService,
    });

    utilisateurRepository.recupererUtilisateurId.mockResolvedValue(
      AUTEUR_ID_SYSTEME,
    );

    baseConfig.set("featureFlip.lienContactBrevo", true);
    baseConfig.set("import.keycloakUrl", "http://keycloak.test");
  });

  it("désactive un compte dont la date de désactivation programmée est atteinte", async () => {
    // Given
    const emailUtilisateur = "utilisateur.inactif@test.com";
    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: emailUtilisateur,
        datePremiereRelanceDesactivation: new Date("2024-12-01"),
        dateDeuxiemeRelanceDesactivation: new Date("2024-12-24"),
        dateDesactivationProgramee: new Date("2024-12-31"),
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(utilisateurRepository.desactiver).toHaveBeenCalledWith(
      emailUtilisateur,
      AUTEUR_ID_SYSTEME,
    );
    expect(contactInfoLettresService.supprimerContact).toHaveBeenCalledWith(
      emailUtilisateur,
    );
    expect(utilisateurIAMRepository.desactive).toHaveBeenCalledWith(
      emailUtilisateur,
    );
    expect(
      tokenAPIInformationRepository.supprimerTokenAPIInformation,
    ).toHaveBeenCalledWith({ email: emailUtilisateur });

    expect(resultat).toEqual({
      comptesTotaux: 1,
      comptesDesactives: 1,
      detailsMails: {
        mailsDeuxiemeRelance: 0,
        mailsPremiereRelance: 0,
      },
    });
  });

  it("envoie un mail J-30 et set la date de première relance si elle est null", async () => {
    // Given
    const emailUtilisateur = "utilisateur.sans.relance@test.com";
    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: emailUtilisateur,
        datePremiereRelanceDesactivation: null,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: emailUtilisateur }],
      39,
      { joursAvantDesactivation: 30 },
    );
    expect(
      utilisateurRepository.mettreAJourDatePremiereRelanceDesactivation,
    ).toHaveBeenCalledWith(emailUtilisateur, expect.any(Date));

    expect(utilisateurRepository.desactiver).not.toHaveBeenCalled();

    expect(resultat).toEqual({
      comptesTotaux: 1,
      comptesDesactives: 0,
      detailsMails: {
        mailsDeuxiemeRelance: 0,
        mailsPremiereRelance: 1,
      },
    });
  });

  it("envoie un mail J-7 et set les dates si 23 jours après la première relance", async () => {
    // Given
    const emailUtilisateur = "utilisateur.relance.j7@test.com";
    const datePremiereRelance = new Date();
    datePremiereRelance.setDate(datePremiereRelance.getDate() - 25);

    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: emailUtilisateur,
        datePremiereRelanceDesactivation: datePremiereRelance,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: emailUtilisateur }],
      39,
      { joursAvantDesactivation: 7 },
    );
    expect(
      utilisateurRepository.mettreAJourDateDeuxiemeRelanceDesactivation,
    ).toHaveBeenCalledWith(emailUtilisateur, expect.any(Date));
    expect(
      utilisateurRepository.mettreAJourDateDesactivationProgramee,
    ).toHaveBeenCalledWith(emailUtilisateur, expect.any(Date));

    expect(utilisateurRepository.desactiver).not.toHaveBeenCalled();

    expect(resultat).toEqual({
      comptesTotaux: 1,
      comptesDesactives: 0,
      detailsMails: {
        mailsDeuxiemeRelance: 1,
        mailsPremiereRelance: 0,
      },
    });
  });

  it("ne fait rien si la première relance a été envoyée mais les 23 jours ne sont pas écoulés", async () => {
    // Given
    const emailUtilisateur = "utilisateur.attente@test.com";
    const datePremiereRelance = new Date();
    datePremiereRelance.setDate(datePremiereRelance.getDate() - 10);

    utilisateurRepository.recupererComptesInactifs.mockResolvedValue([
      {
        email: emailUtilisateur,
        datePremiereRelanceDesactivation: datePremiereRelance,
        dateDeuxiemeRelanceDesactivation: null,
        dateDesactivationProgramee: null,
        dateDerniereConnexion: new Date("2023-06-01"),
      },
    ]);

    // When
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).not.toHaveBeenCalled();
    expect(utilisateurRepository.desactiver).not.toHaveBeenCalled();

    expect(resultat).toEqual({
      comptesTotaux: 1,
      comptesDesactives: 0,
      detailsMails: {
        mailsDeuxiemeRelance: 0,
        mailsPremiereRelance: 0,
      },
    });
  });

  it("applique les bonnes actions selon l'état des dates de relance", async () => {
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
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(utilisateurRepository.desactiver).toHaveBeenCalledTimes(1);
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      comptesTotaux: 3,
      comptesDesactives: 1,
      detailsMails: {
        mailsDeuxiemeRelance: 1,
        mailsPremiereRelance: 1,
      },
    });
  });
});
