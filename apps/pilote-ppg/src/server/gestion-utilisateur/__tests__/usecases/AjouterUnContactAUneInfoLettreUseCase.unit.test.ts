import { mock, MockProxy } from "vitest-mock-extended";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import { AjouterUnContactAUneInfoLettreUseCase } from "@/server/gestion-utilisateur/usecases/AjouterUnContactAUneInfoLettreUseCase";

describe("AjouterUnContactAUneInfoLettreUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let contactInfoLettresService: MockProxy<ContactInfoLettresService>;
  let ajouterUnContactAUneInfoLettreUseCase: AjouterUnContactAUneInfoLettreUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    contactInfoLettresService = mock<ContactInfoLettresService>();
    ajouterUnContactAUneInfoLettreUseCase =
      new AjouterUnContactAUneInfoLettreUseCase({
        contactInfoLettresService,
        utilisateurRepository,
      });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-17T08:06:12.411Z"));
  });

  it("Si l'id utilisateur n'existe pas en base, retourne faux et n'ajoute aucun contact à l'infolettre", async () => {
    // Given
    utilisateurRepository.recupererUtilisateurEmail.mockResolvedValue(null);

    // When
    const contactAjoute = await ajouterUnContactAUneInfoLettreUseCase.execute(
      "9b62a20d-f344-4b7b-939a-2c61db177c4d",
      10,
    );

    // Then
    expect(
      contactInfoLettresService.ajouterContactAUneInfoLettre,
    ).toHaveBeenCalledTimes(0);
    expect(
      utilisateurRepository.mettreAJourLaDateInscriptionInfolettre,
    ).toHaveBeenCalledTimes(0);
    expect(contactAjoute).toBeFalse();
  });

  it("Si l'id utilisateur existe en base, retourne true et ajoute le contact à l'infolettre", async () => {
    // Given
    utilisateurRepository.recupererUtilisateurEmail.mockResolvedValue(
      "john.doe@exemple.com",
    );

    // When
    const contactAjoute = await ajouterUnContactAUneInfoLettreUseCase.execute(
      "9b62a20d-f344-4b7b-939a-2c61db177c4d",
      10,
    );

    // Then
    expect(
      contactInfoLettresService.ajouterContactAUneInfoLettre,
    ).toHaveBeenCalledWith("john.doe@exemple.com", [10]);
    expect(
      utilisateurRepository.mettreAJourLaDateInscriptionInfolettre,
    ).toHaveBeenCalledWith(
      "john.doe@exemple.com",
      new Date("2025-06-17T08:06:12.411Z"),
    );
    expect(contactAjoute).toBeTrue();
  });
});
