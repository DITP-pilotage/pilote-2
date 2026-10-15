import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";

describe("GetIndicateurContexteQuery", () => {
  let query: GetIndicateurContexteQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new GetIndicateurContexteQuery({ prisma: prismaPilote });
  });

  it(
    "retourne le contexte de l'indicateur avec les drapeaux d'agrégation",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier de test",
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur de test",
        description: "Description de test",
        unite_mesure: "%",
        maille_nat_agregee: true,
        maille_reg_agregee: false,
      });

      // When
      const result = await query.execute({ indicateurId: indicateur.id });

      // Then
      expect(result).toEqual({
        id: indicateur.id,
        nom: "Indicateur de test",
        description: "Description de test",
        uniteMesure: "%",
        chantier: { id: chantier.id, nom: "Chantier de test" },
        mailleNatAgregee: true,
        mailleRegAgregee: false,
        explicationValeurAffichee: null,
      });
    }),
  );

  it(
    "explique la construction de la valeur affichée à partir du paramétrage de l'indicateur",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
      });
      await fixtures.metadataParametrageIndicateurs({
        indic_id: indicateur.id,
        param_vaca_decumul_from: "_",
        param_vaca_partition_date: "from_year_start",
        param_vaca_op: "sum",
      });

      // When
      const result = await query.execute({ indicateurId: indicateur.id });

      // Then
      expect(result?.explicationValeurAffichee).toEqual(
        "La valeur affichée dans PILOTE est la somme des valeurs importées depuis janvier de l'année, jusqu'à la date de la valeur.",
      );
    }),
  );

  it(
    "retourne null quand l'indicateur n'existe pas",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute({ indicateurId: "IND-INEXISTANT" });

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne null quand l'indicateur a le statut SUPPRIME",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: $Enums.type_statut_indicateur.SUPPRIME,
      });

      // When
      const result = await query.execute({ indicateurId: indicateur.id });

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "retourne null quand le chantier parent n'est pas publié",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite({
        statut: $Enums.type_statut.ARCHIVE,
      });
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        statut: $Enums.type_statut_indicateur.PUBLIE,
      });

      // When
      const result = await query.execute({ indicateurId: indicateur.id });

      // Then
      expect(result).toBeNull();
    }),
  );
});
