import type { Evidence } from "../evidence";
import { OUTILS_ENCART } from "../evidence";
import { mechanical } from "../criterion";
import {
  checkEncartChantiers,
  checkMailleNommee,
  checkNoHtml,
  checkRestrictionEncart,
} from "../mechanicalChecks";

type ResultatChantiersEncart = {
  territoire_code: string;
  acces_restreint?: boolean;
  chantiers: {
    chantier: { id: string };
    ecart: number | null;
    niveau_de_confiance: string | null;
    synthese: unknown;
  }[];
};

type Encart = {
  type: "synthese" | "comparaison";
  markdown: string;
  donnees: {
    taux: { territoire_code: string }[];
    chantiers_en_retard: { resultats: ResultatChantiersEncart[] };
    chantiers_en_difficulte: { resultats: ResultatChantiersEncart[] };
  };
};

/** Le dernier encart rédigé avec ses données, s'il y en a un. */
function encartDe(evidence: Evidence): Encart | null {
  const encarts = evidence.toolResults
    .filter((result) => OUTILS_ENCART.includes(result.toolName))
    .map((result) => result.output as Partial<Encart>)
    .filter((sortie): sortie is Encart => sortie.donnees !== undefined);
  return encarts.at(-1) ?? null;
}

const resultatsDe = (encart: Encart): ResultatChantiersEncart[] => [
  ...encart.donnees.chantiers_en_retard.resultats,
  ...encart.donnees.chantiers_en_difficulte.resultats,
];

/**
 * Les contrôles propres à l'encart (étape 4). Leurs identifiants commencent
 * par « Encart » : ils se rapportent à part du total N3, pour comparer les
 * grilles existantes à l'étape 3 à grille constante.
 */
export const ENCART_CRITERIA = [
  mechanical({
    id: "Encart — chantiers",
    rule: "Gabarit : chaque chantier avec son niveau de confiance et, en synthèse, son écart",
    applicable: (evidence) => encartDe(evidence) !== null,
    check: (evidence) => {
      const encart = encartDe(evidence) as Encart;
      return checkEncartChantiers({
        text: encart.markdown,
        chantiers: resultatsDe(encart).flatMap(
          (resultat) => resultat.chantiers,
        ),
        avecEcart: encart.type === "synthese",
      });
    },
  }),
  mechanical({
    id: "Encart — maille nommée",
    rule: "Gabarit : la maille du territoire est nommée correctement",
    applicable: (evidence) => encartDe(evidence)?.type === "synthese",
    check: (evidence) => {
      const encart = encartDe(evidence) as Encart;
      return checkMailleNommee({
        text: encart.markdown,
        territoireCode: encart.donnees.taux[0]?.territoire_code ?? "",
      });
    },
  }),
  mechanical({
    id: "Encart — restriction",
    rule: "Règle 6 : un commentaire masqué est dit non accessible, pas absent",
    applicable: (evidence) => encartDe(evidence) !== null,
    check: (evidence) => {
      const encart = encartDe(evidence) as Encart;
      return checkRestrictionEncart({
        text: encart.markdown,
        resultats: resultatsDe(encart),
      });
    },
  }),
  mechanical({
    id: "Encart — pas de HTML",
    rule: "Gabarit : aucune balise HTML dans l'encart",
    applicable: (evidence) => encartDe(evidence) !== null,
    check: (evidence) =>
      checkNoHtml({ text: (encartDe(evidence) as Encart).markdown }),
  }),
];
