import { HabilitationBuilder } from "@/server/gestion-utilisateur/domain/habilitation/HabilitationBuilder";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

describe("Habilitation - indicateurs non à jour", () => {
  it.each<[ProfilCode, boolean]>([
    [ProfilEnum.EQUIPE_DIR_PROJET, true],
    [ProfilEnum.SECRETARIAT_GENERAL, true],
    [ProfilEnum.DITP_ADMIN, true],
    [ProfilEnum.DITP_PILOTAGE, false],
    [ProfilEnum.COORDINATEUR_REGION, false],
  ])("le profil %s a accès : %s", (profil, attendu) => {
    // Given
    const habilitation = new HabilitationBuilder()
      .avecProfilCode(profil)
      .build();

    // When
    const resultat = habilitation.estAutoriseAAccederAuxIndicateursNonAJour();

    // Then
    expect(resultat).toEqual(attendu);
  });

  it("lève une erreur pour un profil non autorisé", () => {
    // Given
    const habilitation = new HabilitationBuilder()
      .avecProfilCode(ProfilEnum.DITP_PILOTAGE)
      .build();

    // When / Then
    expect(() =>
      habilitation.verifierAutorisationLectureIndicateursNonAJour(),
    ).toThrow(UnauthorizedError);
  });
});
