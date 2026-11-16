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
  const chantier = await fixtures.chantierIdentite({ statut: chantierStatut });
  for (const territoire of [FINISTERE, ILLE_ET_VILAINE]) {
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: territoire.territoire_code,
      code_insee: territoire.code_insee,
      maille: territoire.maille,
      zone_id: territoire.zone_id,
    });
  }
  const indicateur = await fixtures.indicateurIdentite({
    chantier_id: chantier.id,
    nom: "Nombre de bornes",
    statut: indicateurStatut,
  });
  return { chantier, indicateur };
}

async function seedTerritoire({
  chantierId,
  indicateurId,
  territoire = FINISTERE,
  valeurInitiale = 10,
  estApplicable = true,
  jalons = { [JALON]: 100 },
}: {
  chantierId: string;
  indicateurId: string;
  territoire?: TerritoireTest;
  valeurInitiale?: number | null;
  estApplicable?: boolean;
  jalons?: Record<number, number | null>;
}) {
  await fixtures.indicateurTerritoire({
    id: indicateurId,
    chantier_id: chantierId,
    ...territoire,
    est_applicable: estApplicable,
    valeur_initiale: valeurInitiale,
  });
  for (const [jalon, valeurCible] of Object.entries(jalons)) {
    await fixtures.indicateurTerritoireJalon({
      id: indicateurId,
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
  chantier: { id: string; nom: string },
  indicateur: { id: string },
  overrides: Partial<LigneIndicateurSansViVc>,
): LigneIndicateurSansViVc => ({
  chantierId: chantier.id,
  chantierNom: chantier.nom,
  indicateurId: indicateur.id,
  indicateurNom: "Nombre de bornes",
  maille: "DEPT",
  territoireCode: "DEPT-29",
  territoireNom: "Finistère",
  territoireNomAffiche: "29 - Finistère",
  viManquante: false,
  vcManquante: false,
  derniereVcConnue: null,
  ...overrides,
});

describe("GetIndicateursSansViVcQuery", () => {
  const query = new GetIndicateursSansViVcQuery({
    prisma: new PrismaPilote(),
  });

  const executer = (
    chantierId: string,
    valeurs: ValeursRecherchees = "vi_et_vc",
  ) =>
    query.execute({
      chantierIds: [chantierId],
      territoireCodes: ["DEPT-29", "DEPT-35"],
      jalon: JALON,
      valeurs,
    });

  it(
    "signale la VI nulle",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, { viManquante: true }),
      ]);
    }),
  );

  it(
    "ne signale pas une VI à 0",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: 0,
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "signale la VC nulle au jalon",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, { vcManquante: true }),
      ]);
    }),
  );

  it(
    "ne signale pas une VC à 0",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: { [JALON]: 0 },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un territoire sans ligne pour le jalon",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: {},
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore une VC nulle sur un autre jalon",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: { 2025: null, [JALON]: 100 },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un territoire non applicable",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
        estApplicable: false,
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un indicateur non publié",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur({
        indicateurStatut: "SUPPRIME",
      });
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un chantier non publié",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur({
        chantierStatut: "BROUILLON",
      });
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([]);
    }),
  );

  it(
    "ignore un territoire hors périmètre",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
      });

      // when
      const result = await query.execute({
        chantierIds: [chantier.id],
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
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
      });
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        territoire: ILLE_ET_VILAINE,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, { viManquante: true }),
        ligne(chantier, indicateur, {
          territoireCode: "DEPT-35",
          territoireNom: "Ille-et-Vilaine",
          territoireNomAffiche: "35 - Ille-et-Vilaine",
          vcManquante: true,
        }),
      ]);
    }),
  );

  it(
    "donne une seule ligne, avec les deux motifs, pour un territoire sans VI ni VC",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, { viManquante: true, vcManquante: true }),
      ]);
    }),
  );

  it(
    "en recherche vc, ne remonte pas un territoire seulement sans VI et ne marque pas viManquante",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
      });
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        territoire: ILLE_ET_VILAINE,
        valeurInitiale: null,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer(chantier.id, "vc");

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, {
          territoireCode: "DEPT-35",
          territoireNom: "Ille-et-Vilaine",
          territoireNomAffiche: "35 - Ille-et-Vilaine",
          vcManquante: true,
        }),
      ]);
    }),
  );

  it(
    "en recherche vi, ne remonte pas un territoire seulement sans VC et ne marque pas vcManquante",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: { [JALON]: null },
      });
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        territoire: ILLE_ET_VILAINE,
        valeurInitiale: null,
        jalons: { [JALON]: null },
      });

      // when
      const result = await executer(chantier.id, "vi");

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, {
          territoireCode: "DEPT-35",
          territoireNom: "Ille-et-Vilaine",
          territoireNomAffiche: "35 - Ille-et-Vilaine",
          viManquante: true,
        }),
      ]);
    }),
  );

  it(
    "dernière VC connue : le jalon antérieur le plus récent non nul",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: { 2023: 50, 2024: 100, 2025: null, [JALON]: null },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, {
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
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: { 2025: 0, [JALON]: null },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, {
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
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        jalons: { [JALON]: null, 2027: 50 },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, { vcManquante: true }),
      ]);
    }),
  );

  it(
    "derniereVcConnue est null pour une ligne en VI manquante seule",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await seedIndicateur();
      await seedTerritoire({
        chantierId: chantier.id,
        indicateurId: indicateur.id,
        valeurInitiale: null,
        jalons: { 2025: 80, [JALON]: 100 },
      });

      // when
      const result = await executer(chantier.id);

      // then
      expect(result).toEqual([
        ligne(chantier, indicateur, { viManquante: true }),
      ]);
    }),
  );
});
