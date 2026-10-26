# 11. Organiser les outils de données d'Albert en trois couches

Date : 2026-10-26

## Statut

Accepté

## Contexte

Albert, l'assistant IA de PILOTE, expose au LLM des outils de données (`get_chantiers`, `get_taux_avancement_territoire`, …) construits avec le SDK `ai`. Les workflows à plusieurs étapes, comme la synthèse d'un territoire, étaient orchestrés par le LLM à partir de consignes écrites dans le prompt système : appeler trois outils en parallèle, ignorer leurs instructions de sortie individuelles, puis appliquer un gabarit injecté dans le prompt quand un mot-clé était détecté dans la question.

Cette organisation posait trois problèmes :

- la primitive `get_chantiers` était couplée au workflow : ses instructions de sortie variaient selon la vue demandée, elle portait une règle propre à la synthèse (non-applicabilité au national) et sa description dictait l'ordre des appels ;
- la logique serveur réutilisable (résolution des sous-territoires, habilitations, masquage des données restreintes) vivait dans le corps de l'outil, inaccessible à un autre outil sans duplication ;
- l'orchestration déléguée au LLM était fragile : les évaluations de scénario relèvent des cas où l'assistant conclut « aucun chantier en retard » sans avoir interrogé les vues, ou rédige le rapport dans le chat au lieu d'appeler l'export.

Ajouter un nouveau cas d'usage revenait à ajouter de la prose au prompt et des cas particuliers à la primitive.

## Décision

Les outils de données d'Albert sont organisés en trois couches :

1. **Services de lecture** (`src/server/albert/services/`) : des classes injectées par Awilix, sans dépendance au SDK `ai`, qui encapsulent la résolution des territoires, l'application des habilitations, le masquage et l'appel aux queries du module `chantiers`. Elles portent les règles de sens des données (par exemple : l'écart à la médiane n'est pas applicable au niveau national) et sont testables unitairement.
2. **Primitives** (`get_chantiers`, `get_taux_avancement_territoire`) : des adaptateurs minces sur ces services. Elles rendent les données avec une instruction de sortie unique et neutre, et ne décrivent aucune orchestration.
3. **Livrables** (`synthese_territoire`) : des outils qui exécutent un workflow complet côté serveur, en un seul appel, en composant les services. Le gabarit de réponse voyage dans les `_output_instructions` du livrable, qui choisit lui-même la variante applicable (mono-territoire ou comparaison) d'après ses résultats.

Le prompt système ne décrit plus les workflows pris en charge par un livrable : il indique quel livrable appeler. La détection de l'intention « synthèse » par mots-clés et l'injection conditionnelle du gabarit sont supprimées.

Un livrable ne compose jamais d'autres `tool()` : il compose des services. Une règle qui vaut pour toute lecture des données appartient au service ; une règle propre à un workflow appartient au livrable.

## Conséquences

- Les workflows deviennent déterministes : le nombre d'appels et le gabarit ne dépendent plus de l'obéissance du LLM au prompt. Les évaluations de niveau 3 attendent un appel au livrable au lieu d'une séquence d'appels.
- Les primitives restent exposées à côté des livrables : le LLM doit choisir entre `synthese_territoire` et `get_chantiers`. Cette concurrence est mesurée par des évaluations de niveau 2 dédiées (cas positifs et négatifs pour chaque outil).
- Un nouveau cas d'usage se construit en composant les services dans un nouveau livrable ou en enrichissant une primitive, sans toucher au prompt au-delà d'une ligne de routage.
- Le module `chantiers` exporte les queries et use cases dont les services ont besoin ; les outils n'appellent plus `getContainer` directement.
- Les évolutions envisagées s'inscrivent dans cette organisation et sont traitées séparément : périmètre multi-territoires, tri et limite, sortie plate pour les primitives ; un livrable `rapport_complet` qui composerait les services et un appel LLM interne pour rédiger le rapport en un seul appel d'outil.
