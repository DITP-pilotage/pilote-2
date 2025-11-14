import { PrismaUtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaUtilisateurRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaUtilisateurRepository", () => {
  let prismaUtilisateurRepository: PrismaUtilisateurRepository;
  let prisma: ReturnType<PrismaPilote["getInstance"]>;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();

    prismaUtilisateurRepository = new PrismaUtilisateurRepository({
      prisma: prismaPilote,
    });
  });

  describe("#recupererUtilisateurParProfilEtTerritoire", () => {
    it("doit retourner uniquement les emails des utilisateurs actifs avec le bon profil et le territoire en lecture", async () => {
      // Given
      const utilisateurActif1Id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const utilisateurActif2Id = "a47ac10b-58cc-4372-a567-0e02b2c3d480";
      const utilisateurDesactiveId = "b47ac10b-58cc-4372-a567-0e02b2c3d481";
      const utilisateurMauvaisProfilId = "c47ac10b-58cc-4372-a567-0e02b2c3d482";
      const utilisateurSansTerritoireId =
        "d47ac10b-58cc-4372-a567-0e02b2c3d483";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurActif1Id,
          nom: "Utilisateur Actif 1",
          prenom: "Test",
          email: "actif1@example.com",
          profil: {
            connect: {
              code: "COORDINATEUR_REGION",
            },
          },
          date_creation: new Date(),
          habilitation: {
            create: {
              scope: {
                connect: {
                  code: "lecture",
                },
              },
              territoires: ["REG-01"],
              perimetres: [],
              chantiers: [],
            },
          },
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurActif2Id,
          nom: "Utilisateur Actif 2",
          prenom: "Test",
          email: "actif2@example.com",
          profil: {
            connect: {
              code: "COORDINATEUR_REGION",
            },
          },
          date_creation: new Date(),
          habilitation: {
            create: {
              scope: {
                connect: {
                  code: "lecture",
                },
              },
              territoires: ["REG-01", "REG-02"],
              perimetres: [],
              chantiers: [],
            },
          },
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurDesactiveId,
          nom: "Utilisateur Désactivé",
          prenom: "Test",
          email: "desactive@example.com",
          profil: {
            connect: {
              code: "COORDINATEUR_REGION",
            },
          },
          date_creation: new Date(),
          date_desactivation: new Date(),
          habilitation: {
            create: {
              scope: {
                connect: {
                  code: "lecture",
                },
              },
              territoires: ["REG-01"],
              perimetres: [],
              chantiers: [],
            },
          },
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurMauvaisProfilId,
          nom: "Utilisateur Mauvais Profil",
          prenom: "Test",
          email: "mauvais-profil@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
          habilitation: {
            create: {
              scope: {
                connect: {
                  code: "lecture",
                },
              },
              territoires: ["REG-01"],
              perimetres: [],
              chantiers: [],
            },
          },
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurSansTerritoireId,
          nom: "Utilisateur Sans Territoire",
          prenom: "Test",
          email: "sans-territoire@example.com",
          profil: {
            connect: {
              code: "COORDINATEUR_REGION",
            },
          },
          date_creation: new Date(),
          habilitation: {
            create: {
              scope: {
                connect: {
                  code: "lecture",
                },
              },
              territoires: ["REG-02"],
              perimetres: [],
              chantiers: [],
            },
          },
        },
      });

      // When
      const result =
        await prismaUtilisateurRepository.recupererUtilisateurParProfilEtTerritoire(
          {
            profil: "COORDINATEUR_REGION",
            territoireCode: "REG-01",
          },
        );

      // Then
      expect(result).toEqual(["actif1@example.com", "actif2@example.com"]);
    });
  });

  describe("#recupererEmailsParUtilisateurIds", () => {
    it("doit retourner uniquement les emails des utilisateurs actifs correspondant aux IDs fournis", async () => {
      // Given
      const utilisateurActif1Id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      const utilisateurActif2Id = "a47ac10b-58cc-4372-a567-0e02b2c3d480";
      const utilisateurDesactiveId = "b47ac10b-58cc-4372-a567-0e02b2c3d481";
      const utilisateurNonDemande = "c47ac10b-58cc-4372-a567-0e02b2c3d482";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurActif1Id,
          nom: "Utilisateur Actif 1",
          prenom: "Test",
          email: "actif1@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurActif2Id,
          nom: "Utilisateur Actif 2",
          prenom: "Test",
          email: "actif2@example.com",
          profil: {
            connect: {
              code: "COORDINATEUR_REGION",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurDesactiveId,
          nom: "Utilisateur Désactivé",
          prenom: "Test",
          email: "desactive@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
          date_desactivation: new Date(),
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurNonDemande,
          nom: "Utilisateur Non Demandé",
          prenom: "Test",
          email: "non-demande@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      // When
      const result =
        await prismaUtilisateurRepository.recupererEmailsParUtilisateurIds([
          utilisateurActif1Id,
          utilisateurActif2Id,
          utilisateurDesactiveId,
          utilisateurActif1Id,
        ]);

      // Then
      expect(result).toEqual(["actif1@example.com", "actif2@example.com"]);
    });
  });
});
