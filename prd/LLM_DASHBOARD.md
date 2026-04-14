# Albert — Composition dynamique de tableaux de bord

> **Statut** : exploration / POC. Ce document n'est pas une décision figée mais un cadre pour ouvrir la discussion en équipe. Il pose le problème, déroule plusieurs options techniques, propose une approche de référence et liste les questions encore ouvertes.

---

## 1. Contexte

Aujourd'hui, PILOTE expose des pages **figées** (page chantier, page territoire, comparaison de territoires…) avec des visualisations choisies au moment du design produit. Albert, lui, sait :

- répondre à des questions textuelles avec des données issues d'outils typés,
- afficher quelques composants riches en réponse à un appel d'outil (`ChantierIndicateursTable`, `ChoicesPanel`, `ExportRapportDownload`),
- exporter une synthèse au format Markdown ou PDF.

La sortie d'Albert reste **monodirectionnelle, éphémère et textuelle**. L'utilisateur ne peut pas dire « assemble-moi une vue avec ces 4 indicateurs, une carte météo et le classement des départements de ma région » et obtenir un objet réutilisable, partageable, rafraîchissable.

C'est ce manque que ce PRD adresse.

---

## 2. Vision produit

> **Permettre à un utilisateur de construire — en langage naturel, via Albert — son propre tableau de bord PILOTE, composé à la volée à partir d'un catalogue de widgets connectés aux données réelles, sans qu'aucune valeur ne soit inventée par le LLM.**

Trois principes fondateurs, hérités du positionnement actuel d'Albert :

1. **Factualité non négociable** — un widget n'embarque jamais de valeurs en dur produites par le LLM. Il déclare une **liaison de données** (chantier, territoire, jalon, indicateur…) et c'est le backend qui résout les valeurs à la lecture.
2. **Composition typée** — le LLM ne génère ni JSX, ni HTML, ni CSS. Il émet un **objet JSON validé par Zod**, dont chaque entrée correspond à un widget connu côté front. Tout ce qui sort du schéma est rejeté.
3. **Conversation dirigée** — Albert ne se lance pas dans une composition tant qu'il n'a pas suffisamment d'informations. Le system prompt encode un protocole de clarification (suite logique de `display_choices` et questions ouvertes) avant tout appel à l'outil de composition.

---

## 3. Problème utilisateur

### 3.1. Qui ?

Les profils déjà ciblés par Albert :

- **Coordinateur territorial** (préfet, SGAR, etc.) qui suit en continu un jeu de chantiers / d'indicateurs sur sa zone.
- **DITP admin / responsable national** qui prépare un comité, une revue, une note de pilotage.
- **Responsable de chantier** qui veut un cockpit personnel sur ses indicateurs et leur situation territoriale.

### 3.2. Quoi ?

Des verbatims plausibles :

- *« Construis-moi un cockpit pour suivre CH-001, CH-014 et CH-052 en Bretagne, avec le TA, la météo et les indicateurs principaux. »*
- *« Je veux une page de comparaison de mes 5 départements sur le jalon 2025, avec une carte météo et le top 5 des chantiers en retard de chaque département. »*
- *« Refais-moi le même tableau de bord que la semaine dernière mais sur le jalon 2024. »*
- *« Sur ce dashboard, enlève la carte et ajoute un graphique de l'évolution du TA des 3 derniers jalons. »*

Caractéristiques communes :

- la structure de la vue **change d'un utilisateur à l'autre** (ce n'est pas une page produit modifiable par configuration centrale),
- elle doit rester **vivante** : ouvrir le dashboard la semaine suivante doit afficher les valeurs à jour,
- elle doit être **partageable** au sein d'une équipe / d'une cellule,
- elle doit pouvoir **évoluer en conversation** : on dit à Albert ce qu'on veut changer, il met à jour la définition.

### 3.3. Pourquoi maintenant ?

- L'agent à outils existe déjà (`Albert.streamText`, boucle multi-step, `_output_instructions`) et est éprouvé en production.
- Le ChatUI sait déjà afficher des composants riches en réponse à un appel d'outil → le pattern « tool d'affichage » est validé.
- Les utilisateurs commencent à demander des vues qui n'existent pas dans le produit, et l'équipe n'a pas la bande passante pour livrer chaque variante en dur.

---

## 4. Limites de l'existant

| Capacité actuelle | Limite |
|---|---|
| Albert produit un texte markdown structuré (synthèse, comparaison) | Lecture unique, pas de mise à jour automatique, pas de visualisation graphique riche |
| `ChantierIndicateursTable` est rendu en réponse à `get_chantier_indicateurs` | Un seul composant codé en dur, pas d'arrangement libre |
| `export_rapport` produit un fichier Markdown / PDF | Document statique, ne se rafraîchit pas |
| Pages chantier / territoire / comparaison | Layout figé, mêmes widgets pour tous les utilisateurs |
| `display_choices` permet la clarification | Pattern conversationnel ad-hoc, pas formalisé pour la composition d'objets complexes |

---

## 5. Hypothèse produit

> Si on donne à Albert un **outil unique de composition** (`compose_dashboard`) qui consomme un schéma JSON décrivant un assemblage de widgets référencés dans un catalogue typé, **alors** un utilisateur autorisé pourra obtenir, en 3 à 5 tours de conversation, un tableau de bord pertinent, factuel et persistable, sans qu'aucune ligne de code produit n'ait été écrite pour son cas d'usage spécifique.

Hypothèses sous-jacentes à valider via le POC :

- H1 — Le modèle (`openweight-large` via Albert.gouv.fr) est capable de produire un JSON conforme à un schéma Zod non trivial avec un taux d'erreur acceptable.
- H2 — Un protocole de clarification écrit dans le system prompt suffit pour que le LLM ne « devine » pas les paramètres manquants (territoire, jalon, périmètre de chantiers, indicateurs).
- H3 — Le catalogue de widgets initial (≈ 8 à 10 types) couvre 70 % des demandes spontanées.
- H4 — Les utilisateurs préfèrent itérer en langage naturel plutôt qu'avec une UI de drag & drop classique.

---

## 5bis. Retours d'expérience du premier prototype (avril 2026)

Un premier prototype (commit `feat: prototype`) a implémenté un outil `compose_dashboard` avec un catalogue initial (`kpi_card` paramétré par un enum de métriques, `tableau_indicateurs`, `liste_chantiers_alerte` paramétré par un enum de type d'alerte, `texte_section`, `filler`) et un flux de clarification en 5 étapes (« Pattern (g) » historique). Il a permis de valider l'architecture conteneurs/grille mais a révélé trois problèmes structurels qui imposent de réviser plusieurs choix de ce PRD.

### 5bis.1. Les widgets paramétrés par un enum sont encore trop génériques

Le catalogue contenait un widget `kpi_card` avec un enum `metric ∈ {ta_global, mediane, nb_chantiers_en_retard}`. Sur le papier, c'est l'approche « spécifique mais paramétrique » défendue au §7.3. En pratique, le LLM :

- confond les métriques (demande `ta_global` quand l'utilisateur voulait la médiane, ou inversement),
- mélange dans un même container un `kpi_card` et un widget d'un autre `row_group` sans percevoir que les containers n'acceptent qu'un seul groupe,
- ne reconnaît pas l'**intention métier** derrière un `kpi_card` tant qu'il doit encore choisir une métrique — c'est une forme d'appel générique déguisée en appel métier.

Même phénomène sur `liste_chantiers_alerte` avec son enum `type_alerte ∈ {retard, difficulte}` : le LLM hésite, ou choisit le mauvais, ou passe le premier dans l'alphabet.

**Leçon** : l'unité du catalogue doit être l'**intention métier atomique**, pas une famille paramétrée par un enum. `kpi_card.metric="ta_global"` devient un widget à part entière nommé `widget_taux_avancement_territoire`. Le nom du widget **est** l'intention, et le LLM n'a plus qu'à choisir le bon outil dans un catalogue nominal — exactement comme il le fait déjà pour les outils de lecture (`get_taux_avancement_territoire`, `get_chantiers_en_retard`, …). C'est un renforcement de la recommandation du §7.3, pas un revirement : on passe de « spécifique paramétré par le périmètre » à « une intention, un widget ».

### 5bis.2. Le tool embarquait les données, en contradiction avec §7.6

Le prototype a fait exactement l'inverse de la recommandation §7.6 : l'`execute` de `compose_dashboard` appelait `GetChantiersEnRetardQuery`, `GetChantierIndicateursQuery`, `RécupérerStatistiquesUseCase` et embarquait les valeurs résolues directement dans le `tool_result`. Le composant React `DashboardRender` recevait ces données toutes prêtes et ne faisait que de la présentation passive.

C'est un raccourci tentant — « le tool a déjà tout ce qu'il faut » — mais il cumule trois coûts :

- **un outil massif** (~580 lignes de code serveur) qui recompose à la main une logique déjà exprimée par les queries tRPC existantes ;
- **une incohérence avec le reste du front PILOTE**, où les composants `_commons/Widget/*` récupèrent leurs données via `api.useSuspenseQueries(...)` et bénéficient automatiquement du cache, de la revalidation, du batching et du prefetch ;
- **les dashboards ne se rafraîchissent pas** au fil du temps sans rappeler le LLM — exactement le défaut que §7.6 avait déjà identifié comme rédhibitoire.

**Leçon** : la décision §7.6 (Option 2) doit être **appliquée à la lettre**. Le tool `compose_dashboard` ne fait **aucun fetch**. Son rôle est uniquement (1) de valider la structure JSON proposée par le LLM via Zod, (2) de renvoyer cette structure telle quelle comme tool result. Le registre d'adaptateurs React lit la structure et chaque composant widget réutilise le pattern de fetch déjà en place dans `_commons/Widget/*` — exactement comme `WidgetCartographieTA` fait aujourd'hui avec `api.useSuspenseQueries`.

Conséquence directe sur le code du tool : l'`execute` devient un simple `return input` (avec éventuellement un `_output_instructions`), plus aucun accès base de données ni aux use cases métier dans le tool lui-même. La DI (`prisma`, `getChantiersEnRetardQuery`, etc.) disparaît de la fabrique `createComposeDashboardTool`.

### 5bis.3. Le LLM posait trop de questions, souvent creuses

Le Pattern (g) initial décrivait 5 étapes : identifier les paramètres manquants, poser une question par paramètre (via `display_choices` ou texte), reformuler un plan en 3 lignes, demander confirmation textuelle, puis composer. En pratique, cette chorégraphie produit des conversations longues où le LLM demande le jalon, puis le territoire, puis la liste de chantiers, puis demande encore confirmation avant d'agir. L'utilisateur se lasse avant même d'avoir vu son premier dashboard — et les questions portent le plus souvent sur des paramètres que le modèle pourrait déduire du contexte agent ou poser en une seule fois.

**Leçon** : revenir à un protocole minimal. Pour la V1, le flux tient en **2 tours** : (1) demande de l'utilisateur, (2) réponse unique d'Albert qui présente brièvement les widgets disponibles et pose **une seule question ouverte** pour récupérer le contexte manquant ; puis composition directe sans étape « plan + confirmation ». L'utilisateur corrige après coup sur le dashboard rendu — c'est possible parce que la composition est bon marché (Option 2 §7.6 : pas de re-fetch, juste un nouveau rewrite JSON). La phase « plan + confirmation » est réintroduite uniquement si l'usage démontre qu'elle est nécessaire.

Les sections §7.2 (catalogue), §7.3 (philosophie), §7.4 (layout), §7.6 (qui charge les données) et §8 (flux d'interaction) ont été mises à jour en conséquence.

---

## 5ter. Ajustements opérés pendant l'implémentation V1 (PR `proto-llm-dashboard`)

Le document `docs/LLM_DASHBOARD_ITERATION_2.md` détaille la planification de la V1 — section §15 de ce document liste les écarts par rapport au plan détaillé. Cette section résume les ajustements **structurants** opérés pendant l'implémentation, ceux qui impactent ce PRD au-delà du simple détail technique.

### 5ter.1. Catalogue passé de 10 à 12 widgets

Deux widgets ajoutés en cours d'implémentation pour combler des incohérences ou des manques :

- **`widget_nombre_chantiers_en_difficulte`** — KPI atomique symétrique de `widget_nombre_chantiers_en_retard`. L'asymétrie initiale (un seul KPI compteur, pas son équivalent en difficulté) était une incohérence puisque les deux catégories existent comme listes (`widget_liste_chantiers_en_*`).
- **`widget_cartographie_propositions_valeur_avancement`** — carte des PVA d'un chantier, sur le même modèle que `widget_cartographie_meteo`. Réutilise un composant et un endpoint tRPC déjà existants. Ajouté pour couvrir le cas d'usage « focus chantier » qui apparaît dans plusieurs scénarios utilisateur.

Les sections §7.2 et §7.4 reflètent maintenant les 12 widgets.

### 5ter.2. Le savoir produit migre du system prompt vers la `description` du tool

La V1 planifiée prévoyait de **réécrire** le Pattern (g) du `systemPrompt.ts` avec le nouveau catalogue (cf. §8.3 historique). En cours d'implémentation, on est allé un cran plus loin : **le Pattern (g) a été entièrement supprimé du system prompt**, et toute la connaissance produit (catalogue de widgets, structure des containers, structure recommandée d'un cockpit, règles JSON strictes, exemples) vit désormais uniquement dans la `description` du tool `compose_dashboard`.

Trois raisons cumulées :

1. **DRY** — la version planifiée demandait de dupliquer le tableau du catalogue, les heuristiques de mise en page et les règles JSON dans deux endroits visibles par le LLM (le system prompt **et** la description du tool). Risque permanent de désynchronisation.
2. **Localité** — le SDK AI propage le `description` d'un tool au modèle au moment où il décide d'appeler ce tool. Mettre les règles d'usage *dans le tool lui-même* est l'endroit le plus pertinent pour qu'elles soient lues et appliquées au bon moment.
3. **Allègement** — le system prompt est envoyé à chaque tour de la conversation. Sortir 60 lignes de spécifications dashboard de la version envoyée à chaque tour réduit la pression sur le contexte (et la facture tokens), pour un savoir qui n'est pertinent que quand l'utilisateur évoque un dashboard.

Conséquence : le §8 (flux d'interaction) reste valide en tant que **vision produit** du flux conversationnel, mais le Pattern (g) historique n'est plus implémenté littéralement dans le system prompt. Le LLM s'appuie sur la description du tool pour comprendre ce qu'il doit faire.

### 5ter.3. KPI à pourcentage en jauge plutôt qu'en grand chiffre

Le plan prévoyait un KPI atomique générique « grand chiffre + label ». L'implémentation a basculé les KPI à pourcentage (`widget_taux_avancement_territoire`, `widget_mediane_avancement_territoire`) sur une **jauge de progression colorée** (`DashboardJaugeCard` qui wrappe le composant DSFR `JaugeDeProgression`). Justification : un pourcentage gagne en lisibilité et en signal visuel quand il est rendu en jauge — l'ordre de grandeur est immédiatement perceptible sans avoir à lire le chiffre. Les KPI à valeur entière (`widget_nombre_chantiers_en_*`) gardent un grand chiffre.

### 5ter.4. Exemples JSON dans la description du tool

Pendant l'usage, le LLM produisait des dashboards parfois mal structurés (oubli de container, mauvaise répartition). Pour fiabiliser la génération, **trois exemples JSON compactés** ont été ajoutés à la `description` du tool : cockpit synthétique d'une région, ventilation par sous-territoires (pattern à répéter), focus chantier. Une note de garde-fou rappelle que les valeurs sont illustratives.

### 5ter.5. Bouton « Tableau de bord du territoire » dans `BoutonSyntheseTerritoire`

Le composant `BoutonSyntheseTerritoire` (point d'entrée Albert depuis les pages territoires) expose un set de scénarios pré-câblés. Un nouveau scénario **« Tableau de bord du territoire »** a été ajouté qui injecte un prompt structuré pour déclencher `compose_dashboard` avec un cockpit complet (KPI + cartographie + sections par chantier en difficulté). C'est un point d'entrée direct pour les utilisateurs qui ne connaîtraient pas la formulation à utiliser.

### 5ter.6. Tweak des `default_width` cartographies (12 → 6)

Le plan prévoyait `default_width=12` pour les widgets cartographie. Le tweak vers `default_width=6` permet au LLM de poser deux cartes côte à côte (TA + météo, TA + PVA) sans avoir à spécifier `width` explicitement — devenu le pattern courant des dashboards focus chantier.

---

## 6. Exploration des approches techniques

Quatre options sur la table, de la plus permissive à la plus contrainte. Le choix de référence pour le POC est l'**Option C** (composition typée à partir d'un catalogue), qui s'inscrit dans la continuité de l'architecture Albert existante.

### Option A — Génération de code (JSX / HTML / CSS)

Le LLM produit directement du code de rendu, exécuté côté client dans un sandbox.

- ✅ Expressivité maximale, aucune limite de design.
- ❌ Surface d'attaque énorme (XSS, exfiltration), nécessite un sandbox isolé (iframe, runtime restreint).
- ❌ Validation difficile : impossible de garantir que le code n'embarque pas de chiffres inventés.
- ❌ Coût et latence (le LLM doit générer beaucoup de tokens « décoratifs »).
- ❌ Incohérent avec la charte DSFR.

**Verdict** : éliminé. Trop éloigné des principes de factualité et de cohérence visuelle de PILOTE.

### Option B — Templates paramétrés

Une bibliothèque de tableaux de bord prédéfinis (« cockpit chantier », « cockpit territoire », « comparaison ») dont le LLM choisit l'occurrence et remplit les paramètres (territoire, chantiers, jalon).

- ✅ Très prédictible, simple à valider, simple à tester.
- ✅ Facile à partager avec des utilisateurs non techniques.
- ❌ Expressivité limitée : si le template ne prévoit pas un widget, l'utilisateur ne peut pas l'avoir.
- ❌ Faible « effet AI » : on est plus proche d'une UI à formulaire que d'une génération.
- ⚠️ Risque d'explosion combinatoire des templates au fil des demandes.

**Verdict** : pertinent comme **point de départ** ou comme **fallback** si l'Option C s'avère trop instable. Utile aussi pour bootstrap (les templates servent d'exemples few-shot dans le system prompt).

### Option C — Composition typée à partir d'un catalogue (référence)

Le LLM appelle un outil `compose_dashboard` dont l'`inputSchema` Zod décrit :

- les **métadonnées** du dashboard (titre, description, filtres globaux : territoire, jalon),
- une **liste de widgets**, chacun étant une union discriminée par `type` (`widget_taux_avancement_territoire`, `widget_cartographie_taux_avancement`, `widget_cartographie_meteo`, `widget_liste_chantiers_en_retard`, `widget_tableau_indicateurs_chantier`, …),
- pour chaque widget, ses **paramètres typés** (référence chantier, indicateur, jalon, maille…) — **jamais de valeurs**.

Le frontend dispose d'un **registre d'adaptateurs React** : à chaque `type` de widget correspond un composant qui sait lire les paramètres et appeler la query backend correspondante (via tRPC, comme le reste de l'app).

- ✅ Cohérent avec l'architecture Albert : un outil de plus, validation Zod, rendu déclenché par un type de tool part.
- ✅ Garantit la factualité : les valeurs sont résolues au rendu côté widget, le LLM ne touche jamais aux chiffres.
- ✅ Cohérent avec la charte DSFR (les composants existent déjà).
- ✅ Évolutif : ajouter un type de widget = (1) nouveau cas dans l'union Zod, (2) nouveau composant, (3) une ligne dans le system prompt.
- ⚠️ Le LLM doit apprendre la grammaire du catalogue (à mitiger via prompt + exemples + retours d'erreur structurés).
- ⚠️ Schéma à maintenir comme une vraie API publique.

**Verdict** : option de référence pour le POC.

### Option D — Hybride templates + composition libre

Le LLM choisit un template de départ (« cockpit territoire ») puis le **modifie** en composant des widgets supplémentaires depuis le catalogue. Combine la prévisibilité de B avec l'expressivité de C.

- ✅ Bootstrapping facile (l'utilisateur dit « cockpit Bretagne », il a immédiatement un résultat utile).
- ✅ Itérations naturelles : « ajoute un graphique d'évolution » s'applique sur un état stable.
- ⚠️ Plus de complexité côté schéma (notion de « base template + override »).

**Verdict** : à viser **après** avoir validé l'option C en POC. Probablement la cible long terme.

---

## 7. Architecture de référence (Option C)

### 7.1. Vue d'ensemble du flux

```
Utilisateur ─► Albert ─► clarification (display_choices / question ouverte)
                  │
                  ├─► appels d'outils de données existants (lecture seule)
                  │   pour valider les références (territoire, chantier, indicateur)
                  │
                  └─► compose_dashboard(JSON conforme au schéma)
                          │
                          └─► validation Zod → persistance → rendu côté client
                                                                │
                                                                └─► chaque widget appelle
                                                                    sa query tRPC dédiée
```

### 7.2. Catalogue de widgets (proposition révisée post-prototype)

> **Principe directeur, renforcé après le POC** : *une intention métier = un widget*. Pas d'enum interne qui multiplie les intentions au sein d'un même type. Le **nom du widget** encode l'intention métier, ses **paramètres n'encodent que le périmètre** (territoire, chantier, jalon, mode d'affichage). Voir §5bis.1 pour le retour d'expérience qui motive ce choix.

Le catalogue est aligné sur les composants déjà présents dans `src/client/components/_commons/Widget/*` — un widget du catalogue est, dans la plupart des cas, un wrapper mince autour d'un widget existant qui sait déjà faire son propre fetch via `api.useSuspenseQueries`.

| Widget | Intention métier | Paramètres (références uniquement) | Composant `_commons` réutilisé |
|---|---|---|---|
| `widget_taux_avancement_territoire` | « Le TA agrégé d'un territoire en gros » | `territoire_code`, `jalon` | `DashboardJaugeCard` (jauge bleue) |
| `widget_mediane_avancement_territoire` | « La médiane de répartition sur un territoire » | `territoire_code`, `jalon` | `DashboardJaugeCard` (jauge violette) |
| `widget_nombre_chantiers_en_retard` | « Combien de chantiers en retard sur un territoire » | `territoire_code`, `jalon` | `DashboardKpiCard` (grand chiffre) |
| `widget_nombre_chantiers_en_difficulte` | « Combien de chantiers en difficulté (météo ORAGE/NUAGE) sur un territoire » | `territoire_code`, `jalon` | `DashboardKpiCard` (grand chiffre) |
| `widget_valeurs_remarquables_avancement` | « Distribution du TA sur les sous-territoires : minimum, médiane, maximum » | `territoire_code`, `jalon` (maille déduite) | `ValeursRemarquables` (déjà utilisé par `WidgetCartographieTA`) |
| `widget_tableau_indicateurs_chantier` | Tableau des indicateurs d'un chantier sur un territoire | `chantier_id`, `territoire_code`, `jalon` | `ChantierIndicateursTable` |
| `widget_liste_chantiers_en_retard` | Liste compacte des chantiers en retard (critère quantitatif : écart ≤ -10 pts) | `territoire_code`, `jalon` | `DashboardChantiersListe` (nouveau) |
| `widget_liste_chantiers_en_difficulte` | Liste compacte des chantiers en difficulté (critère qualitatif : météo ORAGE/NUAGE) | `territoire_code`, `jalon` | `DashboardChantiersListe` (nouveau) |
| `widget_cartographie_taux_avancement` | Carte de France du TA par territoire, pour un ensemble de chantiers | `maille`, `territoire_code`, `jalon`, `chantier_ids` | `WidgetCartographieTA` (mode `chantiers`) |
| `widget_cartographie_meteo` | Carte de France des météos par territoire pour un chantier | `maille`, `territoire_code`, `chantier_id`, `jalon` | `WidgetCartographieMeteo` |
| `widget_cartographie_propositions_valeur_avancement` | Carte de France des propositions de valeurs d'avancement (PVA) d'un chantier | `maille`, `territoire_code`, `chantier_id`, `jalon` | `WidgetCartographiePVA` (mode `chantier`) |
| `widget_titre_section` | Titre + description courte pour structurer visuellement le dashboard | `titre`, `description` (ni l'un ni l'autre ne contient de chiffre) | (nouveau, purement présentationnel) |

> **État au moment de la PR `proto-llm-dashboard`** : 12 widgets implémentés. Le catalogue planifié à 10 widgets a été enrichi en cours d'implémentation de `widget_nombre_chantiers_en_difficulte` (symétrique du KPI « en retard ») et `widget_cartographie_propositions_valeur_avancement` (carte des PVA d'un chantier). Voir aussi `docs/LLM_DASHBOARD_ITERATION_2.md` §15 pour le détail des écarts post-rédaction.

Conséquences de ce découpage par rapport au catalogue initial :

- **4 widgets KPI atomiques + 1 widget distribution au lieu d'un `kpi_card` paramétré par un enum.** Le LLM n'a plus à choisir une métrique dans un enum, il choisit un type de widget. Coûteux en nombre de lignes dans la discriminated union Zod, mais chaque cas est trivial à comprendre pour le modèle, et la surface d'erreur sur le choix de métrique tombe à zéro. Les KPI à pourcentage (`widget_taux_avancement_territoire`, `widget_mediane_avancement_territoire`) sont rendus en **jauge de progression colorée** plutôt qu'en grand chiffre — la jauge donne immédiatement l'ordre de grandeur visuellement, sans avoir à lire le chiffre. Les KPI à valeur entière (`widget_nombre_chantiers_en_*`) gardent un grand chiffre.
- **`widget_valeurs_remarquables_avancement` est un « KPI composite » déjà existant dans le code.** Il reprend le composant `ValeursRemarquables` qui affiche côte à côte le minimum, la médiane et le maximum du TA sur les sous-territoires d'un territoire donné (départements pour une région, régions pour la France entière). C'est la forme préférée pour montrer une distribution résumée : le LLM n'a plus à hésiter entre « un KPI médiane seul » et « trois KPI alignés » — il a un widget dédié, sémantiquement correct. `widget_mediane_avancement_territoire` reste disponible pour les cas où l'utilisateur ne veut *que* la médiane en petit, mais dans un cockpit standard, c'est `widget_valeurs_remarquables_avancement` qui est la bonne réponse.
- **Listes en retard / en difficulté séparées.** Le prototype avait un `liste_chantiers_alerte` avec `type_alerte ∈ {retard, difficulte}`. Même conclusion que pour les KPI : ce sont deux intentions distinctes, deux queries différentes côté serveur, deux widgets distincts dans le catalogue. Cette même symétrie a été appliquée aux KPI compteurs (`widget_nombre_chantiers_en_retard` et `widget_nombre_chantiers_en_difficulte`) pendant l'implémentation.
- **Ajout des widgets cartographie.** Ils manquaient cruellement au catalogue initial — or une bonne part des demandes « je veux voir X par territoire » trouve sa meilleure forme dans une carte. Trois cartes au final : `widget_cartographie_taux_avancement`, `widget_cartographie_meteo` et `widget_cartographie_propositions_valeur_avancement` (PVA d'un chantier, ajoutée pendant l'implémentation). Réutilisation directe de `WidgetCartographieTA`, `WidgetCartographieMeteo` et `WidgetCartographiePVA` déjà en place dans `_commons/Widget/`, qui savent déjà fetcher leurs données via `api.useSuspenseQueries` — leur wrapper n'a rien à faire de plus qu'à passer les props.
- **Disparition de `filler`.** Un widget vide était un palliatif à la rigidité du layout, pas une intention métier. Si la grille interne d'un container laisse un trou, c'est acceptable visuellement (et les `allowed_widths` de chaque widget permettent au LLM de ne pas en créer).
- **Disparition de `texte_libre` au profit de `widget_titre_section`.** Même rôle de structuration sémantique, mais le nom est explicite (« ce widget est un titre de section, pas un paragraphe libre ») et le linter anti-chiffres reste en place (cf. §9) — si le LLM veut afficher une valeur, il doit utiliser un des widgets KPI, pas coller le chiffre dans un titre.

**Règle de factualité inchangée** : tout widget qui affiche un chiffre doit pointer vers une query existante via ses références. Aucune valeur chiffrée ne passe jamais par le LLM. Les widgets KPI atomiques le garantissent par construction — leur schéma Zod n'expose pas de champ `value`.

**Extensibilité** : ajouter une intention métier = (1) nouveau cas dans l'union Zod, (2) nouveau composant dans le registre d'adaptateurs (souvent un wrapper sur un composant de `_commons/Widget/*`), (3) une ligne dans la table ci-dessus du system prompt. Pas de code serveur dans le tool `compose_dashboard` lui-même (cf. §7.6).

### 7.3. Philosophie du catalogue : widgets métier ou primitives génériques ?

Le catalogue présenté au §7.2 est explicitement **métier**. Avant de figer ce choix, il vaut la peine de poser la tension qu'il résout, parce qu'une autre approche est techniquement viable.

#### Trois couches à séparer

La discussion oppose souvent « widget métier » et « widget générique » comme si c'était binaire. En réalité un widget se décompose en trois couches indépendantes :

1. **La source de données** — d'où viennent les chiffres. Les outils Albert actuels (`getTauxAvancementTerritoire`, `getChantierIndicateurs`, `getChantiersEnRetard`, …) sont déjà un catalogue de sources de données, formulées comme des questions métier et non comme des opérations CRUD sur des tables.
2. **La primitive visuelle** — comment on dessine (table, bar chart, line chart, KPI card, carte, liste).
3. **Le couplage entre les deux** — qui décide quelle source alimente quelle primitive, avec quel mapping (colonnes affichées, axe X, axe Y, format des valeurs, couleurs, ordre de tri).

La vraie question est : **où veut-on poser la frontière entre ce qui est figé dans le code et ce qui est laissé à la décision du LLM ?**

#### Option α — Widgets métier couplés (recommandation)

Chaque widget connaît à l'avance sa source de données, ses colonnes, ses unités, ses couleurs, ses règles de format. C'est exactement le catalogue §7.2 : `tableau_indicateurs` sait qu'il affiche un chantier sur un territoire avec les colonnes VI/VA/VC/TA, point ; `meteo_carte` sait qu'il affiche une cartographie de météos par territoire pour un chantier donné, point.

- ✅ **Décisions de format figées une fois pour toutes** : TA en %, météo en couleurs DSFR, code chantier au format `CH-XXX`, écart en points avec signe. Le LLM n'a pas à les redécider à chaque appel.
- ✅ **Validation Zod efficace** : un schéma strict par widget, peu de champs libres, surface d'erreur minimale.
- ✅ **Réutilisation directe** des composants `_commons` existants (`ChantierIndicateursTable`, `Cartographie`, `IconeMeteo`, `BarreDeProgression`).
- ✅ **Cohérent avec la philosophie des outils Albert** : on continue de travailler en intentions métier, pas en opérations génériques (`get_chantiers_en_retard`, pas `select_from_chantier_where`).
- ⚠️ **Longue traîne non couverte** : si demain un utilisateur veut « un graphique en aire empilée du nombre de chantiers par météo et par mois », il faut shipper un widget. Cycle produit → dev → release.

#### Option β — Primitives génériques configurées par le LLM

Un petit nombre de primitives visuelles bas niveau (`table`, `bar_chart`, `line_chart`, `kpi`, `map`), et le LLM choisit la primitive **et** la source de données **et** le mapping. Le widget React n'est qu'un moteur de rendu passif.

- ✅ **Expressivité maximale**, longue traîne couverte par construction, catalogue minuscule.
- ❌ Le LLM doit maîtriser **trois grammaires** au lieu d'une (sources, primitives, mapping). Chaque grammaire ajoute une dimension d'erreur.
- ❌ Les **décisions de formatage** (TA en %, météo en couleur, code `CH-XXX`, écart signé, ordre de tri métier) deviennent des choses que le LLM doit re-décider à chaque appel. Il les fera mal certaines fois — et précisément sur les éléments où l'utilisateur attend une cohérence absolue avec le reste de PILOTE.
- ❌ La **validation Zod** ne protège plus que la structure, pas la sémantique. Un `bar_chart` qui mappe `axe_y = code_chantier` est valide structurellement et catastrophique visuellement.
- ❌ La **cohérence avec la charte DSFR** devient la responsabilité du LLM, ce qui est une mauvaise idée. Aujourd'hui c'est la responsabilité de chaque composant `_commons` qui a été soigneusement conçu.
- ❌ La **surface d'attaque sur les habilitations** s'élargit : chaque source générique doit être scopée séparément, et l'audit d'une composition libre est plus dur.
- ❌ L'**eval** devient quasi obligatoire : on ne peut plus juste vérifier qu'un widget est bien formé, il faut juger qualitativement si la viz a du sens. C'est de l'évaluation de design pilotée par humains, coûteuse en temps et en budget.

#### La nuance qui compte : *spécifique mais paramétrique*

« Métier » ne veut pas dire « un widget par variante ». L'unité de granularité du catalogue est **l'intention métier**, mais chaque widget reste **paramétrique** sur son périmètre :

- `tableau_indicateurs` prend `{ chantier_id, territoire_code }` et fonctionne pour n'importe quel chantier.
- `bar_chart_ta_par_territoire` prend `{ territoires: string[], jalon: number, chantier_id?: string }` et compare ce qu'on lui demande de comparer. Il **est** un bar chart, mais c'est *un bar chart de TA par territoire*, pas un bar chart générique.
- `kpi_card` prend `{ metric: "ta_global" | "mediane" | "nb_chantiers_en_retard", territoire_code, jalon }`. La métrique est choisie dans un **enum fermé de métriques métier**, pas un champ texte libre.

Ce gabarit *spécifique mais paramétrique* donne le bon point d'équilibre :

- la grammaire que le LLM doit apprendre reste **petite et discrète** (une union Zod d'une dizaine de cas, chacun avec ~3 paramètres),
- chaque widget garde une **identité métier claire**, donc des décisions de format figées,
- le **paramétrage couvre la variabilité légitime** (quel chantier, quel territoire, quel jalon, quel sous-ensemble d'indicateurs).

#### Recommandation

**Option α (widgets métier paramétriques) pour le POC, sans hésitation.** Trois raisons :

1. **Le 80/20 est connu d'avance.** Cockpit territoire, suivi de chantiers, comparaison de jalons, vue d'alertes : on connaît la bonne mise en forme de chacun de ces cas. Demander au LLM de re-décider à chaque appel ce que l'équipe a déjà décidé une fois pour toutes, c'est gaspiller de la fiabilité sur des décisions qui n'auraient jamais dû être à sa charge.
2. **Cohérence avec l'architecture Albert existante.** Le PRD `LLM_SYNTHESE_RESULTATS.md` revendique explicitement (§2.2) que les outils sont construits autour des intentions utilisateur, pas autour des tables. Faire des widgets génériques introduirait dans la couche dashboard une philosophie opposée à celle, déjà éprouvée, de la couche outils.
3. **Le coût d'ajout d'un widget métier est faible.** Un nouveau cas dans une union Zod, un nouveau composant React (le plus souvent un wrapper sur un `_commons` existant), une ligne dans le system prompt. Demi-journée. Faire évoluer une primitive générique pour qu'elle « comprenne » mieux un nouveau type de donnée demande du prompt engineering, de l'eval, de la surveillance de régressions. C'est plus cher *et* moins fiable.

#### Quand revisiter ce choix ?

Pas avant d'avoir au moins :

- 15 à 20 widgets métier dans le catalogue (le poids de maintenance commence à devenir réel),
- une trace mesurée de demandes utilisateurs qu'aucun widget existant ne couvre, **et qui ne se ressemblent pas entre elles** (sinon il suffit d'ajouter un widget métier de plus),
- un harness d'évaluation (du type `EvaluerChatUseCase`) capable de noter automatiquement la qualité d'une composition, pour absorber le risque de dérive du LLM en production.

Et même à ce moment-là, l'extension naturelle n'est pas forcément « ajoutons des primitives génériques », c'est plutôt **« ajoutons une variante paramétrique d'un widget métier existant »** — par exemple `bar_chart_par_dimension` où la dimension est choisie dans un enum fermé (territoire / jalon / météo / axe stratégique). On élargit le paramétrage avant d'ouvrir le mapping.

#### Addendum post-prototype : jusqu'où pousser la nominalisation ?

Le premier prototype (cf. §5bis.1) a montré que la recommandation « spécifique mais paramétrique » n'est pas assez stricte. Même un enum fermé de métriques métier (`kpi_card.metric ∈ {ta_global, mediane, nb_chantiers_en_retard}`) est trop de liberté pour le LLM, qui confond les métriques et choisit au hasard.

La V1 va donc un cran plus loin : **un widget = une intention nominalement nommée**, sans enum qui multiplie les intentions à l'intérieur d'un même type. Les paramètres d'un widget se limitent au **périmètre** (territoire, chantier, jalon, maille) — jamais à la **nature** de ce qui est montré.

Cela signifie par exemple :

- Pas un `kpi_card` paramétré par un enum de métrique, mais trois widgets distincts `widget_taux_avancement_territoire`, `widget_mediane_avancement_territoire`, `widget_nombre_chantiers_en_retard`.
- Pas un `liste_chantiers_alerte` paramétré par un enum de `type_alerte`, mais deux widgets distincts `widget_liste_chantiers_en_retard` et `widget_liste_chantiers_en_difficulte`.

Le coût en lignes dans la discriminated union Zod augmente (3 cas au lieu d'1 pour les KPI), mais chaque cas est trivialement compréhensible pour le modèle, et la surface d'erreur sur le choix d'intention tombe à zéro. Le LLM se retrouve en terrain connu : il choisit un outil dans un catalogue nominal, exactement comme il le fait déjà avec les outils de lecture de PILOTE (`get_taux_avancement_territoire`, `get_chantiers_en_retard`, …).

Cette règle n'interdit pas *tous* les enums. Elle interdit les enums qui changent la **nature sémantique** de ce qu'affiche le widget. Un enum de périmètre (ex : `maille ∈ {regionale, departementale}` sur une cartographie) reste acceptable parce qu'il ne change pas l'intention, seulement le zoom.

### 7.4. Layout : grille, tailles et placement

Pour qu'un dashboard ait un rendu propre et lisible — et pour qu'Albert puisse raisonner sur la composition sans réinventer un moteur de mise en page à chaque appel — il faut un système de layout simple, prédictible, et **dont les contraintes sont connues du LLM**.

#### Grille 12 colonnes, packing implicite

Le système retenu est une **grille à 12 colonnes** (modèle DSFR, déjà utilisé partout dans PILOTE) sur laquelle les widgets se placent **dans l'ordre où le LLM les déclare**, en se déplaçant de gauche à droite et de haut en bas. Quand une rangée est pleine, on passe à la suivante. C'est exactement le comportement d'un `flex-wrap` ou d'un grid CSS auto-pack.

Le LLM n'a **jamais** à manipuler des coordonnées absolues (`col_start`, `row_start`). Il liste les widgets dans l'ordre désiré et le moteur de layout fait le reste. Cela élimine d'un coup deux familles d'erreurs : les chevauchements et les trous. C'est aussi un degré de liberté de moins à fiabiliser dans le schéma, donc moins de tokens, moins de validations, moins de retours d'erreur.

#### Chaque widget connaît sa taille

Dans la définition Zod du catalogue, chaque type de widget déclare :

- une **largeur par défaut** en colonnes de la grille (`default_width`),
- une **liste de largeurs autorisées** (`allowed_widths`), choisie dans un enum fermé (3, 4, 6, 8, 12).

Tailles pour le catalogue révisé §7.2 :

| Widget | `default_width` | `allowed_widths` | Justification |
|---|---|---|---|
| `widget_taux_avancement_territoire` | 3 | `[3, 4, 6]` | KPI court (jauge), 4 par rangée possible |
| `widget_mediane_avancement_territoire` | 3 | `[3, 4, 6]` | idem (jauge) |
| `widget_nombre_chantiers_en_retard` | 3 | `[3, 4, 6]` | KPI court (chiffre) |
| `widget_nombre_chantiers_en_difficulte` | 3 | `[3, 4, 6]` | KPI court (chiffre) |
| `widget_valeurs_remarquables_avancement` | 6 | `[4, 6, 8]` | Trio min/médiane/max aligné, demande un peu plus d'espace qu'un KPI atomique |
| `widget_liste_chantiers_en_retard` | 6 | `[6, 12]` | Liste verticale, demi ou pleine largeur |
| `widget_liste_chantiers_en_difficulte` | 6 | `[6, 12]` | idem |
| `widget_tableau_indicateurs_chantier` | 12 | `[12]` | Beaucoup de colonnes, pleine largeur obligatoire |
| `widget_cartographie_taux_avancement` | 6 | `[6, 8, 12]` | Carte SVG, par défaut en demi-largeur pour permettre la juxtaposition de deux cartes |
| `widget_cartographie_meteo` | 6 | `[6, 8, 12]` | idem |
| `widget_cartographie_propositions_valeur_avancement` | 6 | `[6, 8, 12]` | idem |
| `widget_titre_section` | 12 | `[6, 12]` | Bloc titre / introduction de section |

Le LLM peut **choisir une largeur dans le set autorisé** pour chaque instance, via un champ `width` optionnel sur le widget. S'il ne le précise pas, on prend le `default_width`. S'il propose une largeur hors du set autorisé, la validation Zod renvoie une erreur structurée et l'agent corrige.

La **hauteur**, elle, est déterminée par le widget lui-même au rendu (auto-height à partir du contenu). Pas de paramètre `height` exposé au LLM dans la V1 — c'est un degré de liberté de moins, et 95 % des cas n'en ont pas besoin.

#### Le LLM doit *connaître* les tailles : où vit cette information ?

Pour que le LLM compose intelligemment (ne pas empiler 5 tableaux pleine largeur, savoir qu'il peut grouper 4 KPI cards sur une rangée), il doit **connaître à l'avance** la taille de chaque widget. Trois leviers à empiler :

1. **Description Zod** — chaque widget a un `.describe()` qui mentionne explicitement sa largeur par défaut et ses largeurs autorisées. Le AI SDK transmet ces descriptions au LLM via le schéma de l'outil, sans intervention supplémentaire.
2. **Section du system prompt** — le même tableau récapitulatif que ci-dessus est inclus dans le prompt, pour que le LLM puisse raisonner sur la composition avant d'écrire le JSON. Redondant avec les `.describe()` mais utile : le LLM voit la grille des tailles d'un coup d'œil.
3. **Heuristiques de mise en page** explicites dans le system prompt, par exemple :
   > *« Commence le dashboard par un `widget_titre_section`. Regroupe les KPI atomiques (`widget_taux_avancement_territoire`, `widget_nombre_chantiers_en_retard`) et un `widget_valeurs_remarquables_avancement` dans un même container en début de dashboard. Les widgets pleine largeur (`widget_tableau_indicateurs_chantier`, `widget_cartographie_taux_avancement`) viennent ensuite. Évite plus de 2 widgets pleine largeur consécutifs sans rangée intermédiaire. »*

Ces heuristiques ne sont pas un schéma — ce sont des règles éditoriales que le LLM applique en best-effort. La validation Zod ne les fait pas respecter. C'est volontaire : on accepte une dérive minoritaire sur la mise en page parce que le coût d'erreur (un dashboard moins joli) est faible et qu'une grille rigide étoufferait l'inventivité dont on a besoin pour les cas complexes.

#### Sections nommées (à valider en POC, probablement V2)

Une variante consiste à structurer le dashboard en **sections nommées** (titre + grille interne) plutôt qu'en une seule grille continue, par analogie avec les patterns de synthèse actuels (`Chantiers en retard`, `Chantiers en difficulté`, etc.) dans `systemPrompt.ts`.

- ✅ Donne au LLM une dimension sémantique pour organiser un dashboard volumineux.
- ✅ Aide la lecture : le titre de section guide l'œil.
- ⚠️ Ajoute un niveau dans le schéma (`dashboard.sections[].widgets[]` au lieu de `dashboard.widgets[]`) et donc un niveau de raisonnement de plus pour le LLM.

Décision proposée pour le POC : **commencer sans sections**, et n'ajouter le niveau « section » que si les retours utilisateurs montrent que les dashboards à plus de 6-8 widgets deviennent illisibles. Cohérent avec le principe de minimalisme du POC. Le bloc `widget_titre_section` (largeur 12) joue déjà un rôle de séparateur sémantique léger en attendant.

#### Responsive

Sur mobile et tablette, la grille s'effondre : tous les widgets passent en pleine largeur (`width = 12`), dans l'ordre où le LLM les a déclarés. C'est géré côté CSS, le LLM n'a rien à savoir là-dessus.

### 7.5. Liaison de données (« data binding »)

C'est la pièce centrale qui garantit la factualité.

- Un widget contient des **références** (codes territoire, ids chantier, ids indicateur, jalons).
- Le frontend, à l'instanciation du widget, déclenche la query tRPC associée à son type, en passant ces références.
- Les habilitations utilisateur sont **réappliquées à la lecture**, pas à la composition. Conséquence importante : un dashboard partagé peut afficher moins de contenu pour un destinataire ayant moins de droits, sans pour autant casser sa structure.
- Aucune donnée n'est gelée dans le JSON sauf, éventuellement, une notion de « snapshot » optionnelle (cf. §11 questions ouvertes).

### 7.6. Qui charge les données : le LLM ou le widget ?

C'est sans doute **la** question architecturale la plus structurante de ce PRD. Deux modèles possibles, qui produisent des dashboards d'apparence identique mais avec des propriétés très différentes.

#### Option 1 — Le LLM charge, et embarque les valeurs

Albert appelle ses outils de lecture (`getTauxAvancementTerritoire`, `getChantierIndicateurs`, …), récupère les chiffres, puis émet une définition de dashboard dans laquelle **chaque widget contient déjà les valeurs en dur**. Le widget React n'est qu'un composant de présentation passif.

- ✅ Aucune query supplémentaire au moment du rendu, latence d'affichage minimale.
- ✅ Le rendu ne dépend d'aucun service externe : un dashboard ouvert plus tard fonctionnera même si la base est lente.
- ❌ **Les valeurs sont gelées au moment de la composition.** Rouvrir le dashboard une semaine plus tard affiche les chiffres d'il y a une semaine. C'est un *rapport*, pas un *dashboard*.
- ❌ **Le LLM redevient un point de passage pour des chiffres**, ce que l'architecture Albert actuelle évite scrupuleusement (cf. principe « factualité » du §2 et `_output_instructions` du PRD `LLM_SYNTHESE_RESULTATS.md`). Risque non nul d'arrondis fantaisistes, de transposition de colonnes, d'unités erronées.
- ❌ **Coût en tokens élevé** : la définition complète d'un dashboard peut dépasser plusieurs milliers de tokens si elle contient des séries temporelles ou des listes de chantiers.
- ❌ **Habilitations gelées à la composition.** Si le dashboard est partagé, ou si les droits du propriétaire évoluent, le destinataire voit potentiellement des données auxquelles il n'a plus accès. Pour rétablir la sécurité il faut re-vérifier à la lecture, ce qui réintroduit les queries qu'on cherchait à éviter.
- ❌ La boucle d'édition (« change le jalon ») impose au LLM de **re-récupérer toutes les données** et de réémettre une définition complète, alors qu'un changement de paramètre devrait être trivial.

#### Option 2 — Le LLM passe des références, le widget charge

Albert n'émet que des **références** (`{ type: "widget_taux_avancement_territoire", territoire_code: "REG-53", jalon: 2025 }`). Au rendu, chaque adaptateur React appelle la query tRPC correspondante, exactement comme le ferait n'importe quelle page existante de PILOTE.

- ✅ **Données toujours fraîches.** Le dashboard est vivant par construction.
- ✅ **Factualité garantie de bout en bout.** Le LLM ne touche jamais aux chiffres, donc ne peut pas en inventer ni en altérer. C'est exactement la même garantie que celle d'`_output_instructions` aujourd'hui pour `ChantierIndicateursTable`.
- ✅ **Habilitations appliquées au moment du rendu**, par les queries tRPC qui les vérifient déjà. Partage et évolution des droits gérés naturellement.
- ✅ **Définition compacte** (quelques centaines de tokens), donc composition rapide et bon marché.
- ✅ **Édition triviale** : modifier un paramètre de filtre (jalon, territoire) ne demande qu'une réécriture du JSON, pas de rechargement de données par le LLM.
- ✅ **Cache et batching** côté frontend / tRPC réutilisent l'infra existante.
- ⚠️ Le LLM doit composer « à l'aveugle » : il n'a pas vu les chiffres avant de proposer le dashboard. Pour la plupart des cas (cockpits, suivi périodique) ce n'est pas un problème — le LLM choisit la *structure*, les valeurs sont du ressort des queries. Pour les cas où le LLM aurait besoin de connaître les données pour décider quoi afficher (« montre-moi les 3 chantiers avec le plus gros écart »), il peut tout à fait **appeler les outils de lecture pendant la phase de clarification** pour informer sa composition — mais le résultat de ces appels sert uniquement à choisir les **références** à inclure, jamais les valeurs.
- ⚠️ Plusieurs widgets sur un même dashboard = plusieurs queries au rendu. À mitiger par batching tRPC, cache navigateur et — si besoin — par une query agrégée côté serveur qui résout plusieurs widgets en un appel.

#### Option 3 — Hybride snapshot optionnel

Un dashboard est **par défaut** en Option 2 (références, données vivantes). Un mode `snapshot` optionnel permet de geler les valeurs à un instant T pour archivage, preuve ou présentation. Le snapshot est une **vue figée** d'un dashboard vivant, pas le mode normal.

- ✅ Couvre le cas d'usage « j'envoie ce dashboard à mon comité, je veux qu'il reste tel quel ».
- ⚠️ Ajoute un concept de plus à modéliser (snapshot ≠ définition). À documenter clairement côté UX.

#### Recommandation

**Option 2 sans ambiguïté pour le POC**, avec le snapshot (Option 3) en V2 si le besoin émerge.

C'est la seule option qui :

1. respecte le principe de factualité d'Albert tel qu'il existe aujourd'hui (le LLM **ne porte jamais de chiffres**),
2. produit un objet qui mérite le nom de « dashboard » au sens où il se rafraîchit,
3. permet le partage en toute sécurité,
4. rend l'édition conversationnelle bon marché.

#### Application stricte : le tool ne fait rien d'autre que valider

Le premier prototype (§5bis.2) a dérogé à cette recommandation : l'`execute` de `compose_dashboard` appelait les queries serveur et embarquait les données dans le `tool_result`. La V1 revient à une application stricte de l'Option 2, et cette application a des conséquences concrètes sur l'implémentation du tool :

- **Le tool `compose_dashboard` n'a pas de dépendances** (pas de `prisma`, pas de query, pas de use case injecté dans sa factory). Sa signature se limite à `{ habilitations }` — et encore, uniquement pour rejeter au plus tôt les `territoire_code` hors périmètre de l'utilisateur, pas pour lire des données.
- **Son `execute` est trivial** : il valide l'input via Zod (déjà fait par le AI SDK), vérifie que les `territoire_code` référencés sont accessibles à l'utilisateur, et renvoie la structure telle quelle accompagnée des `_output_instructions`. Pas de résolution de valeurs, pas de `KpiCardData`, pas de `TableauIndicateursData`, pas de `ListeChantiersAlerteData` dans le tool result.
- **Le type `ComposeDashboardOutput`** se simplifie à `{ titre, containers: Array<{ widgets: WidgetDefinition[] }>, _output_instructions }`. Plus aucun type `ResolvedWidget` qui combine définition + data.
- **Le registre d'adaptateurs React** est la seule pièce qui connaît les queries tRPC. Chaque adaptateur est un composant qui prend les **références** du widget (issues du tool result) et appelle la query correspondante via `api.useSuspenseQueries`, exactement comme `WidgetCartographieTA` le fait aujourd'hui au §3.2.2 de `_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx`. Un adaptateur est typiquement un wrapper de ~20 lignes autour d'un widget existant ou un petit composant KPI.
- **Un Suspense boundary unique** au niveau du `DashboardRender`, avec un fallback volontairement simple : un rectangle à la taille du dashboard avec un loader centré. On ne cherche pas à streamer widget par widget ni à dessiner un skeleton par type de widget — ce sont des raffinements coûteux en code pour un gain visuel marginal sur un POC. Tout le dashboard apparaît d'un coup quand toutes les queries sont résolues ; si ça devient perceptiblement lent sur certains cockpits, on introduira un Suspense par widget en V2.
- **Les erreurs de résolution** (référence invalide, habilitation refusée au moment de la lecture) sont gérées widget par widget via `ErrorBoundary`, sans casser le rendu global du dashboard. Cohérent avec le principe « habilitations vérifiées au rendu » du §7.5.

Conséquence sur le system prompt : la consigne du pattern (g) interdit explicitement à Albert de copier des valeurs chiffrées dans la définition (principe déjà en place). Conséquence sur la validation Zod : les champs texte de `widget_titre_section` (titre, description) sont lintés côté serveur pour rejeter les chiffres avec unité (`%`, points), comme déjà évoqué au §9.

Ce que cette réécriture **supprime** du prototype : les 577 lignes de `composeDashboard.ts` qui appelaient `GetChantiersEnRetardQuery`, `GetChantierIndicateursQuery`, `récupérerStatistiquesAvancementChantiersUseCase`, `agregerAvancementsChantiersUseCase`, etc. Ces appels sont replongés au niveau du widget React, qui bénéficie alors du cache tRPC, du batching, du prefetch et de l'auto-revalidation — exactement comme le reste de PILOTE.

### 7.7. Persistance

Une nouvelle entité `dashboard_albert` (ou nom équivalent) :

- `id`, `owner_id`, `titre`, `description`, `definition_json` (validé Zod), `cree_le`, `mis_a_jour_le`, `partage_avec` (ids utilisateurs ou rôle).
- Versioning simple : on garde les N dernières définitions pour permettre un undo conversationnel (« annule ta dernière modification »).
- Chargement : une page `/dashboards/[id]` qui rend la définition via le registre d'adaptateurs.

### 7.8. Édition itérative en conversation

Pour qu'Albert puisse modifier un dashboard existant, deux options :

- **Patch incrémental** — un outil `update_dashboard` qui prend un id et une description structurée des changements (`add_widget`, `remove_widget`, `update_filter`).
- **Rewrite complet** — Albert récupère la définition courante via `get_dashboard`, et appelle à nouveau `compose_dashboard` avec la version modifiée.

L'expérience montre que les LLMs sont meilleurs pour **réécrire un objet entier** que pour produire des patchs cohérents. Recommandation : commencer par le rewrite complet, ajouter le patch incrémental seulement si les coûts en tokens deviennent prohibitifs.

---

## 8. Flux d'interaction LLM ↔ utilisateur

L'enjeu central pointé par la demande initiale : *« comment pousser le LLM à produire un dashboard utile sans qu'il ne se lance trop vite ni qu'il ne noie l'utilisateur sous les questions ? »*. Le retour d'expérience §5bis.3 a montré que le premier réflexe (« pose une question par paramètre manquant, puis reformule un plan, puis demande confirmation ») produit des conversations longues et irritantes. La V1 revient à un flux minimal en 2 tours.

### 8.1. Flux en 2 tours, pas en 4

1. **Demande initiale** — l'utilisateur exprime son besoin (« construis-moi un cockpit pour suivre la Bretagne »).
2. **Réponse unique d'Albert** — en **un seul message**, Albert :
   - annonce qu'il peut composer un dashboard et présente en 3-4 lignes les **widgets disponibles pertinents** au regard de la demande (pas tout le catalogue, une sélection raisonnée),
   - pose **une seule question ouverte** qui rassemble tous les paramètres manquants essentiels (typiquement : *« Quel territoire et quel jalon veux-tu suivre ? »*),
   - ne compose rien tant que le périmètre minimum (territoire + jalon) n'est pas connu.
3. **Composition directe** — dès que l'utilisateur répond, Albert appelle `compose_dashboard` **sans étape intermédiaire** de « plan + confirmation ». L'utilisateur voit immédiatement le dashboard rendu avec ses vraies données (fetch côté widget, cf. §7.6).
4. **Itération en conversation** — l'utilisateur ajuste (« enlève la carte », « ajoute le tableau des indicateurs de CH-014 », « passe en 2024 »). Albert rappelle `compose_dashboard` avec une définition complète modifiée. Le coût d'itération est **faible** : pas de re-fetch côté LLM, juste un nouveau JSON qui remplace l'ancien.

### 8.2. Pourquoi pas de phase « plan + confirmation » ?

Le prototype intégrait une étape explicite de reformulation en 3 lignes suivie d'une demande de confirmation textuelle avant tout appel au tool. Elle avait l'ambition d'être un garde-fou contre les compositions ratées. En pratique elle produit deux effets indésirables :

- **Elle double le nombre de tours** avant que l'utilisateur ne voie quoi que ce soit. Dans la majorité des cas, la composition que le LLM va produire est assez prévisible pour qu'une confirmation préalable soit du bruit.
- **Elle est inefficace comme garde-fou** parce que l'utilisateur valide du texte et pas une UI — le texte peut parfaitement décrire un dashboard qui, une fois rendu, ne correspond pas à ce qu'il attendait.

La correction directe sur le dashboard rendu (« remplace la carte par un tableau ») est plus naturelle et moins coûteuse que la validation préalable d'une description textuelle. Elle n'est possible que parce que la composition elle-même est bon marché : l'Option 2 du §7.6 garantit qu'un rewrite complet ne déclenche aucun appel de données par le LLM, donc aucune latence inutile.

### 8.3. Pattern (g) — Construction d'un tableau de bord (V1 simplifiée)

> **Déclencheur** : l'utilisateur demande de *construire*, *composer*, *assembler* ou *afficher* un tableau de bord, un cockpit, une vue personnalisée.
>
> 1. **Si le périmètre minimum est connu** (territoire ET jalon, soit par le contexte agent, soit par les tours précédents de la conversation) : appelle `compose_dashboard` directement avec une composition par défaut adaptée à la demande. Ne pose pas de question.
>
> 2. **Sinon** : réponds en **un seul message** qui combine (a) une phrase courte expliquant que tu vas composer un dashboard, (b) une liste nominale de 4-6 widgets disponibles pertinents au regard de la demande (pour informer le choix de l'utilisateur, pas pour lui demander de les choisir un par un), (c) **une seule question ouverte** pour récupérer le périmètre manquant. **N'enchaîne pas plusieurs questions**, même si plusieurs paramètres manquent — regroupe-les dans une seule formulation.
>
> 3. **Ne reformule pas de plan, ne demande pas de confirmation textuelle** avant de composer. Compose directement dès que le périmètre minimum est connu — l'utilisateur corrigera après coup sur le dashboard rendu.
>
> 4. **Ne commente pas le contenu chiffré** une fois le dashboard composé. Une phrase courte d'introduction suffit (*« Voici le dashboard demandé. »*).
>
> 5. **En cas d'itération** (« change le jalon », « enlève la carte », « ajoute une liste des chantiers en difficulté ») : rappelle `compose_dashboard` avec une nouvelle définition complète qui reprend les containers à conserver et applique les changements. Pas de patch incrémental, pas de question préalable.

### 8.4. Ce que le LLM décide seul

- **Le choix des widgets** à inclure par défaut pour une demande donnée. Un cockpit territoire est un assemblage connu — typiquement : un `widget_titre_section`, puis un container qui mélange un `widget_taux_avancement_territoire` et un `widget_nombre_chantiers_en_retard` (KPIs atomiques) avec un `widget_valeurs_remarquables_avancement` (distribution sur les sous-territoires), puis un container avec un `widget_cartographie_taux_avancement`, puis un container avec `widget_liste_chantiers_en_retard` et `widget_liste_chantiers_en_difficulte` côte à côte en largeur 6.
- L'ordre des containers, les largeurs de chaque widget dans les enums autorisés, les titres de section.
- L'ajout opportun d'un `widget_titre_section` pour structurer un dashboard volumineux.

### 8.5. Ce qui déclenche encore une question

- **Périmètre territorial manquant** et non déductible du contexte agent — question ouverte unique.
- **Jalon manquant** — intégré à la **même** question ouverte que le territoire.
- **Choix d'un chantier précis** quand l'utilisateur a demandé un focus chantier mais sans dire lequel. Dans ce cas, et dans ce cas uniquement, Albert peut utiliser `display_choices` pour lister les chantiers accessibles.

Tout le reste est décidé par le LLM. Si le résultat ne plaît pas, l'utilisateur le dit et Albert recompose — c'est le parti pris de la V1.

---

## 9. Sécurité, factualité et garde-fous

| Risque | Mitigation |
|---|---|
| LLM invente une référence (chantier inexistant, territoire fantôme) | Validation Zod au niveau du tool + vérification d'habilitation sur les `territoire_code` lors de l'appel de `compose_dashboard`. L'existence effective des chantiers / indicateurs / jalons est validée naturellement au moment du fetch côté widget : la query tRPC correspondante retourne une erreur, capturée par l'`ErrorBoundary` du widget concerné (cf. §12). |
| LLM embarque des valeurs chiffrées dans un `widget_titre_section` | Règle explicite dans le system prompt + linter automatique sur les champs `titre` et `description` (regex sur chiffres avec `%` ou `points`). Si détecté, le tool renvoie une erreur structurée pour forcer la réécriture. |
| Dashboard partagé révèle des données pour lesquelles le destinataire n'a pas les droits | Habilitations vérifiées **au rendu de chaque widget**, pas à la composition. Les widgets dont les références ne sont pas accessibles affichent un message « non autorisé ». |
| Surface d'attaque schéma | Schéma Zod strict (`.strict()` sur tous les objets), tests de parsing exhaustifs. Aucun champ libre côté layout (pas de `style`, pas de `className`). |
| Ratelimit / coût | Une composition de dashboard ≠ chaque ouverture du dashboard. Les queries de rendu sont les queries tRPC déjà existantes, donc pas d'inflation côté backend. |
| Le LLM appelle `compose_dashboard` trop tôt sans clarification | Pattern (g) + erreurs structurées en cas de paramètres manquants + (option) un compteur côté serveur qui rejette la composition si aucune question n'a été posée dans la conversation et que le contexte initial est ambigu. |

---

## 10. Métriques de succès du POC

À un mois après mise à disposition (panel restreint) :

- **Taux de complétion** : proportion de demandes initiales qui aboutissent à un dashboard persisté en moins de 6 tours conversationnels. Cible : ≥ 60 %.
- **Taux d'erreur de validation Zod** sur les appels `compose_dashboard` (corrigés ou non par retry agent). Cible : < 15 %.
- **Taux de réutilisation** : proportion de dashboards persistés rouverts au moins 1 fois dans la semaine suivante. Cible : ≥ 30 %.
- **NPS qualitatif** auprès du panel : 5 entretiens post-usage.
- **Détection de hallucinations** : 0 incident de valeur chiffrée embarquée par le LLM (vérifié sur un échantillon manuel).

---

## 11. Risques et questions ouvertes

- **Snapshot vs live** — faut-il pouvoir « figer » un dashboard à une date donnée pour archivage / preuve / présentation ? Si oui, comment cohabite la définition (références) avec un cache de valeurs ? À trancher.
- **Versioning conversationnel** — combien de versions garder ? Faut-il une vraie timeline d'éditions ou juste un undo de dernière action ?
- **Partage et droits** — un dashboard est-il personnel par défaut, partagé à une équipe, ou accessible à tout le monde ayant les droits sur les territoires concernés ? Modèle d'accès à clarifier avec le métier.
- **Sections nommées dans le layout** — §7.4 retient une grille 12 colonnes plate avec packing implicite. À valider en POC : faut-il introduire un niveau de « sections » nommées (titre + sous-grille) au-dessus, comme dans les patterns de synthèse actuels ? Décision à prendre au vu des premiers dashboards composés.
- **Export** — un dashboard doit-il être exportable en PDF (cohérence avec `export_rapport`) ? Si oui, est-ce le même flux ou un flux distinct ?
- **Multi-tenant LLM** — comment évite-t-on qu'un LLM coincé dans une boucle d'erreur Zod consomme tous les steps autorisés (`stepCountIs(50)`) ? Probablement : un budget dédié à la composition et un fallback texte explicatif si le budget est dépassé.
- **Glissement vers le no-code** — à mesure que le catalogue grossit, le risque est qu'on reconstruise un éditeur de dashboards classique mais piloté par chat. Faut-il à un moment exposer une UI d'édition manuelle complémentaire ? Hors POC mais à anticiper.
- **Évaluation continue** — peut-on réutiliser le harness `EvaluerChatUseCase` pour scorer la qualité des compositions sur un jeu de prompts de test ?

---

## 12. Périmètre du POC

### Inclus

- 1 outil Albert `compose_dashboard` **purement déclaratif** : validation Zod uniquement, vérification des habilitations territoriales sur les `territoire_code` référencés, et renvoi de la structure telle quelle comme tool result. **Aucun fetch de données côté tool, aucune query métier injectée dans sa factory.** Schéma couvrant le catalogue révisé §7.2 (12 widgets métier atomiques).
- **Toute la connaissance produit (catalogue, structure recommandée d'un cockpit, règles JSON strictes, exemples) vit dans la `description` du tool `compose_dashboard`.** Le système prompt ne contient aucune section dashboard — décision prise pendant l'implémentation pour éviter de dupliquer le savoir entre deux endroits visibles par le LLM (cf. `docs/LLM_DASHBOARD_ITERATION_2.md` §7 et §15.3).
- 1 nouvelle entité de persistance `dashboard_albert` minimale (sans partage, sans versioning).
- 1 registre d'adaptateurs React qui, à partir de la structure renvoyée par le tool, instancie le bon composant widget pour chaque entrée et lui passe les **références** (territoire, chantier, jalon, maille). **Chaque adaptateur fetch ses propres données** via les queries tRPC déjà en place, suivant le pattern `api.useSuspenseQueries` utilisé aujourd'hui par `WidgetCartographieTA` et les autres widgets de `_commons/Widget/*`.
- 1 moteur de layout en containers + grille 12 colonnes (cf. §7.4), chaque widget déclarant sa `default_width` et ses `allowed_widths` dans son schéma Zod.
- 1 `Suspense` boundary **unique** autour du `DashboardRender` avec un fallback simple (rectangle + loader centré). Pas de skeleton par widget, pas de rendu progressif — à réintroduire en V2 uniquement si la latence perçue devient un problème.
- 1 `ErrorBoundary` par widget, pour qu'un échec de résolution (référence invalide, habilitation refusée au rendu) n'empêche pas l'affichage des autres widgets.
- 1 affichage in-chat du dashboard fraîchement composé (réutilisation du pattern `BaseDisplayTool`).
- Réécriture complète sur édition (pas de patch incrémental).
- Feature flag dédié, ouvert d'abord à un panel restreint.

### Hors périmètre du POC

- Génération de widgets non prévus dans le catalogue §7.2.
- Widgets qui embarqueraient des valeurs issues d'agrégations côté serveur dans le tool result (c'est précisément ce qu'on sort du POC, cf. §5bis.2 et §7.6).
- Partage entre utilisateurs, gestion fine des droits.
- Versioning, undo conversationnel multi-étapes.
- Snapshots gelés (Option 3 du §7.6).
- Export PDF du dashboard.
- UI d'édition manuelle (drag & drop).
- Templates pré-câblés (option D) — à viser en V2.
- Patch incrémental (`update_dashboard`) — à viser en V2 uniquement si le coût du rewrite devient un problème.

---

## 13. Prochaines étapes proposées

1. **Atelier produit** (1 séance, ~1h) pour valider le catalogue de widgets initial avec le métier et les principes de §2.
2. **Spike technique** (~1 jour) pour tester la capacité d'`openweight-large` à produire un JSON conforme à un schéma Zod non trivial, en isolant la phase de composition (sans clarification, en injectant un contexte parfait). Mesure de H1.
3. **Atelier UX** (~1h) sur le flux conversationnel : maquettes des 4 phases (intention → clarification → plan → composition), validation du pattern (g).
4. **Décision Go / No-Go** sur la base de l'output du spike et de l'atelier produit.
5. **Si Go** — implémentation du périmètre §12, mise en place du feature flag, ouverture à un panel restreint, mesure des indicateurs de §10.

---

## Annexe — Pourquoi pas un MCP / un outil générique de viz ?

Plusieurs frameworks tiers proposent des « LLM-driven dashboards » génériques (ex : composants React qui acceptent une description JSON). Ils ne sont pas privilégiés ici parce que :

- ils ne connaissent pas le **modèle de données PILOTE** (chantier, indicateur, jalon, météo, médiane) et ne sauraient pas appliquer les habilitations,
- ils ne respecteraient pas la **charte DSFR** sans gros travail d'adaptation,
- ils déplaceraient la complexité dans une dépendance externe au lieu de la garder dans le module Albert qui est déjà bien structuré (CQRS, DI, queries typées),
- ils ne s'intégreraient pas naturellement à la boucle agent existante (`Albert.streamText`, tool parts du UI message, `_output_instructions`).

L'investissement supplémentaire pour construire le catalogue maison est, à l'échelle du POC, plus faible que l'effort d'intégration et de mise en conformité d'un framework tiers.
