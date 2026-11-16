import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";
import { GetChantiersSignalesQuery } from "@/server/chantiers/infrastructure/queries/GetChantiersSignalesQuery";
import { ChantiersSignalesDataFetcher } from "@/server/chantiers/infrastructure/queries/ChantiersSignalesDataFetcher";

describe("GetChantiersSignalesQuery", () => {
  let query: GetChantiersSignalesQuery;

  beforeEach(() => {
    query = new GetChantiersSignalesQuery({
      chantiersSignalesDataFetcher: new ChantiersSignalesDataFetcher({
        prisma: new PrismaPilote(),
      }),
    });
  });

  it(
    "retourne les compteurs d'alertes pour les chantiers donnés sur un territoire",
    createIntegrationTest(async () => {
      // Given
      const chantierEnAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        cible_attendue: true,
      });
      const chantierHorsAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        cible_attendue: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        est_applicable: true,
        tendance: "BAISSE",
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierEnAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -15,
        taux_avancement: null,
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
        tendance: "HAUSSE",
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierHorsAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -5,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantierEnAlerte.id, chantierHorsAlerte.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then
      expect(result).toEqual({
        estEnAlerteÉcart: 1,
        estEnAlerteBaisse: 1,
        estEnAlerteTauxAvancementNonCalculé: 1,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 1,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "exclut les chantiers non applicables",
    createIntegrationTest(async () => {
      // Given
      const chantierApplicable = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const chantierNonApplicable = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantierApplicable.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierApplicable.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.chantierTerritoire({
        id: chantierNonApplicable.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        // chantier non applicable
        est_applicable: false,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantierApplicable.id, chantierNonApplicable.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then
      expect(result).toEqual({
        estEnAlerteÉcart: 1,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 1,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 1,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "exclut les chantiers sans ministères",
    createIntegrationTest(async () => {
      // Given
      const chantierAvecMinisteres = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const chantierSansMinisteres = await fixtures.chantierIdentite({
        ministeres: [],
      });
      await fixtures.chantierTerritoire({
        id: chantierAvecMinisteres.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierAvecMinisteres.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
      });
      await fixtures.chantierTerritoire({
        id: chantierSansMinisteres.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        est_applicable: true,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantierAvecMinisteres.id, chantierSansMinisteres.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then
      expect(result).toEqual({
        estEnAlerteÉcart: 0,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 1,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 1,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "ignore les chantiers dont l'id n'est pas dans la liste",
    createIntegrationTest(async () => {
      // Given
      const chantierDemande = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      const chantierNonDemande = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantierDemande.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierDemande.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.chantierTerritoire({
        id: chantierNonDemande.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierNonDemande.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -20,
      });

      // When — seul chantierDemande est demandé
      const result = await query.execute({
        chantierIds: [chantierDemande.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then
      expect(result).toEqual({
        estEnAlerteÉcart: 1,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 1,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 1,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "retourne tous les compteurs à zéro quand aucun chantier ne correspond",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({
        chantierIds: [randomUUID()],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then
      expect(result).toEqual({
        estEnAlerteÉcart: 0,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 0,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 0,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "ne compte que les chantiers du territoire demandé",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "NON_RENSEIGNEE",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        jalon: 2025,
        ecart: -5,
        taux_avancement: 50,
      });

      // When — on demande uniquement NAT-FR
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then — seules les alertes NAT-FR sont comptées
      expect(result).toEqual({
        estEnAlerteÉcart: 1,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 1,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 1,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "ne compte pas le taux non calculé quand cible_attendue est false",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        cible_attendue: false,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: null,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then
      expect(result).toEqual({
        estEnAlerteÉcart: 0,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 0,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 0,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "utilise le jalon par défaut pour le calcul de l'écart et du taux d'avancement",
    createIntegrationTest(async () => {
      // Given — ecart < -10 sur jalon 2024 mais pas sur jalon 2025
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        cible_attendue: true,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2024,
        ecart: -20,
        taux_avancement: null,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -5,
        taux_avancement: 50,
      });

      // When — jalonParDefaut = 2025
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then — ecart -5 n'est pas en alerte, taux 50 n'est pas null
      expect(result).toEqual({
        estEnAlerteÉcart: 0,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 0,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 0,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "compte les PVA depuis les territoires enfants au national",
    createIntegrationTest(async () => {
      // Given — PVA = 0 au NAT, mais > 0 sur un DEPT enfant
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        meteo: "SOLEIL",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 3,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        jalon: 2025,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then — PVA compté depuis le DEPT enfant
      expect(result).toEqual({
        estEnAlerteÉcart: 0,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 0,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 0,
        estEnAlertePossedePropositionsValeurAvancement: 1,
      });
    }),
  );

  it(
    "détecte l'absence de taux d'avancement départemental au national",
    createIntegrationTest(async () => {
      // Given — cible_attendue = true, DEPT applicables mais taux_avancement = null
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        cible_attendue: true,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        meteo: "SOLEIL",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        jalon: 2025,
        taux_avancement: null,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCode: "NAT-FR",
        jalonParDefaut: 2025,
      });

      // Then — absence de taux dept détectée
      expect(result).toEqual({
        estEnAlerteÉcart: 0,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 0,
        estEnAlerteAbscenceTauxAvancementDepartemental: 1,
        estEnAlerteMétéoNonRenseignée: 0,
        estEnAlertePossedePropositionsValeurAvancement: 0,
      });
    }),
  );

  it(
    "compte les PVA depuis les territoires enfants au régional",
    createIntegrationTest(async () => {
      const prisma = getPrisma();

      // Given — créer le territoire REG avec un DEPT enfant
      await prisma.territoire.upsert({
        where: { code: "REG-76" },
        update: {},
        create: {
          code: "REG-76",
          nom: "Occitanie",
          nom_affiche: "Occitanie",
          maille: "REG",
          code_insee: "76",
          zone_id: "zone-reg",
        },
      });
      await prisma.territoire.upsert({
        where: { code: "DEPT-31" },
        update: { code_parent: "REG-76" },
        create: {
          code: "DEPT-31",
          nom: "Haute-Garonne",
          nom_affiche: "Haute-Garonne",
          maille: "DEPT",
          code_insee: "31",
          code_parent: "REG-76",
          zone_id: "zone-dept",
        },
      });

      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "REG-76",
        code_insee: "76",
        maille: "REG",
        zone_id: "zone-reg",
        meteo: "SOLEIL",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "REG-76",
        code_insee: "76",
        maille: "REG",
        zone_id: "zone-reg",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-31",
        code_insee: "31",
        maille: "DEPT",
        zone_id: "zone-dept",
        meteo: "SOLEIL",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 2,
      });

      // When
      const result = await query.execute({
        chantierIds: [chantier.id],
        territoireCode: "REG-76",
        jalonParDefaut: 2025,
      });

      // Then — PVA compté depuis le DEPT enfant
      expect(result).toEqual({
        estEnAlerteÉcart: 0,
        estEnAlerteBaisse: 0,
        estEnAlerteTauxAvancementNonCalculé: 0,
        estEnAlerteAbscenceTauxAvancementDepartemental: 0,
        estEnAlerteMétéoNonRenseignée: 0,
        estEnAlertePossedePropositionsValeurAvancement: 1,
      });
    }),
  );
});
