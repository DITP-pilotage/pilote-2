// Tout le savoir de composition vit ICI, dans la description du tool et le prompt du
// sous-agent — pas dans le prompt système. C'est la meilleure décision rétrospective de ppg
// (commit 6138cbd69) : DRY, localité au moment de la décision d'appel, et un prompt système
// qui n'embarque pas à chaque tour un savoir qui ne sert qu'ici.

const CATALOG = `| Tuile | Ce qu'elle montre | Références obligatoires | Largeur par défaut |
|---|---|---|---|
| \`tile_avancement_indicateur\` | La dernière valeur d'un indicateur pour un territoire | indicateurId, individuId | third |
| \`tile_courbe_indicateur\` | L'évolution des valeurs dans le temps | indicateurId, individuId | half |
| \`tile_tableau_valeurs_indicateur\` | Les valeurs datées, en tableau | indicateurId, individuId | half |
| \`tile_carte_indicateur\` | La répartition d'un indicateur sur une carte | indicateurId, referentielId | half |
| \`tile_avancement_collection\` | La progression d'une collection pour un territoire | collectionId, individuId | third |
| \`tile_taux_collection\` | Le taux d'avancement d'une collection | collectionId, individuId | third |
| \`tile_titre_section\` | Un titre introduisant une section | text | full |
| \`tile_paragraphe\` | Une phrase de mise en contexte | text | full |`

const RULES = `Règles :
- Une tuile ne contient JAMAIS de valeur chiffrée, uniquement des références. Les chiffres sont lus à l'affichage.
- N'utilise QUE les identifiants présents dans le contexte. N'en invente jamais, n'en déduis jamais.
- \`tile_paragraphe\` est la seule où tu écris du texte, et il doit être purement qualitatif : aucun nombre, aucun pourcentage.
- La grille fait six colonnes : third en occupe 2, half 3, full 6. Compose des rangées qui se remplissent.
- Commence par un \`tile_titre_section\` quand la vue couvre plusieurs sujets.
- Au maximum 12 tuiles. Préfère une vue courte et lisible à un inventaire.`

const EXAMPLES = `Exemples. Les identifiants y sont illustratifs : remplace-les par ceux du contexte.

Point sur un indicateur pour un territoire :
{"title":"Fraude fiscale — Vaucluse","tiles":[{"type":"tile_titre_section","text":"Fraude fiscale en Vaucluse","width":"full"},{"type":"tile_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","width":"third"},{"type":"tile_courbe_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","width":"half"},{"type":"tile_tableau_valeurs_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","width":"full"}]}

Comparaison d'un indicateur sur plusieurs territoires :
{"title":"Fraude fiscale — comparaison","tiles":[{"type":"tile_titre_section","text":"Comparaison territoriale","width":"full"},{"type":"tile_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","width":"third"},{"type":"tile_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-13","width":"third"},{"type":"tile_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-06","width":"third"},{"type":"tile_carte_indicateur","indicateurId":"IND-1","referentielId":"REF-DEPT","width":"full"}]}

Point sur une collection :
{"title":"Sécurité — Vaucluse","tiles":[{"type":"tile_titre_section","text":"Collection Sécurité","width":"full"},{"type":"tile_taux_collection","collectionId":"COL-1","individuId":"DEPT-84","width":"half"},{"type":"tile_avancement_collection","collectionId":"COL-1","individuId":"DEPT-84","width":"half"}]}`

export const COMPOSE_VIEW_DESCRIPTION = `Compose une vue visuelle — jauges, courbes, tableaux, cartes — au lieu de décrire les chiffres en prose.

Utilise cet outil quand l'utilisateur demande à voir, visualiser, afficher, comparer visuellement, ou demande un tableau de bord.

Il te faut au moins un territoire (\`individus\`) : toute donnée d'indicateur de kpilote est lue pour un territoire donné. Si tu n'en as pas, NE COMPOSE PAS — demande lequel à l'utilisateur.

${CATALOG}

${RULES}

Après composition, dis une phrase d'introduction courte. Ne reproduis jamais de valeur chiffrée dans ta réponse : elles sont affichées par la vue.`

export const SUBAGENT_PROMPT = `Tu composes une vue kpilote à partir d'un catalogue fermé de tuiles.

Tu ne charges aucune donnée et tu n'écris aucun chiffre : tu choisis des tuiles et tu les disposes.

${CATALOG}

${RULES}

${EXAMPLES}`
