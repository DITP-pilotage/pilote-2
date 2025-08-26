import { chantier_territoire_jalon } from "@prisma/client";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { prisma } from "@/server/db/prisma";
import { Utilisateur } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";

describe("PrismaChantierRepository", () => {
  let prismaChantierRepository: PrismaChantierRepository;

  beforeEach(() => {
    prismaChantierRepository = new PrismaChantierRepository();
  });

  describe("#recupererLesEntreesDUnChantier", () => {
    test("Quand on le chantier demandé n'existe pas, doit remonter une erreur en cas de chantier non trouvé", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Chantier 001",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-001",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          territoire_code: "NAT-FR",
        },
      });

      const habilitation = {
        lecture: {
          chantiers: ["CH-001", "CH-002"],
          territoires: ["NAT-FR"],
        },
      } as unknown as Utilisateur["habilitations"];

      const profil = ProfilEnum.DITP_ADMIN;

      // When
      const request = async () => {
        await prismaChantierRepository.recupererLesEntreesDUnChantier(
          "CH-002",
          habilitation,
          profil,
          2024,
        );
      };

      // Then
      await expect(request).rejects.toThrow(/chantier 'CH-002' non trouvé/);
    });

    test("quand on est un profil territorial, doit renvoyer la liste des chantiers sans la maille nationale", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Chantier 001",
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
          },
          {
            id: "CH-001",
            code_insee: "87",
            maille: "DEPT",
            zone_id: "D87",
            territoire_code: "DEPT-87",
          },
          {
            id: "CH-001",
            code_insee: "87",
            maille: "DEPT",
            zone_id: "D87",
            territoire_code: "DEPT-88",
          },
        ],
      });

      const habilitation = {
        lecture: {
          chantiers: ["CH-001", "CH-002"],
          territoires: ["DEPT-87"],
        },
      } as unknown as Utilisateur["habilitations"];

      const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

      // When
      const listeChantier =
        await prismaChantierRepository.recupererLesEntreesDUnChantier(
          "CH-001",
          habilitation,
          profil,
          2024,
        );

      // Then
      expect(listeChantier.nom).toEqual("Chantier 001");
      expect(
        listeChantier.chantier_territoire.map(
          (chantierTerritoire) => chantierTerritoire.territoire_code,
        ),
      ).toContainEqual("DEPT-87");
    });

    test("quand on n'est pas un profil territorial, doit renvoyer la liste des chantiers avec la maille nationale", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Chantier 001",
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: "CH-002",
          nom: "Chantier 002",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-002",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          territoire_code: "NAT-FR",
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-001",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          territoire_code: "NAT-FR",
        },
      });
      await prisma.chantier_territoire.create({
        data: {
          id: "CH-001",
          code_insee: "87",
          maille: "DEPT",
          zone_id: "D87",
          territoire_code: "DEPT-87",
          chantier_territoire_jalon: {
            createMany: {
              data: [
                {
                  code_insee: "87",
                  maille: "DEPT",
                  zone_id: "D87",
                  jalon: 2024,
                  taux_avancement: 10,
                },
                {
                  code_insee: "87",
                  maille: "DEPT",
                  zone_id: "D87",
                  jalon: 2025,
                  taux_avancement: 12,
                },
              ],
            },
          },
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: "CH-001",
          code_insee: "88",
          maille: "DEPT",
          zone_id: "D88",
          territoire_code: "DEPT-88",
          chantier_territoire_jalon: {
            createMany: {
              data: [
                {
                  code_insee: "88",
                  maille: "DEPT",
                  zone_id: "D88",
                  jalon: 2024,
                  taux_avancement: 10,
                },
                {
                  code_insee: "88",
                  maille: "DEPT",
                  zone_id: "D88",
                  jalon: 2025,
                  taux_avancement: 12,
                },
              ],
            },
          },
        },
      });

      const habilitation = {
        lecture: {
          chantiers: ["CH-001", "CH-002"],
          territoires: ["DEPT-87"],
        },
      } as unknown as Utilisateur["habilitations"];

      const profil = ProfilEnum.DITP_ADMIN;

      // When
      const listeChantier =
        await prismaChantierRepository.recupererLesEntreesDUnChantier(
          "CH-001",
          habilitation,
          profil,
          2024,
        );

      // Then
      expect(listeChantier.nom).toEqual("Chantier 001");
      expect(listeChantier.chantier_territoire).toHaveLength(2);
      expect(
        listeChantier.chantier_territoire.map(
          (chantierTerritoire) => chantierTerritoire.territoire_code,
        ),
      ).toIncludeAllMembers(["NAT-FR", "DEPT-87"]);
      expect(
        listeChantier.chantier_territoire.find(
          (chantierTerritoire) =>
            chantierTerritoire.territoire_code === "DEPT-87",
        )?.chantier_territoire_jalon,
      ).toIncludeAllPartialMembers<Partial<chantier_territoire_jalon>>([
        {
          taux_avancement: 10,
        },
      ]);
    });
  });

  describe("#recupererPourExports", () => {
    it("aUnTauxAvancementDepartemental est vrai, si le chantier ne possède aucun département applicable", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: null,
            est_applicable: false,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: false,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            taux_avancement_mandat: 10,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnTauxAvancementDepartemental).toBeTrue();
    });
    it("aUnTauxAvancementDepartemental est vrai, si le chantier possède au moins un département avec un taux d'avancement non null", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: 30,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnTauxAvancementDepartemental).toBeTrue();
    });
    it("aUnTauxAvancementDepartemental est faux, si le chantier ne possède aucun département avec un taux d'avancement non null", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: null,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            taux_avancement_mandat: 10,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnTauxAvancementDepartemental).toBeFalse();
    });
    it("aUnePropositionsValeurAvancement est faux au niveau national, si le chantier ne possède aucune proposition sur aucun territoire", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeFalse();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau national, si le chantier possède au moins une proposition sur un territoire", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur la région", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["REG-84"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur un département enfant", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["REG-84"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est faux au niveau regional, si le chantier ne possède aucune proposition sur la région ou sur un département enfant", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["REG-84"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeFalse();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau departemental, si le chantier possède une proposition sur le département", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["DEPT-01"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est faux au niveau departemental, si le chantier ne possède pas de proposition sur le département", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExports(
        "CH-001",
        ["DEPT-01"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeFalse();
    });
  });

  describe("#recupererPourExportsV2", () => {
    it("aUnTauxAvancementDepartemental est vrai, si le chantier ne possède aucun département applicable", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: null,
            est_applicable: false,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: false,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            taux_avancement_mandat: 10,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnTauxAvancementDepartemental).toBeTrue();
    });
    it("aUnTauxAvancementDepartemental est vrai, si le chantier possède au moins un département avec un taux d'avancement non null", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: 30,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnTauxAvancementDepartemental).toBeTrue();
    });
    it("aUnTauxAvancementDepartemental est faux, si le chantier ne possède aucun département avec un taux d'avancement non null", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: null,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            taux_avancement_mandat: 10,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnTauxAvancementDepartemental).toBeFalse();
    });
    it("aUnePropositionsValeurAvancement est faux au niveau national, si le chantier ne possède aucune proposition sur aucun territoire", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeFalse();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau national, si le chantier possède au moins une proposition sur un territoire", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle_v2: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["NAT-FR"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur la région", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle_v2: 1,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["REG-84"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur un département enfant", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle_v2: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["REG-84"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est faux au niveau regional, si le chantier ne possède aucune proposition sur la région ou sur un département enfant", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle_v2: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["REG-84"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeFalse();
    });
    it("aUnePropositionsValeurAvancement est vrai au niveau departemental, si le chantier possède une proposition sur le département", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle_v2: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["DEPT-01"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeTrue();
    });
    it("aUnePropositionsValeurAvancement est faux au niveau departemental, si le chantier ne possède pas de proposition sur le département", async () => {
      // Given
      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle_v2: 1,
            est_applicable: true,
          },
          {
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle_v2: 0,
            est_applicable: true,
          },
        ],
      });

      // When
      const result = await prismaChantierRepository.recupererPourExportsV2(
        "CH-001",
        ["DEPT-01"],
        optionsPourExport,
        2025,
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result![0].aUnePropositionsValeurAvancement).toBeFalse();
    });
  });

  describe("#récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions", () => {
    it("quand on a l'option estBarometre et territorialisation à ['regionale', 'departementale'], doit remonter les chantiers ids contenant soit les chantiers du barometre soit territorialisé", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            est_barometre: true,
            est_territorialise: true,
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            est_barometre: true,
            est_territorialise: false,
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            est_barometre: false,
            est_territorialise: true,
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            est_barometre: false,
            est_territorialise: false,
          },
        ],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      // When
      const result =
        await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
          ["CH-001", "CH-002", "CH-003", "CH-004"],
          optionsPourExport,
        );

      // Then
      expect(result).toEqual(["CH-001"]);
    });

    it("quand on a l'option estBarometre est a false et estTerritorialise à false, doit remonter les chantiers ids contenant les chantiers du barometre", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            est_barometre: true,
            est_territorialise: true,
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            est_barometre: true,
            est_territorialise: false,
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            est_barometre: false,
            est_territorialise: true,
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            est_barometre: false,
            est_territorialise: false,
          },
        ],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        territorialisation: [],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      // When
      const result =
        await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
          ["CH-001", "CH-002", "CH-003", "CH-004"],
          optionsPourExport,
        );

      // Then
      expect(result).toEqual(["CH-001", "CH-002"]);
    });

    it("quand on a l'option estBarometre est a false et territorialisation à ['regionale', 'departementale'], doit remonter les chantiers ids contenant les chantiers territorialise", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            est_barometre: true,
            est_territorialise: true,
            mailles_applicables: ["REG", "DEPT"],
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            est_barometre: true,
            est_territorialise: false,
            mailles_applicables: ["NAT"],
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            est_barometre: false,
            est_territorialise: true,
            mailles_applicables: ["REG", "DEPT"],
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            est_barometre: false,
            est_territorialise: false,
            mailles_applicables: ["NAT"],
          },
        ],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        territorialisation: ["regionale", "departementale"],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      // When
      const result =
        await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
          ["CH-001", "CH-002", "CH-003", "CH-004"],
          optionsPourExport,
        );

      // Then
      expect(result).toEqual(["CH-001", "CH-003"]);
    });

    it("quand on a l'option listeStatuts est définie, doit remonter les chantiers ids des chantiers avec les statuts demandés", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            est_barometre: true,
            est_territorialise: true,
            statut: "PUBLIE",
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            est_barometre: true,
            est_territorialise: false,
            statut: "PUBLIE",
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            est_barometre: false,
            est_territorialise: true,
            statut: "BROUILLON",
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            est_barometre: false,
            est_territorialise: false,
            statut: "ARCHIVE",
          },
          {
            id: "CH-005",
            nom: "Chantier 005",
            est_barometre: false,
            est_territorialise: false,
            statut: "SUPPRIME",
          },
        ],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        territorialisation: [],
        perimetreIds: [],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: ["PUBLIE", "BROUILLON"],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      // When
      const result =
        await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
          ["CH-001", "CH-002", "CH-003", "CH-004", "CH-005"],
          optionsPourExport,
        );

      // Then
      expect(result).toEqual(["CH-001", "CH-002", "CH-003"]);
    });

    it("quand on a l'option perimetreIds est définie, doit remonter les chantiers ids des chantiers avec les périmètres demandés", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            est_barometre: true,
            est_territorialise: true,
            statut: "PUBLIE",
            perimetre_ids: ["PER-01", "PER-02"],
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            est_barometre: true,
            est_territorialise: false,
            statut: "PUBLIE",
            perimetre_ids: ["PER-01"],
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            est_barometre: false,
            est_territorialise: true,
            statut: "BROUILLON",
            perimetre_ids: ["PER-02"],
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            est_barometre: false,
            est_territorialise: false,
            statut: "ARCHIVE",
            perimetre_ids: ["PER-03"],
          },
          {
            id: "CH-005",
            nom: "Chantier 005",
            est_barometre: false,
            est_territorialise: false,
            statut: "SUPPRIME",
            perimetre_ids: ["PER-01", "PER-03"],
          },
        ],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        territorialisation: [],
        perimetreIds: ["PER-01", "PER-02"],
        listeChantierId: [],
        listeMeteos: [],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      // When
      const result =
        await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
          ["CH-001", "CH-002", "CH-003", "CH-004", "CH-005"],
          optionsPourExport,
        );

      // Then
      expect(result).toEqual(["CH-001", "CH-002", "CH-003", "CH-005"]);
    });

    it("quand on a l'option listeChantierId est définie, doit remonter les chantiers ids des chantiers avec les ids de chantier demandés", async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            est_barometre: true,
            est_territorialise: true,
            statut: "PUBLIE",
            perimetre_ids: ["PER-01", "PER-02"],
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            est_barometre: true,
            est_territorialise: false,
            statut: "PUBLIE",
            perimetre_ids: ["PER-01"],
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            est_barometre: false,
            est_territorialise: true,
            statut: "BROUILLON",
            perimetre_ids: ["PER-02"],
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            est_barometre: false,
            est_territorialise: false,
            statut: "ARCHIVE",
            perimetre_ids: ["PER-03"],
          },
          {
            id: "CH-005",
            nom: "Chantier 005",
            est_barometre: false,
            est_territorialise: false,
            statut: "SUPPRIME",
            perimetre_ids: ["PER-01", "PER-03"],
          },
        ],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        territorialisation: [],
        perimetreIds: [],
        listeChantierId: ["CH-002", "CH-003", "CH-005"],
        listeMeteos: ["CH-002", "CH-003", "CH-005"],
        listeStatuts: [],
        listeOptionsExport: [],
        territoireCode: undefined,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteBaisse: false,
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteMétéoNonRenseignée: false,
        estEnAlertePossedePropositionsValeurAvancement: false,
      };

      // When
      const result =
        await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(
          ["CH-001", "CH-002", "CH-003", "CH-004", "CH-005"],
          optionsPourExport,
        );

      // Then
      expect(result).toEqual(["CH-002", "CH-003", "CH-005"]);
    });
  });

  describe("#récupérerLesEntréesDeTousLesChantiersHabilitésNew", () => {
    it("quand on est profil territoriale et que les filtres sont laissés par défault, doit remonter les chantiers demandés", async () => {
      // Given
      const chantiersLectureIds = ["CH-001", "CH-002", "CH-004"];
      const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

      const filtres: FiltreQueryParams = {
        perimetres: [],
        axes: [],
        statut: [],
        meteos: [],
        territorialisation: [],
        estBarometre: false,
        valeurDeLaRecherche: "",
      };

      const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: false,
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            est_applicable: true,
            taux_avancement_mandat: 5,
          },
          {
            id: "CH-001",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "SOLEIL",
            territoire_code: "DEPT-88",
            est_applicable: true,
            taux_avancement_mandat: 2,
          },
          {
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            est_applicable: true,
            taux_avancement_mandat: 10,
          },
          {
            id: "CH-003",
            zone_id: "FRANCE",
            maille: "NAT",
            code_insee: "FR",
            meteo: "COUVERT",
            territoire_code: "NAT-FR",
            est_applicable: true,
            taux_avancement_mandat: 15,
          },
          {
            id: "CH-004",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "NON_RENSEIGNEE",
            territoire_code: "DEPT-87",
            est_applicable: true,
            taux_avancement_mandat: 20,
          },
        ],
      });
      const jalon = 2024;

      // When
      const result =
        await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
          chantiersLectureIds,
          territoiresLectureIds,
          profil,
          filtres,
          "DEPT-87",
          jalon,
        );

      // Then
      expect(result).toMatchObject([
        {
          nom: "Chantier 001",
          chantier_territoire: [
            { territoire_code: "DEPT-87", taux_avancement_mandat: 5 },
            { territoire_code: "DEPT-88", taux_avancement_mandat: 2 },
          ],
        },
        {
          nom: "Chantier 002",
          chantier_territoire: [
            { territoire_code: "DEPT-88", taux_avancement_mandat: 10 },
          ],
        },
        {
          nom: "Chantier 004",
          chantier_territoire: [
            { territoire_code: "DEPT-87", taux_avancement_mandat: 20 },
          ],
        },
      ]);
      expect(result).not.toMatchObject([
        {
          territoire_code: "NAT-FR",
          taux_avancement_mandat: 20,
          chantier_identite: { id: "CH-003" },
        },
      ]);
    });

    it("quand on n'est pas un profil territoriale et que les filtres sont laissés par défault, doit remonter les chantiers demandés avec la maille nationale en plus", async () => {
      // Given
      const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
      const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

      const filtres: FiltreQueryParams = {
        perimetres: [],
        axes: [],
        statut: [],
        meteos: [],
        territorialisation: [],
        estBarometre: false,
        valeurDeLaRecherche: "",
      };

      const profil = ProfilEnum.DITP_ADMIN;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
          },
          {
            id: "CH-004",
            nom: "Chantier 004",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: false,
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          },
          {
            id: "CH-003",
            zone_id: "FRANCE",
            maille: "NAT",
            code_insee: "FR",
            meteo: "COUVERT",
            territoire_code: "NAT-FR",
            taux_avancement_mandat: 4,
            est_applicable: true,
          },
          {
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          },
          {
            id: "CH-004",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "NON_RENSEIGNEE",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 5,
            est_applicable: true,
          },
        ],
      });

      const jalon = 2024;

      // When
      const result =
        await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
          chantiersLectureIds,
          territoiresLectureIds,
          profil,
          filtres,
          "DEPT-87",
          jalon,
        );

      // Then
      expect(result).toMatchObject([
        {
          nom: "Chantier 001",
          chantier_territoire: [
            { territoire_code: "DEPT-87", taux_avancement_mandat: 2 },
          ],
        },
        {
          nom: "Chantier 002",
          chantier_territoire: [
            { territoire_code: "DEPT-88", taux_avancement_mandat: 3 },
          ],
        },
        {
          nom: "Chantier 003",
          chantier_territoire: [
            { territoire_code: "NAT-FR", taux_avancement_mandat: 4 },
          ],
        },
        {
          nom: "Chantier 004",
          chantier_territoire: [
            { territoire_code: "DEPT-87", taux_avancement_mandat: 5 },
          ],
        },
      ]);
    });

    describe("filtres", () => {
      it("quand on est profil territoriale et que le filtres perimetres est defini, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: ["PER-01", "PER-02"],
          axes: [],
          meteos: [],
          statut: [],
          territorialisation: [],
          estBarometre: false,
          valeurDeLaRecherche: "",
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: true,
              perimetre_ids: ["PER-01", "PER-02"],
            },
            {
              id: "CH-002",
              nom: "Chantier 002",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: false,
              perimetre_ids: ["PER-03", "PER-04"],
            },
            {
              id: "CH-003",
              nom: "Chantier 003",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: true,
              perimetre_ids: ["PER-01", "PER-03"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
          ],
        });
        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier 001",
            chantier_territoire: [
              { territoire_code: "DEPT-87", taux_avancement_mandat: 2 },
            ],
          },
          {
            nom: "Chantier 003",
            chantier_territoire: [
              { territoire_code: "REG-01", taux_avancement_mandat: 4 },
            ],
          },
        ]);
      });

      it("quand on est profil territoriale et que le filtres statut est defini, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          meteos: [],
          statut: ["PUBLIE", "BROUILLON"],
          territorialisation: [],
          estBarometre: false,
          valeurDeLaRecherche: "",
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: true,
              statut: "PUBLIE",
            },
            {
              id: "CH-002",
              nom: "Chantier 002",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: false,
              statut: "BROUILLON",
            },
            {
              id: "CH-003",
              nom: "Chantier 003",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: true,
              statut: "ARCHIVE",
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier 001",
            chantier_territoire: [
              { territoire_code: "DEPT-87", taux_avancement_mandat: 2 },
            ],
          },
          {
            nom: "Chantier 002",
            chantier_territoire: [
              { territoire_code: "DEPT-88", taux_avancement_mandat: 3 },
            ],
          },
        ]);
      });

      it("quand on est profil territoriale et que le filtres meteos est defini, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          meteos: ["SOLEIL"],
          statut: [],
          territorialisation: [],
          estBarometre: false,
          valeurDeLaRecherche: "",
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
            {
              id: "CH-002",
              nom: "Chantier 002",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
            {
              id: "CH-003",
              nom: "Chantier 003",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "COUVERT",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier 001",
            chantier_territoire: [
              { territoire_code: "DEPT-87", taux_avancement_mandat: 2 },
            ],
          },
        ]);
      });

      it("quand on est profil territoriale et que le filtres axes est defini, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: ["axe 1", "axe 2"],
          meteos: [],
          territorialisation: [],
          estBarometre: false,
          valeurDeLaRecherche: "",
          statut: [],
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: true,
              axe: "axe 3",
            },
            {
              id: "CH-002",
              nom: "Chantier 002",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: false,
              axe: "axe 2",
            },
            {
              id: "CH-003",
              nom: "Chantier 003",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: true,
              axe: "axe 1",
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier 002",
            chantier_territoire: [
              { territoire_code: "DEPT-88", taux_avancement_mandat: 3 },
            ],
          },
          {
            nom: "Chantier 003",
            chantier_territoire: [
              { territoire_code: "REG-01", taux_avancement_mandat: 4 },
            ],
          },
        ]);
      });

      it("quand on est profil territoriale et que le filtres est barometre et territorialisation est defini en regionale et departementale, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          meteos: [],
          statut: [],
          territorialisation: ["regionale", "departementale"],
          estBarometre: true,
          valeurDeLaRecherche: "",
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: true,
              mailles_applicables: ["REG", "DEPT"],
            },
            {
              id: "CH-002",
              nom: "Chantier 002",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: false,
              mailles_applicables: ["NAT"],
            },
            {
              id: "CH-003",
              nom: "Chantier 003",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: true,
              mailles_applicables: ["REG", "DEPT"],
            },
            {
              id: "CH-004",
              nom: "Chantier 004",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: false,
              mailles_applicables: ["NAT"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
            {
              id: "CH-004",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 5,
              est_applicable: true,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier 001",
            chantier_territoire: [
              { territoire_code: "DEPT-87", taux_avancement_mandat: 2 },
            ],
          },
        ]);
      });

      it("quand on est profil territoriale et que le filtres est barometre est defini, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          meteos: [],
          statut: [],
          territorialisation: [],
          estBarometre: true,
          valeurDeLaRecherche: "",
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: true,
            },
            {
              id: "CH-002",
              nom: "Chantier 002",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: false,
            },
            {
              id: "CH-003",
              nom: "Chantier 003",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: true,
            },
            {
              id: "CH-004",
              nom: "Chantier 004",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: false,
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
            {
              id: "CH-004",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 5,
              est_applicable: true,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier 001",
            chantier_territoire: [
              { territoire_code: "DEPT-87", taux_avancement_mandat: 2 },
            ],
          },
          {
            nom: "Chantier 002",
            chantier_territoire: [
              { territoire_code: "DEPT-88", taux_avancement_mandat: 3 },
            ],
          },
        ]);
      });

      it("quand on est profil territoriale et que le filtres est territorialise est defini, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          meteos: [],
          statut: [],
          territorialisation: ["regionale", "departementale"],
          estBarometre: false,
          valeurDeLaRecherche: "",
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: true,
              mailles_applicables: ["REG", "DEPT"],
            },
            {
              id: "CH-002",
              nom: "Chantier 002",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: false,
              mailles_applicables: ["NAT"],
            },
            {
              id: "CH-003",
              nom: "Chantier 003",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: true,
              mailles_applicables: ["REG", "DEPT"],
            },
            {
              id: "CH-004",
              nom: "Chantier 004",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: false,
              mailles_applicables: ["NAT"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
            {
              id: "CH-004",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 5,
              est_applicable: true,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier 001",
            chantier_territoire: [
              { territoire_code: "DEPT-87", taux_avancement_mandat: 2 },
            ],
          },
          {
            nom: "Chantier 003",
            chantier_territoire: [
              { territoire_code: "REG-01", taux_avancement_mandat: 4 },
            ],
          },
        ]);
      });

      it("quand on est profil territoriale et que le filtres valeur de recherche est defini, doit remonter les chantiers demandés", async () => {
        // Given
        const chantiersLectureIds = ["CH-001", "CH-002", "CH-003", "CH-004"];
        const territoiresLectureIds = ["DEPT-87", "DEPT-88", "REG-01"];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          meteos: [],
          statut: [],
          territorialisation: [],
          estBarometre: false,
          valeurDeLaRecherche: "maValeur recherche",
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001 ajout texte pour valeur de recherche",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: true,
            },
            {
              id: "CH-002",
              nom: "Chantier maValeur recherche 002 ajout texte pour valeur de recherche",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: true,
              est_territorialise: false,
            },
            {
              id: "CH-003",
              nom: "Chantier maValeur recherche 003 ajout texte pour valeur de recherche",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: true,
            },
            {
              id: "CH-004",
              nom: "Chantier 004 ajout texte pour valeur de recherche",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
              est_barometre: false,
              est_territorialise: false,
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              zone_id: "D87",
              maille: "DEPT",
              code_insee: "87",
              meteo: "SOLEIL",
              territoire_code: "DEPT-87",
              taux_avancement_mandat: 2,
              est_applicable: true,
            },
            {
              id: "CH-002",
              zone_id: "D88",
              maille: "DEPT",
              code_insee: "88",
              meteo: "COUVERT",
              territoire_code: "DEPT-88",
              taux_avancement_mandat: 3,
              est_applicable: true,
            },
            {
              id: "CH-003",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 4,
              est_applicable: true,
            },
            {
              id: "CH-004",
              zone_id: "R01",
              maille: "REG",
              code_insee: "01",
              meteo: "COUVERT",
              territoire_code: "REG-01",
              taux_avancement_mandat: 5,
              est_applicable: true,
            },
          ],
        });

        const jalon = 2024;

        // When
        const result =
          await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(
            chantiersLectureIds,
            territoiresLectureIds,
            profil,
            filtres,
            "DEPT-87",
            jalon,
          );

        // Then
        expect(result).toMatchObject([
          {
            nom: "Chantier maValeur recherche 002 ajout texte pour valeur de recherche",
            chantier_territoire: [
              { territoire_code: "DEPT-88", taux_avancement_mandat: 3 },
            ],
          },
          {
            nom: "Chantier maValeur recherche 003 ajout texte pour valeur de recherche",
            chantier_territoire: [
              { territoire_code: "REG-01", taux_avancement_mandat: 4 },
            ],
          },
        ]);
      });
    });
  });
});
