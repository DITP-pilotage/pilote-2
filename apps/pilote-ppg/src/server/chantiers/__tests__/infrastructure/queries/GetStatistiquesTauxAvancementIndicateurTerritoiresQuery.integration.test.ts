import { $Enums } from "@prisma/client";
import { ProfilEnum } from "@/shared/profil/ProfilEnum";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { GetStatistiquesTauxAvancementIndicateurTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/GetStatistiquesTauxAvancementIndicateurTerritoiresQuery";
import { ListerDetailsIndicateurTerritoireUseCase } from "@/server/chantiers/usecases/ListerDetailsIndicateurTerritoireUseCase";
import { DatajobsExecutionQueries } from "@/server/datajobs-execution/DatajobsExecution";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

function habilitationsPourChantier(
  chantierId: string,
  territoires: string[],
): Habilitations {
  return {
    lecture: {
      chantiers: [chantierId],
      territoires,
      périmètres: [],
    },
    saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
    saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
    responsabilite: { chantiers: [], territoires: [], périmètres: [] },
    gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
  };
}

async function créerIndicateurAvecTerritoires(
  territoires: {
    code: string;
    codeInsee: string;
    maille: $Enums.Maille;
    zoneId: string;
    tauxAvancement: number | null;
    estApplicable: boolean;
  }[],
) {
  const chantier = await fixtures.chantierIdentite();
  const indicateur = await fixtures.indicateurIdentite({
    chantier_id: chantier.id,
    statut: "PUBLIE",
  });

  for (const t of territoires) {
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: t.code,
      maille: t.maille,
      code_insee: t.codeInsee,
      zone_id: t.zoneId,
    });
    await fixtures.indicateurTerritoire({
      id: indicateur.id,
      chantier_id: chantier.id,
      territoire_code: t.code,
      code_insee: t.codeInsee,
      maille: t.maille,
      zone_id: t.zoneId,
      est_applicable: t.estApplicable,
    });
    await fixtures.indicateurTerritoireJalon({
      id: indicateur.id,
      territoire_code: t.code,
      code_insee: t.codeInsee,
      maille: t.maille,
      zone_id: t.zoneId,
      jalon: 2025,
      taux_avancement: t.tauxAvancement,
    });
  }

  return { chantier, indicateur };
}

describe("GetStatistiquesTauxAvancementIndicateurTerritoiresQuery", () => {
  const prismaPilote = new PrismaPilote();
  let query: GetStatistiquesTauxAvancementIndicateurTerritoiresQuery;

  beforeEach(() => {
    const indicateurRepository = new PrismaIndicateurRepository({
      prisma: prismaPilote,
    });
    const datajobsExecutionQueries = new DatajobsExecutionQueries({
      prisma: prismaPilote,
    });

    query = new GetStatistiquesTauxAvancementIndicateurTerritoiresQuery({
      listerDetailsIndicateurTerritoireUseCase:
        new ListerDetailsIndicateurTerritoireUseCase({
          indicateurRepository,
          datajobsExecutionQueries,
        }),
    });
  });

  it(
    "calcule minimum, médiane et maximum des taux d'avancement pour des territoires départementaux",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await créerIndicateurAvecTerritoires([
        {
          code: "DEPT-75",
          codeInsee: "75",
          maille: "DEPT",
          zoneId: "D75",
          tauxAvancement: 30,
          estApplicable: true,
        },
        {
          code: "DEPT-92",
          codeInsee: "92",
          maille: "DEPT",
          zoneId: "D92",
          tauxAvancement: 50,
          estApplicable: true,
        },
        {
          code: "DEPT-93",
          codeInsee: "93",
          maille: "DEPT",
          zoneId: "D93",
          tauxAvancement: 70,
          estApplicable: true,
        },
      ]);

      // when
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        maille: "departementale",
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, [
          "DEPT-75",
          "DEPT-92",
          "DEPT-93",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual({
        minimum: 30,
        médiane: 50,
        maximum: 70,
      });
    }),
  );

  it(
    "exclut les territoires non applicables du calcul",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await créerIndicateurAvecTerritoires([
        {
          code: "DEPT-75",
          codeInsee: "75",
          maille: "DEPT",
          zoneId: "D75",
          tauxAvancement: 10,
          estApplicable: false,
        },
        {
          code: "DEPT-92",
          codeInsee: "92",
          maille: "DEPT",
          zoneId: "D92",
          tauxAvancement: 50,
          estApplicable: true,
        },
        {
          code: "DEPT-93",
          codeInsee: "93",
          maille: "DEPT",
          zoneId: "D93",
          tauxAvancement: 90,
          estApplicable: true,
        },
      ]);

      // when
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        maille: "departementale",
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, [
          "DEPT-75",
          "DEPT-92",
          "DEPT-93",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual({
        minimum: 50,
        médiane: 70,
        maximum: 90,
      });
    }),
  );

  it(
    "filtre par maille régionale en ignorant les territoires départementaux",
    createIntegrationTest(async () => {
      // given
      const { chantier, indicateur } = await créerIndicateurAvecTerritoires([
        {
          code: "REG-11",
          codeInsee: "11",
          maille: "REG",
          zoneId: "R11",
          tauxAvancement: 20,
          estApplicable: true,
        },
        {
          code: "DEPT-75",
          codeInsee: "75",
          maille: "DEPT",
          zoneId: "D75",
          tauxAvancement: 99,
          estApplicable: true,
        },
      ]);

      // when
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        maille: "regionale",
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, [
          "REG-11",
          "DEPT-75",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then
      expect(result).toEqual({
        minimum: 20,
        médiane: 20,
        maximum: 20,
      });
    }),
  );

  it(
    "filtre par maille départementale en ignorant les territoires régionaux",
    createIntegrationTest(async () => {
      // given — 3 DEPT + 1 REG
      const { chantier, indicateur } = await créerIndicateurAvecTerritoires([
        {
          code: "DEPT-75",
          codeInsee: "75",
          maille: "DEPT",
          zoneId: "D75",
          tauxAvancement: 20,
          estApplicable: true,
        },
        {
          code: "DEPT-92",
          codeInsee: "92",
          maille: "DEPT",
          zoneId: "D92",
          tauxAvancement: 40,
          estApplicable: true,
        },
        {
          code: "DEPT-93",
          codeInsee: "93",
          maille: "DEPT",
          zoneId: "D93",
          tauxAvancement: 60,
          estApplicable: true,
        },
        {
          code: "REG-11",
          codeInsee: "11",
          maille: "REG",
          zoneId: "R11",
          tauxAvancement: 80,
          estApplicable: true,
        },
      ]);

      // when — only DEPT territories are used for departementale
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        maille: "departementale",
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, [
          "DEPT-75",
          "DEPT-92",
          "DEPT-93",
          "REG-11",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then — median of [20, 40, 60] = 40 (3 DEPT values, REG-11 excluded)
      expect(result).toEqual({
        minimum: 20,
        médiane: 40,
        maximum: 60,
      });
    }),
  );

  it(
    "calcule la médiane pour un nombre pair de valeurs",
    createIntegrationTest(async () => {
      // given — 4 DEPT values
      const { chantier, indicateur } = await créerIndicateurAvecTerritoires([
        {
          code: "DEPT-75",
          codeInsee: "75",
          maille: "DEPT",
          zoneId: "D75",
          tauxAvancement: 20,
          estApplicable: true,
        },
        {
          code: "DEPT-92",
          codeInsee: "92",
          maille: "DEPT",
          zoneId: "D92",
          tauxAvancement: 40,
          estApplicable: true,
        },
        {
          code: "DEPT-93",
          codeInsee: "93",
          maille: "DEPT",
          zoneId: "D93",
          tauxAvancement: 60,
          estApplicable: true,
        },
        {
          code: "DEPT-94",
          codeInsee: "94",
          maille: "DEPT",
          zoneId: "D94",
          tauxAvancement: 80,
          estApplicable: true,
        },
      ]);

      // when
      const result = await query.execute({
        indicateurId: indicateur.id,
        chantierId: chantier.id,
        maille: "departementale",
        jalon: 2025,
        habilitations: habilitationsPourChantier(chantier.id, [
          "DEPT-75",
          "DEPT-92",
          "DEPT-93",
          "DEPT-94",
        ]),
        profil: ProfilEnum.DITP_ADMIN,
      });

      // then — median of [20, 40, 60, 80] = (40 + 60) / 2 = 50
      expect(result).toEqual({
        minimum: 20,
        médiane: 50,
        maximum: 80,
      });
    }),
  );
});
