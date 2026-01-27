import "./load-env";
import process from "node:process";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getInitialContainerWithTransversalDependencies } from "@/server/InitialDependencies";
import { getRapportsHebdomadairesContainer } from "@/server/rapports-hebdomadaires/container";

const baseUrl = process.env.TCHAP_BASE_URL ?? "";
const roomId = process.env.TCHAP_ROOM_ID_RAPPORT_COORDINATEURS ?? "";
const accessToken = process.env.TCHAP_ACCESS_TOKEN ?? "";

async function main() {
  const initialContainer = getInitialContainerWithTransversalDependencies();
  const container = getRapportsHebdomadairesContainer(initialContainer);

  const produireUseCase = container.resolve(
    "produireRapportsHebdomadairesUseCase",
  );
  const resultProduction = await produireUseCase.run();

  const messagePhase1 = [
    "## 📊 Rapports hebdomadaires coordinateurs - Phase 1 : Production",
    "",
    `✅ **${resultProduction.rapportsCrees} rapports créés** et persistés en base`,
    `ℹ️ ${resultProduction.coordinateursSansActivite} coordinateurs sans activité (aucun rapport créé)`,
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
      logger.info("Exécution terminée", result);
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
      logger.error(error);
      process.exit(1);
    });
}
