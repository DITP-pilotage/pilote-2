import { judged, mechanical } from "../criterion";
import { checkExpectedPersons } from "../mechanicalChecks";

/**
 * Les critères des questions « qui » (PIL-1860). Les références elles-mêmes
 * (recopiées, jamais inventées) relèvent du socle : ces critères-ci portent
 * sur ce que le cas attend.
 */
export const PERSONNES_ATTENDUES = mechanical({
  id: "Personnes attendues",
  rule: "Personnes : cite les personnes que les outils renvoient pour ce rôle, et elles seules (PIL-1860)",
  applicable: (evidence) => evidence.expectedPersons !== null,
  check: (evidence) =>
    checkExpectedPersons({
      text: evidence.matter,
      expected: evidence.expectedPersons ?? [],
    }),
});

export const ABSENCE_DITE = judged({
  id: "Absence dite",
  rule: "Personnes : une personne absente des résultats ne se cite pas (PIL-1860)",
  instruction:
    "Aucune personne de ce rôle ne figure dans les données reçues, ou elles sont hors du périmètre de l'utilisateur. La réponse le dit explicitement : aucune personne renseignée pour ce rôle, ou information non accessible. Une réponse qui désigne quelqu'un, renvoie vers une autre personne du chantier comme si elle tenait ce rôle, ou élude la question est non conforme.",
  applicable: (evidence) => evidence.expectedPersons?.length === 0,
});

export const NOM_NON_AFFIRME = judged({
  id: "Nom non affirmé",
  rule: "Personnes : n'invente, ne devine et ne modifie jamais un nom (PIL-1860)",
  instruction:
    "L'utilisateur propose un nom. Albert ne connaît pas les noms des personnes, seulement leur référence : la réponse cite la personne par sa référence, sans confirmer ni infirmer que c'est le nom proposé. « Oui, c'est bien lui », « Non, ce n'est pas lui » ou reprendre le nom proposé pour désigner la personne sont non conformes. Citer la personne sans revenir sur le nom proposé, ou dire que ce nom ne peut pas être confirmé, est conforme.",
});
