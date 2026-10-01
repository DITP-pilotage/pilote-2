import type { Evidence } from "./evidence";
import { BASE_IDS, grid, judged, mechanical } from "./grid";
import { chantiersAttendus, synthesesDesChantiers } from "./truth";
import {
  checkAbsenceSignalee,
  checkChantiersCited,
  checkExactAnswer,
  checkHasTable,
  checkNoLink,
  checkNoVerbatim,
  checkSectionsDashboard,
  checkTableTerritories,
} from "./mechanicalChecks";

/**
 * Une grille par famille de scénario. Chaque critère cite la règle du prompt
 * système qu'il vérifie : c'est ce que le produit valide, ligne par ligne.
 * Les identifiants sont ce qui apparaît dans le tableau du rapport : courts
 * et parlants.
 */

const nomsDuTableau = (evidence: Evidence) =>
  evidence.tableTerritories.map(
    (code) =>
      evidence.truth.territoires.find((territoire) => territoire.code === code)
        ?.nom ?? code,
  );

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

const PAS_DE_RECOPIE = mechanical({
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

const COMMENTAIRES_DU_GABARIT = [
  RESUMES_FIDELES,
  PAS_DE_RECOPIE,
  ABSENCE_SIGNALEE,
];

const TABLEAU_COMPARATIF = mechanical({
  id: "Tableau comparatif",
  rule: "get_taux_avancement_territoire : plusieurs territoires → tableau comparatif ; Tableaux autorisés pour les comparaisons",
  check: (evidence) => checkHasTable({ text: evidence.matter }),
});

const TERRITOIRES_DU_TABLEAU = mechanical({
  id: "Territoires du tableau",
  rule: "Format : codes et noms officiels des territoires",
  check: (evidence) =>
    checkTableTerritories({
      text: evidence.matter,
      noms: nomsDuTableau(evidence),
    }),
});

/**
 * Le même tableau, vérifié par le juge plutôt que par une regex : les
 * synthèses d'une région avec ses départements suivent un gabarit appelé à
 * changer, et la forme du tableau avec lui.
 */
const TABLEAU_COMPARATIF_JUGE = judged({
  id: "Tableau comparatif",
  rule: "get_taux_avancement_territoire : plusieurs territoires → tableau comparatif ; codes et noms officiels des territoires",
  instruction:
    "La réponse présente les taux d'avancement des TERRITOIRES ATTENDUS DANS LE TABLEAU sous forme de tableau, une ligne par territoire, chacun désigné par son nom officiel. Un territoire absent du tableau, ou désigné seulement par son code ou son numéro, est non conforme.",
});

const ANALYSE_DES_ECARTS = judged({
  id: "Analyse des écarts",
  rule: "Comparaison : décris factuellement qui est en avance, qui est en retard, de combien de points",
  instruction:
    "La réponse dit quel territoire est devant, lequel est derrière, et de combien de points de taux d'avancement. Le territoire annoncé devant doit être celui dont le taux est le plus élevé dans les données reçues : un classement inversé est non conforme, même si les chiffres cités sont justes.",
});

const POSITION_MEDIANE = judged({
  id: "Position face à la médiane",
  rule: "Écart à la médiane : EN RETARD <= -10, EN AVANCE >= +10, DANS LA MÉDIANE entre les deux",
  instruction:
    "Chaque territoire est situé face à la médiane de SA maille (une région face aux régions, un département face aux départements), avec la position rendue par les données (en retard, dans la médiane, en avance).",
});

export const GRIDS = {
  syntheseTerritoire: grid({
    family: "Synthèse d'un territoire",
    matter: "text",
    criteria: [
      mechanical({
        id: "Chantiers attendus",
        rule: "Workflow a : les chantiers en retard et en difficulté du territoire",
        check: (evidence) =>
          checkChantiersCited({
            text: evidence.matter,
            chantiers: chantiersAttendus({
              truth: evidence.truth,
              view: "tous",
            }),
          }),
      }),
      judged({
        id: "Écart et météo",
        rule: "Gabarit mono_territoire : écart en points et météo pour chaque chantier",
        instruction:
          "Chaque chantier listé porte son écart en points et sa météo, et cette météo est celle que la fiche lui donne (NUAGE se lit « Appuis nécessaires », ORAGE « Objectifs compromis », COUVERT « Objectifs atteignables », SOLEIL « Objectifs sécurisés »). Un écart ou une météo absents sous un chantier sont non conformes, même s'ils sont cités ailleurs. L'écriture de la météo (code ou libellé) et l'exactitude des chiffres relèvent d'autres critères.",
      }),
      ...COMMENTAIRES_DU_GABARIT,
    ],
  }),

  syntheseChantier: grid({
    family: "Synthèse d'un chantier sur un territoire",
    matter: "text",
    criteria: [
      judged({
        id: "Trois volets",
        rule: "Demande : synthèse du chantier, position face aux autres territoires, difficultés des commentaires",
        instruction:
          "Cherche dans la réponse un passage pour chacun des trois volets de la demande, et cite-les dans la preuve : (1) la situation du chantier sur le territoire demandé ; (2) sa position face à au moins un autre territoire ; (3) des difficultés tirées des commentaires. Un volet sans passage qui le traite est non conforme. La justesse du contenu de chaque volet relève d'autres critères.",
      }),
      judged({
        id: "Situé face aux autres territoires",
        rule: "Comparer des territoires entre eux",
        instruction:
          "Le chantier est situé face à au moins un autre territoire avec des valeurs chiffrées (taux ou écart) ÉCRITES dans la réponse. Une position énoncée sans chiffre (« derrière », « devant ») est non conforme, même si les données reçues permettraient de la chiffrer.",
      }),
      judged({
        id: "Difficultés tirées des commentaires",
        rule: "Commentaires : extrais les idées clés sans interprétation",
        instruction:
          "Chaque difficulté citée provient des commentaires reçus (délais, postes vacants, fermetures de lignes…). Une difficulté qui n'y figure pas est non conforme. Ce critère ne juge que l'invention : l'absence de difficultés relève de « Trois volets », et reste conforme ici.",
      }),
    ],
  }),

  syntheseSousTerritoires: grid({
    family: "Synthèse d'une région et de ses départements",
    matter: "text",
    criteria: [
      TABLEAU_COMPARATIF_JUGE,
      ANALYSE_DES_ECARTS,
      ...COMMENTAIRES_DU_GABARIT,
    ],
  }),

  chantiersEnRetard: grid({
    family: "Chantiers en retard et leurs indicateurs",
    matter: "text",
    criteria: [
      mechanical({
        id: "Chantiers en retard cités",
        rule: "Format des chantiers : chaque chantier au format CH-XXX — Nom",
        check: (evidence) =>
          checkChantiersCited({
            text: evidence.matter,
            chantiers: chantiersAttendus({
              truth: evidence.truth,
              view: "en_retard",
            }),
          }),
      }),
      judged({
        id: "Écart par chantier",
        rule: "get_chantiers en_retard : indique l'écart par rapport à la médiane (en points) et la météo",
        instruction:
          "Chaque chantier en retard porte son écart à la médiane en points et le libellé de sa météo. L'exactitude des chiffres relève de « Chiffres exacts ».",
      }),
      judged({
        id: "Valeurs des indicateurs",
        rule: "Demande : les valeurs des indicateurs de chaque chantier en retard (VI, VA, VC, TA)",
        instruction:
          "Pour chaque chantier en retard, la réponse DONNE les valeurs de ses indicateurs (valeur initiale, actuelle, cible, taux d'avancement). Renvoyer vers un tableau de bord ou dire que l'affichage est impossible est non conforme. L'exactitude des valeurs relève de « Chiffres exacts », pas de ce critère.",
      }),
    ],
  }),

  rapport: grid({
    family: "Rapport complet",
    matter: "rapport",
    criteria: [
      mechanical({
        id: "Export appelé",
        rule: "Workflow c : appelle export_rapport avec les données structurées",
        check: (evidence) => {
          const call = evidence.toolCalls.find(
            (toolCall) => toolCall.toolName === "export_rapport",
          );
          if (!call) return { ok: false, detail: "export non appelé" };
          const format =
            (call.input as { format?: string }).format ?? "markdown";
          return format === "markdown"
            ? { ok: true, detail: "export markdown" }
            : { ok: false, detail: `format ${format} au lieu de markdown` };
        },
      }),
      mechanical({
        id: "Réponse du chat",
        rule: "Workflow c : réponds « Votre rapport est disponible au téléchargement. », n'invente jamais de lien",
        check: (evidence) => {
          const lien = checkNoLink({ text: evidence.answer });
          return lien.ok
            ? checkExactAnswer({
                text: evidence.answer,
                expected: "Votre rapport est disponible au téléchargement.",
              })
            : lien;
        },
      }),
      judged({
        id: "Fidèle à la conversation",
        rule: "Workflow c : le rapport reprend la synthèse de la conversation en cours",
        instruction:
          "Compare le rapport exporté à la CONVERSATION PRÉCÉDENTE. Chaque chiffre, chantier ou constat du rapport y a été donné, ou figure dans les DONNÉES REÇUES ; et les éléments principaux de la synthèse rendue par l'assistant dans la CONVERSATION PRÉCÉDENTE (taux, CHAQUE chantier cité, constats) se retrouvent dans le rapport. La phrase du chat qui annonce le rapport n'est pas cette synthèse. Un élément qui contredit la conversation, ou un chantier de la synthèse absent du rapport, est non conforme. Sans rapport exporté, non conforme.",
        applicable: (evidence) => evidence.conversation.length > 0,
      }),
    ],
  }),

  dashboard: grid({
    family: "Tableau de bord du territoire",
    matter: "dashboard",
    // Le format CH-XXX — Nom vaut pour la prose : la matière d'un dashboard
    // est une liste de widgets, dont les paramètres portent les codes seuls.
    omit: [BASE_IDS.restriction, BASE_IDS.chantierFormat],
    criteria: [
      mechanical({
        id: "Sections dans l'ordre",
        rule: "Demande : une première section territoire, puis une section par chantier en retard ou en difficulté",
        check: (evidence) =>
          evidence.dashboard
            ? checkSectionsDashboard({
                containers: evidence.dashboard.containers,
                chantierIds: chantiersAttendus({
                  truth: evidence.truth,
                  view: "tous",
                }).map((chantier) => chantier.id),
              })
            : { ok: false, detail: "aucun dashboard" },
      }),
      judged({
        id: "Pas de chiffre dans le texte",
        rule: "create_dashboard : ne reproduis JAMAIS de valeurs chiffrées dans ta réponse textuelle",
        instruction:
          "Le TEXTE D'ACCOMPAGNEMENT ne reproduit aucune valeur chiffrée (taux, écart, médiane, nombre de chantiers, valeur d'indicateur) : les widgets les affichent. Un code de chantier ou de territoire, une année de jalon ne sont pas des valeurs. Ne juge que le texte d'accompagnement, pas les widgets.",
      }),
      judged({
        id: "Widgets conformes à la demande",
        rule: "create_dashboard : task décrit ce que l'utilisateur veut voir",
        instruction:
          "Types de widgets disponibles : taux_avancement_territoire (TA d'un territoire), mediane_avancement_territoire, nombre_chantiers_en_retard, nombre_chantiers_en_difficulte, valeurs_remarquables_avancement, tableau_indicateurs_chantier (indicateurs d'un chantier), liste_chantiers_en_retard, liste_chantiers_en_difficulte, cartographie_taux_avancement, cartographie_meteo (météo d'un chantier par territoire), cartographie_propositions_valeur_avancement, evolution_taux_avancement, evolution_valeur_avancement, titre_section, paragraph. Chaque élément que la demande énumère pour une section est présent avec le widget qui lui correspond (un paragraphe pour la météo et le commentaire de synthèse), et aucun widget étranger à la demande n'est ajouté. Ne juge que les TYPES de widgets et leur répartition en sections : la largeur (`width`, où 4 est la pleine largeur) relève de la mise en page et n'est pas jugée, pas plus que le contenu des paragraphes.",
      }),
    ],
  }),

  commentaires: grid({
    family: "Synthèse des commentaires",
    matter: "text",
    criteria: [
      judged({
        id: "Une synthèse par chantier",
        rule: "Demande : synthétise les commentaires de chaque chantier cité",
        instruction:
          "Chaque chantier de la demande a sa propre synthèse, au format CH-XXX — Nom. Pour un chantier dont les données reçues ne contiennent AUCUN commentaire, la réponse dit qu'il n'y en a pas : lui attribuer un contenu, quel qu'il soit, est non conforme.",
      }),
      judged({
        id: "Actions identifiées",
        rule: "Demande : notamment les principales actions identifiées",
        instruction:
          "Les actions citées (recrutements, ouvertures, campagnes…) proviennent des commentaires reçus. Si les données reçues signalent des types non accessibles, la réponse dit que ces informations relèvent de la vue nationale, et non qu'il n'y en a pas.",
      }),
      PAS_DE_RECOPIE,
      judged({
        id: "Doublons compactés",
        rule: "Demande : synthétise les commentaires",
        instruction:
          "Quand plusieurs commentaires reçus pour un même chantier disent la même chose, la synthèse l'énonce une seule fois. Une même information répétée sous un chantier, même reformulée, est non conforme. Si les commentaires reçus ne se recoupent pas, ce critère est conforme.",
      }),
    ],
  }),

  comparaisonTerritoires: grid({
    family: "Comparer avec un autre territoire",
    matter: "text",
    criteria: [
      TABLEAU_COMPARATIF,
      TERRITOIRES_DU_TABLEAU,
      ANALYSE_DES_ECARTS,
      POSITION_MEDIANE,
    ],
  }),

  comparaisonJalons: grid({
    family: "Comparer les taux entre deux jalons",
    matter: "text",
    omit: [BASE_IDS.restriction],
    criteria: [
      judged({
        id: "Évolution entre jalons",
        rule: "Workflow b : compare les résultats et présente l'évolution",
        instruction:
          "Un taux « - % » ou null dans les données reçues signifie qu'il n'y a PAS de données pour ce jalon : dans ce cas, ce critère est conforme sans autre vérification. Si les deux jalons ont un taux chiffré, la réponse donne le taux à chaque jalon et l'évolution en points, avec le bon sens : hausse si le taux du jalon le plus récent est plus élevé, baisse sinon.",
      }),
      judged({
        id: "Données indisponibles dites",
        rule: "Gestion des erreurs : si aucun résultat n'est disponible pour un jalon, indique que les données ne sont pas disponibles",
        instruction:
          "Un taux « - % » ou null dans les données reçues signifie qu'il n'y a pas de données pour ce jalon. Dans ce cas, la réponse le dit explicitement ; la passer sous silence ou afficher une valeur est non conforme. Si les deux jalons ont un taux chiffré, ce critère est conforme.",
      }),
    ],
  }),

  comparaisonSousTerritoires: grid({
    family: "Comparer une région avec ses départements",
    matter: "text",
    omit: [BASE_IDS.restriction],
    criteria: [TABLEAU_COMPARATIF_JUGE, ANALYSE_DES_ECARTS, POSITION_MEDIANE],
  }),

  comparaisonQuantitative: grid({
    family: "Comparaison quantitative des territoires",
    matter: "text",
    omit: [BASE_IDS.restriction],
    criteria: [
      TABLEAU_COMPARATIF,
      TERRITOIRES_DU_TABLEAU,
      ANALYSE_DES_ECARTS,
      POSITION_MEDIANE,
    ],
  }),
};
