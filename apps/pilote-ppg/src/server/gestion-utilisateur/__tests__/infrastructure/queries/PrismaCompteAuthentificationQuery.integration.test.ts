import { PrismaCompteAuthentificationQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaCompteAuthentificationQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

describe("PrismaCompteAuthentificationQuery", () => {
  let query: PrismaCompteAuthentificationQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new PrismaCompteAuthentificationQuery({ prisma: prismaPilote });
  });

  it(
    "retourne actif et le profil quand le compte n'a pas de date de désactivation",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.actif@exemple.gouv.fr",
        date_desactivation: null,
        profilCode: ProfilEnum.DITP_ADMIN,
      });

      const compte = await query.recuperer({
        email: "agent.actif@exemple.gouv.fr",
      });

      expect(compte).toEqual({
        statut: "actif",
        profilCode: ProfilEnum.DITP_ADMIN,
      });
    }),
  );

  it(
    "retourne desactive quand le compte porte une date de désactivation",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.desactive@exemple.gouv.fr",
        date_desactivation: new Date("2026-01-15"),
        profilCode: ProfilEnum.EQUIPE_DIR_PROJET,
      });

      const compte = await query.recuperer({
        email: "agent.desactive@exemple.gouv.fr",
      });

      expect(compte).toEqual({
        statut: "desactive",
        profilCode: ProfilEnum.EQUIPE_DIR_PROJET,
      });
    }),
  );

  it(
    "retourne inconnu et aucun profil quand aucun compte ne porte cet email",
    createIntegrationTest(async () => {
      const compte = await query.recuperer({
        email: "personne@exemple.gouv.fr",
      });

      expect(compte).toEqual({ statut: "inconnu", profilCode: null });
    }),
  );

  it(
    "normalise la casse et les espaces autour de l'email",
    createIntegrationTest(async () => {
      await fixtures.utilisateur({
        email: "agent.casse@exemple.gouv.fr",
        profilCode: ProfilEnum.DITP_ADMIN,
      });

      const compte = await query.recuperer({
        email: "  Agent.Casse@Exemple.Gouv.FR  ",
      });

      expect(compte).toEqual({
        statut: "actif",
        profilCode: ProfilEnum.DITP_ADMIN,
      });
    }),
  );
});
