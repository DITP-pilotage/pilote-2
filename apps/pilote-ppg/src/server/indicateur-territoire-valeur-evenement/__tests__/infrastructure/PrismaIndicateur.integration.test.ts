import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurRepository";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("PrismaIndicateurRepository", () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;
  let prisma: ReturnType<PrismaPilote["getInstance"]>;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();

    prismaIndicateurRepository = new PrismaIndicateurRepository({
      prisma: prismaPilote,
    });
  });

  describe("#supprimerTauxAvancementProposition", () => {
    it(
      "Doit supprimer le taux d'avancement de la proposition au niveau mandat et pour tous les jalons",
      createIntegrationTest(async () => {
        // Given

        const chantier = await fixtures.chantierIdentite({
          nom: "Chantier Test 1",
        });

        await prisma.chantier_territoire.create({
          data: {
            id: chantier.id,
            territoire_code: "REG-01",
            maille: "REG",
            code_insee: "01",
            zone_id: "R01",
          },
        });

        const indicateur001 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur Test 1",
          type_id: "IMPACT",
          est_barometre: false,
          est_phare: false,
        });

        await prisma.indicateur_territoire.create({
          data: {
            id: indicateur001.id,
            chantier_id: chantier.id,
            maille: "REG",
            territoire_code: "REG-01",
            code_insee: "01",
            zone_id: "R01",
            taux_avancement_mandat_proposition: 10,
          },
        });

        await prisma.indicateur_territoire_jalon.create({
          data: {
            id: indicateur001.id,
            maille: "REG",
            territoire_code: "REG-01",
            code_insee: "01",
            zone_id: "R01",
            jalon: 2024,
            taux_avancement_proposition: 20,
          },
        });

        await prisma.indicateur_territoire_jalon.create({
          data: {
            id: indicateur001.id,
            maille: "REG",
            territoire_code: "REG-01",
            code_insee: "01",
            zone_id: "R01",
            jalon: 2025,
            taux_avancement_proposition: 15,
          },
        });

        // When
        await prismaIndicateurRepository.supprimerTauxAvancementProposition({
          indicId: indicateur001.id,
          territoireCode: "REG-01",
        });

        // Then
        const indicateurTerritoire =
          await prisma.indicateur_territoire.findFirst({
            where: {
              id: indicateur001.id,
              territoire_code: "REG-01",
            },
          });

        const indicateursTerritoireJalon =
          await prisma.indicateur_territoire_jalon.findMany({
            where: {
              id: indicateur001.id,
              territoire_code: "REG-01",
            },
          });

        expect(
          indicateurTerritoire?.taux_avancement_mandat_proposition,
        ).toBeNull();
        expect(indicateursTerritoireJalon).toHaveLength(2);
        expect(
          indicateursTerritoireJalon[0].taux_avancement_proposition,
        ).toBeNull();
        expect(
          indicateursTerritoireJalon[1].taux_avancement_proposition,
        ).toBeNull();
      }),
    );
  });

  describe("#getDerniereDateValeurAvancement", () => {
    it(
      "Doit retourner null quand il n'y a pas de ligne pour l'indicateur et le territoire",
      createIntegrationTest(async () => {
        // When
        const result =
          await prismaIndicateurRepository.getDateEffectiveValeurAvancement({
            indicId: "IND-999",
            territoireCode: "REG-99",
          });

        // Then
        expect(result).toBeNull();
      }),
    );

    it(
      "Doit retourner la date la plus récente quand il y a plusieurs lignes",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          nom: "Chantier Test 2",
        });

        await prisma.chantier_territoire.create({
          data: {
            id: chantier.id,
            territoire_code: "REG-02",
            maille: "REG",
            code_insee: "02",
            zone_id: "R02",
          },
        });

        const indicateur002 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur Test 2",
          type_id: "IMPACT",
          est_barometre: false,
          est_phare: false,
        });

        await prisma.indicateur_territoire.create({
          data: {
            id: indicateur002.id,
            chantier_id: chantier.id,
            maille: "REG",
            territoire_code: "REG-02",
            code_insee: "02",
            zone_id: "R02",
          },
        });

        const dateAncienne = new Date("2024-01-15");
        const dateMilieu = new Date("2024-06-15");
        const dateRecente = new Date("2024-12-15");

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: indicateur002.id,
              maille: "REG",
              territoire_code: "REG-02",
              code_insee: "02",
              zone_id: "R02",
              jalon: 2024,
              date_valeur_actuelle: dateAncienne,
            },
            {
              id: indicateur002.id,
              maille: "REG",
              territoire_code: "REG-02",
              code_insee: "02",
              zone_id: "R02",
              jalon: 2025,
              date_valeur_actuelle: dateRecente,
            },
            {
              id: indicateur002.id,
              maille: "REG",
              territoire_code: "REG-02",
              code_insee: "02",
              zone_id: "R02",
              jalon: 2026,
              date_valeur_actuelle: dateMilieu,
            },
          ],
        });

        // When
        const result =
          await prismaIndicateurRepository.getDateEffectiveValeurAvancement({
            indicId: indicateur002.id,
            territoireCode: "REG-02",
          });

        // Then
        expect(result).toEqual(dateRecente);
      }),
    );
  });

  describe("#recupererInformationIndicateur", () => {
    it(
      "Doit retourner null quand l'indicateur n'existe pas",
      createIntegrationTest(async () => {
        // When
        const result =
          await prismaIndicateurRepository.recupererInformationIndicateur(
            "IND-999",
          );

        // Then
        expect(result).toBeNull();
      }),
    );

    it(
      "Doit retourner le nom de l'indicateur, l'id du chantier et le nom du chantier",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          nom: "Chantier Test 3",
        });

        const indicateur003 = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
          nom: "Indicateur Test 3",
          type_id: "IMPACT",
          est_barometre: false,
          est_phare: false,
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererInformationIndicateur(
            indicateur003.id,
          );

        // Then
        expect(result).toEqual({
          nom: "Indicateur Test 3",
          chantierId: chantier.id,
          chantierNom: "Chantier Test 3",
        });
      }),
    );
  });
});
