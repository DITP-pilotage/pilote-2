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
| 0 – ligne de base | | | | | |
