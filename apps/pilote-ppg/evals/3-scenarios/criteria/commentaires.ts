import type { Evidence } from "../evidence";
import { judged, mechanical } from "../criterion";
import { synthesesDesChantiers } from "../truth";
import { checkAbsenceSignalee, checkNoVerbatim } from "../mechanicalChecks";

/**
 * La règle « Commentaires » du prompt, en trois critères. La fidélité
 * demande de lire : elle est jugée. La recopie et la mention d'absence sont
 * mécaniques : les calibrations du 30/09 et du 01/10 ont montré que le juge
 * ne les voyait pas. Le gabarit va changer ; la longueur des résumés n'est
 * plus vérifiée.
 */
const RESUMES_FIDELES = judged({
  id: "Résumés fidèles",
  rule: "Commentaires : extrais uniquement les idées clés sans interprétation ni jugement",
  instruction:
    "Sous chaque chantier listé dont la fiche porte un commentaire de synthèse, le résumé ne contient que des idées présentes dans ce commentaire. Une cause, un chiffre, une action ou une conséquence qui n'y figure pas est non conforme. La longueur du résumé n'est pas jugée ici.",
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

/**
 * Tous les commentaires que l'agent a reçus, quel que soit l'outil : ceux de
 * `get_chantier_commentaires`, mais aussi le commentaire de synthèse et les
 * commentaires territoriaux que porte `get_chantiers`. Revue du 30/09 : Albert
 * lit les commentaires par `get_chantiers`, et une recopie depuis cette
 * source passait inaperçue.
 */
function contenusDesCommentairesRecus(evidence: Evidence): string[] {
  return evidence.toolResults.flatMap((result) => {
    const resultats =
      (result.output as { resultats?: unknown[] }).resultats ?? [];

    if (result.toolName === "get_chantier_commentaires") {
      return (resultats as { commentaires: { contenu: string }[] }[]).flatMap(
        (resultat) =>
          resultat.commentaires.map((commentaire) => commentaire.contenu),
      );
    }

    if (result.toolName === "get_chantiers") {
      return (resultats as ResultatChantiers[]).flatMap((resultat) =>
        (resultat.chantiers ?? []).flatMap((chantier) =>
          [
            chantier.synthese?.commentaire,
            chantier.commentaires?.donnees?.contenu,
            chantier.commentaires?.autresResultats?.contenu,
          ].filter((contenu): contenu is string => Boolean(contenu)),
        ),
      );
    }

    return [];
  });
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
  rule: "Commentaires : condense et reformule, ne reproduis jamais un commentaire mot pour mot in extenso",
  check: (evidence) =>
    checkNoVerbatim({
      text: evidence.matter,
      sources: commentairesSources(evidence),
    }),
});

/**
 * Les chantiers dont aucune synthèse n'a de commentaire, hors territoires
 * masqués : là, c'est la restriction d'accès qu'il faut signaler, et
 * « Restriction signalée » le vérifie.
 */
function chantiersSansCommentaire(evidence: Evidence) {
  const visibles = synthesesDesChantiers(evidence.truth).filter(
    (synthese) => !evidence.maskedTerritories.includes(synthese.territoireCode),
  );
  const ids = [...new Set(visibles.map((synthese) => synthese.chantierId))];
  return ids.filter((chantierId) =>
    visibles
      .filter((synthese) => synthese.chantierId === chantierId)
      .every((synthese) => synthese.commentaire === null),
  );
}

const ABSENCE_SIGNALEE = mechanical({
  id: "Absence de commentaire signalée",
  rule: "Commentaires : si aucun commentaire n'est disponible, écris « Pas de commentaire disponible »",
  check: (evidence) =>
    checkAbsenceSignalee({
      text: evidence.matter,
      chantierIds: chantiersSansCommentaire(evidence),
    }),
  applicable: (evidence) => chantiersSansCommentaire(evidence).length > 0,
});

export const COMMENTAIRES_DU_GABARIT = [
  RESUMES_FIDELES,
  PAS_DE_RECOPIE,
  ABSENCE_SIGNALEE,
];
