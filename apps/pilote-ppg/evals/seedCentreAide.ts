import type { $Enums } from "@prisma/client";
import { getPrisma } from "@/server/framework/persistence/PrismaTransaction";

type ArticleSeed = {
  id: string;
  titre: string;
  titre_affiche?: string;
  contenu?: string;
  type: $Enums.TypeArticleCentreAide;
  ordre: number;
  parent_id?: string;
};

const GROUPE_INTRODUCTION = "0192a000-0000-7000-8000-0000000000a1";
const GROUPE_DONNEES = "0192a000-0000-7000-8000-0000000000a2";
export const PAGE_TAUX_AVANCEMENT = "0192a000-0000-7000-8000-0000000000a3";
const PAGE_TYPES_DONNEES = "0192a000-0000-7000-8000-0000000000a4";
const GROUPE_SAISIE = "0192a000-0000-7000-8000-0000000000b1";
const PAGE_METEO = "0192a000-0000-7000-8000-0000000000b2";
export const PAGE_PREPARER_FICHIER = "0192a000-0000-7000-8000-0000000000b3";
export const PAGE_MISE_A_JOUR_INDICATEURS =
  "0192a000-0000-7000-8000-0000000000b4";
const GROUPE_EXPORT = "0192a000-0000-7000-8000-0000000000c1";
const PAGE_EXPORT = "0192a000-0000-7000-8000-0000000000c2";
const GROUPE_PVA = "0192a000-0000-7000-8000-0000000000d1";
const PAGE_PVA = "0192a000-0000-7000-8000-0000000000d2";
const GROUPE_UTILISATEURS = "0192a000-0000-7000-8000-0000000000e1";
const PAGE_COMPTES = "0192a000-0000-7000-8000-0000000000e2";
const GROUPE_RESSOURCES = "0192a000-0000-7000-8000-0000000000f1";
const PAGE_FAQ = "0192a000-0000-7000-8000-0000000000f2";
const PAGE_LEXIQUE = "0192a000-0000-7000-8000-0000000000f3";

/**
 * Un centre d'aide fictif, inspiré du réel sans en reprendre le texte : le
 * contenu de production ne doit pas sortir de la base. Les faits (formule du
 * taux d'avancement, vocabulaire, arborescence, procédures) et les structures
 * HTML de l'éditeur (titres ouverts par un `<br>`, callouts, accordéons,
 * images sans texte alternatif, vidéo, icônes) suivent ceux de la production,
 * pour que les evals passent par la même conversion.
 *
 * La visibilité (masqué, dépublié, brouillon) n'est pas semée : c'est la
 * query qui filtre, et ses tests le couvrent.
 */
const ARTICLES: ArticleSeed[] = [
  {
    id: GROUPE_INTRODUCTION,
    titre: "Introduction et notions clés",
    type: "GROUPE",
    ordre: 0,
  },
  {
    id: GROUPE_DONNEES,
    titre: "Les données dans PILOTE",
    type: "GROUPE",
    ordre: 0,
    parent_id: GROUPE_INTRODUCTION,
  },
  {
    id: PAGE_TYPES_DONNEES,
    titre: "Les types de données dans PILOTE",
    type: "PAGE",
    ordre: 0,
    parent_id: GROUPE_DONNEES,
    contenu: `<p>PILOTE rassemble deux familles de données pour suivre un chantier prioritaire.</p><h4><br>Les données quantitatives</h4><p>Ce sont les indicateurs du chantier. Chaque indicateur porte trois valeurs : la valeur initiale, la valeur d'avancement et la valeur cible.</p><h4><br>Les données qualitatives</h4><p>Ce sont les commentaires saisis sur le chantier, dont la météo, qui traduit le niveau de confiance dans l'atteinte des résultats.</p>`,
  },
  {
    id: PAGE_TAUX_AVANCEMENT,
    titre: "Le taux d’avancement",
    type: "PAGE",
    ordre: 1,
    parent_id: GROUPE_DONNEES,
    contenu: `<div data-type="callout" data-color="info"><p>Le taux d'avancement est calculé à partir des données quantitatives des chantiers.</p></div><h4><br>Le taux d’avancement d’un indicateur</h4><p>Il mesure le chemin parcouru vers la cible. Il repose sur trois valeurs :</p><ul><li><p>la <strong>valeur initiale (VI)</strong> : la valeur de référence ;</p></li><li><p>la <strong>valeur d’avancement (VA)</strong> : la valeur au jalon sélectionné ;</p></li><li><p>la <strong>valeur cible (VC)</strong> : la valeur à atteindre.</p></li></ul><div data-type="callout" data-color="success"><p>Le taux d’avancement (TA) se calcule ainsi :</p><p><strong>TA = (VA – VI) / (VC – VI)</strong></p></div><p><strong>Le taux est borné : il ne descend pas sous 0 % et ne dépasse pas 100 %.</strong></p><p><img src="/centre-aide/taux-indicateur.png"></p><h4><br>Le taux d’avancement d’un chantier</h4><p>C'est la moyenne pondérée des taux d'avancement de ses indicateurs. Les pondérations sont fixées par les directeurs de projet et peuvent varier selon la maille territoriale.</p><h4><br>Le taux d’avancement d’un territoire</h4><p>C'est la moyenne simple des taux d'avancement des chantiers du territoire.</p>`,
  },
  {
    id: GROUPE_SAISIE,
    titre: "Saisie & import des données",
    type: "GROUPE",
    ordre: 1,
  },
  {
    id: PAGE_METEO,
    titre: "Saisir une météo",
    type: "PAGE",
    ordre: 0,
    parent_id: GROUPE_SAISIE,
    contenu: `<p>La météo se renseigne dans la section météo de la page chantier, avec le bouton « Nouveau commentaire ».</p><h4><br>Les quatre niveaux de météo</h4><ul><li><p><strong>Objectif sécurisé</strong> : le chantier se déploie sans difficulté.</p></li><li><p><strong>Objectif atteignable</strong> : des difficultés existent mais se règlent sur le terrain.</p></li><li><p><strong>Appui nécessaire</strong> : des obstacles importants demandent une intervention du directeur de projet.</p></li><li><p><strong>Objectif compromis</strong> : les difficultés empêchent d'atteindre l'objectif.</p></li></ul>`,
  },
  {
    id: PAGE_PREPARER_FICHIER,
    titre: "Indicateurs : préparer son fichier",
    type: "PAGE",
    ordre: 1,
    parent_id: GROUPE_SAISIE,
    contenu: `<div data-type="callout" data-color="info"><p><strong>Prérequis</strong></p><p>Vous êtes directeur de projet, ou membre de son équipe, et disposez du droit de saisie des indicateurs.</p></div><h4><br>Je ne dispose pas d’un tableau</h4><div data-type="accordion-item" data-title="Procédure"><ul><li><p>Depuis la page d'accueil, ouvrez votre chantier et cliquez sur « Mettre à jour les données » ;</p></li><li><p>dans « Importez vos données », cliquez sur « Suivant » ;</p></li><li><p>téléchargez l'un des modèles de tableau.</p></li></ul><p>Le tableau compte cinq colonnes obligatoires, dont l'identifiant de l'indicateur (identifiant_indic), la date et la valeur.</p><p><img src="/centre-aide/modele-import.png"></p></div><h4><br>Je dispose d’un tableau</h4><div data-type="accordion-item" data-title="Procédure"><p>Vérifiez que votre tableau respecte le format du modèle : mêmes colonnes, dans le même ordre, avec les mêmes intitulés.</p></div>`,
  },
  {
    id: PAGE_MISE_A_JOUR_INDICATEURS,
    titre: "Indicateurs : mise à jour",
    type: "PAGE",
    ordre: 2,
    parent_id: GROUPE_SAISIE,
    contenu: `<p>Une fois le fichier préparé, déposez-le dans le module d'import : PILOTE le vérifie avant d'enregistrer les valeurs.</p><h4><br>En cas d'erreur</h4><p>Vérifiez notamment l'identifiant de l'indicateur sur chaque ligne, l'ordre et les intitulés des colonnes, et le format des dates.</p><h4><br>Repérer les indicateurs à mettre à jour</h4><p>Une alerte signale les indicateurs dont la valeur d'avancement n'a pas été mise à jour à la date prévisionnelle.</p><div data-type="callout" data-color="warning"><p>Cette alerte n'est visible que des directeurs de projet et de la DITP.</p></div><div data-type="video" data-src="https://tube.numerique.gouv.fr/videos/watch/exemple" data-align="center" data-largeur="100"></div>`,
  },
  {
    id: GROUPE_EXPORT,
    titre: "Export des données",
    type: "GROUPE",
    ordre: 2,
  },
  {
    id: PAGE_EXPORT,
    titre: "Exporter les données",
    type: "PAGE",
    ordre: 0,
    parent_id: GROUPE_EXPORT,
    contenu: `<p>Le bouton « Exporter les données » de l'interface principale télécharge les données au format .csv, lisible dans un tableur.</p><div data-type="callout" data-color="info"><p>L'export est ouvert à tous les utilisateurs ; les données exportées dépendent de vos habilitations sur les chantiers et les territoires.</p></div><h4><br>Les trois exports</h4><ul><li><p><strong>Export des chantiers</strong> : résultats, commentaires et responsables des chantiers ;</p></li><li><p><strong>Export des indicateurs</strong> : VI, VA, VC et TA de chaque indicateur ;</p></li><li><p><strong>Export de l'historique des indicateurs</strong> : toutes les valeurs importées.</p></li></ul>`,
  },
  {
    id: GROUPE_PVA,
    titre: "Proposition de valeur d'avancement",
    type: "GROUPE",
    ordre: 3,
  },
  {
    id: PAGE_PVA,
    titre: "Présentation de la fonctionnalité",
    type: "PAGE",
    ordre: 0,
    parent_id: GROUPE_PVA,
    contenu: `<p>Une proposition de valeur d'avancement (PVA) permet à un acteur territorial de proposer une valeur d'avancement pour un indicateur de son territoire.</p><h4><br>Le circuit d'une proposition</h4><p>La proposition est examinée par le directeur de projet, qui l'accepte, la modifie ou la refuse. Une alerte de la page d'accueil liste les chantiers qui ont des propositions en attente.</p>`,
  },
  {
    id: GROUPE_UTILISATEURS,
    titre: "Gestion des utilisateurs",
    type: "GROUPE",
    ordre: 4,
  },
  {
    id: PAGE_COMPTES,
    titre: "Création de comptes",
    type: "PAGE",
    ordre: 0,
    parent_id: GROUPE_UTILISATEURS,
    contenu: `<p>Les comptes sont créés depuis la page « Gestion des comptes » par les utilisateurs habilités à le faire.</p><h4><br>Créer un compte</h4><p>Renseignez l'adresse mail, le profil, puis les chantiers et territoires auxquels le compte aura accès. La personne reçoit ensuite un mail pour activer son compte.</p>`,
  },
  {
    id: GROUPE_RESSOURCES,
    titre: "Ressources",
    type: "GROUPE",
    ordre: 5,
  },
  {
    id: PAGE_FAQ,
    titre: "Foire aux Questions",
    type: "PAGE",
    ordre: 0,
    parent_id: GROUPE_RESSOURCES,
    contenu: `<p>Les questions les plus fréquentes sur PILOTE.</p><h4>Les données sur PILOTE</h4><h6><br>Quelle est la fréquence de mise à jour des indicateurs ?</h6><p>Les valeurs d'avancement sont à mettre à jour dès que de nouvelles données sont disponibles. Les valeurs initiales et cibles sont fixées au cadrage du chantier.</p><h6><br>Qui peut modifier les commentaires d'un chantier ?</h6><p>Les commentaires nationaux relèvent de l'équipe du directeur de projet ; les commentaires territoriaux, des acteurs du territoire habilités.</p>`,
  },
  {
    id: PAGE_LEXIQUE,
    titre: "Lexique",
    type: "PAGE",
    ordre: 1,
    parent_id: GROUPE_RESSOURCES,
    contenu: `<p><span data-type="icone" data-icon-type="InformationPleineIcon"></span>Les mots clés de PILOTE.</p><div data-type="callout" data-color="info"><p><strong>Chantier prioritaire</strong></p><p><em>Déclinaison d'une politique publique, suivie jusqu'au niveau territorial.</em></p><p><strong>Jalon</strong></p><p><em>L'année de référence des valeurs affichées.</em></p></div>`,
  },
];

export async function seedCentreAide() {
  await getPrisma().article_centre_aide.createMany({
    data: ARTICLES.map((article) => ({
      ...article,
      est_publie: true,
    })),
  });
}
