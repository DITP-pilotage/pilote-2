import type { Evidence } from "./evidence";
import { BASE_IDS, grid, judged, mechanical } from "./grid";
import { chantiersAttendus, synthesesDesChantiers } from "./truth";
import {
  checkAbsenceSignalee,
  checkChantiersCited,
  checkContains,
  checkExactAnswer,
  checkHasTable,
  checkHeadings,
  checkNoChantierTable,
  checkNoFigure,
  checkNoLink,
  checkNoVerbatim,
  checkResumesCourts,
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

const territoirePrincipalEstUnDepartement = (evidence: Evidence) =>
  evidence.truth.territoires.find(
    (territoire) =>
      territoire.code === evidence.truth.tauxAvancement[0]?.territoire_code,
  )?.maille === "DEPT";

/**
 * La règle « Commentaires » du prompt est découpée en quatre critères. La
 * longueur, la recopie et la mention d'absence sont mécaniques : les
 * calibrations du 30/09 ont montré que le juge ne les voyait pas (0/3 sur
 * leurs mutants). Le juge ne garde que la fidélité au commentaire, qui
 * demande de lire.
 */
const RESUMES_COURTS = mechanical({
  id: "Résumés en 1 à 2 phrases",
  rule: "Commentaires : condense en 1-2 phrases factuelles",
  check: (evidence) => checkResumesCourts({ text: evidence.matter }),
});

const RESUMES_FIDELES = judged({
  id: "Résumés fidèles",
  rule: "Commentaires : extrais uniquement les idées clés sans interprétation ni jugement",
  instruction:
    "Sous chaque chantier listé dont la fiche porte un commentaire de synthèse, le résumé ne contient que des idées présentes dans ce commentaire. Une cause, un chiffre, une action ou une conséquence qui n'y figure pas est non conforme. La longueur du résumé n'est pas jugée ici.",
});

const PAS_DE_RECOPIE_DES_SYNTHESES = mechanical({
  id: "Pas de recopie",
  rule: "Commentaires : ne reproduis jamais un commentaire mot pour mot in extenso",
  check: (evidence) =>
    checkNoVerbatim({
      text: evidence.matter,
      sources: synthesesDesChantiers(evidence.truth).flatMap((synthese) =>
        synthese.commentaire ? [synthese.commentaire] : [],
      ),
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

function contenusDesCommentairesRecus(evidence: Evidence): string[] {
  return evidence.toolResults
    .filter((result) => result.toolName === "get_chantier_commentaires")
    .flatMap(
      (result) =>
        (
          result.output as {
            resultats?: { commentaires: { contenu: string }[] }[];
          }
        ).resultats ?? [],
    )
    .flatMap((resultat) =>
      resultat.commentaires.map((commentaire) => commentaire.contenu),
    );
}

const COMMENTAIRES_DU_GABARIT = [
  RESUMES_COURTS,
  RESUMES_FIDELES,
  PAS_DE_RECOPIE_DES_SYNTHESES,
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
        id: "Sections du gabarit",
        rule: "Gabarit mono_territoire : titre, chantiers en retard, chantiers en difficulté, sources",
        check: (evidence) => {
          const titres = checkHeadings({
            text: evidence.matter,
            titles: [
              "Synthèse pour",
              "Chantiers en retard",
              "Chantiers en difficulté",
            ],
          });
          return titres.ok
            ? checkContains({
                text: evidence.matter,
                fragments: ["Sources analysées"],
              })
            : titres;
        },
      }),
      mechanical({
        id: "Chantiers cités",
        rule: "Format des chantiers : chaque chantier au format CH-XXX — Nom",
        check: (evidence) =>
          checkChantiersCited({
            text: evidence.matter,
            chantiers: chantiersAttendus({
              truth: evidence.truth,
              view: "tous",
            }),
          }),
      }),
      mechanical({
        id: "Synthèses de tendance",
        rule: "Gabarit mono_territoire : « Synthèse — chantiers en retard » et « Synthèse — chantiers en difficulté »",
        check: (evidence) =>
          checkContains({
            text: evidence.matter.replace(/[*_]/g, ""),
            fragments: [
              "Synthèse — chantiers en retard",
              "Synthèse — chantiers en difficulté",
            ],
          }),
      }),
      mechanical({
        id: "Pas de tableau",
        rule: "Tableaux : pas de tableau pour les listes de chantiers",
        check: (evidence) => checkNoChantierTable({ text: evidence.matter }),
      }),
      judged({
        id: "Écart et météo",
        rule: "Gabarit mono_territoire : écart en points et météo (libellé) pour chaque chantier",
        instruction:
          "Chaque chantier listé porte son écart en points et le libellé de sa météo. Un écart absent sous un chantier est non conforme, même s'il est cité ailleurs. Le libellé de météo correspond à la météo de la fiche ; l'exactitude des chiffres relève de « Chiffres exacts ».",
      }),
      ...COMMENTAIRES_DU_GABARIT,
      judged({
        id: "Maille nommée",
        rule: "Factualité : n'affirme rien de faux ; le gabarit écrit « de la région » quel que soit le territoire",
        instruction:
          "Le territoire est désigné par sa maille réelle : un département n'est jamais présenté comme « la région ».",
        applicable: territoirePrincipalEstUnDepartement,
      }),
    ],
  }),

  syntheseChantier: grid({
    family: "Synthèse d'un chantier sur un territoire",
    matter: "text",
    criteria: [
      mechanical({
        id: "Pas le gabarit territorial",
        rule: "Workflow a : le gabarit de synthèse territoriale ne vaut que pour une demande qui ne cible pas un chantier spécifique",
        check: (evidence) => {
          const gabarit = checkHeadings({
            text: evidence.matter,
            titles: ["Chantiers en retard", "Chantiers en difficulté"],
          });
          return gabarit.ok
            ? {
                ok: false,
                detail: "la réponse suit le gabarit de synthèse territoriale",
              }
            : { ok: true, detail: "réponse centrée sur le chantier" };
        },
      }),
      judged({
        id: "Trois volets",
        rule: "Demande : synthèse du chantier, position face aux autres territoires, difficultés des commentaires",
        instruction:
          "La réponse traite les trois volets de la demande : la synthèse du chantier sur le territoire, sa position face à d'autres territoires, les difficultés remontées dans les commentaires.",
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
      mechanical({
        id: "Sections du gabarit comparaison",
        rule: "Gabarit : plusieurs territoires dans les résultats → template comparaison",
        check: (evidence) =>
          checkHeadings({
            text: evidence.matter,
            titles: [
              "Comparaison",
              "Analyse des écarts",
              "Chantiers en retard",
              "Chantiers en difficulté",
            ],
          }),
      }),
      TABLEAU_COMPARATIF,
      TERRITOIRES_DU_TABLEAU,
      ANALYSE_DES_ECARTS,
      judged({
        id: "Communs et spécifiques",
        rule: "Gabarit comparaison : chantiers communs à plusieurs territoires, puis spécifiques à chacun",
        instruction:
          "Les chantiers en retard ou en difficulté présents dans plusieurs territoires sont regroupés en « communs » avec la liste des territoires concernés ; les autres sont rangés sous leur territoire.",
      }),
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
        id: "Sections demandées",
        rule: "Demande : taux d'avancement, chantiers en retard, chantiers en difficulté et leurs indicateurs",
        instruction:
          "Le rapport exporté contient le taux d'avancement du territoire, les chantiers en retard, les chantiers en difficulté, et les indicateurs de ces chantiers. Sans rapport exporté, non conforme.",
      }),
      judged({
        id: "Tableau d'indicateurs",
        rule: "Export : tu DOIS inclure les données des indicateurs sous forme de tableau dans le rapport",
        instruction:
          "Le rapport exporté présente les indicateurs de chaque chantier cité sous forme de tableau. Sans rapport exporté, non conforme.",
      }),
    ],
  }),

  dashboard: grid({
    family: "Tableau de bord du territoire",
    matter: "dashboard",
    omit: [BASE_IDS.restriction],
    criteria: [
      mechanical({
        id: "Sections dans l'ordre",
        rule: "Demande : une première section territoire, puis une section par chantier en retard ou en difficulté",
        check: (evidence) => {
          if (!evidence.dashboard) {
            return { ok: false, detail: "aucun dashboard" };
          }
          const chantiersParSection = evidence.dashboard.containers.map(
            (container) => [
              ...new Set(
                container.widgets
                  .filter((widget) => "chantier_id" in widget)
                  .map(
                    (widget) => (widget as { chantier_id: string }).chantier_id,
                  ),
              ),
            ],
          );
          const [premiere = [], ...suivantes] = chantiersParSection;
          if (premiere.length > 0) {
            return {
              ok: false,
              detail: "la première section porte sur un chantier",
            };
          }
          const attendus = chantiersAttendus({
            truth: evidence.truth,
            view: "tous",
          }).map((chantier) => chantier.id);
          const obtenus = suivantes.map((ids) => ids.join("+")).sort();
          return JSON.stringify(obtenus) === JSON.stringify(attendus)
            ? {
                ok: true,
                detail: `une section par chantier : ${attendus.join(", ")}`,
              }
            : {
                ok: false,
                detail: `sections chantier : ${obtenus.join(", ") || "aucune"}, attendu ${attendus.join(", ")}`,
              };
        },
      }),
      mechanical({
        id: "Pas de chiffre dans le texte",
        rule: "create_dashboard : ne reproduis JAMAIS de valeurs chiffrées dans ta réponse textuelle",
        check: (evidence) => checkNoFigure({ text: evidence.answer }),
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
      // « Synthétise » est une demande explicite de reformulation : ici, la
      // restitution en verbatim que demande l'outil ne s'applique pas.
      mechanical({
        id: "Pas de recopie",
        rule: "Commentaires : condense et reformule, ne reproduis jamais un commentaire in extenso",
        check: (evidence) =>
          checkNoVerbatim({
            text: evidence.matter,
            sources: contenusDesCommentairesRecus(evidence),
          }),
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
    criteria: [
      TABLEAU_COMPARATIF,
      TERRITOIRES_DU_TABLEAU,
      ANALYSE_DES_ECARTS,
      POSITION_MEDIANE,
    ],
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
