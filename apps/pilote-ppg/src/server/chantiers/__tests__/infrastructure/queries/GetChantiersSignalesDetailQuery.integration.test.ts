import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetChantiersSignalesDetailQuery } from "@/server/chantiers/infrastructure/queries/GetChantiersSignalesDetailQuery";
import { ChantiersSignalesDataFetcher } from "@/server/chantiers/infrastructure/queries/ChantiersSignalesDataFetcher";

describe("GetChantiersSignalesDetailQuery", () => {
  let query: GetChantiersSignalesDetailQuery;

  beforeEach(() => {
    query = new GetChantiersSignalesDetailQuery({
      chantiersSignalesDataFetcher: new ChantiersSignalesDataFetcher({
        prisma: new PrismaPilote(),
      }),
    });
  });

  it(
    "catégorie ecart : présent quand écart <= -10, absent sinon",
    createIntegrationTest(async () => {
      // Given
      const chantierEnAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier en retard",
      });
      const chantierHorsAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier dans la médiane",
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierEnAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierHorsAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        jalon: 2025,
        ecart: -5,
      });

      // When
      const result = await query.execute({
        territoireCode: "REG-11",
        jalon: 2025,
        chantierIds: [chantierEnAlerte.id, chantierHorsAlerte.id],
        typesAlerte: ["estEnAlerteÉcart"],
      });

      // Then
      expect(result).toEqual([
        {
          id: chantierEnAlerte.id,
          nom: `${chantierEnAlerte.id} — Chantier en retard`,
          meteo: "NON_RENSEIGNEE",
          ecart: -15,
          typesAlerte: ["estEnAlerteÉcart"],
        },
      ]);
    }),
  );

  it(
    "catégorie baisse : présent quand tendance BAISSE, absent sinon",
    createIntegrationTest(async () => {
      // Given
      const chantierEnAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier en baisse",
      });
      const chantierHorsAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier en hausse",
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        est_applicable: true,
        tendance: "BAISSE",
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        est_applicable: true,
        tendance: "HAUSSE",
      });

      // When
      const result = await query.execute({
        territoireCode: "REG-11",
        jalon: 2025,
        chantierIds: [chantierEnAlerte.id, chantierHorsAlerte.id],
        typesAlerte: ["estEnAlerteBaisse"],
      });

      // Then
      expect(result).toEqual([
        {
          id: chantierEnAlerte.id,
          nom: `${chantierEnAlerte.id} — Chantier en baisse`,
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          typesAlerte: ["estEnAlerteBaisse"],
        },
      ]);
    }),
  );

  it(
    "catégorie taux_non_calcule : présent quand cible_attendue et taux null, absent sinon",
    createIntegrationTest(async () => {
      // Given
      const chantierEnAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier sans taux",
        cible_attendue: true,
      });
      const chantierHorsAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier avec taux",
        cible_attendue: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierEnAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        jalon: 2025,
        taux_avancement: null,
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierHorsAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        jalon: 2025,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
        chantierIds: [chantierEnAlerte.id, chantierHorsAlerte.id],
        typesAlerte: ["estEnAlerteTauxAvancementNonCalculé"],
      });

      // Then
      expect(result).toEqual([
        {
          id: chantierEnAlerte.id,
          nom: `${chantierEnAlerte.id} — Chantier sans taux`,
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          typesAlerte: ["estEnAlerteTauxAvancementNonCalculé"],
        },
      ]);
    }),
  );

  it(
    "catégorie meteo_non_renseignee : présent quand météo NON_RENSEIGNEE, absent sinon",
    createIntegrationTest(async () => {
      // Given
      const chantierEnAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier sans météo",
      });
      const chantierHorsAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier avec météo",
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        est_applicable: true,
        meteo: "NON_RENSEIGNEE",
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        est_applicable: true,
        meteo: "SOLEIL",
      });

      // When
      const result = await query.execute({
        territoireCode: "REG-11",
        jalon: 2025,
        chantierIds: [chantierEnAlerte.id, chantierHorsAlerte.id],
        typesAlerte: ["estEnAlerteMétéoNonRenseignée"],
      });

      // Then
      expect(result).toEqual([
        {
          id: chantierEnAlerte.id,
          nom: `${chantierEnAlerte.id} — Chantier sans météo`,
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          typesAlerte: ["estEnAlerteMétéoNonRenseignée"],
        },
      ]);
    }),
  );

  it(
    "catégorie pva au départemental : présent quand nombre_propositions_valeur_actuelle > 0, absent sinon",
    createIntegrationTest(async () => {
      // Given
      const chantierEnAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier avec PVA",
      });
      const chantierHorsAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier sans PVA",
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 3,
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 0,
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
        chantierIds: [chantierEnAlerte.id, chantierHorsAlerte.id],
        typesAlerte: ["estEnAlertePossedePropositionsValeurAvancement"],
      });

      // Then
      expect(result).toEqual([
        {
          id: chantierEnAlerte.id,
          nom: `${chantierEnAlerte.id} — Chantier avec PVA`,
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          typesAlerte: ["estEnAlertePossedePropositionsValeurAvancement"],
        },
      ]);
    }),
  );

  it(
    "catégorie pva au national : comptée depuis les territoires enfants",
    createIntegrationTest(async () => {
      // Given — PVA = 0 au NAT, mais > 0 sur un DEPT enfant
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier national",
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        est_applicable: true,
        nombre_propositions_valeur_actuelle: 3,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
        chantierIds: [chantier.id],
        typesAlerte: ["estEnAlertePossedePropositionsValeurAvancement"],
      });

      // Then — PVA compté depuis le DEPT enfant
      expect(result).toEqual([
        {
          id: chantier.id,
          nom: `${chantier.id} — Chantier national`,
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          typesAlerte: ["estEnAlertePossedePropositionsValeurAvancement"],
        },
      ]);
    }),
  );

  it(
    "catégorie absence_taux_departemental au national : détectée quand le département applicable n'a pas de taux",
    createIntegrationTest(async () => {
      // Given
      const chantierEnAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier sans taux dept",
        cible_attendue: true,
      });
      const chantierHorsAlerte = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier avec taux dept",
        cible_attendue: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierEnAlerte.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierEnAlerte.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        jalon: 2025,
        taux_avancement: null,
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoire({
        id: chantierHorsAlerte.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        est_applicable: true,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantierHorsAlerte.id,
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        jalon: 2025,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
        chantierIds: [chantierEnAlerte.id, chantierHorsAlerte.id],
        typesAlerte: ["estEnAlerteAbscenceTauxAvancementDepartemental"],
      });

      // Then
      expect(result).toEqual([
        {
          id: chantierEnAlerte.id,
          nom: `${chantierEnAlerte.id} — Chantier sans taux dept`,
          meteo: "NON_RENSEIGNEE",
          ecart: null,
          typesAlerte: ["estEnAlerteAbscenceTauxAvancementDepartemental"],
        },
      ]);
    }),
  );

  it(
    "un chantier matchant 2 catégories demandées simultanément n'apparaît qu'une seule fois",
    createIntegrationTest(async () => {
      // Given — écart <= -10 ET météo non renseignée en même temps
      const chantier = await fixtures.chantierIdentite({
        ministeres: ["MIN-01"],
        nom: "Chantier double alerte",
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        est_applicable: true,
        meteo: "NON_RENSEIGNEE",
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "REG-11",
        code_insee: "11",
        maille: "REG",
        jalon: 2025,
        ecart: -15,
      });

      // When
      const result = await query.execute({
        territoireCode: "REG-11",
        jalon: 2025,
        chantierIds: [chantier.id],
        typesAlerte: ["estEnAlerteÉcart", "estEnAlerteMétéoNonRenseignée"],
      });

      // Then — une seule entrée, avec les 2 catégories
      expect(result).toEqual([
        {
          id: chantier.id,
          nom: `${chantier.id} — Chantier double alerte`,
          meteo: "NON_RENSEIGNEE",
          ecart: -15,
          typesAlerte: ["estEnAlerteÉcart", "estEnAlerteMétéoNonRenseignée"],
        },
      ]);
    }),
  );
});
