# Refonte du prompt système d'Albert et des descriptions de tools

Ticket : PIL-1900 (point 5 : audit du prompt système, des tools et des evals).
Evals : `2026-09-10-albert-strategie-evaluation-design.md` et
`2026-09-30-albert-evals-niveau-3-design.md`.

## Objectif

Le prompt système (`src/server/albert/systemPrompt.ts`) et les descriptions de
tools ont grandi sans mesure : environ 630 lignes de prompt, des règles
recopiées entre le prompt, les descriptions et les résultats des tools, et des
copies qui ont divergé. On les réécrit entièrement pour :

- **simplifier** ;
- **cloisonner les usages** : une règle née d'un usage ne doit pas s'appliquer
  aux autres. Exemple : l'interdiction des tableaux, née du gabarit de
  synthèse, bloque l'utilisateur qui demande un tableau ;
- **se détacher des gabarits** de synthèse. Un besoin de format structuré, s'il
  est avéré, passera par un tool ou un sous-agent dédié.

**Méthode : YAGNI.** On part de la réécriture la plus simple, on la mesure avec
les evals, et chaque complexité ajoutée ensuite doit être justifiée par un
échec mesuré.

**Hors périmètre** : l'audit des evals du ticket (O8 à O17). Les evals ne sont
touchées que pour aligner leurs critères sur les décisions ci-dessous
(étape 0).

## État des lieux (27/10/2026)

### Six canaux d'instructions

| Canal | Contenu | Partie dynamique |
|---|---|---|
| Prompt système | ~630 lignes, dont ~150 de gabarit | jalon, territoires accessibles, `agentContext`, capacités `synthese` et `inclureSousTerritoires` |
| `description` des tools | 14 tools toujours exposés, 2 selon l'intention (`create_dashboard`, `export_rapport`) | liste filtrée |
| `.describe` des paramètres | sens des paramètres, mais aussi des règles (`include_sous_territoires`) | aucune |
| `_output_instructions` des résultats | 47 occurrences : mise en forme, routage, mises en garde | selon le résultat |
| Prompts des sous-agents | recherche ×3, centre d'aide ×2, dashboard | aucune |
| `agentContext.instructions` | inséré au milieu du prompt | tout |

Les capacités viennent de `detecterCapacities` (`detecteurIntention.ts`), qui
cherche des mots-clés dans le dernier message. Elles changent à la fois le
texte du prompt et la liste des tools.

### Fuites entre usages

Des règles nées d'un usage précis s'appliquent à tous les autres :

- **Tableaux** : « pas de tableaux pour les listes de chantiers » vient du
  gabarit, mais figure dans les règles fondamentales.
- **Commentaires** : « condense en 1-2 phrases » et « Pas de commentaire
  disponible » viennent du gabarit. `get_chantier_commentaires` et
  `get_chantier_objectifs` demandent au contraire le verbatim (A11).
- **Format selon un mot-clé** : « synthèse de la Bretagne » déclenche le
  gabarit, « quel est l'état de la Bretagne » non. Le gabarit s'active aussi
  « quand tu appelles les 3 outils ensemble » : la forme dépend des appels
  faits, pas de la demande.
- **Résultats qui imposent la forme**, quel que soit l'usage :
  `get_evolution_indicateur` (« Termine SYSTÉMATIQUEMENT en proposant… »),
  `get_taux_avancement_territoire` (tableau dès plusieurs territoires),
  `get_indicateurs` (« utilise create_dashboard », outil pas toujours exposé,
  A15).
- **Priorités concurrentes** : la section sous-territoires « prime sur tout
  autre protocole » ; le workflow de synthèse dit « ignore les
  `_output_instructions` », la règle générale dit « suis-les ».

### Contradictions

| # | Contradiction | Ticket |
|---|---|---|
| C1 | Restriction d'accès : le prompt dit l'écart masqué, l'instruction de `get_chantiers` le dit disponible, le code ne le masque pas et force `est_en_retard` à `false`. Trois tools lèvent une exception sur un territoire non accessible, contre « tu peux interroger n'importe quel territoire ». | A16, A23, A24 |
| C2 | Territoires : « résous depuis la liste des territoires accessibles », « demande le code REG-XX », alors que `search_territoires` existe. « Le 84 » sert d'exemple de clarification, le sous-agent le résout en DEPT-84. | A1, A17, A19 |
| C3 | Clarification : « 2 à 4 options » contre « une option par résultat » (jusqu'à 10) ; « pas de texte avant l'appel » contre « présente la liste » dans les `search_*`. | A13, A18 |
| C4 | Médiane « territoriale » (glossaire), « nationale » (gabarit) ; NAT-FR est comparé à la médiane des départements. | A6 |
| C5 | Jalon : `\${jalon}` lu littéralement dans la section dashboard ; 2025 en dur contre la date de bascule pour les signalés. | A14, A25 |
| C6 | PPG est à la fois synonyme et attribut d'un chantier. | O3 |
| C7 | « Ne déduis pas de tendance » contre « décris les tendances communes » (gabarit). | |
| C8 | Le prompt décrit `create_dashboard` et l'export comme toujours disponibles, alors qu'ils sont conditionnels : faux dashboard rédigé en texte, appel écrit en pseudo-code. | A2, F1 |
| C9 | « Ne donne jamais de lien », mais `export_rapport` renvoie l'URL au modèle. | A10 |

### Redondances

| Information | Occurrences |
|---|---|
| `include_sous_territoires` sur le parent | ~8 |
| Routage retard / baisse vers les signalés | 4 |
| Workflow des `search_*` | 4 |
| Format « CH-XXX — Nom » | 7 |
| Libellés météo | 4, dont 2 dans la même section |
| Quand clarifier, quand appeler le centre d'aide | 2 à 3 chacun |
| Interdiction du pseudo-code | 3 |
| « Votre rapport est disponible » | 2 |

### Erreurs de structure

- **Aucun canal n'est propriétaire d'une règle** : la même règle est écrite
  plusieurs fois, et les copies divergent.
- **Les règles fondamentales mélangent** des invariants (langue, factualité,
  LaTeX) et des formats propres à un usage.
- **La priorité passe par l'emphase** (⚠️ ×10, JAMAIS ×10, IMPORTANT,
  CRITIQUE, « Règle d'or ») : aucune hiérarchie n'est écrite.
- **Le glossaire mélange le métier et la mécanique des tools**
  (`mailles_applicables`, `view`, codes de signalement, routage).
- **Les tools renvoient des codes bruts** (météo, tendance, maille, catégorie) :
  le prompt doit porter des tables de correspondance et la règle « n'affiche
  pas le code » (A7).
- **Le prompt n'est pas statique** : des sections conditionnelles au milieu, et
  le gabarit en fin de prompt, loin du workflow qui le cite.
- **L'identité contient du routage technique**, jusqu'à un code de catégorie de
  signalement.
- **Environ 130 lignes du prompt redocumentent les tools**, en doublon de leurs
  descriptions (O18).

## Décisions

| # | Décision |
|---|---|
| D1 | La météo disparaît du prompt. Les tools renvoient directement les libellés finaux (« Objectifs sécurisés », « Objectifs atteignables », « Appuis nécessaires », « Objectifs compromis ») : ni le mot « météo » ni les codes ne sont plus exposés au modèle. Reste à trancher : le libellé de la catégorie de signalement « Météo et synthèse non renseignées ». |
| D2 | Commentaires et objectifs : restitués fidèlement par défaut, résumés seulement sur demande. |
| D3 | « Le 84 » désigne le département, « la région 84 » la région. |
| D4 | `create_dashboard` et `export_rapport` sont exposés en permanence. |
| D5 | Un tool composite « situation d'un territoire » (TA, chantiers en retard et chantiers en difficulté en un seul appel) est envisageable, si la mesure le justifie. |
| D6 | La liste des territoires accessibles dans le prompt est tranchée selon les mesures. |

## Cible de la réécriture

### Principes

1. **Un canal, une responsabilité.**
   - Prompt système : rôle, invariants, métier, méthode, formats par défaut,
     contexte de session.
   - Description d'un tool : ce qu'il renvoie, quand l'utiliser, quand ne pas
     l'utiliser.
   - `.describe` d'un paramètre : son sens et sa valeur par défaut.
   - Résultat d'un tool : des données, sans consigne de mise en forme.
2. **Une priorité écrite une fois** : les invariants, puis la demande explicite
   de l'utilisateur, puis les formats par défaut. L'emphase devient inutile.
3. **Aucune règle de format globale** : chaque format par défaut est rattaché à
   un type de réponse et cède devant la demande.
4. **Le prompt ne parle que de ce qui est toujours disponible.**
5. **Les tools renvoient des libellés**, pas des codes.
6. **Un prompt statique**, avec le contexte de session à la fin.

### Plan du prompt système

0. `Reasoning: high`, la directive propre à gpt-oss.

**I. Rôle et périmètre**

- A. Albert, assistant de PILOTE ; ses utilisateurs : préfets, coordinateurs
  territoriaux, référents ministériels.
- B. Trois familles de besoins : analyser les données, expliquer PILOTE (centre
  d'aide), produire un livrable (dashboard, rapport).
- C. Hors périmètre, avec une réponse type.

**II. Invariants** (une ligne chacun)

1. Toujours en français.
2. Ne citer que des données issues des outils ; une donnée absente se dit.
3. Ne conclure à une absence qu'après avoir interrogé le périmètre exact.
4. Ni opinion, ni recommandation, ni causalité absente des données.
5. Ne jamais exposer la mécanique : noms d'outils ou de champs, codes, JSON,
   syntaxe d'appel, liens.
6. Une restriction d'accès n'est pas une absence de données.
7. Pas de LaTeX.
8. Ordre de priorité : ces règles, puis la demande explicite de l'utilisateur,
   puis les formats par défaut (partie V).

**III. Le métier PILOTE** (sert à lire les résultats ; pour expliquer une
notion à l'utilisateur, le centre d'aide prime)

- A. Chantiers et PPG.
- B. Indicateurs : VI, VA, VC, TA ; valeur importée et valeur affichée.
- C. Territoires, mailles, sous-territoires ; accès complet ou restreint.
- D. Jalon.
- E. Situation d'un chantier : TA, écart à la médiane, en retard, en
  difficulté, tendance, signalements.
- F. Contenus rédigés par les équipes : commentaires, objectifs, synthèse des
  résultats.

**IV. Méthode**

- A. Identifier l'intention (consulter, comparer, expliquer, visualiser,
  exporter) et les objets. Le lexique utilisateur se réduit aux notions :
  « où ça coince », « compromis », « non à jour » ≠ « en retard ».
- B. Résoudre les références : l'identifiant s'il est fourni, sinon la
  recherche ; règle des numéros de territoire (D3).
- C. Clarifier plutôt que deviner : quand demander, et quand ne pas demander.
- D. Collecter : tous les outils nécessaires, en parallèle, au jalon courant
  par défaut, avec un nouvel appel pour tout nouveau périmètre. Une synthèse de
  territoire couvre le TA, les chantiers en retard et les chantiers en
  difficulté : c'est une liste de contenus, pas un format.
- E. Une question sur le fonctionnement de PILOTE passe par le centre d'aide,
  jamais par la mémoire du modèle.

**V. Rédiger** (formats par défaut, que la demande remplace)

- A. La forme suit la demande : tableau, liste, résumé, verbatim, longueur.
- B. Par défaut :
  - question ponctuelle : réponse directe ;
  - liste de chantiers : « CH-XXX — Nom » ;
  - comparaison : tableau ;
  - synthèse : sections courtes ;
  - contenus rédigés : fidèles et attribués, avec territoire et date (D2) ;
  - explication : la réponse du centre d'aide, reprise.
- C. Après un dashboard, un export ou une clarification : une phrase,
  l'interface affiche le reste.

**VI. Contexte de session** (partie dynamique)

- Le jalon courant, en source unique.
- Les territoires à accès complet.
- `agentContext`, qui complète les invariants sans les remplacer.

### Modèle de description d'un tool

```
<ce que l'outil renvoie, en une phrase>
Utilise-le pour : <intentions, 2 à 4 formulations types>
Ne l'utilise pas pour : <cas voisin> → <autre outil>
```

Le routage entre tools voisins vit à un seul endroit : signalés et
`get_chantiers`, évolution / historique / indicateurs, commentaires et
objectifs, « non à jour » et « en retard ».

### Où va chaque bloc actuel

| Bloc actuel | Devenir |
|---|---|
| Gabarit, capacités `synthese` et `inclureSousTerritoires` | supprimés |
| Règles fondamentales | invariants en II, formats en V comme défauts |
| Glossaire | métier en III, mécanique dans les tools |
| « Comprendre les demandes » | notions en IV.A, routage dans les descriptions |
| Workflows a et b | IV.D et `.describe` |
| Workflow c et section Export | description d'`export_rapport` |
| Workflow d | description de `get_chantiers_signales` |
| Sections `search_*`, dashboard, centre d'aide, clarification | descriptions des tools ; « quand clarifier » en IV.C |
| Questions de suivi, règle d'or | II.3 |
| Gestion des erreurs | II.6 et IV.B |

## Démarche

### Règles du jeu

- **Mesure** : un run complet des niveaux 2 et 3 (3 essais par cas, cache
  coupé, environ un quart d'heure), comparé au run précédent par les moyennes
  de chaque niveau et la liste des échecs répétés, relevées avec jq et
  consignées dans le journal. S'y ajoute la taille du contexte : les tokens
  d'entrée du premier appel du cas « Bonjour, tu peux m'aider ? », soit le
  prompt et les schémas des tools.
- **Échec qui compte** : un cas en échec sur au moins 2 essais sur 3. Un échec
  sur un seul essai reste du bruit tant qu'il ne se répète pas.
- **Pas de cas en échec, pas de règle.** Une complexité n'entre que pour
  corriger un échec mesuré, et ne reste que si elle n'en crée pas ailleurs. Ce
  que les evals ne couvrent pas (les échanges en plusieurs tours, par exemple)
  ne justifie aucune complexité : on écrit d'abord le cas.
- **Échelle des leviers**, du plus local au plus global ; on prend le premier
  qui corrige :
  1. la donnée renvoyée par le tool ;
  2. la description du tool ou le `.describe` d'un paramètre ;
  3. une ligne dans le prompt système ;
  4. un nouveau tool ou sous-agent.
- **Un commit par étape**, avec la mesure dans le message et une ligne dans le
  journal en fin de document.

### Étape 0 : ligne de base

But : savoir d'où on part, avec des critères qui décrivent la cible et non
l'ancien prompt. Plan détaillé des étapes 0 et 1 :
`../plans/2026-10-27-albert-refonte-etapes-0-1.md`.

- **0.a** Aligner les critères existants sur les décisions : plus de gabarit
  (« Écart et météo », `COMMENTAIRES_DU_GABARIT`), plus de météo (D1),
  commentaires fidèles (D2), « le 84 » compris comme le département (D3).
  Sans cet alignement, l'étape 1 paraîtrait régresser par construction.
- **0.b** Ajouter le minimum de cas pour ce que rien ne couvre aujourd'hui :
  - le cloisonnement : un tableau demandé sur une liste de chantiers, et des
    commentaires demandés sans demande de synthèse (D2). Le résumé demandé est
    déjà couvert par le scénario « Synthèse des commentaires » ;
  - deux critères d'acceptation du ticket : un dashboard sans chantier
    présenté comme un succès, et des réponses en français (un critère du
    socle).
- **0.c** Un run sur le prompt actuel, qui sert de ligne de base.

### Étape 1 : réécriture minimale

But : la version la plus simple compatible avec les décisions.

Ce qui change :

- le prompt système, réécrit selon le plan ci-dessus, sans workflow ni
  gabarit ;
- les descriptions des tools, selon le modèle commun ; les `.describe` se
  limitent au sens du paramètre ;
- les `_output_instructions`, supprimées ;
- les tools renvoient les libellés finaux : météo (D1), tendance, maille de
  pilotage, catégories de signalement ;
- `detecteurIntention.ts` est supprimé : tous les tools sont exposés (D4) et il
  n'y a plus de section conditionnelle. Le niveau 1 des evals disparaît avec.

Ce qui ne change pas : les sous-agents, les champs de statut existants
(`non_applicable`, `acces_refuse`…), la liste des territoires accessibles.
Aucun nouveau tool.

Sortie : la comparaison avec la ligne de base, et les cas en échec répété
classés par famille.

Risque assumé : un changement en un seul bloc rend une régression large plus
difficile à attribuer. Le classement par famille sert à la localiser.

### Étapes 2 à n : itérations

À chaque tour : la famille d'échecs la plus fréquente, le levier le plus local,
une mesure. On garde si c'est mieux, sinon on revient en arrière.

Leviers déjà repérés, qui n'entrent que si leur signal apparaît :

| Signal mesuré | Levier candidat |
|---|---|
| Mauvais choix entre deux outils voisins (niveau 2) | description du tool |
| Synthèse incomplète (chantiers attendus manquants) | tool composite « situation d'un territoire » (D5) |
| Sous-territoires interrogés un par un | `.describe` d'`include_sous_territoires` |
| Restriction d'accès mal restituée | un statut commun à tous les tools |
| Lien ou JSON recopié dans la réponse | ne plus renvoyer ces champs au modèle (`toModelOutput` du SDK `ai`, à vérifier) |
| Territoire mal résolu | règle des numéros, liste des territoires accessibles (D6) |
| Forme inadaptée à un type de réponse | un format par défaut dans la partie V |
| Dashboard vide présenté comme un succès | `create_dashboard` répond « non réalisable » |
| Réponse en anglais, pseudo-code, noms d'outils cités | une ligne ciblée dans le prompt |

### Critère d'arrêt

- Aucun échec répété ne vient plus du prompt ou des tools ; ceux qui restent
  relèvent des données ou des evals.
- Les critères d'acceptation de PIL-1900 sont respectés : aucune réponse ne
  mentionne la météo, le gabarit n'est plus utilisé, les réponses sont en
  français y compris après un appel d'outil, aucun dashboard vide n'est
  présenté comme un succès.

## Journal des mesures

| Étape | Commit | Niveau 2 | Niveau 3 | Contexte (tokens) | Décision |
|---|---|---|---|---|---|
| 0 – ligne de base | `edc45d4` | 91 % | 91 % | 9 265 | référence |
| 1 – réécriture minimale | `5ae608e` | 88 % | 92 % | 2 290 | base de l'étape 2 |
| 2 – résolution, sous-territoires, exemples | `9805829` | 90 % | 93 % | 2 853 | base de l'étape 3 |
| 3 – régressions, courbe iso prod, restriction | `dead2dc` | 91 % | 94 % | 2 928 | base de l'étape 4 |

Niveau 2 : moyenne des suites `2.*`. Niveau 3 : moyenne des suites `3.1` à
`3.4`, calibration exclue. Contexte : tokens d'entrée du premier appel du cas
« Bonjour, tu peux m'aider ? », identiques sur les trois essais ; ce cas
n'expose pas encore `create_dashboard` ni `export_rapport`.

### Échecs répétés de la ligne de base

Suite · cas · critère · essais en échec, sur le prompt d'origine
(44 lignes) :

```
3.4 · Forme de la réponse · Tableau demandé · Tableau demandé sur une liste de chantiers : le prompt actuel l'interdit · Chantiers en retard dans le tableau · 3/3
3.4 · Forme de la réponse · Tableau demandé · Tableau demandé sur une liste de chantiers : le prompt actuel l'interdit · Outils attendus · 2/3
3.4 · Forme de la réponse · Tableau demandé · Tableau demandé sur une liste de chantiers : le prompt actuel l'interdit · Tableau · 3/3
3.2 · Comparaison · Comparer avec les autres départements de Bretagne · Message envoyé tel quel · Analyse des écarts · 2/3
3.2 · Comparaison · Comparer Bretagne avec ses départements · Message envoyé tel quel · Analyse des écarts · 3/3
3.1 · Synthèse · Chantiers en retard et leurs indicateurs · Coordinateur · Libellés météo · 2/3
2.1 · Recherche · search_territoires · numéro seul : le département 84 (D3), code à résoudre · Outils attendus · 3/3
2.1 · Recherche · search_territoires · numéro précisé « région » : la recherche reste nécessaire · Outils attendus · 3/3
2.1 · Recherche · search_territoires · territoire désigné par son nom : le code est à résoudre · Outils attendus · 3/3
2.1 · Recherche · search_territoires · numéro précisé « département » : la recherche reste nécessaire · Outils attendus · 3/3
3.2 · Comparaison · Comparaison quantitative des territoires · Département du périmètre · Analyse des écarts · 3/3
3.2 · Comparaison · Comparaison quantitative des territoires · Région hors périmètre : le taux reste visible · Analyse des écarts · 3/3
3.2 · Comparaison · Comparaison quantitative des territoires · Piège du 84 : DEPT-84, Vaucluse · Analyse des écarts · 3/3
3.2 · Comparaison · Comparaison quantitative des territoires · Piège du 84 : DEPT-84, Vaucluse · Territoires du tableau · 3/3
2.1 · Recherche · search_chantiers · thématique d'indicateur : search_chantiers toléré pour scoper la recherche · Outils attendus · 3/3
2.3 · Rendu · export_rapport · scénario de l'écran d'accueil, format Markdown demandé · Outils attendus · 2/3
3.2 · Comparaison · Comparer avec un autre territoire · Une région face à son département : deux médianes de mailles différentes · Analyse des écarts · 3/3
3.2 · Comparaison · Comparer avec un autre territoire · Deux régions · Analyse des écarts · 3/3
3.2 · Comparaison · Comparer avec un autre territoire · Piège du 84 : REG-84, Auvergne-Rhône-Alpes · Analyse des écarts · 3/3
3.1 · Synthèse · Synthèse des difficultés d'un territoire · Trou complété par le territoire courant · Chantiers attendus · 2/3
3.1 · Synthèse · Synthèse des difficultés d'un territoire · Un département du périmètre · Chantiers attendus · 3/3
3.1 · Synthèse · Synthèse des difficultés d'un territoire · Un département du périmètre · Outils attendus · 3/3
3.1 · Synthèse · Synthèse des difficultés d'un territoire · Hors périmètre : commentaires masqués, restriction à signaler · Chantiers attendus · 3/3
3.1 · Synthèse · Synthèse des difficultés d'un territoire · Hors périmètre : commentaires masqués, restriction à signaler · Outils attendus · 2/3
3.1 · Synthèse · Rapport complet (Markdown) · Message envoyé tel quel · Export appelé · 2/3
3.1 · Synthèse · Rapport complet (Markdown) · Message envoyé tel quel · Outils attendus · 2/3
3.1 · Synthèse · Rapport complet (Markdown) · Message envoyé tel quel · Réponse du chat · 3/3
3.1 · Synthèse · Rapport complet (Markdown) · Export d'une synthèse faite au tour précédent : le rapport doit la reprendre · Chiffres exacts · 2/3
3.1 · Synthèse · Rapport complet (Markdown) · Export d'une synthèse faite au tour précédent : le rapport doit la reprendre · Fidèle à la conversation · 3/3
3.1 · Synthèse · Synthèse d'un chantier sur un territoire · Coordinateur : CH-XXX complété, territoire pré-rempli · Format des chantiers · 2/3
3.1 · Synthèse · Synthèse d'un chantier sur un territoire · Coordinateur : CH-XXX complété, territoire pré-rempli · Libellés météo · 3/3
3.1 · Synthèse · Synthèse d'un chantier sur un territoire · Coordinateur : CH-XXX complété, territoire pré-rempli · Outils attendus · 3/3
3.1 · Synthèse · Synthèse d'un chantier sur un territoire · Coordinateur : CH-XXX complété, territoire pré-rempli · Restriction signalée · 2/3
3.1 · Synthèse · Synthèse d'un chantier sur un territoire · DITP : CH-XXX et NOM_TERRITOIRE complétés · Format des chantiers · 3/3
3.1 · Synthèse · Synthèse d'un chantier sur un territoire · DITP : CH-XXX et NOM_TERRITOIRE complétés · Libellés météo · 3/3
3.1 · Synthèse · Synthèse d'un chantier sur un territoire · DITP : CH-XXX et NOM_TERRITOIRE complétés · Outils attendus · 3/3
3.1 · Synthèse · Synthèse des commentaires d'un/de plusieurs chantiers · Un seul chantier · Format des chantiers · 2/3
3.1 · Synthèse · Synthèse des commentaires d'un/de plusieurs chantiers · Un seul chantier · Pas de recopie · 3/3
3.1 · Synthèse · Synthèse des commentaires d'un/de plusieurs chantiers · Deux chantiers commentés · Format des chantiers · 2/3
3.1 · Synthèse · Synthèse des commentaires d'un/de plusieurs chantiers · Deux chantiers commentés · Pas de recopie · 3/3
3.1 · Synthèse · Synthèse des commentaires d'un/de plusieurs chantiers · CH-012 n'a aucun commentaire en Bretagne : à dire, sans inventer · Pas de recopie · 3/3
2.2 · Données · get_historique_indicateur · PVA : filtre PROPOSITIONS · Outils attendus · 2/3
2.2 · Données · get_chantier_commentaires · type territorial commentaires_sur_les_donnees · Outils attendus · 3/3
2.2 · Données · get_chantiers_signales · « à surveiller », absent du prompt système · Outils attendus · 3/3
```

### Fiabilité du juge (calibration de la ligne de base)

- « Commentaires fidèles », réécrit à l'étape 0 : fiable (mutant détecté et
  références admises sur 3 essais sur 3).
- Faux signalements sur des mutants d'autres critères, à garder en tête en
  lisant leurs scores : « Actions identifiées » (2/3 détecté seulement),
  « Une synthèse par chantier » (3/3 faux signalements), « Évolution entre
  jalons » (3/3), « Trois volets » (3/3), « Données indisponibles dites »
  (2/3).

### Étape 1 : réécriture minimale (`5ae608e`)

- Niveau 2 : 90,7 % → 88,1 %. Niveau 3 : 91,3 % → 92,5 %.
- Tokens du premier appel « Bonjour » : 9 265 → 2 290. Le compteur de l'API
  Albert semble ne compter que les messages : avec 16 outils toujours exposés,
  leurs schémas ne tiendraient pas dans 2 290 tokens avec le prompt. La taille
  des schémas d'outils n'est donc pas mesurée.
- Durée moyenne d'un essai : 9 s → 12 s.
- Mesuré hors ligne sur les réponses des deux runs, avec les critères ajoutés
  après la revue de la branche :
  - météo citée sans que la question en parle : 85 → 1 essai sur 495 (niveau
    3 : 35 → 0 sur 105) ;
  - balise HTML dans la réponse : 0 → 2 essais, des `<br>` écrits par le
    modèle dans des cellules de tableau (les commentaires n'en contiennent
    pas) ;
  - réponse en français : aucun échec dans les deux runs.
- Échecs répétés : 44 → 43, dont 18 résolus, 17 nouveaux et 26 inchangés.
- Calibration du juge, refaite après la réécriture des références (« Météo »
  devenu « Niveau de confiance ») : aucune nouvelle fragilité. Restent fragiles
  « Une synthèse par chantier », « Trois volets » (3/3 faux signalements),
  « Données indisponibles dites » (2/3), « Évolution entre jalons » et
  « Actions identifiées » (1/3).

### Échecs répétés de l'étape 1, par famille

| Famille | Résolus | Nouveaux | Inchangés |
|---|---|---|---|
| Choix d'outil | 3 | 6 | 13 |
| Sous-territoires | 0 | 4 | 0 |
| Forme | 9 | 4 | 5 |
| Contenu et factualité | 5 | 2 | 8 |
| Restriction d'accès | 1 | 1 | 0 |
| Langue | 0 | 0 | 0 |

- **Choix d'outil.**
  - Résolus : `search_chantiers` « thématique d'indicateur » ;
    `get_historique_indicateur` « filtre PROPOSITIONS » ; « Tableau demandé »,
    outils attendus.
  - Nouveaux : `get_chantiers_signales` « plusieurs catégories, retard
    compris » part vers `get_chantiers` ; `create_dashboard` « courbe » ;
    `clarify_with_choices` « trois chantiers logement » ; `search_chantiers`
    « politique prioritaire » ; `search_indicateurs` « recherche restreinte au
    chantier » ; synthèse des difficultés, « trou complété par le territoire
    courant ».
  - Inchangés : `search_territoires` (4 cas, déjà à 20 % sur la ligne de
    base) ; `get_chantier_commentaires` « commentaires_sur_les_donnees » ;
    signalés « à surveiller » ; `export_rapport` « scénario de l'écran
    d'accueil » ; rapport complet (export appelé, outils attendus) ; synthèse
    d'un chantier (2 cas) ; synthèse des difficultés (2 cas).
- **Sous-territoires.** Nouveaux : `get_taux_avancement_territoire` « un seul
  appel sur le parent » ; synthèse de Bretagne et ses départements (outils
  attendus, tableau comparatif, analyse des écarts). La règle ne vit plus que
  dans le `.describe` du paramètre.
- **Forme.**
  - Résolus : « Tableau demandé » (tableau, chantiers dans le tableau) ;
    libellés météo (3 cas) ; pas de recopie (3 cas) ; format des chantiers
    (synthèse des commentaires, deux chantiers).
  - Nouveaux : comparaison quantitative « région hors périmètre » (tableau
    comparatif, territoires du tableau) ; « piège du 84 », REG-84 (territoires
    du tableau) ; commentaires restitués (format des chantiers).
  - Inchangés : format des chantiers (3 cas) ; rapport complet (réponse du
    chat) ; « piège du 84 », DEPT-84 (territoires du tableau).
- **Contenu et factualité.**
  - Résolus : analyse des écarts (4 cas) ; rapport complet (chiffres exacts).
  - Nouveaux : synthèse des commentaires, un seul chantier : « Actions
    identifiées » et « Une synthèse par chantier », deux critères que la
    calibration signale comme peu fiables.
  - Inchangés : analyse des écarts (4 cas) ; chantiers attendus de la synthèse
    des difficultés (3 cas) ; rapport complet (fidèle à la conversation).
- **Restriction d'accès.** Résolu : synthèse d'un chantier, coordinateur.
  Nouveau : synthèse des difficultés, hors périmètre. Plus rien ne signale
  les territoires restreints dans les résultats de `get_chantiers`, et les
  drapeaux « en retard » et « en difficulté » y sont forcés à faux (revue de
  la branche).

### Entrées de l'étape 2

Décision d'Antoine (27/10) : la règle des sous-territoires est essentielle, on
la remet. Le `.describe` du paramètre seul ne suffit pas.

Ce que l'agent fait réellement sur les cas en échec, et le levier retenu, par
effet attendu sur les scores :

| # | Échec mesuré | Ce que fait l'agent | Levier |
|---|---|---|---|
| 1 | Sous-territoires : `get_taux_avancement_territoire` « un seul appel sur le parent » (2/3), synthèse de Bretagne et ses départements (outils, tableau comparatif, analyse des écarts) | Interroge REG-94 puis DEPT-2A et DEPT-2B un par un | Une règle dans la méthode du prompt (« un territoire et ses sous-territoires : un seul appel sur le parent, par jalon ») et une ligne « Utilise-le pour » dans les trois tools. Le test du prompt qui interdit `include_sous_territoires` change avec |
| 2 | Analyse des écarts : 8 cas de comparaison (Bretagne et ses départements, deux régions, région face à un département, comparaison quantitative) | Donne les taux et la position face à la médiane, sans dire qui est devant et de combien de points | Une ligne dans « Rédiger » : une comparaison donne un tableau, puis qui est devant, qui est derrière et de combien de points |
| 3 | Territoires du tableau : « piège du 84 » (Vaucluse), comparaison quantitative | Écrit « département 84 » ou le code : `get_taux_avancement_territoire` ne renvoie pas le nom du territoire | La donnée : ajouter `territoire_nom` au résultat |
| 4 | `create_dashboard` « courbe » (3/3) | Appelle `get_evolution_indicateur` : sa description revendique « la courbe d'un indicateur » | La description : la courbe affichée relève de `create_dashboard`, `get_evolution_indicateur` donne les valeurs |
| 5 | Synthèse des difficultés : chantiers attendus (3 cas) | N'appelle pas la vue `en_retard` (A5) | Une ligne de lexique : « les difficultés d'un territoire » = chantiers en retard et en difficulté ; si ça ne suffit pas, le tool composite (D5) |
| 6 | Rapport complet : export appelé, réponse du chat (inchangés) | Rédige le rapport dans le chat sans appeler `export_rapport` | Lexique ou description : « rapport » désigne toujours un fichier exporté |
| 7 | Clarification « trois chantiers logement » (2/3), signalés « plusieurs catégories, retard compris » (3/3) | Choisit un chantier sans demander ; appelle `get_chantiers` avant `get_chantiers_signales` | Les descriptions : `search_*` « plusieurs candidats plausibles → clarify_with_choices » (consigne perdue avec les `_output_instructions`) ; un exemple « en retard ou sans … renseignée → cet outil » dans les signalés |
| 8 | `search_chantiers` « politique prioritaire » (3/3) | N'appelle aucun outil | Lexique : « politique prioritaire » = chantier |
| 9 | Format des chantiers (4 cas) | Cite « CH-005 » sans son nom | À mesurer après les leviers 1 à 8 ; candidat : un champ « CH-XXX — Nom » dans les résultats |
| 10 | Restriction d'accès : synthèse des difficultés hors périmètre | Rien ne signale les territoires restreints ; drapeaux forcés à faux | La donnée : un champ de restriction dans le résultat de `get_chantiers` (revue, Important 1) |

À corriger côté evals plutôt que côté agent :

- `search_territoires` (4 cas, en échec depuis la ligne de base) : l'agent
  résout seul « le Vaucluse » et « le 84 » en DEPT-84, ce qui est juste (D3).
  L'attente « doit passer par la recherche » est à revoir.
- `search_indicateurs` « chantier connu » : l'agent lit directement les
  indicateurs du chantier. C'est défendable ; à trancher avant d'y toucher.

À ne pas poursuivre : les critères que la calibration juge peu fiables
(« Actions identifiées », « Une synthèse par chantier », « Trois volets »).

À surveiller sans levier : les `<br>` dans les tableaux (2 essais).

### Étape 2 : résolution, sous-territoires, exemples (`9805829`)

Changements : recherche imposée pour tout territoire nommé, règle des
sous-territoires remise dans le prompt, six exemples « demande → appels »,
trois entrées de lexique, comparaison qui dit qui est devant, descriptions de
neuf tools ajustées, `territoire_nom` dans `get_taux_avancement_territoire`.

- Niveau 2 : 88,1 % → 89,6 %. Niveau 3 : 92,5 % → 93,4 %.
- Tokens du premier appel : 2 290 → 2 853. Durée moyenne d'un essai : 12 s → 11 s.
- Météo citée sans être demandée : 2 essais ; balise HTML : 0 ; langue : 0 échec.
- Échecs répétés : 43 → 43, dont 14 résolus, 14 nouveaux et 29 inchangés.

Ce qui a marché :

- Analyse des écarts : toutes les comparaisons du niveau 3 passent.
- Sous-territoires : plus d'appel par département ; `get_taux_avancement_territoire`
  « un seul appel sur le parent » est résolu.
- Noms des territoires dans les tableaux, résolus dans les cas concernés.
- Routage : signalés à plusieurs catégories, clarification des trois chantiers
  logement, export du scénario de l'écran d'accueil, « politique
  prioritaire », recherche d'indicateurs restreinte au chantier.

Ce qui n'a pas marché :

- Recherche imposée de territoire : 0 essai sur 12 passe par
  `search_territoires`. Malgré la règle, l'exemple et la description,
  l'agent appelle directement les données avec DEPT-84 ou REG-84. Une
  consigne ne suffit pas : il faut un levier dans le code.
- « Trace la courbe d'évolution de l'IND-004 » : toujours
  `get_evolution_indicateur` (3/3), malgré l'exemple et les deux descriptions.
- Synthèse d'une région et de ses départements : plus d'énumération, mais
  l'agent ne collecte que le taux d'avancement, sans les chantiers en retard
  et en difficulté (outils attendus 33 %).

Régressions causées par l'étape 2 :

- `get_evolution_indicateur` « progresse » (3/3) et « tendance » (2/3) : la
  nouvelle description a perdu « la tendance ». L'agent passe par
  `search_indicateurs` puis `get_indicateurs`, ou n'appelle aucun outil.
- Clarification « graphique de répartition hors catalogue » : 2 essais sur 3
  répondent sans outil.

Autres nouveaux échecs, sur des critères que la calibration juge fragiles ou
déjà instables d'un run à l'autre : « Pas d'opinion », « Actions
identifiées », « Chiffres exacts », « Position face à la médiane »,
« Tableau comparatif », « Restriction signalée » (synthèse d'un chantier,
coordinateur).

### Entrées de l'étape 3

1. Corriger la régression de `get_evolution_indicateur` : remettre « la
   tendance, la progression » dans sa description.
2. Recherche de territoire : la consigne échoue, le levier est dans le code.
   À décider avec Antoine avant d'écrire quoi que ce soit, par exemple : les
   outils de données acceptent un nom de territoire et le résolvent
   eux-mêmes, ou refusent un code qui ne vient pas d'une recherche.
3. Synthèse d'une région et de ses départements, et chantiers attendus de la
   synthèse des difficultés : le tool composite « situation d'un territoire »
   (D5), désormais justifié par la mesure.
4. Courbe d'évolution : une décision produit. Soit `create_dashboard` pour
   toute courbe, soit `get_evolution_indicateur` qui donne les valeurs, et le
   graphique proposé ensuite.
5. Restriction d'accès : le champ de restriction dans `get_chantiers`.

### Étape 3 : régressions, courbe alignée sur la prod, restriction (`dead2dc`)

Changements :

- `get_evolution_indicateur` retrouve « la tendance, la progression » ;
- les exemples rappellent que les outils s'appellent et ne s'écrivent pas ;
- l'entrée de lexique « courbe, graphique, cartographie, tableau de bord →
  dashboard ; comment évolue, tendance → les valeurs » ;
- après une évolution, la proposition du graphique et du détail des actions,
  comme en prod (vérifié par Antoine sur la prod) ;
- `acces_restreint: true` sur les territoires hors de l'accès complet dans
  `get_chantiers`.

Mesure : 15 essais ont échoué sur des délais de connexion à l'API Albert (4
cas de `get_taux_avancement_territoire` et le « Cas frontière » du centre
d'aide). Ces deux suites ont été rejouées seules, et leurs résultats
remplacent ceux du run (`evals/resultats-etape-3-complet.json`).

- Niveau 2 : 89,6 % → 90,5 %. Niveau 3 : 93,4 % → 93,6 %.
- Tokens du premier appel : 2 853 → 2 928.
- Météo citée sans être demandée : 0 ; balise HTML : 1 ; langue : 0 échec.
- Échecs répétés : 43 → 36, dont 18 résolus, 11 nouveaux et 25 inchangés.

Résolus par les changements : l'évolution « progresse » et « tendance », la
clarification hors catalogue (plus d'appel écrit en JSON), la restriction
d'accès signalée (2 cas), un territoire désigné par son nom qui passe par la
recherche (2 essais sur 3, la première fois que la règle est suivie).

Toujours en échec :

- « le 84 », « la région 84 », « le département 84 » : jamais de recherche
  (0/9) ; l'agent traite le numéro comme un code connu.
- « Trace la courbe d'évolution » : dashboard 1 fois sur 3.
- Sous-territoires sur le taux d'avancement : un appel par département 1 fois
  sur 3 ; le cas, résolu à l'étape 2, est instable.

Nouveaux échecs à surveiller : « où ça coince » appelle la vue `all` au lieu
des vues `en_retard` et `en_difficulte` ; la synthèse du territoire courant
oublie des chantiers attendus ; les autres portent sur des critères fragiles
ou instables d'un run à l'autre (« Pas d'opinion », « Format des chantiers »,
« Analyse des écarts » de deux régions, « Données indisponibles dites »).

### Entrées de l'étape 4

1. Résolution des territoires dans le code : les numéros ne passent jamais par
   la recherche malgré la règle.
2. Outil composite « situation d'un territoire » : mis de côté le 27/10, la
   synthèse du territoire courant et « où ça coince » le justifient toujours.

