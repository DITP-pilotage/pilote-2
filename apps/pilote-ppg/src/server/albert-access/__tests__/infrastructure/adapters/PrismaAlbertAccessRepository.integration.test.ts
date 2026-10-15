import { PrismaAlbertAccessRepository } from "@/server/albert-access/infrastructure/adapters/PrismaAlbertAccessRepository";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PilotePrismaClient } from "@/server/framework/persistence/PrismaTransaction";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";

const COORDINATEUR_ID = "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0";
const PREFET_ID = "d1e776ad-af24-4320-bef9-7367d0373cad";
const ADMIN_ID = "eb735d0d-8249-496c-9c54-a2d502405950";
const DESACTIVE_ID = "dce03af2-e6c6-4f9c-8162-6afb98de6318";

describe("PrismaAlbertAccessRepository", () => {
  let repository: PrismaAlbertAccessRepository;
  let prisma: PilotePrismaClient;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();
    repository = new PrismaAlbertAccessRepository({ prisma: prismaPilote });
  });

  const creerUtilisateurs = () =>
    prisma.utilisateur.createMany({
      data: [
        {
          id: COORDINATEUR_ID,
          email: "jean.dupont@test.com",
          nom: "Dupont",
          prenom: "Jean",
          profilCode: ProfilEnum.COORDINATEUR_REGION,
          date_creation: new Date(),
        },
        {
          id: PREFET_ID,
          email: "jeanne.martin@test.com",
          nom: "Martin",
          prenom: "Jeanne",
          profilCode: ProfilEnum.PREFET_REGION,
          date_creation: new Date(),
        },
        {
          id: ADMIN_ID,
          email: "jean.admin@test.com",
          nom: "Admin",
          prenom: "Jean",
          profilCode: ProfilEnum.DITP_ADMIN,
          date_creation: new Date(),
        },
        {
          id: DESACTIVE_ID,
          email: "jean.desactive@test.com",
          nom: "Desactive",
          prenom: "Jean",
          profilCode: ProfilEnum.PREFET_REGION,
          date_creation: new Date(),
          date_desactivation: new Date(),
        },
      ],
    });

  describe("profils", () => {
    it(
      "Doit lister les profils sans DITP_ADMIN, inactifs par défaut",
      createIntegrationTest(async () => {
        const profils = await repository.listProfils();

        expect(profils.map((p) => p.code)).not.toContain(ProfilEnum.DITP_ADMIN);
        expect(profils.map((p) => p.code)).toEqual(
          expect.arrayContaining([
            ProfilEnum.COORDINATEUR_REGION,
            ProfilEnum.COORDINATEUR_DEPARTEMENT,
          ]),
        );
        expect(profils.every((p) => !p.active)).toBe(true);
      }),
    );

    it(
      "Doit activer puis désactiver un profil",
      createIntegrationTest(async () => {
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);

        let profils = await repository.listProfils();
        expect(
          profils.find((p) => p.code === ProfilEnum.COORDINATEUR_REGION)
            ?.active,
        ).toBe(true);

        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, false);

        profils = await repository.listProfils();
        expect(
          profils.find((p) => p.code === ProfilEnum.COORDINATEUR_REGION)
            ?.active,
        ).toBe(false);
      }),
    );
  });

  describe("utilisateurs", () => {
    it(
      "Doit ajouter un utilisateur de façon idempotente et le lister",
      createIntegrationTest(async () => {
        await creerUtilisateurs();

        await repository.addUtilisateur(PREFET_ID);
        await repository.addUtilisateur(PREFET_ID);

        const utilisateurs = await repository.listUtilisateurs();
        expect(utilisateurs).toEqual([
          {
            utilisateurId: PREFET_ID,
            email: "jeanne.martin@test.com",
            nom: "Martin",
            prenom: "Jeanne",
            profilCode: ProfilEnum.PREFET_REGION,
            profilNom: expect.any(String),
            autoriseViaProfil: false,
          },
        ]);
      }),
    );

    it(
      "Doit signaler un utilisateur déjà autorisé via son profil",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(COORDINATEUR_ID);
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);

        const utilisateurs = await repository.listUtilisateurs();

        expect(utilisateurs).toEqual([
          expect.objectContaining({
            utilisateurId: COORDINATEUR_ID,
            autoriseViaProfil: true,
          }),
        ]);
      }),
    );

    it(
      "Doit retirer un utilisateur",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(PREFET_ID);

        await repository.removeUtilisateur(PREFET_ID);

        expect(await repository.listUtilisateurs()).toEqual([]);
      }),
    );

    it(
      "Doit supprimer l'accès en cascade quand l'utilisateur est supprimé",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(PREFET_ID);

        await prisma.utilisateur.delete({ where: { id: PREFET_ID } });

        expect(await prisma.albert_access_utilisateur.count()).toBe(0);
      }),
    );

    it(
      "Doit retrouver le profil d'un utilisateur, null s'il est inconnu",
      createIntegrationTest(async () => {
        await creerUtilisateurs();

        expect(await repository.findUtilisateurProfil(ADMIN_ID)).toBe(
          ProfilEnum.DITP_ADMIN,
        );
        expect(
          await repository.findUtilisateurProfil(
            "00000000-0000-0000-0000-000000000000",
          ),
        ).toBeNull();
      }),
    );
  });

  describe("searchUtilisateurs", () => {
    it(
      "Doit chercher sans tenir compte de la casse, sans DITP_ADMIN ni utilisateur désactivé",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.addUtilisateur(PREFET_ID);
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);

        const resultats = await repository.searchUtilisateurs("JEAN", 10);

        expect(
          resultats.map(({ email, dejaAjoute, autoriseViaProfil }) => ({
            email,
            dejaAjoute,
            autoriseViaProfil,
          })),
        ).toEqual([
          {
            email: "jean.dupont@test.com",
            dejaAjoute: false,
            autoriseViaProfil: true,
          },
          {
            email: "jeanne.martin@test.com",
            dejaAjoute: true,
            autoriseViaProfil: false,
          },
        ]);
      }),
    );

    it(
      "Doit limiter le nombre de résultats",
      createIntegrationTest(async () => {
        await creerUtilisateurs();

        expect(await repository.searchUtilisateurs("jean", 1)).toHaveLength(1);
      }),
    );
  });

  describe("getAccessFlags", () => {
    it(
      "Doit indiquer profil activé et autorisation individuelle",
      createIntegrationTest(async () => {
        await creerUtilisateurs();
        await repository.setProfilActive(ProfilEnum.COORDINATEUR_REGION, true);
        await repository.addUtilisateur(PREFET_ID);

        expect(
          await repository.getAccessFlags(
            COORDINATEUR_ID,
            ProfilEnum.COORDINATEUR_REGION,
          ),
        ).toEqual({ profilActive: true, utilisateurAutorise: false });
        expect(
          await repository.getAccessFlags(PREFET_ID, ProfilEnum.PREFET_REGION),
        ).toEqual({ profilActive: false, utilisateurAutorise: true });
        expect(await repository.getAccessFlags(PREFET_ID, null)).toEqual({
          profilActive: false,
          utilisateurAutorise: true,
        });
      }),
    );
  });
});
