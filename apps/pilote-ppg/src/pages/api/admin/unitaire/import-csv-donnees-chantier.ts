import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "csv-parse/sync";
import { File } from "formidable";
import fs from "node:fs";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";
import logger from "@/server/infrastructure/Logger";
import { parseForm } from "@/server/import-indicateur/infrastructure/handlers/ParseForm";
import { ImporterDonneesChantierCSVUseCase } from "@/server/infrastructure/import_csv/donnees_chantier/ImporterDonneesChantierCSVUseCase";

/**
 - Format CSV attendu :
      chantier_id,type,contenu,date,auteur_email,maille,code_insee,meteo
      CH-001,commentaires_sur_les_donnees,"RAS ce mois-ci",2026-01-15,dp.dir@example.com,REG,11,
      CH-001,suivi_des_decisions,"Décision actée en comité",2026-01-15,,,,
      CH-001,notre_ambition,"Réduire le délai de traitement",2026-01-15,,,,
      CH-001,synthese_des_resultats,"Trajectoire conforme",2026-01-15,,REG,11,OBJECTIF_SECURISE

   Le champ `type` détermine le domaine cible (commentaire, synthèse des résultats,
   décision stratégique ou objectif) — voir résoudreDomaineCible dans
   src/validation/import-csv-donnees-chantier.ts pour la liste complète des types
   acceptés.

   `maille`/`code_insee` ne sont utilisés que pour les domaines territorialisés
   (commentaire, synthese_des_resultats) ; laissés vides, le territoire national
   NAT-FR est utilisé par défaut.

   `auteur_email` est optionnel : si vide ou si l'email ne correspond à aucun
   utilisateur, le commentaire est attribué à l'utilisateur système
   import.csv@modernisation.gouv.fr.

 - Comment appeler cet endpoint en local :
      S'assurer d'avoir les variables d'env APP_URL et CRON_AUTH_SECRET configurées
      curl -X POST $APP_URL/api/admin/unitaire/import-csv-donnees-chantier \
        -H "Authorization: Bearer $CRON_AUTH_SECRET" \
        -F "file=@/chemin/fichier/local/import.csv"

 - Remarques :
      Le CSV doit être encodé en utf8, et nous n'avons testé que sans BOM.
      La réponse 200 contient le compte de lignes importées par domaine.
      Import "tout ou rien" : si une seule ligne est invalide, rien n'est importé et
      la réponse 400 liste toutes les erreurs.
      Un ré-import du même fichier crée de nouvelles entrées (pas de déduplication) :
      chaque exécution doit être volontaire.
*/

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const formData = await parseForm(req);
  const fichier = formData.file?.[0] as File | undefined;

  if (!fichier) {
    return res
      .status(400)
      .json({ error: "Un fichier CSV est requis (champ 'file')" });
  }

  const contenu = fs.readFileSync(fichier.filepath, "utf8");
  const lignesBrutes = parse(contenu, {
    columns: true,
    skipEmptyLines: true,
    trim: true,
  });

  const importerDonneesChantierCSVUseCase =
    new ImporterDonneesChantierCSVUseCase({
      prisma,
      importerCommentairesUseCase: getContainer("commentaires").resolve(
        "importerCommentairesUseCase",
      ),
      importerSynthesesDesResultatsUseCase: getContainer(
        "importSyntheseDesResultats",
      ).resolve("importerSynthesesDesResultatsUseCase"),
      importerDecisionsStrategiquesUseCase: getContainer(
        "decisionStrategique",
      ).resolve("importerDecisionsStrategiquesUseCase"),
      importerObjectifsUseCase: getContainer("objectif").resolve(
        "importerObjectifsUseCase",
      ),
    });

  const résultat =
    await importerDonneesChantierCSVUseCase.execute(lignesBrutes);

  if (!résultat.succès) {
    logger.warn(
      {
        categorie: "import",
        source: "import-csv-donnees-chantier",
        nombreErreurs: résultat.erreurs.length,
      },
      "Validation échouée pour l'import CSV de données chantier",
    );
    return res.status(400).json({
      message: "Une erreur est survenue lors de l'import du CSV",
      erreurs: résultat.erreurs,
    });
  }

  logger.info(
    {
      categorie: "import",
      source: "import-csv-donnees-chantier",
      comptesParDomaine: résultat.comptesParDomaine,
    },
    "Import CSV de données chantier terminé avec succès",
  );

  return res
    .status(200)
    .json({ comptesParDomaine: résultat.comptesParDomaine });
}

export default onlyCron(handler);
