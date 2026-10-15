import { createIntegrationTest } from "@/test/createIntegrationTest";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { PrismaArticleCentreAideRepository } from "@/server/parametrage-centre-aide/infrastructure/adapters/PrismaArticleCentreAideRepository";
import { GetPagesCentreAideQuery } from "@/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery";

const PAGE_IMPORT = "0192a000-0000-7000-8000-000000000021";
const PAGE_EXPORT = "0192a000-0000-7000-8000-000000000022";
const PAGE_MASQUEE = "0192a000-0000-7000-8000-000000000023";
const INCONNUE = "0192a000-0000-7000-8000-000000000029";

describe("GetPagesCentreAideQuery", () => {
  it(
    "renvoie le contenu publié en markdown des pages visibles demandées, dans l'ordre demandé",
    createIntegrationTest(async (tx) => {
      // Given
      await tx.article_centre_aide.createMany({
        data: [
          {
            id: PAGE_IMPORT,
            titre: "Importer des mesures",
            contenu: "<p>Déposez le fichier.</p>",
            contenu_brouillon: "<p>Texte en cours de rédaction</p>",
            type: "PAGE",
            ordre: 1,
            est_publie: true,
          },
          {
            id: PAGE_EXPORT,
            titre: "Exporter les données",
            contenu: "<p>Cliquez sur Exporter.</p>",
            type: "PAGE",
            ordre: 2,
            est_publie: true,
          },
          {
            id: PAGE_MASQUEE,
            titre: "Ancienne procédure",
            contenu: "<p>Obsolète</p>",
            type: "PAGE",
            ordre: 3,
            est_publie: true,
            est_masque: true,
          },
        ],
      });
      const query = new GetPagesCentreAideQuery({
        articleCentreAideRepository: new PrismaArticleCentreAideRepository({
          prisma: new PrismaPilote(),
        }),
      });

      // When
      const pages = await query.execute({
        ids: [PAGE_EXPORT, PAGE_MASQUEE, INCONNUE, PAGE_IMPORT],
      });

      // Then
      expect(pages).toEqual([
        {
          id: PAGE_EXPORT,
          titre: "Exporter les données",
          chemin: [],
          url: `/centre-aide-pilote?article=${PAGE_EXPORT}`,
          contenuMarkdown: "Cliquez sur Exporter.",
        },
        {
          id: PAGE_IMPORT,
          titre: "Importer des mesures",
          chemin: [],
          url: `/centre-aide-pilote?article=${PAGE_IMPORT}`,
          contenuMarkdown: "Déposez le fichier.",
        },
      ]);
    }),
  );
});
