import "./load-env";
import process from "node:process";
import assert from "node:assert/strict";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getContainer } from "@/server/dependances";

const baseUrl = process.env.TCHAP_BASE_URL ?? "";
const roomId = process.env.TCHAP_ROOM_ID_RAPPORT_COORDINATEURS ?? "";
const accessToken = process.env.TCHAP_ACCESS_TOKEN ?? "";

function parseOptionalDateArg(arg: string | undefined): Date {
  if (!arg) {
    return new Date();
  }

  const parsed = Date.parse(arg);
  assert(!Number.isNaN(parsed), `Date invalide: ${arg}`);

  return new Date(parsed);
}

async function main() {
  const maintenant = parseOptionalDateArg(process.argv[2]);

  logger.info({ categorie: "rapport", source: "rapportHebdomadaireCoordinateurs", dateExecution: maintenant.toISOString() }, "Génération des rapports hebdomadaires");

  const container = getContainer("rapportsHebdomadaires");

  const produireUseCase = container.resolve(
    "produireRapportsHebdomadairesUseCase",
  );
  const resultProduction = await produireUseCase.run({ maintenant });

  const messagePhase1 = [
    "## 📊 Rapports hebdomadaires coordinateurs - Phase 1 : Production",
    "",
    `✅ **${resultProduction.rapportsCrees} rapports créés** et persistés en base`,
  ].join("\n");

  envoieMessageTchap(messagePhase1, baseUrl, roomId, accessToken);
  //
  const envoyerUseCase = container.resolve(
    "envoyerRapportsHebdomadairesUseCase",
  );
  const resultEnvoi = await envoyerUseCase.run({
    dateCreationMin: resultProduction.dateExecution,
  });

  const messagePhase2Lines = [
    "## 📧 Rapports hebdomadaires coordinateurs - Phase 2 : Envoi",
    "",
    `✅ **${resultEnvoi.emailsEnvoyes} emails envoyés avec succès**`,
  ];

  if (resultEnvoi.emailsEnEchec > 0) {
    messagePhase2Lines.push(
      `❌ **${resultEnvoi.emailsEnEchec} emails en échec** :`,
    );
    for (const erreur of resultEnvoi.erreursDetails) {
      messagePhase2Lines.push(`* ${erreur.email} - ${erreur.erreur}`);
    }
    messagePhase2Lines.push(
      "",
      "Les rapports en échec restent en statut ECHEC et peuvent être renvoyés manuellement.",
    );
  }

  envoieMessageTchap(
    messagePhase2Lines.join("\n"),
    baseUrl,
    roomId,
    accessToken,
  );

  return {
    production: resultProduction,
    envoi: resultEnvoi,
  };
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then((result) => {
      logger.info({ categorie: "rapport", source: "rapportHebdomadaireCoordinateurs", ...result }, "Exécution terminée");
      process.exit(0);
    })
    .catch((error) => {
      const messageErreur = [
        "## ⚠️ Erreur lors de l'exécution des rapports hebdomadaires",
        "",
        `**Erreur** : ${error instanceof Error ? error.message : String(error)}`,
        "",
        "Veuillez regarder les logs pour en savoir plus :",
        `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
      ].join("\n");

      envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);
      logger.error({ categorie: "rapport", source: "rapportHebdomadaireCoordinateurs" }, (error as Error).message);
      process.exit(1);
    });
}
