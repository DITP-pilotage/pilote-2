import { ProfilAPI } from "@/server/authentification/domain/ProfilAPI";
import { PrismaProfilRepository } from "@/server/authentification/infrastructure/adapters/PrismaProfilRepository";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";

describe("PrismaProfilRepository", () => {
  let prismaProfilRepository: PrismaProfilRepository;

  beforeEach(() => {
    prismaProfilRepository = new PrismaProfilRepository();
  });

  describe("#estAutoriseAAccederAuxChantiersBrouillons", () => {
    it(
      "quand le profil n'est pas autorisé, doit remonter false",
      createIntegrationTest(async () => {
        // Given
        const profilCodeChantierBrouillonNonAutorise: ProfilAPI =
          ProfilEnum.PREFET_DEPARTEMENT;

        // When
        const result =
          await prismaProfilRepository.estAutoriseAAccederAuxChantiersBrouillons(
            {
              profilCode: profilCodeChantierBrouillonNonAutorise,
            },
          );

        // Then
        expect(result).toEqual(false);
      }),
    );

    it(
      "quand le profil est autorisé, doit remonter true",
      createIntegrationTest(async () => {
        // Given
        const profilCodeChantierBrouillonNonAutorise: ProfilAPI =
          ProfilEnum.EQUIPE_DIR_PROJET;

        // When
        const result =
          await prismaProfilRepository.estAutoriseAAccederAuxChantiersBrouillons(
            {
              profilCode: profilCodeChantierBrouillonNonAutorise,
            },
          );

        // Then
        expect(result).toEqual(true);
      }),
    );
  });
});
