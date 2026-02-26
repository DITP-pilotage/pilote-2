import { chantier_territoire_jalon } from "@prisma/client";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { FiltreQueryParams } from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import { Utilisateur } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { OptionsExport } from "@/server/usecase/chantier/OptionsExport";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("PrismaChantierRepository", () => {
  let prismaChantierRepository: PrismaChantierRepository;

  beforeEach(() => {
    prismaChantierRepository = new PrismaChantierRepository();
  });

  describe("#recupererPourExports", () => {
    const optionsParDefaut: OptionsExport = {
      estBarometre: false,
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

    describe("filtrage", () => {
      it(
        "doit retourner null si le chantier n'existe pas",
        createIntegrationTest(async () => {
          // When
          const result = await prismaChantierRepository.recupererPourExports(
            "CH-INEXISTANT",
            ["NAT-FR"],
            optionsParDefaut,
            2025,
          );

          // Then
          expect(result).toBeNull();
        }),
      );

      it(
        "doit retourner null si le chantier n'a aucun ministère",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({ id: "CH-001", ministeres: [] });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });

          // When
          const result = await prismaChantierRepository.recupererPourExports(
            "CH-001",
            ["NAT-FR"],
            optionsParDefaut,
            2025,
          );

          // Then
          expect(result).toBeNull();
        }),
      );

      it(
        "doit exclure les territoires absents de territoireCodesLecture",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: "CH-001",
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "REG-84",
            code_insee: "84",
            maille: "REG",
            zone_id: "R84",
            est_applicable: true,
          });

          // When : seul NAT-FR est demandé
          const result = await prismaChantierRepository.recupererPourExports(
            "CH-001",
            ["NAT-FR"],
            optionsParDefaut,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({ maille: "NAT", codeInsee: "FR" }),
          ]);
        }),
      );

      it(
        "doit exclure les territoires dont la météo ne correspond pas à listeMeteos",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: "CH-001",
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
            meteo: "SOLEIL",
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "REG-84",
            code_insee: "84",
            maille: "REG",
            zone_id: "R84",
            est_applicable: true,
            meteo: "NUAGE",
          });

          // When : seuls les territoires avec météo SOLEIL sont demandés
          const result = await prismaChantierRepository.recupererPourExports(
            "CH-001",
            ["NAT-FR", "REG-84"],
            { ...optionsParDefaut, listeMeteos: ["SOLEIL"] },
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({ maille: "NAT", météo: "SOLEIL" }),
          ]);
        }),
      );
    });

    describe("taux d'avancement", () => {
      it(
        "doit retourner le taux d'avancement du jalon demandé pour chaque territoire",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: "CH-001",
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          // Jalon 2024 — ne doit pas apparaître
          await fixtures.chantierTerritoireJalon({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            jalon: 2024,
            taux_avancement: 30,
          });
          // Jalon 2025 — attendu
          await fixtures.chantierTerritoireJalon({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            jalon: 2025,
            taux_avancement: 75,
          });

          // When
          const result = await prismaChantierRepository.recupererPourExports(
            "CH-001",
            ["NAT-FR"],
            optionsParDefaut,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({ tauxDAvancement: 75 }),
          ]);
        }),
      );

      it(
        "doit retourner null pour tauxDAvancement si aucun jalon n'existe pour ce territoire",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: "CH-001",
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });

          // When : aucun chantier_territoire_jalon créé
          const result = await prismaChantierRepository.recupererPourExports(
            "CH-001",
            ["NAT-FR"],
            optionsParDefaut,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({ tauxDAvancement: null }),
          ]);
        }),
      );

      it(
        "doit retourner tauxDAvancementNational, tauxDAvancementRégional et tauxDAvancementDépartemental depuis les jalons de chaque niveau pour une maille DEPT",
        createIntegrationTest(async () => {
          // Given
          await fixtures.chantierIdentite({
            id: "CH-001",
            ministeres: ["MINEDU"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "REG-84",
            code_insee: "84",
            maille: "REG",
            zone_id: "R84",
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            est_applicable: true,
          });
          await fixtures.chantierTerritoireJalon({
            id: "CH-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            jalon: 2025,
            taux_avancement: 50,
          });
          await fixtures.chantierTerritoireJalon({
            id: "CH-001",
            territoire_code: "REG-84",
            code_insee: "84",
            maille: "REG",
            zone_id: "R84",
            jalon: 2025,
            taux_avancement: 65,
          });
          await fixtures.chantierTerritoireJalon({
            id: "CH-001",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
            jalon: 2025,
            taux_avancement: 80,
          });

          // When
          const result = await prismaChantierRepository.recupererPourExports(
            "CH-001",
            ["DEPT-01"],
            optionsParDefaut,
            2025,
          );

          // Then
          expect(result).toEqual([
            expect.objectContaining({
              tauxDAvancement: 80,
              tauxDAvancementDépartemental: 80,
              tauxDAvancementRégional: 65,
              tauxDAvancementNational: 50,
            }),
          ]);
        }),
      );
    });

    describe("proposition avancement", () => {
      it(
        "aUnePropositionsValeurAvancement est faux au niveau national, si le chantier ne possède aucune proposition sur aucun territoire",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnePropositionsValeurAvancement est vrai au niveau national, si le chantier possède au moins une proposition sur un territoire",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          // DEPT-02 possède une proposition
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnePropositionsValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur la région",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            est_applicable: true,
            nombre_propositions_valeur_actuelle: 0,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          // REG-84 possède une proposition
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnePropositionsValeurAvancement est vrai au niveau regional, si le chantier possède une proposition sur un département enfant",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          // DEPT-01 possède une proposition (département enfant de REG-84)
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnePropositionsValeurAvancement est faux au niveau regional, si le chantier ne possède aucune proposition sur la région ou sur un département enfant",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          // DEPT-02 a une proposition mais n'est pas enfant de REG-84
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnePropositionsValeurAvancement est vrai au niveau departemental, si le chantier possède une proposition sur le département",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          // DEPT-01 possède une proposition
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnePropositionsValeurAvancement est faux au niveau departemental, si le chantier ne possède pas de proposition sur le département",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
          });
          // DEPT-02 a une proposition mais on demande DEPT-01
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            nombre_propositions_valeur_actuelle: 1,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            nombre_propositions_valeur_actuelle: 0,
            est_applicable: true,
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
        }),
      );
    });

    describe("AUnTauxAvancementDepartemental", () => {
      it(
        "aUnTauxAvancementDepartemental est vrai, si le chantier ne possède aucun département applicable",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          });
          // Départements non applicables
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: null,
            est_applicable: false,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: false,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            taux_avancement_mandat: 10,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnTauxAvancementDepartemental est vrai, si le chantier possède au moins un département avec un taux d'avancement non null",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          });
          // DEPT-01 a un taux non null
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: 30,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: true,
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
        }),
      );

      it(
        "aUnTauxAvancementDepartemental est faux, si le chantier ne possède aucun département avec un taux d'avancement non null",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
            taux_avancement_mandat: 20,
            est_applicable: true,
          });
          // Tous les départements ont taux_avancement_mandat null
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
            taux_avancement_mandat: null,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            taux_avancement_mandat: null,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            maille: "REG",
            code_insee: "84",
            territoire_code: "REG-84",
            zone_id: "R84",
            taux_avancement_mandat: 10,
            est_applicable: true,
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
        }),
      );
    });
  });

  describe("#recupererLesEntreesDUnChantier", () => {
    test(
      "Quand on le chantier demandé n'existe pas, doit remonter une erreur en cas de chantier non trouvé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({ id: "CH-001", nom: "Chantier 001" });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
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
      }),
    );

    test(
      "quand on est un profil territorial, doit renvoyer la liste des chantiers sans la maille nationale",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({ id: "CH-001", nom: "Chantier 001" });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-87",
          code_insee: "87",
          maille: "DEPT",
          zone_id: "D87",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-88",
          code_insee: "87",
          maille: "DEPT",
          zone_id: "D87",
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
      }),
    );

    test(
      "quand on n'est pas un profil territorial, doit renvoyer la liste des chantiers avec la maille nationale",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({ id: "CH-001", nom: "Chantier 001" });
        await fixtures.chantierIdentite({ id: "CH-002", nom: "Chantier 002" });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-87",
          code_insee: "87",
          maille: "DEPT",
          zone_id: "D87",
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "DEPT-87",
          code_insee: "87",
          maille: "DEPT",
          zone_id: "D87",
          jalon: 2024,
          taux_avancement: 10,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "DEPT-87",
          code_insee: "87",
          maille: "DEPT",
          zone_id: "D87",
          jalon: 2025,
          taux_avancement: 12,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-88",
          code_insee: "88",
          maille: "DEPT",
          zone_id: "D88",
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "DEPT-88",
          code_insee: "88",
          maille: "DEPT",
          zone_id: "D88",
          jalon: 2024,
          taux_avancement: 10,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "DEPT-88",
          code_insee: "88",
          maille: "DEPT",
          zone_id: "D88",
          jalon: 2025,
          taux_avancement: 12,
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
      }),
    );
  });

  describe("#récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions", () => {
    it(
      "quand on a l'option estBarometre et territorialisation à ['regionale', 'departementale'], doit remonter les chantiers ids contenant soit les chantiers du barometre soit territorialisé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          est_barometre: true,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          est_barometre: true,
          est_territorialise: false,
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          est_barometre: false,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          est_barometre: false,
          est_territorialise: false,
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
      }),
    );

    it(
      "quand on a l'option estBarometre est a false et estTerritorialise à false, doit remonter les chantiers ids contenant les chantiers du barometre",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          est_barometre: true,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          est_barometre: true,
          est_territorialise: false,
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          est_barometre: false,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          est_barometre: false,
          est_territorialise: false,
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
      }),
    );

    it(
      "quand on a l'option estBarometre est a false et territorialisation à ['regionale', 'departementale'], doit remonter les chantiers ids contenant les chantiers territorialise",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          est_barometre: true,
          est_territorialise: true,
          mailles_applicables: ["REG", "DEPT"],
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          est_barometre: true,
          est_territorialise: false,
          mailles_applicables: ["NAT"],
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          est_barometre: false,
          est_territorialise: true,
          mailles_applicables: ["REG", "DEPT"],
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          est_barometre: false,
          est_territorialise: false,
          mailles_applicables: ["NAT"],
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
      }),
    );

    it(
      "quand on a l'option listeStatuts est définie, doit remonter les chantiers ids des chantiers avec les statuts demandés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          est_barometre: true,
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          est_barometre: true,
          est_territorialise: false,
          statut: "PUBLIE",
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          est_barometre: false,
          est_territorialise: true,
          statut: "BROUILLON",
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          est_barometre: false,
          est_territorialise: false,
          statut: "ARCHIVE",
        });
        await fixtures.chantierIdentite({
          id: "CH-005",
          nom: "Chantier 005",
          est_barometre: false,
          est_territorialise: false,
          statut: "SUPPRIME",
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
      }),
    );

    it(
      "quand on a l'option perimetreIds est définie, doit remonter les chantiers ids des chantiers avec les périmètres demandés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          est_barometre: true,
          est_territorialise: true,
          statut: "PUBLIE",
          perimetre_ids: ["PER-01", "PER-02"],
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          est_barometre: true,
          est_territorialise: false,
          statut: "PUBLIE",
          perimetre_ids: ["PER-01"],
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          est_barometre: false,
          est_territorialise: true,
          statut: "BROUILLON",
          perimetre_ids: ["PER-02"],
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          est_barometre: false,
          est_territorialise: false,
          statut: "ARCHIVE",
          perimetre_ids: ["PER-03"],
        });
        await fixtures.chantierIdentite({
          id: "CH-005",
          nom: "Chantier 005",
          est_barometre: false,
          est_territorialise: false,
          statut: "SUPPRIME",
          perimetre_ids: ["PER-01", "PER-03"],
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
      }),
    );

    it(
      "quand on a l'option listeChantierId est définie, doit remonter les chantiers ids des chantiers avec les ids de chantier demandés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          est_barometre: true,
          est_territorialise: true,
          statut: "PUBLIE",
          perimetre_ids: ["PER-01", "PER-02"],
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          est_barometre: true,
          est_territorialise: false,
          statut: "PUBLIE",
          perimetre_ids: ["PER-01"],
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          est_barometre: false,
          est_territorialise: true,
          statut: "BROUILLON",
          perimetre_ids: ["PER-02"],
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          est_barometre: false,
          est_territorialise: false,
          statut: "ARCHIVE",
          perimetre_ids: ["PER-03"],
        });
        await fixtures.chantierIdentite({
          id: "CH-005",
          nom: "Chantier 005",
          est_barometre: false,
          est_territorialise: false,
          statut: "SUPPRIME",
          perimetre_ids: ["PER-01", "PER-03"],
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
      }),
    );
  });

  describe("#récupérerLesEntréesDeTousLesChantiersHabilitésNew", () => {
    it(
      "quand on est profil territoriale et que les filtres sont laissés par défault, doit remonter les chantiers demandés",
      createIntegrationTest(async () => {
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

        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: true,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: false,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: true,
          est_territorialise: false,
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: false,
          est_territorialise: false,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          zone_id: "D87",
          maille: "DEPT",
          code_insee: "87",
          meteo: "SOLEIL",
          territoire_code: "DEPT-87",
          est_applicable: true,
          taux_avancement_mandat: 5,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          zone_id: "D88",
          maille: "DEPT",
          code_insee: "88",
          meteo: "SOLEIL",
          territoire_code: "DEPT-88",
          est_applicable: true,
          taux_avancement_mandat: 2,
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          zone_id: "D88",
          maille: "DEPT",
          code_insee: "88",
          meteo: "COUVERT",
          territoire_code: "DEPT-88",
          est_applicable: true,
          taux_avancement_mandat: 10,
        });
        await fixtures.chantierTerritoire({
          id: "CH-003",
          zone_id: "FRANCE",
          maille: "NAT",
          code_insee: "FR",
          meteo: "COUVERT",
          territoire_code: "NAT-FR",
          est_applicable: true,
          taux_avancement_mandat: 15,
        });
        await fixtures.chantierTerritoire({
          id: "CH-004",
          zone_id: "D87",
          maille: "DEPT",
          code_insee: "87",
          meteo: "NON_RENSEIGNEE",
          territoire_code: "DEPT-87",
          est_applicable: true,
          taux_avancement_mandat: 20,
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
            [jalon],
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
      }),
    );

    it(
      "quand on n'est pas un profil territoriale et que les filtres sont laissés par défault, doit remonter les chantiers demandés avec la maille nationale en plus",
      createIntegrationTest(async () => {
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

        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Chantier 001",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: true,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-002",
          nom: "Chantier 002",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: true,
          est_territorialise: false,
        });
        await fixtures.chantierIdentite({
          id: "CH-003",
          nom: "Chantier 003",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: false,
          est_territorialise: true,
        });
        await fixtures.chantierIdentite({
          id: "CH-004",
          nom: "Chantier 004",
          ministeres: ["1009"],
          ministeres_acronymes: ["MINA"],
          est_barometre: false,
          est_territorialise: false,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          zone_id: "D87",
          maille: "DEPT",
          code_insee: "87",
          meteo: "SOLEIL",
          territoire_code: "DEPT-87",
          taux_avancement_mandat: 2,
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-003",
          zone_id: "FRANCE",
          maille: "NAT",
          code_insee: "FR",
          meteo: "COUVERT",
          territoire_code: "NAT-FR",
          taux_avancement_mandat: 4,
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          zone_id: "D88",
          maille: "DEPT",
          code_insee: "88",
          meteo: "COUVERT",
          territoire_code: "DEPT-88",
          taux_avancement_mandat: 3,
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-004",
          zone_id: "D87",
          maille: "DEPT",
          code_insee: "87",
          meteo: "NON_RENSEIGNEE",
          territoire_code: "DEPT-87",
          taux_avancement_mandat: 5,
          est_applicable: true,
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
            [jalon],
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
      }),
    );

    describe("filtres", () => {
      it(
        "quand on est profil territoriale et que le filtres perimetres est defini, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
            perimetre_ids: ["PER-01", "PER-02"],
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
            perimetre_ids: ["PER-03", "PER-04"],
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
            perimetre_ids: ["PER-01", "PER-03"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
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
              [jalon],
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
        }),
      );

      it(
        "quand on est profil territoriale et que le filtres statut est defini, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
            statut: "PUBLIE",
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
            statut: "BROUILLON",
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
            statut: "ARCHIVE",
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
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
              [jalon],
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
        }),
      );

      it(
        "quand on est profil territoriale et que le filtres meteos est defini, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "COUVERT",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
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
              [jalon],
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
        }),
      );

      it(
        "quand on est profil territoriale et que le filtres axes est defini, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
            axe: "axe 3",
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
            axe: "axe 2",
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
            axe: "axe 1",
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
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
              [jalon],
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
        }),
      );

      it(
        "quand on est profil territoriale et que le filtres est barometre et territorialisation est defini en regionale et departementale, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
            mailles_applicables: ["REG", "DEPT"],
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
            mailles_applicables: ["NAT"],
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
            mailles_applicables: ["REG", "DEPT"],
          });
          await fixtures.chantierIdentite({
            id: "CH-004",
            nom: "Chantier 004",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: false,
            mailles_applicables: ["NAT"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-004",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 5,
            est_applicable: true,
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
              [jalon],
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
        }),
      );

      it(
        "quand on est profil territoriale et que le filtres est barometre est defini, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
          });
          await fixtures.chantierIdentite({
            id: "CH-004",
            nom: "Chantier 004",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: false,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-004",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 5,
            est_applicable: true,
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
              [jalon],
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
        }),
      );

      it(
        "quand on est profil territoriale et que le filtres est territorialise est defini, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
            mailles_applicables: ["REG", "DEPT"],
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier 002",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
            mailles_applicables: ["NAT"],
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier 003",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
            mailles_applicables: ["REG", "DEPT"],
          });
          await fixtures.chantierIdentite({
            id: "CH-004",
            nom: "Chantier 004",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: false,
            mailles_applicables: ["NAT"],
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-004",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 5,
            est_applicable: true,
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
              [jalon],
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
        }),
      );

      it(
        "quand on est profil territoriale et que le filtres valeur de recherche est defini, doit remonter les chantiers demandés",
        createIntegrationTest(async () => {
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

          await fixtures.chantierIdentite({
            id: "CH-001",
            nom: "Chantier 001 ajout texte pour valeur de recherche",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: true,
          });
          await fixtures.chantierIdentite({
            id: "CH-002",
            nom: "Chantier maValeur recherche 002 ajout texte pour valeur de recherche",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: true,
            est_territorialise: false,
          });
          await fixtures.chantierIdentite({
            id: "CH-003",
            nom: "Chantier maValeur recherche 003 ajout texte pour valeur de recherche",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: true,
          });
          await fixtures.chantierIdentite({
            id: "CH-004",
            nom: "Chantier 004 ajout texte pour valeur de recherche",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
            est_barometre: false,
            est_territorialise: false,
          });
          await fixtures.chantierTerritoire({
            id: "CH-001",
            zone_id: "D87",
            maille: "DEPT",
            code_insee: "87",
            meteo: "SOLEIL",
            territoire_code: "DEPT-87",
            taux_avancement_mandat: 2,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-002",
            zone_id: "D88",
            maille: "DEPT",
            code_insee: "88",
            meteo: "COUVERT",
            territoire_code: "DEPT-88",
            taux_avancement_mandat: 3,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-003",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 4,
            est_applicable: true,
          });
          await fixtures.chantierTerritoire({
            id: "CH-004",
            zone_id: "R01",
            maille: "REG",
            code_insee: "01",
            meteo: "COUVERT",
            territoire_code: "REG-01",
            taux_avancement_mandat: 5,
            est_applicable: true,
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
              [jalon],
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
        }),
      );
    });
  });

  describe("#récupérerDonneesChantier", () => {
    it(
      "retourne les données de base d'un chantier pour un territoire NAT",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          nom: "Mon chantier",
          ministeres: ["MINEDU"],
          ministeres_acronymes: ["EDU"],
          axe: "Axe 1",
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          taux_avancement: 60,
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            id: "CH-001",
            nom: "Mon chantier",
            maille: "NAT",
            territoireCode: "NAT-FR",
            ministèreNom: "EDU",
            tauxDAvancementNational: 60,
            tauxDAvancementRégional: null,
            tauxDAvancementDépartemental: null,
          }),
        ]);
      }),
    );

    it(
      "retourne un tableau vide si le chantier n'a aucun ministère",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({ id: "CH-001" });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "exclut les territoires absents de territoireCodesLecture",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });
        // territoire non demandé
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          est_applicable: true,
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({ territoireCode: "NAT-FR" }),
        ]);
      }),
    );

    it(
      "exclut les territoires dont est_applicable est faux",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: false,
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "retourne null pour tauxDAvancementNational si aucun jalon n'existe",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({ tauxDAvancementNational: null }),
        ]);
      }),
    );

    it(
      "retourne le taux d'avancement du jalon demandé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });
        // Jalon 2024 — ne doit pas apparaître
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2024,
          taux_avancement: 30,
        });
        // Jalon 2025 — attendu
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          taux_avancement: 75,
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({ tauxDAvancementNational: 75 }),
        ]);
      }),
    );

    it(
      "pour une maille DEPT, retourne les taux d'avancement national, régional et départemental",
      createIntegrationTest(async () => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          est_applicable: true,
        });
        // DEPT-01 a pour parent REG-84 dans la table territoire pré-seedée
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          est_applicable: true,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          taux_avancement: 50,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          jalon: 2025,
          taux_avancement: 65,
        });
        await fixtures.chantierTerritoireJalon({
          id: "CH-001",
          territoire_code: "DEPT-01",
          code_insee: "01",
          maille: "DEPT",
          zone_id: "D01",
          jalon: 2025,
          taux_avancement: 80,
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["DEPT-01"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            territoireCode: "DEPT-01",
            tauxDAvancementNational: 50,
            tauxDAvancementRégional: 65,
            tauxDAvancementDépartemental: 80,
          }),
        ]);
      }),
    );

    it(
      "retourne le commentaire le plus récent par type",
      createIntegrationTest(async (prisma) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });
        // Commentaire ancien — ne doit pas être retourné
        await prisma.commentaire.create({
          data: {
            id: "c001",
            chantier_id: "CH-001",
            auteur_id: utilisateur.id,
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            type: "actions_a_venir",
            date: new Date("2024-01-01"),
            contenu: "Ancien commentaire",
          },
        });
        // Commentaire récent — attendu
        await prisma.commentaire.create({
          data: {
            id: "c002",
            chantier_id: "CH-001",
            auteur_id: utilisateur.id,
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            type: "actions_a_venir",
            date: new Date("2025-06-01"),
            contenu: "Commentaire récent",
          },
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({ commActionsÀVenir: "Commentaire récent" }),
        ]);
      }),
    );

    it(
      "retourne la synthèse des résultats et la météo les plus récentes",
      createIntegrationTest(async (prisma) => {
        // Given
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });
        // Synthèse ancienne — ne doit pas être retournée
        await prisma.synthese_des_resultats.create({
          data: {
            id: "s001",
            chantier_id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            territoire_code: "NAT-FR",
            date_commentaire: new Date("2024-01-01"),
            date_meteo: new Date("2024-01-01"),
            commentaire: "Ancienne synthèse",
            meteo: "SOLEIL",
          },
        });
        // Synthèse récente — attendue
        await prisma.synthese_des_resultats.create({
          data: {
            id: "s002",
            chantier_id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            territoire_code: "NAT-FR",
            date_commentaire: new Date("2025-06-01"),
            date_meteo: new Date("2025-06-01"),
            commentaire: "Synthèse récente",
            meteo: "NUAGE",
          },
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            synthèseDesRésultats: "Synthèse récente",
            météo: "NUAGE",
          }),
        ]);
      }),
    );

    it(
      "retourne les décisions stratégiques et objectifs pour la maille NAT, null pour les autres mailles",
      createIntegrationTest(async (prisma) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        await fixtures.chantierIdentite({
          id: "CH-001",
          ministeres: ["MINEDU"],
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "NAT-FR",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          est_applicable: true,
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          est_applicable: true,
        });
        await prisma.decision_strategique.create({
          data: {
            id: "d001",
            chantier_id: "CH-001",
            auteur_id: utilisateur.id,
            contenu: "Décision stratégique",
            type: "suivi_des_decisions",
            date: new Date("2025-01-01"),
          },
        });
        await prisma.objectif.create({
          data: {
            id: "o001",
            chantier_id: "CH-001",
            auteur_id: utilisateur.id,
            contenu: "Notre ambition",
            type: "notre_ambition",
            date: new Date("2025-01-01"),
          },
        });
        await prisma.objectif.create({
          data: {
            id: "o002",
            chantier_id: "CH-001",
            auteur_id: utilisateur.id,
            contenu: "Déjà fait",
            type: "deja_fait",
            date: new Date("2025-01-01"),
          },
        });
        await prisma.objectif.create({
          data: {
            id: "o003",
            chantier_id: "CH-001",
            auteur_id: utilisateur.id,
            contenu: "À faire",
            type: "a_faire",
            date: new Date("2025-01-01"),
          },
        });

        // When
        const result = await prismaChantierRepository.récupérerDonneesChantier(
          "CH-001",
          ["NAT-FR", "REG-84"],
          2025,
        );

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            territoireCode: "NAT-FR",
            decStratSuiviDesDécisions: "Décision stratégique",
            objNotreAmbition: "Notre ambition",
            objDéjàFait: "Déjà fait",
            objÀFaire: "À faire",
          }),
          expect.objectContaining({
            territoireCode: "REG-84",
            decStratSuiviDesDécisions: null,
            objNotreAmbition: null,
            objDéjàFait: null,
            objÀFaire: null,
          }),
        ]);
      }),
    );
  });
});
