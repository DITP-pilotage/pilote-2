import { BASE_IDS, judged, mechanical, withBase } from "../criterion";
import { chantiersAttendus } from "../truth";
import { checkSectionsDashboard } from "../mechanicalChecks";

/** Les critères du scénario « Tableau de bord du territoire ». */
export const TABLEAU_DE_BORD_CRITERIA = withBase({
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
});
