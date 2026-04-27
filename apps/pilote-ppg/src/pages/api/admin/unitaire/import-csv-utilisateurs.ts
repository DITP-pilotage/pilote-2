import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "csv-parse/sync";
import { File } from "formidable";
import fs from "node:fs";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import UtilisateurCSVParseur from "@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur";
import { parseForm } from "@/server/import-indicateur/infrastructure/handlers/ParseForm";

/**
 - Format CSV attendu :
      nom,prénom,email,profil,scope,territoires,périmètreIds,chantierIds,auteurEmail
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,lecture,REG-12,,,ditp.admin@example.com
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,saisieCommentaire,REG-12,,,
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,saisieIndicateur,REG-12,,,
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,lecture,TOUS,,CH-001|CH-002,
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,saisieCommentaire,NAT-FR,,CH-001,
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,saisieIndicateur,TOUS,,,

 - Comment appeler cet endpoint en local :
      S'assurer d'avoir les variables d'env APP_URL et CRON_AUTH_SECRET configurées
      curl -X POST $APP_URL/api/admin/unitaire/import-csv-utilisateurs \
        -H "Authorization: Bearer $CRON_AUTH_SECRET" \
        -F "file=@/chemin/fichier/local/import.csv"

 - Comment appeler cet endpoint sur le serveur de prod :
      scalingo --region osc-secnum-fr1 -a prod-pilote-ditp run bash
      curl -X POST $APP_URL/api/admin/unitaire/import-csv-utilisateurs \
        -H "Authorization: Bearer $CRON_AUTH_SECRET" \
        -F "file=@/chemin/fichier/local/import.csv"

 - Remarques :
      Le CSV doit être encodé en utf8, et nous n'avons testé que sans BOM.
      Le CSV doit contenir le même nombre de champs pour toutes les lignes, séparés par des ",".
      Les utilisateurs existants sont remplacés et leurs droits également.
      La réponse 200 contient la liste des emails importés : { utilisateursImportés: string[] }
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
  const csvRecords = parse(contenu, {
    columns: true,
    skipEmptyLines: true,
    trim: true,
  });

  const parseur = new UtilisateurCSVParseur("");
  const parsedCsvRecords = parseur._parseCsvRecords(csvRecords);

  const container = getContainer("gestionUtilisateur");
  await container
    .resolve("importerDesUtilisateursUseCase")
    .run(parsedCsvRecords);

  logger.info(
    {
      categorie: "utilisateur",
      source: "import-csv-utilisateurs",
      count: parsedCsvRecords.length,
    },
    "Import CSV utilisateurs terminé avec succès",
  );

  return res
    .status(200)
    .json({ utilisateursImportés: parsedCsvRecords.map((u) => u.email) });
}

export default onlyCron(handler);
