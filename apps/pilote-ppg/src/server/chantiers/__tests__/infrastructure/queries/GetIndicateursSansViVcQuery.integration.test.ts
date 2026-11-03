import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import {
  GetIndicateursSansViVcQuery,
  type LigneIndicateurSansViVc,
  type ValeursRecherchees,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";

const JALON = 2026;

const FINISTERE = {
  territoire_code: "DEPT-29",
  code_insee: "29",
  maille: "DEPT",
  zone_id: "D29",
  territoire_nom: "Finistère",
} as const;
const ILLE_ET_VILAINE = {
  territoire_code: "DEPT-35",
  code_insee: "35",
  maille: "DEPT",
  zone_id: "D35",
  territoire_nom: "Ille-et-Vilaine",
} as const;

type TerritoireTest = typeof FINISTERE | typeof ILLE_ET_VILAINE;

async function seedIndicateur({
  chantierStatut = "PUBLIE",
  indicateurStatut = "PUBLIE",
}: {
  chantierStatut?: "PUBLIE" | "BROUILLON";
  indicateurStatut?: "PUBLIE" | "SUPPRIME";
} = {}) {
  await fixtures.chantierIdentite({ id: "CH-SVV", statut: chantierStatut });
  for (const territoire of [FINISTERE, ILLE_ET_VILAINE]) {
    await fixtures.chantierTerritoire({
      id: "CH-SVV",
      territoire_code: territoire.territoire_code,
      code_insee: territoire.code_insee,
      maille: territoire.maille,
      zone_id: territoire.zone_id,
    });
  }
  await fixtures.indicateurIdentite({
    id: "IND-SVV",
    chantier_id: "CH-SVV",
    nom: "Nombre de bornes",
    statut: indicateurStatut,
  });
}

async function seedTerritoire({
  territoire = FINISTERE,
  valeurInitiale = 10,
  estApplicable = true,
  jalons = { [JALON]: 100 },
}: {
  territoire?: TerritoireTest;
  valeurInitiale?: number | null;
  estApplicable?: boolean;
  jalons?: Record<number, number | null>;
} = {}) {
  await fixtures.indicateurTerritoire({
    id: "IND-SVV",
    chantier_id: "CH-SVV",
    ...territoire,
    est_applicable: estApplicable,
    valeur_initiale: valeurInitiale,
  });
  for (const [jalon, valeurCible] of Object.entries(jalons)) {
    await fixtures.indicateurTerritoireJalon({
      id: "IND-SVV",
      territoire_code: territoire.territoire_code,
      code_insee: territoire.code_insee,
      maille: territoire.maille,
      zone_id: territoire.zone_id,
      jalon: Number(jalon),
      valeur_cible: valeurCible,
    });
  }
}

const ligne = (
  overrides: Partial<LigneIndicateurSansViVc>,
): LigneIndicateurSansViVc => ({
  chantierId: "CH-SVV",
  chantierNom: "Chantier CH-SVV",
  indicateurId: "IND-SVV",
  indicateurNom: "Nombre de bornes",
  maille: "DEPT",
  territoireCode: "DEPT-29",
  territoireNom: "Finistère",
  viManquante: false,
  vcManquante: false,
  derniereVcConnue: null,
  ...overrides,
});

describe("GetIndicateursSansViVcQuery", () => {
  const query = new GetIndicateursSansViVcQuery({
    prisma: new PrismaPilote(),
  });

  const executer = (valeurs: ValeursRecherchees = "vi_et_vc") =>
    query.execute({
      chantierIds: ["CH-SVV"],
      territoireCodes: ["DEPT-29", "DEPT-35"],
      jalon: JALON,
      valeurs,
    });

  it(
    "signale la VI nulle",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ valeurInitiale: null });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([ligne({ viManquante: true })]);
    }),
  );

  it(
    "ne signale pas une VI à 0",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ valeurInitiale: 0 });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "signale la VC nulle au jalon",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ jalons: { [JALON]: null } });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([ligne({ vcManquante: true })]);
    }),
  );

  it(
    "ne signale pas une VC à 0",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ jalons: { [JALON]: 0 } });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un territoire sans ligne pour le jalon",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ jalons: {} });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore une VC nulle sur un autre jalon",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ jalons: { 2025: null, [JALON]: 100 } });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un territoire non applicable",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ valeurInitiale: null, estApplicable: false });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un indicateur non publié",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur({ indicateurStatut: "SUPPRIME" });
      await seedTerritoire({ valeurInitiale: null });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un chantier non publié",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur({ chantierStatut: "BROUILLON" });
      await seedTerritoire({ valeurInitiale: null });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un territoire hors périmètre",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ valeurInitiale: null });

      // when
      const result = await query.execute({
        chantierIds: ["CH-SVV"],
        territoireCodes: ["DEPT-35"],
        jalon: JALON,
        valeurs: "vi_et_vc",
      });

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "signale VI sur un territoire et VC sur un autre, chacun avec son motif",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ valeurInitiale: null });
      await seedTerritoire({
        territoire: ILLE_ET_VILAINE,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([
        ligne({ viManquante: true }),
        ligne({
          territoireCode: "DEPT-35",
          territoireNom: "Ille-et-Vilaine",
          vcManquante: true,
        }),
      ]);
    }),
  );

  it(
    "donne une seule ligne, avec les deux motifs, pour un territoire sans VI ni VC",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ valeurInitiale: null, jalons: { [JALON]: null } });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([ligne({ viManquante: true, vcManquante: true })]);
    }),
  );

  it(
    "en recherche vc, ne remonte pas un territoire seulement sans VI et ne marque pas viManquante",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ valeurInitiale: null });
      await seedTerritoire({
        territoire: ILLE_ET_VILAINE,
        valeurInitiale: null,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer("vc");

      // then
      expect(result).toEqual([
        ligne({
          territoireCode: "DEPT-35",
          territoireNom: "Ille-et-Vilaine",
          vcManquante: true,
        }),
      ]);
    }),
  );

  it(
    "en recherche vi, ne remonte pas un territoire seulement sans VC et ne marque pas vcManquante",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ jalons: { [JALON]: null } });
      await seedTerritoire({
        territoire: ILLE_ET_VILAINE,
        valeurInitiale: null,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer("vi");

      // then
      expect(result).toEqual([
        ligne({
          territoireCode: "DEPT-35",
          territoireNom: "Ille-et-Vilaine",
          viManquante: true,
        }),
      ]);
    }),
  );

  it(
    "dernière VC connue : le jalon antérieur le plus récent non nul",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({
        jalons: { 2023: 50, 2024: 100, 2025: null, [JALON]: null },
      });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([
        ligne({
          vcManquante: true,
          derniereVcConnue: { valeur: 100, jalon: 2024 },
        }),
      ]);
    }),
  );

  it(
    "dernière VC connue à 0",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ jalons: { 2025: 0, [JALON]: null } });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([
        ligne({
          vcManquante: true,
          derniereVcConnue: { valeur: 0, jalon: 2025 },
        }),
      ]);
    }),
  );

  it(
    "dernière VC connue : ignore un jalon postérieur",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({ jalons: { [JALON]: null, 2027: 50 } });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([ligne({ vcManquante: true })]);
    }),
  );

  it(
    "derniereVcConnue est null pour une ligne en VI manquante seule",
    createIntegrationTest(async () => {
      // given
      await seedIndicateur();
      await seedTerritoire({
        valeurInitiale: null,
        jalons: { 2025: 80, [JALON]: 100 },
      });

      // when
      const result = await executer();

      // then
      expect(result).toEqual([ligne({ viManquante: true })]);
    }),
  );
});
