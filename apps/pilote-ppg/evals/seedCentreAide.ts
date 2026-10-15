import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

const GROUPE_NOTIONS = "0192a000-0000-7000-8000-0000000000a1";
export const PAGE_TAUX = "0192a000-0000-7000-8000-0000000000a2";
const PAGE_METEO = "0192a000-0000-7000-8000-0000000000a3";
const GROUPE_SAISIE = "0192a000-0000-7000-8000-0000000000b1";
export const PAGE_IMPORT = "0192a000-0000-7000-8000-0000000000b2";
const PAGE_IMPORT_MASQUEE = "0192a000-0000-7000-8000-0000000000b3";
const PAGE_EXPORT = "0192a000-0000-7000-8000-0000000000b4";
const GROUPE_ARCHIVES = "0192a000-0000-7000-8000-0000000000c1";
const PAGE_ARCHIVEE = "0192a000-0000-7000-8000-0000000000c2";

export const IDS_PAGES_VISIBLES = [
  PAGE_TAUX,
  PAGE_METEO,
  PAGE_IMPORT,
  PAGE_EXPORT,
];

/**
 * Chaque contenu invisible porte un marqueur : le retrouver dans une réponse
 * prouve une fuite.
 */
const MARQUEUR_MASQUE = "ZEPHYR-MASQUE";
const MARQUEUR_DEPUBLIE = "ZEPHYR-DEPUBLIE";
const MARQUEUR_BROUILLON = "ZEPHYR-BROUILLON";
export const MARQUEURS_INVISIBLES = [
  MARQUEUR_MASQUE,
  MARQUEUR_DEPUBLIE,
  MARQUEUR_BROUILLON,
];

/**
 * Un centre d'aide réduit, fictif, aux formulations propres : les evals
 * vérifient que l'assistant restitue CE contenu, pas qu'il connaît PILOTE.
 */
export async function seedCentreAide() {
  await getPrisma().article_centre_aide.createMany({
    data: [
      {
        id: GROUPE_NOTIONS,
        titre: "Introduction et notions clés",
        type: "GROUPE",
        ordre: 1,
        est_publie: true,
      },
      {
        id: PAGE_TAUX,
        titre: "Le taux d'avancement",
        type: "PAGE",
        ordre: 1,
        parent_id: GROUPE_NOTIONS,
        est_publie: true,
        contenu:
          "<p>Le taux d'avancement mesure la progression d'un indicateur entre sa valeur initiale (VI) et sa valeur cible (VC), au regard de sa valeur actuelle (VA).</p><h2>Pour un indicateur</h2><p>TA = (VA − VI) / (VC − VI) × 100. Le taux est plafonné à 100 %.</p><h2>Pour un chantier</h2><p>Le taux d'avancement d'un chantier est la moyenne des taux d'avancement de ses indicateurs, pondérée par le poids de chaque indicateur.</p>",
      },
      {
        id: PAGE_METEO,
        titre: "La météo d'un chantier",
        type: "PAGE",
        ordre: 2,
        parent_id: GROUPE_NOTIONS,
        est_publie: true,
        contenu:
          "<p>La météo exprime le niveau de confiance du responsable du chantier dans l'atteinte de ses objectifs. Elle est renseignée chaque mois.</p><h2>Les quatre niveaux</h2><ul><li>Objectifs sécurisés</li><li>Objectifs atteignables</li><li>Appuis nécessaires</li><li>Objectifs compromis</li></ul>",
      },
      {
        id: GROUPE_SAISIE,
        titre: "Saisie et import des données",
        type: "GROUPE",
        ordre: 2,
        est_publie: true,
      },
      {
        id: PAGE_IMPORT,
        titre: "Importer des mesures d'indicateurs",
        type: "PAGE",
        ordre: 1,
        parent_id: GROUPE_SAISIE,
        est_publie: true,
        contenu:
          "<p>Les mesures d'indicateurs s'importent depuis la page « Import de mesures ».</p><h2>Étapes</h2><ol><li>Téléchargez le modèle de fichier.</li><li>Remplissez une ligne par mesure.</li><li>Déposez le fichier : PILOTE le vérifie avant de l'enregistrer.</li></ol>",
      },
      {
        id: PAGE_IMPORT_MASQUEE,
        titre: "Ancienne procédure d'import",
        type: "PAGE",
        ordre: 2,
        parent_id: GROUPE_SAISIE,
        est_publie: true,
        est_masque: true,
        contenu: `<p>Envoyez le fichier par mail au référent ${MARQUEUR_MASQUE}.</p>`,
      },
      {
        id: PAGE_EXPORT,
        titre: "Exporter les données",
        type: "PAGE",
        ordre: 3,
        parent_id: GROUPE_SAISIE,
        est_publie: true,
        contenu:
          "<p>Le bouton « Exporter » de la page d'un chantier télécharge ses données au format Excel.</p>",
        contenu_brouillon: `<p>Export au format CSV ${MARQUEUR_BROUILLON}.</p>`,
      },
      {
        id: GROUPE_ARCHIVES,
        titre: "Archives",
        type: "GROUPE",
        ordre: 3,
        est_publie: false,
      },
      {
        id: PAGE_ARCHIVEE,
        titre: "Procédure d'export 2024",
        type: "PAGE",
        ordre: 1,
        parent_id: GROUPE_ARCHIVES,
        est_publie: true,
        contenu: `<p>L'export se demandait par ticket ${MARQUEUR_DEPUBLIE}.</p>`,
      },
    ],
  });
}
