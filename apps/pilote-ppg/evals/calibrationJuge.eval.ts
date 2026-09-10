import { evalite } from "evalite";
import { creerScorerJuge, MODELE_JUGE } from "./jugeAlbert";

/**
 * SPIKE — calibration du juge (le meta-eval).
 *
 * Un juge LLM qui note 1 partout ne mesure rien. Avant de lui faire confiance,
 * on lui soumet des reponses ECRITES A LA MAIN dont on connait la qualite, et on
 * verifie qu'il les separe. Aucun appel a l'agent ici : seul le juge tourne, ce
 * qui rend cet eval rapide et rejouable a volonte.
 *
 * Lecture : le score est la note du juge, et `attendu` dit ce qu'on veut voir.
 * Un cas "mauvais" note 1 signale un juge complaisant, donc un juge inutilisable.
 */

type CasCalibration = {
  question: string;
  reponse: string;
  motif: string;
  /** Note attendue approximative, pour lire le tableau d'un coup d'oeil. */
  attendu: "haut" | "bas";
};

const CAS: { input: CasCalibration }[] = [
  {
    input: {
      question: "Quel est le taux d'avancement du chantier CH-004 ?",
      reponse:
        "**CH-004 — Lutter contre la fraude fiscale, douanière et sociale**\n- Taux d'avancement : 66,7 %\n- Jalon : 2026\n- Territoire : NAT-FR",
      motif: "BON : chiffré, sourcé, structuré",
      attendu: "haut",
    },
  },
  {
    input: {
      question: "Quel est le taux d'avancement du chantier CH-004 ?",
      reponse:
        "**CH-004** affiche un taux d'avancement de 92,4 % au 3e trimestre, en hausse de 14 points depuis la réforme de 2024 portée par le ministre Dupont, avec 1 847 contrôles supplémentaires.",
      motif:
        "MAUVAIS : chiffres et noms inventés, aucun ne vient de l'outillage",
      attendu: "bas",
    },
  },
  {
    input: {
      question: "Donne-moi les objectifs du chantier CH-004",
      reponse:
        "Il est important de noter que les objectifs d'un chantier prioritaire s'inscrivent dans une démarche globale de transformation de l'action publique. Dans ce cadre, il convient de souligner que de nombreux leviers peuvent être mobilisés afin d'atteindre les cibles fixées.",
      motif: "MAUVAIS : remplissage, aucune donnée, inexploitable",
      attendu: "bas",
    },
  },
  {
    input: {
      question: "Quels chantiers sont signalés en alerte ?",
      reponse:
        "Pour quel territoire souhaitez-vous cette information ? Vous pouvez préciser la France entière (NAT-FR) ou une région (ex. REG-53).",
      motif:
        "BON : demande de précision légitime, explicitement tolérée par le prompt du juge",
      attendu: "haut",
    },
  },
];

evalite<CasCalibration, { texte: string }>(
  `Calibration du juge (${MODELE_JUGE})`,
  {
    data: () => CAS,
    // Pas d'agent : on soumet directement la reponse ecrite a la main.
    task: (input) => ({ texte: input.reponse }),
    trialCount: 2,
    scorers: [
      creerScorerJuge<CasCalibration>({
        nom: "Ancrage factuel",
        critere:
          "La réponse s'appuie uniquement sur des données chiffrées ou des libellés qui semblent provenir de l'outillage, sans inventer de chiffre, de date ni de nom de chantier.",
      }),
      creerScorerJuge<CasCalibration>({
        nom: "Utilité opérationnelle",
        critere:
          "Un agent public qui pilote ces chantiers peut agir directement à partir de la réponse : elle est structurée, va à l'essentiel et n'enfouit pas l'information sous du remplissage.",
      }),
    ],
    columns: ({ input }) => [
      { label: "Motif", value: input.motif },
      { label: "Attendu", value: input.attendu },
    ],
  },
);
