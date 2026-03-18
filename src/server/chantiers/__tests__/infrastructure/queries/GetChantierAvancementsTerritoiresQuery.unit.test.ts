import { GetChantierAvancementsTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/GetChantierAvancementsTerritoiresQuery";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Profil";

function créerChantierAvecMailles(
  regionale: Record<
    string,
    {
      territoireCode: string;
      avancementAnnuel: number | null;
      estApplicable: boolean | null;
      dateTauxAvancementAnnuel: string | null;
    }
  > = {},
  departementale: Record<
    string,
    {
      territoireCode: string;
      avancementAnnuel: number | null;
      estApplicable: boolean | null;
      dateTauxAvancementAnnuel: string | null;
    }
  > = {},
): Chantier {
  const toMailleData = (
    entries: Record<
      string,
      {
        territoireCode: string;
        avancementAnnuel: number | null;
        estApplicable: boolean | null;
        dateTauxAvancementAnnuel: string | null;
      }
    >,
  ) =>
    Object.fromEntries(
      Object.entries(entries).map(([codeInsee, data]) => [
        codeInsee,
        {
          territoireCode: data.territoireCode,
          codeInsee,
          avancement: {
            annuel: data.avancementAnnuel,
            global: null,
          },
          avancementPrécédent: { annuel: null, global: null },
          météo: "NON_RENSEIGNEE" as const,
          écart: null,
          tendance: null,
          dateDeMàjDonnéesQualitatives: null,
          dateDeMàjDonnéesQuantitatives: null,
          dateTauxAvancementAnnuel: data.dateTauxAvancementAnnuel,
          estApplicable: data.estApplicable,
          responsableLocal: [],
          coordinateurTerritorial: [],
          mailleSourceDonnees: null,
          nombrePropositionValeur: 0,
          nombrePropositionValeurPonderee: 0,
          dateTauxAvancementPrecedent: null,
        },
      ]),
    );

  return {
    id: "CH-001",
    nom: "Chantier test",
    axe: "",
    ppg: "",
    périmètreIds: [],
    maillesApplicables: [],
    mailles: {
      nationale: {},
      regionale: toMailleData(regionale),
      departementale: toMailleData(departementale),
    },
    responsables: {
      porteur: null,
      coporteurs: [],
      directeursAdminCentrale: [],
      directeursProjet: [],
    },
    estBaromètre: false,
    estTerritorialisé: false,
    tauxAvancementDonnéeTerritorialisée: {
      regionale: false,
      departementale: false,
    },
    météoDonnéeTerritorialisée: {
      regionale: false,
      departementale: false,
    },
    ate: null,
    statut: "PUBLIE",
    cibleAttendu: false,
    territoiresApplicables: [],
  };
}

function créerTerritoire(
  code: string,
  nomAffiché: string,
  codeInsee: string,
): Territoire {
  return {
    code,
    nom: nomAffiché,
    nomAffiché,
    codeInsee,
    codeParent: null,
    maille: "regionale",
  };
}

const defaultParams = {
  chantierId: "CH-001",
  jalon: 2025,
  habilitations: {} as Habilitations,
  profil: "DITP_ADMIN" as ProfilCode,
};

describe("GetChantierAvancementsTerritoiresQuery", () => {
  it("mappe les territoires régionaux avec les bons champs", async () => {
    // Given
    const chantier = créerChantierAvecMailles({
      "11": {
        territoireCode: "REG-11",
        avancementAnnuel: 75.5,
        estApplicable: true,
        dateTauxAvancementAnnuel: "2025-06-15",
      },
    });

    const query = new GetChantierAvancementsTerritoiresQuery({
      recupererChantierUseCaseV2: { run: async () => chantier },
      territoireRepository: {
        récupérerTousNew: async () => [
          créerTerritoire("REG-11", "Île-de-France", "11"),
        ],
      },
    } as never);

    // When
    const result = await query.execute(defaultParams);

    // Then
    expect(result).toEqual([
      {
        territoireCode: "REG-11",
        territoireNom: "Île-de-France",
        codeInsee: "11",
        maille: "REG",
        avancementAnnuel: 75.5,
        estApplicable: true,
        dateTauxAvancementAnnuel: "2025-06-15",
      },
    ]);
  });

  it("mappe les territoires départementaux avec maille DEPT", async () => {
    // Given
    const chantier = créerChantierAvecMailles(
      {},
      {
        "75": {
          territoireCode: "DEPT-75",
          avancementAnnuel: 42,
          estApplicable: true,
          dateTauxAvancementAnnuel: "2025-03-10",
        },
      },
    );

    const query = new GetChantierAvancementsTerritoiresQuery({
      recupererChantierUseCaseV2: { run: async () => chantier },
      territoireRepository: {
        récupérerTousNew: async () => [
          créerTerritoire("DEPT-75", "Paris", "75"),
        ],
      },
    } as never);

    // When
    const result = await query.execute(defaultParams);

    // Then
    expect(result).toEqual([
      {
        territoireCode: "DEPT-75",
        territoireNom: "Paris",
        codeInsee: "75",
        maille: "DEPT",
        avancementAnnuel: 42,
        estApplicable: true,
        dateTauxAvancementAnnuel: "2025-03-10",
      },
    ]);
  });

  it("retourne les territoires REG et DEPT combinés", async () => {
    // Given
    const chantier = créerChantierAvecMailles(
      {
        "11": {
          territoireCode: "REG-11",
          avancementAnnuel: 60,
          estApplicable: true,
          dateTauxAvancementAnnuel: null,
        },
      },
      {
        "75": {
          territoireCode: "DEPT-75",
          avancementAnnuel: 30,
          estApplicable: true,
          dateTauxAvancementAnnuel: null,
        },
      },
    );

    const query = new GetChantierAvancementsTerritoiresQuery({
      recupererChantierUseCaseV2: { run: async () => chantier },
      territoireRepository: {
        récupérerTousNew: async () => [
          créerTerritoire("REG-11", "Île-de-France", "11"),
          créerTerritoire("DEPT-75", "Paris", "75"),
        ],
      },
    } as never);

    // When
    const result = await query.execute(defaultParams);

    // Then
    expect(result).toEqual([
      expect.objectContaining({ territoireCode: "REG-11", maille: "REG" }),
      expect.objectContaining({ territoireCode: "DEPT-75", maille: "DEPT" }),
    ]);
  });

  it("gère un avancementAnnuel null", async () => {
    // Given
    const chantier = créerChantierAvecMailles({
      "11": {
        territoireCode: "REG-11",
        avancementAnnuel: null,
        estApplicable: true,
        dateTauxAvancementAnnuel: null,
      },
    });

    const query = new GetChantierAvancementsTerritoiresQuery({
      recupererChantierUseCaseV2: { run: async () => chantier },
      territoireRepository: {
        récupérerTousNew: async () => [
          créerTerritoire("REG-11", "Île-de-France", "11"),
        ],
      },
    } as never);

    // When
    const result = await query.execute(defaultParams);

    // Then
    expect(result).toEqual([
      expect.objectContaining({
        territoireCode: "REG-11",
        avancementAnnuel: null,
      }),
    ]);
  });

  it("utilise une chaîne vide quand le territoire n'est pas trouvé dans le repository", async () => {
    // Given
    const chantier = créerChantierAvecMailles({
      "11": {
        territoireCode: "REG-11",
        avancementAnnuel: 50,
        estApplicable: true,
        dateTauxAvancementAnnuel: null,
      },
    });

    const query = new GetChantierAvancementsTerritoiresQuery({
      recupererChantierUseCaseV2: { run: async () => chantier },
      territoireRepository: {
        // territoire REG-11 absent du repository
        récupérerTousNew: async () => [],
      },
    } as never);

    // When
    const result = await query.execute(defaultParams);

    // Then
    expect(result).toEqual([
      expect.objectContaining({
        territoireCode: "REG-11",
        territoireNom: "",
      }),
    ]);
  });

  it("retourne un tableau vide quand le chantier n'a pas de données territoriales", async () => {
    // Given
    const chantier = créerChantierAvecMailles();

    const query = new GetChantierAvancementsTerritoiresQuery({
      recupererChantierUseCaseV2: { run: async () => chantier },
      territoireRepository: {
        récupérerTousNew: async () => [],
      },
    } as never);

    // When
    const result = await query.execute(defaultParams);

    // Then
    expect(result).toEqual([]);
  });
});
