import type { DonneesEncart } from "@/server/albert/tools/encart";

// Sans dépendance serveur : le panneau de contexte de l'assistant l'affiche
// telle que le modèle la reçoit.

/**
 * Ce que l'encart couvre, et surtout ce qu'il ne couvre pas : sans ce
 * périmètre explicite, une question de suivi après l'encart partait sur
 * NAT-FR, et une donnée absente de l'encart était annoncée inexistante
 * (PIL-1949).
 */
export const couvertureEncart = ({
  jalon,
  donnees,
}: {
  jalon: number;
  donnees: DonneesEncart;
}) => {
  const territoires = new Map<string, string | null>();
  for (const { territoire_code, territoire_nom } of [
    ...donnees.taux,
    ...donnees.chantiers_en_retard.resultats,
    ...donnees.chantiers_en_difficulte.resultats,
  ]) {
    if (!territoires.has(territoire_code)) {
      territoires.set(territoire_code, territoire_nom);
    }
  }
  const avecIndicateurs = donnees.indicateurs !== undefined;

  return {
    territoires: [...territoires].map(([code, nom]) => ({ code, nom })),
    jalon,
    contient: [
      "taux d'avancement et position face à la médiane",
      "chantiers en retard et en difficulté : écart, niveau de confiance, tendance, commentaire de synthèse",
      ...(avecIndicateurs ? ["valeurs des indicateurs de ces chantiers"] : []),
    ],
    ne_contient_pas: [
      ...(avecIndicateurs ? [] : ["indicateurs"]),
      "commentaires typés (sur les données, actions, résultats, freins)",
      "objectifs",
      "chantiers ni en retard ni en difficulté",
      "autres territoires, dont les départements d'une région, et autres jalons",
    ],
    consigne:
      "Pour une donnée hors de cette couverture, appelle l'outil correspondant sur ce périmètre : son absence de l'encart ne dit pas qu'elle n'existe pas.",
  };
};
