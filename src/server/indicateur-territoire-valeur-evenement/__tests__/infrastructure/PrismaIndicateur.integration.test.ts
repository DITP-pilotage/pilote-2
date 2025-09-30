import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/PrismaIndicateurRepository";

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
    it("Doit supprimer le taux d'avancement de la proposition au niveau mandat et pour tous les jalons", async () => {
      // Given

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
          taux_avancement_mandat_proposition_v2: 10,
        },
      });

      await prisma.indicateur_territoire_jalon.create({
        data: {
          id: "IND-001",
          maille: "REG",
          territoire_code: "REG-01",
          code_insee: "01",
          zone_id: "R01",
          jalon: 2024,
          taux_avancement_proposition_v2: 20,
        },
      });

      await prisma.indicateur_territoire_jalon.create({
        data: {
          id: "IND-001",
          maille: "REG",
          territoire_code: "REG-01",
          code_insee: "01",
          zone_id: "R01",
          jalon: 2025,
          taux_avancement_proposition_v2: 15,
        },
      });

      // When
      await prismaIndicateurRepository.supprimerTauxAvancementProposition({
        indicId: "IND-001",
        territoireCode: "REG-01",
      });

      // Then
      const indicateurTerritoire = await prisma.indicateur_territoire.findFirst(
        {
          where: {
            id: "IND-001",
            territoire_code: "REG-01",
          },
        },
      );

      const indicateursTerritoireJalon =
        await prisma.indicateur_territoire_jalon.findMany({
          where: {
            id: "IND-001",
            territoire_code: "REG-01",
          },
        });

      expect(
        indicateurTerritoire?.taux_avancement_mandat_proposition_v2,
      ).toBeNull();
      expect(indicateursTerritoireJalon).toHaveLength(2);
      expect(
        indicateursTerritoireJalon[0].taux_avancement_proposition_v2,
      ).toBeNull();
      expect(
        indicateursTerritoireJalon[1].taux_avancement_proposition_v2,
      ).toBeNull();
    });
  });

  describe("#getDerniereDateValeurAvancement", () => {
    it("Doit retourner null quand il n'y a pas de ligne pour l'indicateur et le territoire", async () => {
      // When
      const result =
        await prismaIndicateurRepository.getDerniereDateValeurAvancement(
          "IND-999",
          "REG-99",
        );

      // Then
      expect(result).toBeNull();
    });

    it("Doit retourner la date la plus récente quand il y a plusieurs lignes", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: "CH-002",
          nom: "Chantier Test 2",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-002",
          territoire_code: "REG-02",
          maille: "REG",
          code_insee: "02",
          zone_id: "R02",
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
            id: "IND-002",
            maille: "REG",
            territoire_code: "REG-02",
            code_insee: "02",
            zone_id: "R02",
            jalon: 2024,
            date_valeur_actuelle: dateAncienne,
          },
          {
            id: "IND-002",
            maille: "REG",
            territoire_code: "REG-02",
            code_insee: "02",
            zone_id: "R02",
            jalon: 2025,
            date_valeur_actuelle: dateRecente,
          },
          {
            id: "IND-002",
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
        await prismaIndicateurRepository.getDerniereDateValeurAvancement(
          "IND-002",
          "REG-02",
        );

      // Then
      expect(result).toEqual(dateRecente);
    });
  });
});
