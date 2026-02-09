import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaIndicateurTerritoireValeurEvenementRepository", () => {
  let prismaIndicateurTerritoireValeurEvenementRepository: PrismaIndicateurTerritoireValeurEvenementRepository;
  let prisma: ReturnType<PrismaPilote["getInstance"]>;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();

    prismaIndicateurTerritoireValeurEvenementRepository =
      new PrismaIndicateurTerritoireValeurEvenementRepository({
        prisma: prismaPilote,
      });
  });

  describe("#enregistrer", () => {
    it("Doit enregistrer un événement indicateur territoire valeur", async () => {
      // Given
      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test",
          prenom: "Prénom Test",
          email: "test@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Chantier Test 1",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-001",
          territoire_code: "REG-01",
          maille: "REG",
          code_insee: "01",
          zone_id: "R01",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-001",
          nom: "Indicateur Test 1",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-001",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-001",
          chantier_id: "CH-001",
          maille: "REG",
          territoire_code: "REG-01",
          code_insee: "01",
          zone_id: "R01",
        },
      });

      const evenement =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-001",
            territoireCode: "REG-01",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-01-15"),
            valeur: 75.5,
            idAuteurModification: userId,
            correlationId: "550e8400-e29b-41d4-a716-446655440001",
            ordre: 1,
            dateCreation: new Date("2024-01-15"),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      // When
      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrer(
        evenement,
      );

      // Then
      const evenements =
        await prisma.indicateur_territoire_valeur_evenement.findMany();

      expect(evenements).toHaveLength(1);
      expect(evenements[0].indic_id).toBe("IND-001");
      expect(evenements[0].territoire_code).toBe("REG-01");
      expect(evenements[0].type_evenement).toBe("PROPOSITION_VALEUR_CREEE");
      expect(evenements[0].type_valeur).toBe("VALEUR_AVANCEMENT");
      expect(evenements[0].valeur).toBe(75.5);
      expect(evenements[0].id_auteur_modification).toBe(userId);
      expect(evenements[0].correlation_id).toBe(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      expect(evenements[0].ordre).toBe(1);
      expect(evenements[0].donnees_complementaires).toEqual({
        motif: "Motif de la proposition",
        source_donnee_methode_calcul:
          "Source de la donnée et méthode de calcul",
      });
    });
  });
  describe("#enregistrerTous", () => {
    it("Doit enregistrer plusieurs événements avec enregistrerTous", async () => {
      // Given
      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d480";
      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test 2",
          prenom: "Prénom Test 2",
          email: "test2@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-002",
          nom: "Chantier Test 2",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-002",
          territoire_code: "DEPT-75",
          maille: "DEPT",
          code_insee: "75",
          zone_id: "D75",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-002",
          nom: "Indicateur Test 2",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-002",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-002",
          chantier_id: "CH-002",
          maille: "DEPT",
          territoire_code: "DEPT-75",
          code_insee: "75",
          zone_id: "D75",
        },
      });

      const evenement1 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-002",
            territoireCode: "DEPT-75",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-02-01"),
            valeur: 50,
            idAuteurModification: userId,
            correlationId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date("2024-02-01"),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement2 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-002",
            territoireCode: "DEPT-75",
            typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-02-01"),
            valeur: 60,
            idAuteurModification: userId,
            correlationId: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
            ordre: 2,
            dateCreation: new Date("2024-02-01"),
            donneesComplementaires: {
              motif: "Motif de la modification",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      // When
      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenement1, evenement2],
      );

      // Then
      const evenements =
        await prisma.indicateur_territoire_valeur_evenement.findMany({
          orderBy: { ordre: "asc" },
        });
      expect(evenements).toHaveLength(2);
      expect(evenements[0].ordre).toBe(1);
      expect(evenements[0].type_evenement).toBe("PROPOSITION_VALEUR_CREEE");
      expect(evenements[1].ordre).toBe(2);
      expect(evenements[1].type_evenement).toBe("PROPOSITION_VALEUR_MODIFIEE");
    });
  });

  describe("#recupererParIndicIdTerritoireCodeEtTypeValeur", () => {
    it("Doit récupérer les événements par indicId, territoireCode et typeValeur", async () => {
      // Given
      const userId1 = "f47ac10b-58cc-4372-a567-0e02b2c3d481";
      const userId2 = "f47ac10b-58cc-4372-a567-0e02b2c3d482";
      const userId3 = "f47ac10b-58cc-4372-a567-0e02b2c3d483";

      await prisma.utilisateur.create({
        data: {
          id: userId1,
          nom: "Nom Test 3",
          prenom: "Prénom Test 3",
          email: "test3@example.com",
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
          id: userId2,
          nom: "Nom Test 4",
          prenom: "Prénom Test 4",
          email: "test4@example.com",
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
          id: userId3,
          nom: "Nom Test 5",
          prenom: "Prénom Test 5",
          email: "test5@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-003",
          nom: "Chantier Test 3",
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-004",
          nom: "Chantier Test 4",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-003",
          territoire_code: "REG-02",
          maille: "REG",
          code_insee: "02",
          zone_id: "R02",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-004",
          territoire_code: "REG-02",
          maille: "REG",
          code_insee: "02",
          zone_id: "R02",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-003",
          nom: "Indicateur Test 3",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-003",
            },
          },
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-004",
          nom: "Indicateur Test 4",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-004",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-003",
          chantier_id: "CH-003",
          maille: "REG",
          territoire_code: "REG-02",
          code_insee: "02",
          zone_id: "R02",
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-004",
          chantier_id: "CH-004",
          maille: "REG",
          territoire_code: "REG-02",
          code_insee: "02",
          zone_id: "R02",
        },
      });

      const evenement1 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-003",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-03-01"),
            valeur: 30,
            idAuteurModification: userId1,
            correlationId: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date("2024-03-01"),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement2 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-003",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
            typeValeur: "VALEUR_CIBLE",
            dateValeur: new Date("2024-03-02"),
            valeur: 80,
            idAuteurModification: userId2,
            correlationId: "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date("2024-03-02"),
            donneesComplementaires: {
              motif: "Motif de la modification",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement3 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-004",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-03-03"),
            valeur: 40,
            idAuteurModification: userId3,
            correlationId: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date("2024-03-02"),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenement1, evenement2, evenement3],
      );

      // When
      const evenements =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur(
          {
            indicId: "IND-003",
            territoireCode: "REG-02",
            typeValeur: "VALEUR_AVANCEMENT",
          },
        );

      // Then
      expect(evenements).toHaveLength(1);
      expect(evenements[0].indicId).toBe("IND-003");
      expect(evenements[0].territoireCode).toBe("REG-02");
      expect(evenements[0].typeValeur).toBe("VALEUR_AVANCEMENT");
      expect(evenements[0].valeur).toBe(30);
    });

    it("Doit récupérer les événements par indicId, territoireCode, typeValeur et date", async () => {
      // Given
      const date1 = new Date("2024-04-01");
      const date2 = new Date("2024-04-02");

      const userId1 = "f47ac10b-58cc-4372-a567-0e02b2c3d484";
      const userId2 = "f47ac10b-58cc-4372-a567-0e02b2c3d485";
      const userId3 = "f47ac10b-58cc-4372-a567-0e02b2c3d486";

      await prisma.utilisateur.create({
        data: {
          id: userId1,
          nom: "Nom Test 6",
          prenom: "Prénom Test 6",
          email: "test6@example.com",
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
          id: userId2,
          nom: "Nom Test 7",
          prenom: "Prénom Test 7",
          email: "test7@example.com",
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
          id: userId3,
          nom: "Nom Test 8",
          prenom: "Prénom Test 8",
          email: "test8@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-005",
          nom: "Chantier Test 5",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-005",
          territoire_code: "REG-02",
          maille: "REG",
          code_insee: "02",
          zone_id: "R02",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-005",
          nom: "Indicateur Test 5",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-005",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-005",
          chantier_id: "CH-005",
          maille: "REG",
          territoire_code: "REG-02",
          code_insee: "02",
          zone_id: "R02",
        },
      });

      const evenement1 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-005",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date1,
            valeur: 20,
            idAuteurModification: userId1,
            correlationId: "6ba7b815-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement2 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-005",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date2,
            valeur: 25,
            idAuteurModification: userId2,
            correlationId: "6ba7b816-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif de la modification",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement3 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-005",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date1,
            valeur: 22,
            idAuteurModification: userId3,
            correlationId: "6ba7b817-9dad-11d1-80b4-00c04fd430c8",
            ordre: 2,
            dateCreation: new Date(),
            donneesComplementaires: { motif: "Motif d'acceptation" },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenement1, evenement2, evenement3],
      );

      // When
      const evenementsSurDate =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
          {
            indicId: "IND-005",
            territoireCode: "REG-02",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date1,
          },
        );

      // Then
      expect(evenementsSurDate.evenementsSurDate).toHaveLength(2);
      expect(evenementsSurDate.evenementsSurDate[0].dateValeur).toEqual(date1);
      expect(evenementsSurDate.evenementsSurDate[1].dateValeur).toEqual(date1);
      // Vérifier que les événements sont triés par ordre décroissant
      expect(evenementsSurDate.evenementsSurDate[0].ordre).toBe(2);
      expect(evenementsSurDate.evenementsSurDate[1].ordre).toBe(1);
    });

    it("Doit retourner un tableau vide quand aucun événement ne correspond aux critères", async () => {
      // Given
      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d487";
      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test 9",
          prenom: "Prénom Test 9",
          email: "test9@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-006",
          nom: "Chantier Test 6",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-006",
          territoire_code: "REG-03",
          maille: "REG",
          code_insee: "03",
          zone_id: "R03",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-006",
          nom: "Indicateur Test 6",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-006",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-006",
          chantier_id: "CH-006",
          maille: "REG",
          territoire_code: "REG-03",
          code_insee: "03",
          zone_id: "R03",
        },
      });

      const evenement =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-006",
            territoireCode: "REG-03",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_CIBLE",
            dateValeur: new Date("2024-05-01"),
            valeur: 100,
            idAuteurModification: userId,
            correlationId: "6ba7b818-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date("2024-05-01"),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrer(
        evenement,
      );

      // When
      const evenementsSurDate =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
          {
            indicId: "IND-006",
            territoireCode: "REG-03",
            typeValeur: "VALEUR_AVANCEMENT", // Type différent
            dateValeur: new Date("2024-05-01"),
          },
        );

      // Then
      expect(evenementsSurDate.evenementsSurDate).toHaveLength(0);
    });

    it("Doit trier les événements par date décroissante puis par ordre décroissant", async () => {
      // Given
      const date1 = new Date("2024-06-01");
      const date2 = new Date("2024-06-02");

      const userId1 = "f47ac10b-58cc-4372-a567-0e02b2c3d488";
      const userId2 = "f47ac10b-58cc-4372-a567-0e02b2c3d489";
      const userId3 = "f47ac10b-58cc-4372-a567-0e02b2c3d490";

      await prisma.utilisateur.create({
        data: {
          id: userId1,
          nom: "Nom Test 10",
          prenom: "Prénom Test 10",
          email: "test10@example.com",
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
          id: userId2,
          nom: "Nom Test 11",
          prenom: "Prénom Test 11",
          email: "test11@example.com",
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
          id: userId3,
          nom: "Nom Test 12",
          prenom: "Prénom Test 12",
          email: "test12@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-007",
          nom: "Chantier Test 7",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-007",
          territoire_code: "DEPT-69",
          maille: "DEPT",
          code_insee: "69",
          zone_id: "D69",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-007",
          nom: "Indicateur Test 7",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-007",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-007",
          chantier_id: "CH-007",
          maille: "DEPT",
          territoire_code: "DEPT-69",
          code_insee: "69",
          zone_id: "D69",
        },
      });

      const evenement1 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-007",
            territoireCode: "DEPT-69",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date1,
            valeur: 10,
            idAuteurModification: userId1,
            correlationId: "6ba7b819-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement2 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-007",
            territoireCode: "DEPT-69",
            typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date2,
            valeur: 15,
            idAuteurModification: userId2,
            correlationId: "6ba7b81a-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif de la modification",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement3 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-007",
            territoireCode: "DEPT-69",
            typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date1,
            valeur: 12,
            idAuteurModification: userId3,
            correlationId: "6ba7b81b-9dad-11d1-80b4-00c04fd430c8",
            ordre: 2,
            dateCreation: new Date(),
            donneesComplementaires: { motif: "Motif de l'acceptation" },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenement1, evenement2, evenement3],
      );

      // When
      const evenements =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur(
          {
            indicId: "IND-007",
            territoireCode: "DEPT-69",
            typeValeur: "VALEUR_AVANCEMENT",
          },
        );

      // Then
      expect(evenements).toHaveLength(3);
      // Premier : date la plus récente (date2)
      expect(evenements[0].dateValeur).toEqual(date2);
      expect(evenements[0].ordre).toBe(1);
      // Deuxième : date1 avec ordre le plus élevé
      expect(evenements[1].dateValeur).toEqual(date1);
      expect(evenements[1].ordre).toBe(2);
      // Troisième : date1 avec ordre plus faible
      expect(evenements[2].dateValeur).toEqual(date1);
      expect(evenements[2].ordre).toBe(1);
    });
  });

  describe("#recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA", () => {
    it("Doit récupérer tous les événements avec une date supérieure à la date donnée, groupés par date", async () => {
      // Given
      const dateRef = new Date("2024-08-15");

      const userId1 = "f47ac10b-58cc-4372-a567-0e02b2c3d500";
      const userId2 = "f47ac10b-58cc-4372-a567-0e02b2c3d501";
      const userId3 = "f47ac10b-58cc-4372-a567-0e02b2c3d502";
      const userId4 = "f47ac10b-58cc-4372-a567-0e02b2c3d503";

      // Créer les utilisateurs
      await prisma.utilisateur.create({
        data: {
          id: userId1,
          nom: "Nom Test 20",
          prenom: "Prénom Test 20",
          email: "test20@example.com",
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
          id: userId2,
          nom: "Nom Test 21",
          prenom: "Prénom Test 21",
          email: "test21@example.com",
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
          id: userId3,
          nom: "Nom Test 22",
          prenom: "Prénom Test 22",
          email: "test22@example.com",
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
          id: userId4,
          nom: "Nom Test 23",
          prenom: "Prénom Test 23",
          email: "test23@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-010",
          nom: "Chantier Test 10",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-010",
          territoire_code: "REG-01",
          maille: "REG",
          code_insee: "10",
          zone_id: "R10",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-010",
          nom: "Indicateur Test 10",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-010",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-010",
          chantier_id: "CH-010",
          maille: "REG",
          territoire_code: "REG-01",
          code_insee: "10",
          zone_id: "R10",
        },
      });

      // Créer les événements
      const evenement1 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-010",
            territoireCode: "REG-01",
            typeEvenement: "VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            valeur: 10,
            donneesComplementaires: undefined,
            idAuteurModification: userId1,
            correlationId: "30161e9c-ca29-4e32-b503-0cc3c45f777e",
            ordre: 1,
            dateValeur: new Date("2024-08-10"), // Antérieure
            dateCreation: new Date("2024-12-01"),
          },
        );

      const evenement2 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-010",
            territoireCode: "REG-01",
            typeEvenement: "VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            ordre: 1,
            dateValeur: new Date("2024-08-16"), // Supérieure
            dateCreation: new Date("2024-12-01"),
            valeur: 20,
            donneesComplementaires: undefined,
            idAuteurModification: userId2,
            correlationId: "fe4e702c-91fe-4818-a7cb-79c4abdfa2e7",
          },
        );

      const evenement3 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-010",
            territoireCode: "REG-01",
            typeEvenement: "VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-08-20"), // Supérieure - même date que evenement4
            dateCreation: new Date("2024-12-01"),
            valeur: 30,
            ordre: 1,
            donneesComplementaires: undefined,
            idAuteurModification: userId3,
            correlationId: "f2eaaade-fcbe-4a3a-bf38-1c6c38c1bdc2",
          },
        );

      const evenement4 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-010",
            typeEvenement: "VALEUR_CREEE",
            territoireCode: "REG-01",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-08-20"), // Même date que evenement3
            dateCreation: new Date("2024-12-01"),
            ordre: 1,
            valeur: 40,
            donneesComplementaires: undefined,
            idAuteurModification: userId4,
            correlationId: "1e1b28c5-59b9-454d-804e-c7938bd510be",
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenement1, evenement2, evenement3, evenement4],
      );

      // When
      const evenementsSurDates =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA(
          {
            indicId: "IND-010",
            territoireCode: "REG-01",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: dateRef,
          },
        );

      // Then
      expect(evenementsSurDates).toHaveLength(2); // 2 dates distinctes supérieures à dateRef

      // Vérifier le tri par date décroissante
      expect(evenementsSurDates[0].identifiantFlux.date).toBe("2024-08-20"); // Date la plus récente
      expect(evenementsSurDates[1].identifiantFlux.date).toBe("2024-08-16");

      // Vérifier le groupement pour la date 2024-08-20 (2 événements)
      expect(evenementsSurDates[0].evenementsSurDate).toHaveLength(2);
      expect(evenementsSurDates[0].evenementsSurDate[0].valeur).toBe(30);
      expect(evenementsSurDates[0].evenementsSurDate[1].valeur).toBe(40);

      // Vérifier le groupement pour la date 2024-08-16 (1 événement)
      expect(evenementsSurDates[1].evenementsSurDate).toHaveLength(1);
      expect(evenementsSurDates[1].evenementsSurDate[0].valeur).toBe(20);
    });

    it("Doit retourner un tableau vide quand aucun événement n'a une date supérieure", async () => {
      // Given
      const dateRef = new Date("2024-12-31"); // Date très récente
      const dateAnterieure = new Date("2024-01-01");

      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d504";

      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test 24",
          prenom: "Prénom Test 24",
          email: "test24@example.com",
          profilCode: "DITP_ADMIN",
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-011",
          nom: "Chantier Test 11",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-011",
          territoire_code: "REG-01",
          maille: "REG",
          code_insee: "01",
          zone_id: "R01",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-011",
          nom: "Indicateur Test 11",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-011",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-011",
          chantier_id: "CH-011",
          maille: "REG",
          territoire_code: "REG-01",
          code_insee: "01",
          zone_id: "R01",
        },
      });

      const evenement =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-011",
            territoireCode: "REG-01",
            typeEvenement: "VALEUR_CREEE",
            dateCreation: new Date("2024-12-01"),
            ordre: 1,
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: dateAnterieure,
            valeur: 50,
            donneesComplementaires: undefined,
            idAuteurModification: userId,
            correlationId: "cd6c4113-8233-4601-a7f2-6f1e16727545",
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrer(
        evenement,
      );

      // When
      const evenementsSurDates =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA(
          {
            indicId: "IND-011",
            territoireCode: "REG-01",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: dateRef,
          },
        );

      // Then
      expect(evenementsSurDates).toHaveLength(0);
    });
  });

  describe("#recupererHistoriqueParIndicIdEtTerritoireCode", () => {
    it("Doit récupérer l'historique complet des événements par indicId et territoireCode", async () => {
      // Given
      const date1 = new Date("2024-07-01");
      const date2 = new Date("2024-07-02");
      const date3 = new Date("2024-07-03");

      const userId1 = "f47ac10b-58cc-4372-a567-0e02b2c3d491";
      const userId2 = "f47ac10b-58cc-4372-a567-0e02b2c3d492";
      const userId3 = "f47ac10b-58cc-4372-a567-0e02b2c3d493";

      await prisma.utilisateur.create({
        data: {
          id: userId1,
          nom: "Nom Test 13",
          prenom: "Prénom Test 13",
          email: "test13@example.com",
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
          id: userId2,
          nom: "Nom Test 14",
          prenom: "Prénom Test 14",
          email: "test14@example.com",
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
          id: userId3,
          nom: "Nom Test 15",
          prenom: "Prénom Test 15",
          email: "test15@example.com",
          profil: {
            connect: {
              code: "DITP_ADMIN",
            },
          },
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-008",
          nom: "Chantier Test 8",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-008",
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FR",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-008",
          nom: "Indicateur Test 8",
          est_barometre: false,
          est_phare: false,
          chantier_identite: {
            connect: {
              id: "CH-008",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-008",
          chantier_id: "CH-008",
          maille: "NAT",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          zone_id: "FR",
        },
      });

      const evenement1 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-008",
            territoireCode: "NAT-FR",
            typeEvenement: "VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date1,
            valeur: 10,
            idAuteurModification: userId1,
            correlationId: "6ba7b81c-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: undefined,
          },
        );

      const evenement2 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-008",
            territoireCode: "NAT-FR",
            typeEvenement: "VALEUR_MODIFIEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date1,
            valeur: 15,
            idAuteurModification: userId2,
            correlationId: "6ba7b81d-9dad-11d1-80b4-00c04fd430c8",
            ordre: 2,
            dateCreation: new Date(),
            donneesComplementaires: undefined,
          },
        );

      const evenement3 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-008",
            territoireCode: "NAT-FR",
            typeEvenement: "VALEUR_CREEE",
            typeValeur: "VALEUR_CIBLE",
            dateValeur: date2,
            valeur: 100,
            idAuteurModification: userId3,
            correlationId: "6ba7b81e-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: undefined,
          },
        );

      const evenement4 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-008",
            territoireCode: "NAT-FR",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date3,
            valeur: 20,
            idAuteurModification: userId1,
            correlationId: "6ba7b81f-9dad-11d1-80b4-00c04fd430c8",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      const evenement5 =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-008",
            territoireCode: "NAT-FR",
            typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: date3,
            valeur: 25,
            idAuteurModification: userId2,
            correlationId: "6ba7b820-9dad-11d1-80b4-00c04fd430c8",
            ordre: 2,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif de la modification",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenement1, evenement2, evenement3, evenement4, evenement5],
      );

      // When
      const evenements =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode(
          {
            indicId: "IND-008",
            territoireCode: "NAT-FR",
          },
        );

      // Then
      expect(evenements).toHaveLength(5);

      // Vérifier le tri par date décroissante puis ordre décroissant
      expect(evenements[0].dateValeur).toEqual(date3);
      expect(evenements[0].ordre).toBe(2); // evenement5
      expect(evenements[1].dateValeur).toEqual(date3);
      expect(evenements[1].ordre).toBe(1); // evenement4
      expect(evenements[2].dateValeur).toEqual(date2);
      expect(evenements[2].ordre).toBe(1); // evenement3
      expect(evenements[3].dateValeur).toEqual(date1);
      expect(evenements[3].ordre).toBe(2); // evenement2
      expect(evenements[4].dateValeur).toEqual(date1);
      expect(evenements[4].ordre).toBe(1); // evenement1
    });

    it("Doit retourner un tableau vide pour l'historique quand aucun événement ne correspond", async () => {
      // When
      const evenements =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode(
          {
            indicId: "IND-INEXISTANT",
            territoireCode: "INEXISTANT",
          },
        );

      // Then
      expect(evenements).toHaveLength(0);
    });
  });

  describe("#recupererLesPropositionsEnCoursParChantierIds", () => {
    it("Doit récupérer les propositions en cours groupées par chantier et indicateur", async () => {
      // Given
      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d600";
      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test PVA",
          prenom: "Prénom Test PVA",
          email: "testpva@example.com",
          profilCode: "DITP_ADMIN",
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-PVA-001",
          nom: "Chantier PVA Test 1",
          statut: "PUBLIE",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-PVA-001",
          territoire_code: "REG-01",
          maille: "REG",
          code_insee: "01",
          zone_id: "R01",
          est_applicable: true,
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-PVA-001",
          nom: "Indicateur PVA Test 1",
          unite_mesure: "%",
          est_barometre: false,
          est_phare: false,
          statut: "PUBLIE",
          chantier_identite: {
            connect: {
              id: "CH-PVA-001",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-PVA-001",
          chantier_id: "CH-PVA-001",
          maille: "REG",
          territoire_code: "REG-01",
          code_insee: "01",
          zone_id: "R01",
          valeur_actuelle_mandat: 50.5,
          date_valeur_actuelle_mandat: new Date("2024-06-01"),
          est_applicable: true,
        },
      });

      const evenementProposition =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-001",
            territoireCode: "REG-01",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-07-01"),
            valeur: 75,
            idAuteurModification: userId,
            correlationId: "cdc411d4-9c0e-41f5-93c3-70d7f5044c6c",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul: "Source de la donnée",
            },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrer(
        evenementProposition,
      );

      // When
      const result =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

      // Then
      expect(result.size).toBe(1);
      expect(result.has("CH-PVA-001")).toBe(true);

      const indicateurMap = result.get("CH-PVA-001")!;
      expect(indicateurMap.size).toBe(1);
      expect(indicateurMap.has("IND-PVA-001")).toBe(true);

      const rapports = indicateurMap.get("IND-PVA-001")!;
      expect(rapports).toEqual([
        {
          indicateurId: "IND-PVA-001",
          territoireCode: "REG-01",
          valeurAvancementProposee: "75",
          dateValeurAvancement: "01/06/2024",
          valeurAvancementReference: "50.5",
          nomIndicateur: "Indicateur PVA Test 1",
          uniteIndicateur: "%",
          nomTerritoire: "Guadeloupe",
        },
      ]);
    });

    it("Doit filtrer les propositions selon leur statut pour ne garder que les propositions en cours", async () => {
      // Given
      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d601";
      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test PVA 2",
          prenom: "Prénom Test PVA 2",
          email: "testpva2@example.com",
          profilCode: "DITP_ADMIN",
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-PVA-002",
          nom: "Chantier PVA Test 2",
          statut: "PUBLIE",
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-PVA-002",
            territoire_code: "REG-02",
            maille: "REG",
            code_insee: "02",
            zone_id: "R02",
          },
          {
            id: "CH-PVA-002",
            territoire_code: "REG-03",
            maille: "REG",
            code_insee: "03",
            zone_id: "R03",
          },
        ],
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-PVA-002",
          nom: "Indicateur PVA Test 2",
          unite_mesure: "unité",
          est_barometre: false,
          est_phare: false,
          statut: "PUBLIE",
          chantier_identite: {
            connect: {
              id: "CH-PVA-002",
            },
          },
        },
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-PVA-002",
            chantier_id: "CH-PVA-002",
            maille: "REG",
            territoire_code: "REG-02",
            code_insee: "02",
            zone_id: "R02",
            valeur_actuelle_mandat: 100,
            date_valeur_actuelle_mandat: new Date("2024-07-01"),
            est_applicable: true,
          },
          {
            id: "IND-PVA-002",
            chantier_id: "CH-PVA-002",
            maille: "REG",
            territoire_code: "REG-03",
            code_insee: "03",
            zone_id: "R03",
            valeur_actuelle_mandat: 200,
            date_valeur_actuelle_mandat: new Date("2024-07-01"),
            est_applicable: true,
          },
        ],
      });

      const evenementCree =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-002",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-07-01"),
            valeur: 150,
            idAuteurModification: userId,
            correlationId: "cdc411d4-9c0e-41f5-93c3-70d7f5044c6c",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif",
              sourceDonneeEtMethodeCalcul: "Source",
            },
          },
        );

      const evenementAcceptee =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-002",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-07-01"),
            valeur: 200,
            idAuteurModification: userId,
            correlationId: "33040663-78f3-4236-b39b-be0565f051f7",
            ordre: 2,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif acceptation",
            },
          },
        );

      const evenementRefusee =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-002",
            territoireCode: "REG-03",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-07-01"),
            valeur: 250,
            idAuteurModification: userId,
            correlationId: "d2e6bbac-20c9-441a-ab4f-af325e4c4859",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif",
              sourceDonneeEtMethodeCalcul: "Source",
            },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenementCree, evenementAcceptee, evenementRefusee],
      );

      // When
      const result =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

      // Then
      const indicateurMap = result.get("CH-PVA-002")!;
      const rapports = indicateurMap.get("IND-PVA-002")!;
      expect(rapports).toEqual([
        {
          indicateurId: "IND-PVA-002",
          territoireCode: "REG-03",
          valeurAvancementProposee: "250",
          dateValeurAvancement: "01/07/2024",
          valeurAvancementReference: "200",
          nomIndicateur: "Indicateur PVA Test 2",
          uniteIndicateur: "unité",
          nomTerritoire: "Guyane",
        },
      ]);
    });

    it("Doit ne garder que le dernier événement par triplet (indicId, territoireCode, dateValeur)", async () => {
      // Given
      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d602";
      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test PVA 3",
          prenom: "Prénom Test PVA 3",
          email: "testpva3@example.com",
          profilCode: "DITP_ADMIN",
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-PVA-003",
          nom: "Chantier PVA Test 3",
          statut: "PUBLIE",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-PVA-003",
          territoire_code: "REG-03",
          maille: "REG",
          code_insee: "03",
          zone_id: "R03",
        },
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-PVA-003",
          nom: "Indicateur PVA Test 3",
          est_barometre: false,
          est_phare: false,
          statut: "PUBLIE",
          chantier_identite: {
            connect: {
              id: "CH-PVA-003",
            },
          },
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-PVA-003",
          chantier_id: "CH-PVA-003",
          maille: "REG",
          territoire_code: "REG-03",
          code_insee: "03",
          zone_id: "R03",
          valeur_actuelle_mandat: 30,
          date_valeur_actuelle_mandat: new Date("2024-01-01"),
          est_applicable: true,
        },
      });

      const dateValeur = new Date("2024-07-01");
      const evenementCree =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-003",
            territoireCode: "REG-03",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur,
            valeur: 10,
            idAuteurModification: userId,
            correlationId: "d2e6bbac-20c9-441a-ab4f-af325e4c4859",
            ordre: 1,
            dateCreation: new Date("2024-07-01T10:00:00"),
            donneesComplementaires: {
              motif: "Motif création",
              sourceDonneeEtMethodeCalcul: "Source",
            },
          },
        );

      const evenementModifiee =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-003",
            territoireCode: "REG-03",
            typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur,
            valeur: 15,
            idAuteurModification: userId,
            correlationId: "d2e6bbac-20c9-441a-ab4f-af325e4c4859",
            ordre: 2,
            dateCreation: new Date("2024-07-01T11:00:00"),
            donneesComplementaires: {
              motif: "Motif modification",
              sourceDonneeEtMethodeCalcul: "Source",
            },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenementCree, evenementModifiee],
      );

      // When
      const result =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

      // Then
      const indicateurMap = result.get("CH-PVA-003")!;
      const rapports = indicateurMap.get("IND-PVA-003")!;
      expect(rapports).toEqual([
        {
          indicateurId: "IND-PVA-003",
          territoireCode: "REG-03",
          valeurAvancementProposee: "15",
          dateValeurAvancement: "01/01/2024",
          valeurAvancementReference: "30",
          nomIndicateur: "Indicateur PVA Test 3",
          uniteIndicateur: "",
          nomTerritoire: "Guyane",
        },
      ]);
    });

    it("Doit exclure les propositions dont l'indicateur ou le chantier n'est pas publié", async () => {
      // Given
      const userId = "f47ac10b-58cc-4372-a567-0e02b2c3d604";
      await prisma.utilisateur.create({
        data: {
          id: userId,
          nom: "Nom Test PVA 5",
          prenom: "Prénom Test PVA 5",
          email: "testpva5@example.com",
          profilCode: "DITP_ADMIN",
          date_creation: new Date(),
        },
      });

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-PVA-005",
            nom: "Chantier PVA Test 5 (Brouillon)",
            statut: "BROUILLON",
          },
          {
            id: "CH-PVA-006",
            nom: "Chantier PVA Test 6 (Publié)",
            statut: "PUBLIE",
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-PVA-005",
            territoire_code: "REG-01",
            maille: "REG",
            code_insee: "01",
            zone_id: "R01",
          },
          {
            id: "CH-PVA-006",
            territoire_code: "REG-02",
            maille: "REG",
            code_insee: "02",
            zone_id: "R02",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-PVA-005",
            chantier_id: "CH-PVA-005",
            nom: "Indicateur PVA Test 5 (Chantier Brouillon)",
            est_barometre: false,
            est_phare: false,
            statut: "PUBLIE",
          },
          {
            id: "IND-PVA-006",
            chantier_id: "CH-PVA-006",
            nom: "Indicateur PVA Test 6 (Indicateur Brouillon)",
            est_barometre: false,
            est_phare: false,
            statut: "SUPPRIME",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-PVA-005",
            chantier_id: "CH-PVA-005",
            maille: "REG",
            territoire_code: "REG-01",
            code_insee: "01",
            zone_id: "R01",
            valeur_actuelle_mandat: 50,
            date_valeur_actuelle_mandat: new Date("2024-01-01"),
            est_applicable: true,
          },
          {
            id: "IND-PVA-006",
            chantier_id: "CH-PVA-006",
            maille: "REG",
            territoire_code: "REG-02",
            code_insee: "02",
            zone_id: "R02",
            valeur_actuelle_mandat: 60,
            date_valeur_actuelle_mandat: new Date("2024-01-01"),
            est_applicable: true,
          },
        ],
      });

      const evenementChantierBrouillon =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-005",
            territoireCode: "REG-01",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-07-01"),
            valeur: 75,
            idAuteurModification: userId,
            correlationId: "d2e6bbac-20c9-441a-ab4f-af325e4c4859",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif",
              sourceDonneeEtMethodeCalcul: "Source",
            },
          },
        );

      const evenementIndicateurBrouillon =
        IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
          {
            indicId: "IND-PVA-006",
            territoireCode: "REG-02",
            typeEvenement: "PROPOSITION_VALEUR_CREEE",
            typeValeur: "VALEUR_AVANCEMENT",
            dateValeur: new Date("2024-07-01"),
            valeur: 85,
            idAuteurModification: userId,
            correlationId: "d2e6bbac-20c9-441a-ab4f-af325e4c4859",
            ordre: 1,
            dateCreation: new Date(),
            donneesComplementaires: {
              motif: "Motif",
              sourceDonneeEtMethodeCalcul: "Source",
            },
          },
        );

      await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous(
        [evenementChantierBrouillon, evenementIndicateurBrouillon],
      );

      // When
      const result =
        await prismaIndicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds();

      // Then
      expect(result.size).toBe(0);
    });
  });
});
