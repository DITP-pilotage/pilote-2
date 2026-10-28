import type { ConsulterCentreAideOutput } from "@/server/albert/tools/consulterCentreAide";
import { judged, mechanical, withBase, type Criterion } from "../criterion";
import type { Evidence } from "../evidence";

const consultations = (evidence: Evidence) =>
  evidence.toolResults
    .filter((result) => result.toolName === "consulter_centre_aide")
    .map((result) => result.output as ConsulterCentreAideOutput);

const consulte = mechanical({
  id: "Centre d'aide consulté",
  rule: "Méthode, expliquer PILOTE : une définition, un calcul ou une procédure passe par le centre d'aide",
  check: (evidence) => {
    const passed = evidence.toolCalls.some(
      (call) => call.toolName === "consulter_centre_aide",
    );
    return { ok: passed, detail: passed ? "appelé" : "jamais appelé" };
  },
});

const pasDeLatex = mechanical({
  id: "Pas de LaTeX",
  rule: "Règle 7 : pas de LaTeX, les formules en texte",
  check: (evidence) => {
    const latex = /\\(frac|text|times|cdot)\b|\\\[|\\\(/.exec(evidence.answer);
    return {
      ok: latex === null,
      detail: latex === null ? "aucun" : `LaTeX : ${latex[0]}`,
    };
  },
});

const pasDeLien = mechanical({
  id: "Pas de lien dans le texte",
  rule: "Règle 5 : aucun lien, les pages du centre d'aide s'affichent sous la réponse",
  check: (evidence) => {
    const passed = !/centre-aide-pilote|https?:\/\//.test(evidence.answer);
    return {
      ok: passed,
      detail: passed ? "aucun lien" : "lien écrit dans la réponse",
    };
  },
});

const fidele = judged({
  id: "Fidèle au centre d'aide",
  rule: "consulter_centre_aide : restitue `reponse` sans la compléter",
  instruction:
    "Compare la réponse au champ `reponse` du résultat de consulter_centre_aide. Chaque affirmation sur une notion ou une procédure de PILOTE doit s'y trouver. Une définition, une règle ou une étape absente de `reponse` est non conforme.",
  applicable: (evidence) =>
    consultations(evidence).some((output) => output.trouve),
});

/**
 * Plusieurs pages peuvent légitimement répondre : la préparation du fichier
 * et la mise à jour des indicateurs décrivent toutes deux l'import.
 */
const pageAttendue = (pagesParQuestion: Record<string, string[]>) =>
  mechanical({
    id: "Bonne page",
    rule: "Le centre d'aide indique les pages utilisées",
    check: (evidence) => {
      const attendues = pagesParQuestion[evidence.question] ?? [];
      const citees = consultations(evidence).flatMap((output) =>
        output.sources.map((source) => source.id),
      );
      const passed = citees.some((id) => attendues.includes(id));
      return {
        ok: passed,
        detail: passed
          ? "page attendue citée"
          : `citées : ${citees.join(", ") || "aucune"}`,
      };
    },
  });

export const criteresQuestionCouverte = (
  pagesParQuestion: Record<string, string[]>,
): Criterion[] =>
  withBase({
    criteria: [
      consulte,
      pageAttendue(pagesParQuestion),
      pasDeLien,
      pasDeLatex,
      fidele,
    ],
  });

export const criteresHorsCorpus = withBase({
  criteria: [
    consulte,
    pasDeLien,
    mechanical({
      id: "Non trouvé",
      rule: "Si le centre d'aide ne permet pas de répondre, l'outil renvoie trouve: false",
      check: (evidence) => {
        const passed = consultations(evidence).every(
          (output) => !output.trouve,
        );
        return {
          ok: passed,
          detail: passed ? "non trouvé" : "une réponse a été trouvée",
        };
      },
    }),
    judged({
      id: "Limite signalée",
      rule: "consulter_centre_aide (trouve false) : dis que le centre d'aide ne couvre pas la question, sans répondre de mémoire",
      instruction:
        "La réponse dit que l'information n'est pas disponible dans le centre d'aide et n'affirme aucune réponse à la question, même partielle ou présentée comme probable. Une réponse tirée de connaissances générales est non conforme.",
    }),
    judged({
      id: "Renvoi vers l'équipe PILOTE",
      rule: "consulter_centre_aide (trouve false) : un bouton pour contacter l'équipe PILOTE s'affiche sous la réponse",
      instruction:
        "La réponse oriente l'utilisateur vers l'équipe PILOTE (ou le support). Elle n'écrit pas d'adresse mail.",
    }),
  ],
});

export const criteresCasFrontiere = withBase({
  criteria: [
    consulte,
    pasDeLien,
    pasDeLatex,
    fidele,
    judged({
      id: "Définition sans calcul",
      rule: "Méthode, expliquer PILOTE : même juste après l'affichage d'une donnée, la définition du centre d'aide, sans calcul",
      instruction:
        "La réponse donne la définition ou la formule du taux d'avancement tirée du centre d'aide. Elle ne pose aucun calcul sur des valeurs (VI, VA, VC ou autres) et ne pose pas de question de clarification à la place de la réponse.",
    }),
  ],
});
