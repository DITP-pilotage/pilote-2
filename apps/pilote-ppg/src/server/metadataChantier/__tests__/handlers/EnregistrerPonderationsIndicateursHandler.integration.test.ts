import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerPonderationsIndicateursHandler } from "@/server/metadataChantier/handlers/EnregistrerPonderationsIndicateursHandler";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { BadRequestError } from "@/server/app/error-boundary/bad-request-error";

describe("EnregistrerPonderationsIndicateursHandler", () => {
  let handler: EnregistrerPonderationsIndicateursHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new EnregistrerPonderationsIndicateursHandler({
      prisma: prismaPilote,
    });
  });

  it(
    "enregistre les pondérations quand la somme par maille applicable vaut 100",
    createIntegrationTest(async () => {
      // Given
      await fixtures.metadataChantier({ chantier_id: "CH-010" });
      const indicateur1 = await fixtures.metadataIndicateurHidden({
        indic_id: "IND-001",
        indic_parent_ch: "CH-010",
      });
      const indicateur2 = await fixtures.metadataIndicateurHidden({
        indic_id: "IND-002",
        indic_parent_ch: "CH-010",
      });
      await fixtures.metadataIndicateurComplementaire({
        indic_id: indicateur1.indic_id,
        indic_territorialise: false,
      });
      await fixtures.metadataIndicateurComplementaire({
        indic_id: indicateur2.indic_id,
        indic_territorialise: false,
      });
      await fixtures.metadataParametrageIndicateurs({
        indic_id: indicateur1.indic_id,
      });
      await fixtures.metadataParametrageIndicateurs({
        indic_id: indicateur2.indic_id,
      });

      // When
      await handler.execute({
        lignes: [
          {
            indicId: indicateur1.indic_id,
            poidsPourcentDept: null,
            poidsPourcentReg: null,
            poidsPourcentNat: 40,
          },
          {
            indicId: indicateur2.indic_id,
            poidsPourcentDept: null,
            poidsPourcentReg: null,
            poidsPourcentNat: 60,
          },
        ],
      });

      // Then
      const parametrage1 =
        await getPrisma().metadata_parametrage_indicateurs.findUniqueOrThrow({
          where: { indic_id: indicateur1.indic_id },
        });
      const parametrage2 =
        await getPrisma().metadata_parametrage_indicateurs.findUniqueOrThrow({
          where: { indic_id: indicateur2.indic_id },
        });
      expect(parametrage1.poids_pourcent_nat_declaree).toBe(40);
      expect(parametrage2.poids_pourcent_nat_declaree).toBe(60);
    }),
  );

  it(
    "rejette l'enregistrement si la somme d'une maille applicable est différente de 100",
    createIntegrationTest(async () => {
      // Given
      await fixtures.metadataChantier({ chantier_id: "CH-010" });
      const indicateur1 = await fixtures.metadataIndicateurHidden({
        indic_id: "IND-001",
        indic_parent_ch: "CH-010",
      });
      const indicateur2 = await fixtures.metadataIndicateurHidden({
        indic_id: "IND-002",
        indic_parent_ch: "CH-010",
      });
      await fixtures.metadataIndicateurComplementaire({
        indic_id: indicateur1.indic_id,
        indic_territorialise: false,
      });
      await fixtures.metadataIndicateurComplementaire({
        indic_id: indicateur2.indic_id,
        indic_territorialise: false,
      });
      await fixtures.metadataParametrageIndicateurs({
        indic_id: indicateur1.indic_id,
        poids_pourcent_nat_declaree: 10,
      });
      await fixtures.metadataParametrageIndicateurs({
        indic_id: indicateur2.indic_id,
        poids_pourcent_nat_declaree: 20,
      });

      // When
      const exécution = handler.execute({
        lignes: [
          {
            indicId: indicateur1.indic_id,
            poidsPourcentDept: null,
            poidsPourcentReg: null,
            poidsPourcentNat: 40,
          },
          {
            indicId: indicateur2.indic_id,
            poidsPourcentDept: null,
            poidsPourcentReg: null,
            poidsPourcentNat: 40,
          },
        ],
      });

      // Then
      await expect(exécution).rejects.toThrow(BadRequestError);
      const parametrage1 =
        await getPrisma().metadata_parametrage_indicateurs.findUniqueOrThrow({
          where: { indic_id: indicateur1.indic_id },
        });
      expect(parametrage1.poids_pourcent_nat_declaree).toBe(10);
    }),
  );

  it(
    "n'inclut pas les mailles non applicables à un indicateur dans le calcul de la somme",
    createIntegrationTest(async () => {
      // Given : un indicateur non territorialisé (donc seule la maille NAT est applicable)
      await fixtures.metadataChantier({ chantier_id: "CH-010" });
      const indicateur = await fixtures.metadataIndicateurHidden({
        indic_id: "IND-001",
        indic_parent_ch: "CH-010",
      });
      await fixtures.metadataIndicateurComplementaire({
        indic_id: indicateur.indic_id,
        indic_territorialise: false,
      });
      await fixtures.metadataParametrageIndicateurs({
        indic_id: indicateur.indic_id,
      });

      // When : on enregistre une valeur DEPT/REG incohérente, non applicable, aux côtés d'un NAT correct
      await handler.execute({
        lignes: [
          {
            indicId: indicateur.indic_id,
            poidsPourcentDept: 999,
            poidsPourcentReg: 999,
            poidsPourcentNat: 100,
          },
        ],
      });

      // Then : la sauvegarde réussit car DEPT/REG ne sont pas des mailles applicables à valider
      const parametrage =
        await getPrisma().metadata_parametrage_indicateurs.findUniqueOrThrow({
          where: { indic_id: indicateur.indic_id },
        });
      expect(parametrage.poids_pourcent_nat_declaree).toBe(100);
      expect(parametrage.poids_pourcent_dept_declaree).toBe(999);
    }),
  );
});
