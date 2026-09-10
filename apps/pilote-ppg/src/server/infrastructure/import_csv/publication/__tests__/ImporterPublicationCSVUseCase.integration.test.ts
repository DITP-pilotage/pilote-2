import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { ImporterPublicationCSVUseCase } from "@/server/infrastructure/import_csv/publication/ImporterPublicationCSVUseCase";
import { ImporterCommentairesUseCase } from "@/server/commentaires/usecases/ImporterCommentairesUseCase";
import CommentaireSQLRepository from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";
import { ImporterSynthesesDesResultatsUseCase } from "@/server/syntheses-des-resultats/usecases/ImporterSynthesesDesResultatsUseCase";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { ImporterObjectifsUseCase } from "@/server/objectifs/usecases/ImporterObjectifsUseCase";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";

const EMAIL_UTILISATEUR_IMPORT = "import.csv@modernisation.gouv.fr";

async function créerChantierRattachéÀNatFr() {
  const chantier = await fixtures.chantierIdentite();
  await fixtures.chantierTerritoire({
    id: chantier.id,
    territoire_code: "NAT-FR",
    zone_id: "FRANCE",
    code_insee: "FR",
    maille: $Enums.Maille.NAT,
  });
  return chantier;
}

describe("ImporterPublicationCSVUseCase", () => {
  let useCase: ImporterPublicationCSVUseCase;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    useCase = new ImporterPublicationCSVUseCase({
      prisma: prismaPilote,
      importerCommentairesUseCase: new ImporterCommentairesUseCase({
        commentaireRepository: new CommentaireSQLRepository({
          prisma: prismaPilote,
        }),
      }),
      importerSynthesesDesResultatsUseCase:
        new ImporterSynthesesDesResultatsUseCase({
          synthèseDesRésultatsRepository: new SynthèseDesRésultatsSQLRepository(
            { prisma: prismaPilote },
          ),
        }),
      importerDecisionsStrategiquesUseCase:
        new ImporterDecisionsStrategiquesUseCase({
          décisionStratégiqueRepository: new DécisionStratégiqueSQLRepository({
            prisma: prismaPilote,
          }),
        }),
      importerObjectifsUseCase: new ImporterObjectifsUseCase({
        objectifRepository: new ObjectifSQLRepository({
          prisma: prismaPilote,
        }),
      }),
    });
  });

  it(
    "répartit les lignes d'un CSV vers les 4 domaines cibles",
    createIntegrationTest(async () => {
      // Given
      await fixtures.utilisateur({ email: EMAIL_UTILISATEUR_IMPORT });
      const chantier = await créerChantierRattachéÀNatFr();

      const lignesBrutes = [
        {
          chantier_id: chantier.id,
          type: "risques_et_freins_a_lever",
          contenu: "Un frein identifié",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
        {
          chantier_id: chantier.id,
          type: "synthese_des_resultats",
          contenu: "Trajectoire conforme",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "SOLEIL",
        },
        {
          chantier_id: chantier.id,
          type: "suivi_des_decisions",
          contenu: "Décision actée",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
        {
          chantier_id: chantier.id,
          type: "notre_ambition",
          contenu: "Réduire le délai",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ];

      // When
      const résultat = await useCase.execute(lignesBrutes);

      // Then
      expect(résultat).toEqual({
        succès: true,
        comptesParDomaine: {
          commentaire: 1,
          synthese_des_resultats: 1,
          decision_strategique: 1,
          objectif: 1,
        },
      });

      const prisma = getPrisma();

      const commentaires = await prisma.commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(commentaires.map((commentaire) => commentaire.type)).toEqual([
        "freins_a_lever",
      ]);

      const syntheses = await prisma.synthese_des_resultats.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(syntheses.map((synthese) => synthese.meteo)).toEqual(["SOLEIL"]);

      const decisions = await prisma.decision_strategique.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(decisions.map((decision) => decision.type)).toEqual([
        "suivi_des_decisions",
      ]);

      const objectifs = await prisma.objectif.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(objectifs.map((objectif) => objectif.type)).toEqual([
        "notre_ambition",
      ]);
    }),
  );

  it(
    "attribue le commentaire à l'auteur correspondant à auteur_email",
    createIntegrationTest(async () => {
      // Given
      await fixtures.utilisateur({ email: EMAIL_UTILISATEUR_IMPORT });
      const chantier = await créerChantierRattachéÀNatFr();
      const auteur = await fixtures.utilisateur();

      // When
      await useCase.execute([
        {
          chantier_id: chantier.id,
          type: "commentaires_sur_les_donnees",
          contenu: "Commentaire attribué",
          date: "2026-01-15",
          auteur_email: auteur.email,
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ]);

      // Then
      const commentaires = await getPrisma().commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(
        commentaires.map((commentaire) => commentaire.auteur_creation_id),
      ).toEqual([auteur.id]);
    }),
  );

  it(
    "attribue à l'utilisateur système quand auteur_email est vide ou inconnu",
    createIntegrationTest(async () => {
      // Given
      const utilisateurImport = await fixtures.utilisateur({
        email: EMAIL_UTILISATEUR_IMPORT,
      });
      const chantier = await créerChantierRattachéÀNatFr();

      // When
      await useCase.execute([
        {
          chantier_id: chantier.id,
          type: "commentaires_sur_les_donnees",
          contenu: "Commentaire sans auteur connu",
          date: "2026-01-15",
          auteur_email: "inconnu@test.com",
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ]);

      // Then
      const commentaires = await getPrisma().commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(
        commentaires.map((commentaire) => commentaire.auteur_creation_id),
      ).toEqual([utilisateurImport.id]);
    }),
  );

  it(
    "n'importe rien si une ligne est invalide (tout ou rien)",
    createIntegrationTest(async () => {
      // Given
      await fixtures.utilisateur({ email: EMAIL_UTILISATEUR_IMPORT });
      const chantier = await créerChantierRattachéÀNatFr();

      // When
      const résultat = await useCase.execute([
        {
          chantier_id: chantier.id,
          type: "commentaires_sur_les_donnees",
          contenu: "Commentaire valide",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
        {
          chantier_id: chantier.id,
          type: "type_inexistant",
          contenu: "Commentaire invalide",
          date: "2026-01-15",
          auteur_email: "",
          maille: "",
          code_insee: "",
          meteo: "",
        },
      ]);

      // Then
      expect(résultat.succès).toEqual(false);
      const commentaires = await getPrisma().commentaire.findMany({
        where: { chantier_id: chantier.id },
      });
      expect(commentaires).toEqual([]);
    }),
  );
});
