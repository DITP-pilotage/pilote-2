import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";

describe("GetChantiersQuery — plusieurs territoires", () => {
  const query = new GetChantiersQuery({ prisma: new PrismaPilote() });

  const semerChantier = async () => {
    const chantier = await fixtures.chantierIdentite({
      nom: "Chantier suivi",
      axe: "Axe 1",
      ppg: "PPG 1",
      ministeres_acronymes: ["MIN-01"],
      statut: "PUBLIE",
    });
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: "REG-53",
      code_insee: "53",
      maille: "REG",
      zone_id: "REG-53",
      est_applicable: true,
    });
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: "DEPT-29",
      code_insee: "29",
      maille: "DEPT",
      zone_id: "DEPT-29",
      est_applicable: true,
    });
    return chantier;
  };

  it(
    "renvoie un résultat par territoire, dans l'ordre des codes demandés",
    createIntegrationTest(async () => {
      // Given
      const chantier = await semerChantier();

      // When
      const resultats = await query.execute({
        territoireCodes: ["DEPT-29", "REG-53"],
        jalon: 2025,
        chantierIds: [chantier.id],
      });

      // Then
      expect(
        resultats.map((resultat) => ({
          territoire_code: resultat.territoire_code,
          chantiers: resultat.chantiers.map((chantier) => chantier.chantier.id),
        })),
      ).toEqual([
        { territoire_code: "DEPT-29", chantiers: [chantier.id] },
        { territoire_code: "REG-53", chantiers: [chantier.id] },
      ]);
    }),
  );

  it(
    "renvoie un territoire sans chantier avec une liste vide",
    createIntegrationTest(async () => {
      // Given
      const chantier = await semerChantier();

      // When
      const resultats = await query.execute({
        territoireCodes: ["REG-53", "DEPT-35"],
        jalon: 2025,
        chantierIds: [chantier.id],
      });

      // Then
      expect(
        resultats.map((resultat) => ({
          territoire_code: resultat.territoire_code,
          chantiers: resultat.chantiers.length,
        })),
      ).toEqual([
        { territoire_code: "REG-53", chantiers: 1 },
        { territoire_code: "DEPT-35", chantiers: 0 },
      ]);
    }),
  );

  it(
    "refuse un code de territoire inconnu",
    createIntegrationTest(async () => {
      // When / Then
      await expect(
        query.execute({
          territoireCodes: ["REG-53", "REG-999"],
          jalon: 2025,
        }),
      ).rejects.toThrow("Territoires inconnus : REG-999");
    }),
  );
});

describe("GetChantiersQuery — taux d'avancement", () => {
  const query = new GetChantiersQuery({ prisma: new PrismaPilote() });

  it(
    "renvoie un taux d'avancement nul quand celui du jalon n'est pas calculé, sans se rabattre sur le taux mandat",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        ministeres_acronymes: ["MIN-01"],
        statut: "PUBLIE",
      });
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-29",
        code_insee: "29",
        maille: "DEPT",
        zone_id: "DEPT-29",
        est_applicable: true,
        // Le taux mandat est renseigné, celui du jalon 2026 ne l'est pas
        taux_avancement_mandat: 89.675,
      });
      await fixtures.chantierTerritoireJalon({
        id: chantier.id,
        territoire_code: "DEPT-29",
        code_insee: "29",
        maille: "DEPT",
        zone_id: "DEPT-29",
        jalon: 2026,
        taux_avancement: null,
      });

      // When
      const [resultat] = await query.execute({
        territoireCodes: ["DEPT-29"],
        jalon: 2026,
      });

      // Then
      expect(resultat.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: chantier.id }),
          taux_avancement: null,
        }),
      ]);
    }),
  );
});

describe("GetChantiersQuery — synthèse des résultats", () => {
  const query = new GetChantiersQuery({ prisma: new PrismaPilote() });

  const semerChantierEnBretagne = async () => {
    const chantier = await fixtures.chantierIdentite({
      ministeres_acronymes: ["MIN-01"],
      statut: "PUBLIE",
    });
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: "REG-53",
      code_insee: "53",
      maille: "REG",
      zone_id: "REG-53",
      est_applicable: true,
    });
    return chantier;
  };

  const territoireBretagne = {
    territoire_code: "REG-53",
    maille: "REG",
    code_insee: "53",
  };

  it(
    "lit la dernière synthèse publiée, pas un brouillon plus récent",
    createIntegrationTest(async () => {
      // Given
      const chantier = await semerChantierEnBretagne();
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        ...territoireBretagne,
        statut: $Enums.statut_publication.PUBLIE,
        commentaire: "Synthèse publiée",
        meteo: "NUAGE",
        date_modification: new Date("2026-01-01"),
      });
      // Un brouillon enregistré sans météo porte NON_RENSEIGNEE
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        ...territoireBretagne,
        statut: $Enums.statut_publication.BROUILLON,
        commentaire: "Brouillon",
        meteo: "NON_RENSEIGNEE",
        date_modification: new Date("2026-02-01"),
      });

      // When
      const [resultat] = await query.execute({
        territoireCodes: ["REG-53"],
        jalon: 2026,
        chantierIds: [chantier.id],
      });

      // Then
      expect(
        resultat.chantiers.map(({ synthese }) => ({
          commentaire: synthese?.commentaire,
          meteo: synthese?.meteo,
        })),
      ).toEqual([{ commentaire: "Synthèse publiée", meteo: "NUAGE" }]);
    }),
  );

  it(
    "ne renvoie pas de synthèse quand le chantier n'a qu'un brouillon",
    createIntegrationTest(async () => {
      // Given
      const chantier = await semerChantierEnBretagne();
      await fixtures.syntheseDesResultats({
        chantier_id: chantier.id,
        ...territoireBretagne,
        statut: $Enums.statut_publication.BROUILLON,
        commentaire: "Brouillon",
      });

      // When
      const [resultat] = await query.execute({
        territoireCodes: ["REG-53"],
        jalon: 2026,
        chantierIds: [chantier.id],
      });

      // Then
      expect(resultat.chantiers.map(({ synthese }) => synthese)).toEqual([
        null,
      ]);
    }),
  );
});
