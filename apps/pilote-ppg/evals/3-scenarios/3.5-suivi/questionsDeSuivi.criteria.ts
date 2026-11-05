import { judged, mechanical, withBase } from "../criterion";

const ABSENCE_VERIFIEE = judged({
  id: "Absence vérifiée",
  rule: "Règle 3 : ne conclus à une absence qu'après avoir interrogé ce périmètre exact",
  instruction:
    "Si la réponse dit qu'une donnée est absente, indisponible ou inexistante (« aucun commentaire », « pas de détail par département », « pas d'indicateur renseigné »), cette absence doit se lire dans un résultat d'outil qui porte sur ce périmètre exact : même territoire, même maille, même chantier, même type de donnée. Une absence déduite d'un résultat sur un autre périmètre (la région au lieu de ses départements, une synthèse au lieu des commentaires, la liste des chantiers au lieu de leurs indicateurs) est non conforme : cite-la dans la preuve. Une réponse qui n'annonce aucune absence est conforme.",
});

/**
 * Après un encart, « détaille par département » se sert d'un outil de
 * données ou d'un encart de comparaison : seul compte qu'un appel porte sur
 * les départements.
 */
const DEPARTEMENTS_INTERROGES = mechanical({
  id: "Départements interrogés",
  rule: "Collecter les données : « détaille par département » passe par REGION_ET_SES_DEPARTEMENTS",
  applicable: (evidence) => /par d[ée]partement/i.test(evidence.question),
  check: (evidence) => {
    const passed = evidence.toolCalls.some((call) => {
      const perimetre = (call.input as { perimetre?: { type?: string } })
        .perimetre;
      return perimetre?.type === "REGION_ET_SES_DEPARTEMENTS";
    });
    return {
      ok: passed,
      detail: passed
        ? "appel sur la région et ses départements"
        : "aucun appel sur les départements",
    };
  },
});

/** Les critères du scénario « Questions de suivi ». */
export const QUESTIONS_DE_SUIVI_CRITERIA = withBase({
  criteria: [ABSENCE_VERIFIEE, DEPARTEMENTS_INTERROGES],
});
