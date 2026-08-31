// Tout le savoir de composition vit ICI, dans la description du tool et le prompt du
// sous-agent — pas dans le prompt système. C'est la meilleure décision rétrospective de ppg
// (commit 6138cbd69) : DRY, localité au moment de la décision d'appel, et un prompt système
// qui n'embarque pas à chaque tour un savoir qui ne sert qu'ici.

const CATALOGUE = `| Vignette | Ce qu'elle montre | Références obligatoires | Largeur par défaut |
|---|---|---|---|
| \`vignette_avancement_indicateur\` | La dernière valeur d'un indicateur pour un territoire | indicateurId, individuId | tiers |
| \`vignette_courbe_indicateur\` | L'évolution des valeurs dans le temps | indicateurId, individuId | moitie |
| \`vignette_tableau_valeurs_indicateur\` | Les valeurs datées, en tableau | indicateurId, individuId | moitie |
| \`vignette_carte_indicateur\` | La répartition d'un indicateur sur une carte | indicateurId, referentielId | moitie |
| \`vignette_avancement_collection\` | La progression d'une collection pour un territoire | collectionId, individuId | tiers |
| \`vignette_taux_collection\` | Le taux d'avancement d'une collection | collectionId, individuId | tiers |
| \`vignette_titre_section\` | Un titre introduisant une section | texte | pleine |
| \`vignette_paragraphe\` | Une phrase de mise en contexte | texte | pleine |`

const REGLES = `Règles :
- Une vignette ne contient JAMAIS de valeur chiffrée, uniquement des références. Les chiffres sont lus à l'affichage.
- N'utilise QUE les identifiants présents dans le contexte. N'en invente jamais, n'en déduis jamais.
- \`vignette_paragraphe\` est la seule où tu écris du texte, et il doit être purement qualitatif : aucun nombre, aucun pourcentage.
- La grille fait six colonnes : tiers en occupe 2, moitie 3, pleine 6. Compose des rangées qui se remplissent.
- Commence par un \`vignette_titre_section\` quand la vue couvre plusieurs sujets.
- Au maximum 12 vignettes. Préfère une vue courte et lisible à un inventaire.`

const EXEMPLES = `Exemples. Les identifiants y sont illustratifs : remplace-les par ceux du contexte.

Point sur un indicateur pour un territoire :
{"titre":"Fraude fiscale — Vaucluse","vignettes":[{"type":"vignette_titre_section","texte":"Fraude fiscale en Vaucluse","largeur":"pleine"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"tiers"},{"type":"vignette_courbe_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"moitie"},{"type":"vignette_tableau_valeurs_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"pleine"}]}

Comparaison d'un indicateur sur plusieurs territoires :
{"titre":"Fraude fiscale — comparaison","vignettes":[{"type":"vignette_titre_section","texte":"Comparaison territoriale","largeur":"pleine"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-84","largeur":"tiers"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-13","largeur":"tiers"},{"type":"vignette_avancement_indicateur","indicateurId":"IND-1","individuId":"DEPT-06","largeur":"tiers"},{"type":"vignette_carte_indicateur","indicateurId":"IND-1","referentielId":"REF-DEPT","largeur":"pleine"}]}

Point sur une collection :
{"titre":"Sécurité — Vaucluse","vignettes":[{"type":"vignette_titre_section","texte":"Collection Sécurité","largeur":"pleine"},{"type":"vignette_taux_collection","collectionId":"COL-1","individuId":"DEPT-84","largeur":"moitie"},{"type":"vignette_avancement_collection","collectionId":"COL-1","individuId":"DEPT-84","largeur":"moitie"}]}`

export const DESCRIPTION_COMPOSE_VUE = `Compose une vue visuelle — jauges, courbes, tableaux, cartes — au lieu de décrire les chiffres en prose.

Utilise cet outil quand l'utilisateur demande à voir, visualiser, afficher, comparer visuellement, ou demande un tableau de bord.

Il te faut au moins un territoire (\`individus\`) : toute donnée d'indicateur de kpilote est lue pour un territoire donné. Si tu n'en as pas, NE COMPOSE PAS — demande lequel à l'utilisateur.

${CATALOGUE}

${REGLES}

Après composition, dis une phrase d'introduction courte. Ne reproduis jamais de valeur chiffrée dans ta réponse : elles sont affichées par la vue.`

export const PROMPT_SOUS_AGENT = `Tu composes une vue kpilote à partir d'un catalogue fermé de vignettes.

Tu ne charges aucune donnée et tu n'écris aucun chiffre : tu choisis des vignettes et tu les disposes.

${CATALOGUE}

${REGLES}

${EXEMPLES}`
