import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { PrismaSuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaSuiviPasswordAdminRepository";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaSuiviPasswordAdminRepository", () => {
  let repository: PrismaSuiviPasswordAdminRepository;
  const prismaPilote = new PrismaPilote();

  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> & { utilisateurId: string },
  ): SuiviPasswordAdmin => ({
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  beforeEach(() => {
    repository = new PrismaSuiviPasswordAdminRepository({
      prisma: prismaPilote,
    });
  });

  it(
    "retourne null quand l'utilisateur n'a pas de suivi",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur();

      // When
      const result = await repository.recupererParUtilisateur(utilisateur.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "crée puis relit un suivi",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const suivi = creerSuivi({ utilisateurId: utilisateur.id });

      // When
      await repository.sauvegarder(suivi);
      const result = await repository.recupererParUtilisateur(utilisateur.id);

      // Then
      expect(result).toEqual(suivi);
    }),
  );

  it(
    "met à jour un suivi existant",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const suivi = creerSuivi({ utilisateurId: utilisateur.id });
      await repository.sauvegarder(suivi);

      // When
      await repository.sauvegarder({
        ...suivi,
        datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
      });
      const result = await repository.recupererParUtilisateur(utilisateur.id);

      // Then
      expect(result).toEqual({
        ...suivi,
        datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
      });
    }),
  );

  it(
    "ne retourne que les suivis des comptes actifs du profil demandé",
    createIntegrationTest(async () => {
      // Given
      const adminActif = await fixtures.utilisateur({
        profilCode: ProfilEnum.DITP_ADMIN,
      });
      const adminDesactive = await fixtures.utilisateur({
        profilCode: ProfilEnum.DITP_ADMIN,
        date_desactivation: new Date("2026-01-01"),
      });
      const pilotage = await fixtures.utilisateur({
        profilCode: ProfilEnum.DITP_PILOTAGE,
      });
      const suiviAdminActif = creerSuivi({ utilisateurId: adminActif.id });
      await repository.sauvegarder(suiviAdminActif);
      await repository.sauvegarder(
        creerSuivi({ utilisateurId: adminDesactive.id }),
      );
      await repository.sauvegarder(creerSuivi({ utilisateurId: pilotage.id }));

      // When
      const result = await repository.recupererDesComptesActifsParProfil(
        ProfilEnum.DITP_ADMIN,
      );

      // Then
      expect(result).toEqual([suiviAdminActif]);
    }),
  );
});
