import type { Evidence } from "../evidence";
import { judged, mechanical } from "../criterion";
import { synthesesDesChantiers } from "../truth";
import { checkNoVerbatim, checkVerbatim } from "../mechanicalChecks";

/**
 * Les critères sur les commentaires. La fidélité demande de lire : elle est
 * jugée. La recopie est mécanique : les calibrations du 30/09 et du 01/10 ont
 * montré que le juge ne la voyait pas. Depuis PIL-1900, les commentaires sont
 * restitués fidèlement par défaut (D2) : la recopie n'est une faute que si
 * l'utilisateur demande une synthèse.
 */
export const COMMENTAIRES_FIDELES = judged({
  id: "Commentaires fidèles",
  rule: "Factualité : ce que la réponse rapporte des commentaires y figure (D2)",
  instruction:
    "Tout ce que la réponse rapporte des commentaires de synthèse (résumé, citation ou reprise) ne contient que des idées présentes dans ces commentaires. Une cause, un chiffre, une action ou une conséquence qui n'y figure pas est non conforme. Une réponse qui ne rapporte aucun commentaire est conforme : la couverture relève d'autres critères.",
});

type CommentaireRecu = { contenu: string } | null | undefined;

type ResultatChantiers = {
  chantiers?: {
    synthese?: { commentaire: string | null } | null;
    commentaires?: {
      donnees: CommentaireRecu;
      autresResultats: CommentaireRecu;
    };
  }[];
};

/** Les commentaires que l'agent a reçus de `get_chantier_commentaires`. */
function contenusDeGetChantierCommentaires(evidence: Evidence): string[] {
  return evidence.toolResults
    .filter((result) => result.toolName === "get_chantier_commentaires")
    .flatMap((result) =>
      (
        ((result.output as { resultats?: unknown[] }).resultats ?? []) as {
          commentaires: { contenu: string }[];
        }[]
      ).flatMap((resultat) =>
        resultat.commentaires.map((commentaire) => commentaire.contenu),
      ),
    );
}

/**
 * Tous les commentaires que l'agent a reçus, quel que soit l'outil : ceux de
 * `get_chantier_commentaires`, mais aussi le commentaire de synthèse et les
 * commentaires territoriaux que porte `get_chantiers`. Revue du 30/09 : Albert
 * lit les commentaires par `get_chantiers`, et une recopie depuis cette
 * source passait inaperçue.
 */
function contenusDesCommentairesRecus(evidence: Evidence): string[] {
  return [
    ...contenusDeGetChantierCommentaires(evidence),
    ...evidence.toolResults.flatMap((result) => {
      if (result.toolName !== "get_chantiers") return [];
      const resultats =
        (result.output as { resultats?: unknown[] }).resultats ?? [];
      return (resultats as ResultatChantiers[]).flatMap((resultat) =>
        (resultat.chantiers ?? []).flatMap((chantier) =>
          [
            chantier.synthese?.commentaire,
            chantier.commentaires?.donnees?.contenu,
            chantier.commentaires?.autresResultats?.contenu,
          ].filter((contenu): contenu is string => Boolean(contenu)),
        ),
      );
    }),
  ];
}

/** Les commentaires de synthèse de la fiche, et tous ceux que l'agent a reçus. */
const commentairesSources = (evidence: Evidence) => [
  ...synthesesDesChantiers(evidence.truth).flatMap((synthese) =>
    synthese.commentaire ? [synthese.commentaire] : [],
  ),
  ...contenusDesCommentairesRecus(evidence),
];

export const PAS_DE_RECOPIE = mechanical({
  id: "Pas de recopie",
  rule: "Demande de synthèse : ne recopie pas un commentaire in extenso (D2)",
  check: (evidence) =>
    checkNoVerbatim({
      text: evidence.matter,
      sources: commentairesSources(evidence),
    }),
});

export const COMMENTAIRES_RESTITUES = mechanical({
  id: "Commentaires restitués",
  rule: "Commentaires : restitués fidèlement par défaut, résumés seulement sur demande (D2)",
  check: (evidence) =>
    checkVerbatim({
      text: evidence.matter,
      sources: contenusDeGetChantierCommentaires(evidence),
    }),
  applicable: (evidence) =>
    contenusDeGetChantierCommentaires(evidence).length > 0,
});
