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
  });

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
        },
      );

    // When
    await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous([
      evenement1,
      evenement2,
    ]);

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
        },
      );

    await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous([
      evenement1,
      evenement2,
      evenement3,
    ]);

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
        },
      );

    await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous([
      evenement1,
      evenement2,
      evenement3,
    ]);

    // When
    const evenements =
      await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId: "IND-005",
          territoireCode: "REG-02",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date1,
        },
      );

    // Then
    expect(evenements).toHaveLength(2);
    expect(evenements[0].dateValeur).toEqual(date1);
    expect(evenements[1].dateValeur).toEqual(date1);
    // Vérifier que les événements sont triés par ordre décroissant
    expect(evenements[0].ordre).toBe(2);
    expect(evenements[1].ordre).toBe(1);
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
        },
      );

    await prismaIndicateurTerritoireValeurEvenementRepository.enregistrer(
      evenement,
    );

    // When
    const evenements =
      await prismaIndicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId: "IND-006",
          territoireCode: "REG-03",
          typeValeur: "VALEUR_AVANCEMENT", // Type différent
          dateValeur: new Date("2024-05-01"),
        },
      );

    // Then
    expect(evenements).toHaveLength(0);
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
        },
      );

    await prismaIndicateurTerritoireValeurEvenementRepository.enregistrerTous([
      evenement1,
      evenement2,
      evenement3,
    ]);

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
