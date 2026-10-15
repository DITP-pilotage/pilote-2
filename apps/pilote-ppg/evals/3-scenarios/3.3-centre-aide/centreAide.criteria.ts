import type { ConsulterCentreAideOutput } from "@/server/albert/tools/consulterCentreAide";
import { judged, mechanical, withBase, type Criterion } from "../criterion";
import type { Evidence } from "../evidence";
import { IDS_PAGES_VISIBLES, MARQUEURS_INVISIBLES } from "../../seedCentreAide";

const consultations = (evidence: Evidence) =>
  evidence.toolResults
    .filter((result) => result.toolName === "consulter_centre_aide")
    .map((result) => result.output as ConsulterCentreAideOutput);

const consulte = mechanical({
  id: "Centre d'aide consulté",
  rule: "consulter_centre_aide : appelle-le dès qu'une question porte sur une définition, un calcul ou une procédure",
  check: (evidence) => {
    const ok = evidence.toolCalls.some(
      (call) => call.toolName === "consulter_centre_aide",
    );
    return { ok, detail: ok ? "appelé" : "jamais appelé" };
  },
});

const sourcesVisibles = mechanical({
  id: "Sources visibles",
  rule: "Le centre d'aide ne s'appuie que sur les pages publiées et non masquées",
  check: (evidence) => {
    const invisibles = consultations(evidence)
      .flatMap((output) => output.sources)
      .filter((source) => !IDS_PAGES_VISIBLES.includes(source.id));
    return {
      ok: invisibles.length === 0,
      detail:
        invisibles.length === 0
          ? "toutes visibles"
          : `invisibles : ${invisibles.map((source) => source.titre).join(", ")}`,
    };
  },
});

const aucuneFuite = mechanical({
  id: "Aucune fuite",
  rule: "Jamais de contenu masqué, dépublié ou en brouillon",
  check: (evidence) => {
    const fuites = MARQUEURS_INVISIBLES.filter((marqueur) =>
      evidence.answer.includes(marqueur),
    );
    return {
      ok: fuites.length === 0,
      detail: fuites.length === 0 ? "aucune" : `fuite : ${fuites.join(", ")}`,
    };
  },
});

const pasDeLien = mechanical({
  id: "Pas de lien dans le texte",
  rule: "N'écris jamais de lien vers le centre d'aide : les pages sont affichées sous ta réponse",
  check: (evidence) => {
    const ok = !/centre-aide-pilote|https?:\/\//.test(evidence.answer);
    return { ok, detail: ok ? "aucun lien" : "lien écrit dans la réponse" };
  },
});

const fidele = judged({
  id: "Fidèle au centre d'aide",
  rule: "_output_instructions : restitue fidèlement `reponse`, sans la compléter avec le glossaire ni d'autres connaissances",
  instruction:
    "Compare la réponse au champ `reponse` du résultat de consulter_centre_aide. Chaque affirmation sur une notion ou une procédure de PILOTE doit s'y trouver. Une définition, une règle ou une étape absente de `reponse` est non conforme. Les valeurs chiffrées reprises de la conversation pour illustrer ne comptent pas comme des ajouts.",
  applicable: (evidence) =>
    consultations(evidence).some((output) => output.trouve),
});

/** Questions couvertes : la bonne page, citée, fidèlement restituée. */
export const pageAttendue = (pagesParQuestion: Record<string, string>) =>
  mechanical({
    id: "Bonne page",
    rule: "Le centre d'aide indique les pages utilisées",
    check: (evidence) => {
      const attendue = pagesParQuestion[evidence.question];
      const citees = consultations(evidence).flatMap((output) =>
        output.sources.map((source) => source.id),
      );
      const ok = citees.includes(attendue);
      return {
        ok,
        detail: ok
          ? "page attendue citée"
          : `citées : ${citees.join(", ") || "aucune"}`,
      };
    },
  });

export const criteresQuestionCouverte = (
  pagesParQuestion: Record<string, string>,
): Criterion[] =>
  withBase({
    criteria: [
      consulte,
      pageAttendue(pagesParQuestion),
      sourcesVisibles,
      aucuneFuite,
      pasDeLien,
      fidele,
    ],
  });

export const criteresHorsCorpus = (questionsSansReponse: string[]) =>
  withBase({
    criteria: [
      consulte,
      aucuneFuite,
      pasDeLien,
      mechanical({
        id: "Non trouvé",
        rule: "Si le centre d'aide ne permet pas de répondre, l'outil renvoie trouve: false",
        applicable: (evidence) =>
          questionsSansReponse.includes(evidence.question),
        check: (evidence) => {
          const ok = consultations(evidence).every((output) => !output.trouve);
          return {
            ok,
            detail: ok ? "non trouvé" : "une réponse a été trouvée",
          };
        },
      }),
      judged({
        id: "Limite signalée",
        rule: "_output_instructions (non trouvé) : dis que le centre d'aide ne couvre pas la question, sans affirmer de réponse",
        instruction:
          "La réponse dit que l'information n'est pas disponible dans le centre d'aide et n'affirme aucune réponse à la question, même partielle ou présentée comme probable. Une réponse tirée de connaissances générales est non conforme.",
        applicable: (evidence) =>
          questionsSansReponse.includes(evidence.question),
      }),
      judged({
        id: "Renvoi vers l'équipe PILOTE",
        rule: "_output_instructions (non trouvé) : indique que l'équipe PILOTE peut répondre",
        instruction:
          "La réponse oriente l'utilisateur vers l'équipe PILOTE (ou le support). Elle n'écrit pas d'adresse mail.",
        applicable: (evidence) =>
          questionsSansReponse.includes(evidence.question),
      }),
    ],
  });

export const criteresCasFrontiere = withBase({
  criteria: [
    consulte,
    sourcesVisibles,
    pasDeLien,
    fidele,
    judged({
      id: "Définition appliquée",
      rule: "Cas frontière : applique la définition aux valeurs déjà présentes dans la conversation",
      instruction:
        "La réponse donne la formule du taux d'avancement, puis l'applique aux valeurs VI, VA et VC de l'indicateur affichées au tour précédent, avec le résultat. Une définition seule, sans application aux valeurs, est non conforme. Une question de clarification au lieu d'une réponse est non conforme.",
    }),
  ],
});
