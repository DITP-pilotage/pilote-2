import { scenarioEval } from "../scenarioEval";
import { SYNTHESE_CHANTIER_CRITERIA } from "./syntheseChantier.criteria";

/**
 * Scénario « Synthèse d'un chantier sur un territoire » (DITP et
 * coordinateur, à compléter). Trois volets : la synthèse du chantier, sa
 * position face aux autres territoires, les difficultés des commentaires.
 *
 * Le message DITP de l'interface est « … sur le territoire NOM_TERRITOIRE »,
 * celui du coordinateur « … sur <territoire courant> » : d'où « le territoire
 * Bretagne » d'un côté, « Bretagne » de l'autre.
 *
 * Le mot « synthèse » charge le gabarit de synthèse territoriale, alors que
 * le workflow ne vaut que pour une demande qui ne cible pas un chantier :
 * « Pas le gabarit territorial » le mesure. Aucun workflow ne dit comment
 * situer un chantier face aux autres territoires : le chemin n'est pas
 * imposé, le juge vérifie le résultat. Côté coordinateur, les autres régions
 * sont hors périmètre : « Restriction signalée » s'applique si l'agent les
 * interroge.
 *
 * Référence observée le 2026-09-30 : outils 42 %, forme 79 %, fond 100 %.
 * `get_chantier_commentaires` n'est jamais appelé : Albert tire les
 * difficultés des commentaires que porte déjà `get_chantiers`, et le juge
 * note le fond à 100 %. L'attente d'outils est à trancher avec le produit.
 * Codes météo bruts (NUAGE, COUVERT) dans 5 essais sur 6.
 * Second run du 2026-09-30 : outils 50 %, forme 75 %, fond 100 %.
 */

const MESSAGE = (territoire: string) =>
  `Fais moi la synthèse du chantier CH-005 sur ${territoire}
Comment se situe ce chantier par rapport aux autres territoires ?
Quelles sont les principales difficultés remontées dans les commentaires ?`;

const OUTILS = [
  {
    toolName: "get_chantiers",
    input: { territoire_code: "REG-53", chantier_ids: ["CH-005"] },
  },
  {
    toolName: "get_chantier_commentaires",
    input: { chantier_id: "CH-005", territoire_code: "REG-53" },
  },
];

const SCOPE = { territoires: ["REG-53"], chantiersCommentes: ["CH-005"] };

scenarioEval({
  suite: "Synthèse d'un chantier sur un territoire",
  group: "synthese",
  criteria: SYNTHESE_CHANTIER_CRITERIA,
  cases: [
    {
      question: MESSAGE("le territoire Bretagne"),
      reason: "DITP : CH-XXX et NOM_TERRITOIRE complétés",
      profile: "ditp",
      truthScope: SCOPE,
      expected: OUTILS,
    },
    {
      question: MESSAGE("Bretagne"),
      reason: "Coordinateur : CH-XXX complété, territoire pré-rempli",
      profile: "coordinateur",
      truthScope: SCOPE,
      expected: OUTILS,
    },
  ],
});
