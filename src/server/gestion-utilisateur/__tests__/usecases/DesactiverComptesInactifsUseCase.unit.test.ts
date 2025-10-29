import { mock, MockProxy } from "jest-mock-extended";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { TokenAPIInformationRepository } from "@/server/gestion-utilisateur/domain/ports/TokenAPIInformationRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { DesactiverComptesInactifsUseCase } from "@/server/gestion-utilisateur/usecases/DesactiverComptesInactifsUseCase";

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

    process.env.NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO = "true";
    process.env.IMPORT_KEYCLOAK_URL = "http://keycloak.test";
  });

  it("désactive un compte inactif depuis plus de 90 jours", async () => {
    // Given
    const emailUtilisateur = "utilisateur.inactif@test.com";
    utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak.mockResolvedValue(
      [
        {
          email: emailUtilisateur,
          joursInactivite: 91,
        },
      ],
    );

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
      mailsEnvoyes: 0,
      detailsMails: {
        mailsJ7: 0,
        mailsJ30: 0,
      },
    });
  });

  it("envoie un mail J-30 pour un compte inactif depuis 60 jours", async () => {
    // Given
    const emailUtilisateur = "utilisateur.bientot.inactif@test.com";
    utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak.mockResolvedValue(
      [
        {
          email: emailUtilisateur,
          joursInactivite: 60,
        },
      ],
    );

    // When
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: emailUtilisateur }],
      39,
      { joursAvantDesactivation: 30 },
    );

    expect(utilisateurRepository.desactiver).not.toHaveBeenCalled();

    expect(resultat).toEqual({
      comptesTotaux: 1,
      comptesDesactives: 0,
      mailsEnvoyes: 1,
      detailsMails: {
        mailsJ7: 0,
        mailsJ30: 1,
      },
    });
  });

  it("envoie un mail J-7 pour un compte inactif depuis 83 jours", async () => {
    // Given
    const emailUtilisateur = "utilisateur.tres.bientot.inactif@test.com";
    utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak.mockResolvedValue(
      [
        {
          email: emailUtilisateur,
          joursInactivite: 83,
        },
      ],
    );

    // When
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: emailUtilisateur }],
      39,
      { joursAvantDesactivation: 7 },
    );

    expect(utilisateurRepository.desactiver).not.toHaveBeenCalled();

    expect(resultat).toEqual({
      comptesTotaux: 1,
      comptesDesactives: 0,
      mailsEnvoyes: 1,
      detailsMails: {
        mailsJ7: 1,
        mailsJ30: 0,
      },
    });
  });

  it("applique les bonnes actions selon le nombre de jours d'inactivité", async () => {
    // Given
    utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak.mockResolvedValue(
      [
        { email: "compte.desactiver@test.com", joursInactivite: 150 },
        { email: "compte.mail.j30@test.com", joursInactivite: 60 },
        { email: "compte.mail.j7@test.com", joursInactivite: 83 },
        { email: "compte.inactif.70j@test.com", joursInactivite: 70 },
      ],
    );

    // When
    const resultat = await desactiverComptesInactifsUseCase.run();

    // Then
    expect(utilisateurRepository.desactiver).toHaveBeenCalledTimes(1);
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      comptesTotaux: 4,
      comptesDesactives: 1,
      mailsEnvoyes: 2,
      detailsMails: {
        mailsJ7: 1,
        mailsJ30: 1,
      },
    });
  });
});
