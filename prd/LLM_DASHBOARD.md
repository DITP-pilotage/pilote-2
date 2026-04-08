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
- une **liste de widgets**, chacun étant une union discriminée par `type` (`kpi_card`, `bar_chart_ta_par_territoire`, `meteo_carte`, `liste_chantiers_alerte`, `tableau_indicateurs`, `comparaison_territoires`, …),
- pour chaque widget, ses **paramètres typés** (référence chantier, indicateur, jalon, dimension de découpage…) — **jamais de valeurs**.

Le frontend dispose d'un **registre d'adaptateurs React** : à chaque `type` de widget correspond un composant qui sait lire les paramètres et appeler la query backend correspondante (via tRPC, comme le reste de l'app).

- ✅ Cohérent avec l'architecture Albert : un outil de plus, validation Zod, rendu déclenché par un type de tool part.
- ✅ Garantit la factualité : les valeurs sont résolues côté serveur, le LLM ne touche jamais aux chiffres.
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

### 7.2. Catalogue de widgets (proposition initiale)

| Widget | Intention métier | Paramètres clés |
|---|---|---|
| `kpi_card` | « Une métrique clé en gros » (TA d'un territoire, médiane, nombre de chantiers en retard) | métrique, territoire, jalon |
| `tableau_indicateurs` | Reprend `ChantierIndicateursTable` existant | chantier, territoire |
| `liste_chantiers_alerte` | Liste compacte de chantiers en retard ou en difficulté | territoire, type d'alerte |
| `meteo_carte` | Carte de France colorée par météo pour un chantier | chantier, niveau de maille |
| `bar_chart_ta_par_territoire` | Comparaison du TA entre plusieurs territoires | liste de territoires, jalon, chantier ou agrégat |
| `evolution_ta` | Évolution du TA sur plusieurs jalons | territoire (ou chantier), liste de jalons |
| `comparaison_territoires` | Mini-tableau comparatif (TA, médiane, position) | liste de territoires, jalon |
| `texte_libre` | Bloc markdown pour titre / commentaire / contexte | contenu (texte produit par Albert, **pas de valeurs chiffrées**) |

Règle : tout widget qui affiche un chiffre doit pointer vers une query existante. `texte_libre` est explicitement contraint dans le system prompt à ne pas embarquer de chiffres.

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

### 7.4. Layout : grille, tailles et placement

Pour qu'un dashboard ait un rendu propre et lisible — et pour qu'Albert puisse raisonner sur la composition sans réinventer un moteur de mise en page à chaque appel — il faut un système de layout simple, prédictible, et **dont les contraintes sont connues du LLM**.

#### Grille 12 colonnes, packing implicite

Le système retenu est une **grille à 12 colonnes** (modèle DSFR, déjà utilisé partout dans PILOTE) sur laquelle les widgets se placent **dans l'ordre où le LLM les déclare**, en se déplaçant de gauche à droite et de haut en bas. Quand une rangée est pleine, on passe à la suivante. C'est exactement le comportement d'un `flex-wrap` ou d'un grid CSS auto-pack.

Le LLM n'a **jamais** à manipuler des coordonnées absolues (`col_start`, `row_start`). Il liste les widgets dans l'ordre désiré et le moteur de layout fait le reste. Cela élimine d'un coup deux familles d'erreurs : les chevauchements et les trous. C'est aussi un degré de liberté de moins à fiabiliser dans le schéma, donc moins de tokens, moins de validations, moins de retours d'erreur.

#### Chaque widget connaît sa taille

Dans la définition Zod du catalogue, chaque type de widget déclare :

- une **largeur par défaut** en colonnes de la grille (`default_width`),
- une **liste de largeurs autorisées** (`allowed_widths`), choisie dans un enum fermé (3, 4, 6, 8, 12).

Exemples plausibles, à valider en POC :

| Widget | `default_width` | `allowed_widths` | Justification |
|---|---|---|---|
| `kpi_card` | 3 | `[3, 4, 6]` | Petit, on peut en aligner 4 par rangée |
| `liste_chantiers_alerte` | 6 | `[6, 12]` | Liste verticale, demi ou pleine largeur |
| `tableau_indicateurs` | 12 | `[12]` | Beaucoup de colonnes, demande la pleine largeur |
| `comparaison_territoires` | 12 | `[8, 12]` | Tableau comparatif large |
| `bar_chart_ta_par_territoire` | 6 | `[6, 8, 12]` | Souple selon le nombre de barres |
| `evolution_ta` | 6 | `[6, 12]` | Graphique en ligne |
| `meteo_carte` | 6 | `[6, 8, 12]` | Carte SVG, lit mieux en grand |
| `texte_libre` | 12 | `[6, 12]` | Bloc texte / titre / commentaire |

Le LLM peut **choisir une largeur dans le set autorisé** pour chaque instance, via un champ `width` optionnel sur le widget. S'il ne le précise pas, on prend le `default_width`. S'il propose une largeur hors du set autorisé, la validation Zod renvoie une erreur structurée et l'agent corrige.

La **hauteur**, elle, est déterminée par le widget lui-même au rendu (auto-height à partir du contenu). Pas de paramètre `height` exposé au LLM dans la V1 — c'est un degré de liberté de moins, et 95 % des cas n'en ont pas besoin.

#### Le LLM doit *connaître* les tailles : où vit cette information ?

Pour que le LLM compose intelligemment (ne pas empiler 5 tableaux pleine largeur, savoir qu'il peut grouper 4 KPI cards sur une rangée), il doit **connaître à l'avance** la taille de chaque widget. Trois leviers à empiler :

1. **Description Zod** — chaque widget a un `.describe()` qui mentionne explicitement sa largeur par défaut et ses largeurs autorisées. Le AI SDK transmet ces descriptions au LLM via le schéma de l'outil, sans intervention supplémentaire.
2. **Section du system prompt** — le même tableau récapitulatif que ci-dessus est inclus dans le prompt, pour que le LLM puisse raisonner sur la composition avant d'écrire le JSON. Redondant avec les `.describe()` mais utile : le LLM voit la grille des tailles d'un coup d'œil.
3. **Heuristiques de mise en page** explicites dans le system prompt, par exemple :
   > *« Préfère regrouper les KPI cards en début de dashboard, 3 ou 4 par rangée. Les widgets pleine largeur (`tableau_indicateurs`, `comparaison_territoires`) viennent ensuite. Termine par les blocs `texte_libre` de commentaire. Évite plus de 2 widgets pleine largeur consécutifs sans rangée intermédiaire. »*

Ces heuristiques ne sont pas un schéma — ce sont des règles éditoriales que le LLM applique en best-effort. La validation Zod ne les fait pas respecter. C'est volontaire : on accepte une dérive minoritaire sur la mise en page parce que le coût d'erreur (un dashboard moins joli) est faible et qu'une grille rigide étoufferait l'inventivité dont on a besoin pour les cas complexes.

#### Sections nommées (à valider en POC, probablement V2)

Une variante consiste à structurer le dashboard en **sections nommées** (titre + grille interne) plutôt qu'en une seule grille continue, par analogie avec les patterns de synthèse actuels (`Chantiers en retard`, `Chantiers en difficulté`, etc.) dans `systemPrompt.ts`.

- ✅ Donne au LLM une dimension sémantique pour organiser un dashboard volumineux.
- ✅ Aide la lecture : le titre de section guide l'œil.
- ⚠️ Ajoute un niveau dans le schéma (`dashboard.sections[].widgets[]` au lieu de `dashboard.widgets[]`) et donc un niveau de raisonnement de plus pour le LLM.

Décision proposée pour le POC : **commencer sans sections**, et n'ajouter le niveau « section » que si les retours utilisateurs montrent que les dashboards à plus de 6-8 widgets deviennent illisibles. Cohérent avec le principe de minimalisme du POC. Le bloc `texte_libre` (largeur 12) joue déjà un rôle de séparateur sémantique léger en attendant.

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

Albert n'émet que des **références** (`{ type: "kpi_card", metric: "taux_avancement_global", territoire: "REG-53", jalon: 2025 }`). Au rendu, chaque adaptateur React appelle la query tRPC correspondante, exactement comme le ferait n'importe quelle page existante de PILOTE.

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

Conséquence pour le system prompt : la consigne du pattern (g) doit interdire explicitement à Albert de copier des valeurs chiffrées dans la définition. Conséquence pour la validation Zod : le champ `texte_libre.contenu` doit être linté côté serveur pour rejeter les chiffres avec unité (`%`, valeurs numériques en contexte de TA), comme déjà évoqué au §9.

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

L'enjeu central pointé par la demande initiale : *« comment pousser le LLM à poser assez de questions pour produire un dashboard utile ? »*

### 8.1. Quatre phases conversationnelles

1. **Intention** — l'utilisateur exprime son besoin (« je veux suivre mes chantiers prioritaires en région »).
2. **Clarification** — Albert identifie les **paramètres manquants obligatoires** et les pose. Pour chaque paramètre, soit `display_choices` (liste fermée), soit question ouverte.
3. **Plan** — Albert reformule en langage naturel ce qu'il s'apprête à composer, et **demande confirmation** avant d'appeler `compose_dashboard`. C'est un garde-fou contre les hallucinations structurelles : l'utilisateur peut corriger « non pas la météo, le TA » avant de payer le coût d'une composition complète.
4. **Composition + itération** — Albert appelle l'outil, le dashboard apparaît dans le chat (et est persisté). L'utilisateur ajuste en conversation (« remplace la carte par un graphique »). Albert réécrit la définition.

### 8.2. Comment forcer la phase de clarification

C'est la partie la plus délicate. Plusieurs leviers, à empiler :

- **Liste explicite de paramètres requis dans le system prompt**, par catégorie de dashboard. Exemple : *« Avant tout appel à compose_dashboard, tu DOIS connaître : (a) le périmètre territorial, (b) le jalon, (c) la liste des chantiers OU le critère de sélection automatique, (d) au moins un indicateur cible si l'utilisateur veut un suivi fin. Si l'un de ces paramètres manque, pose la question via display_choices ou en texte libre. »*
- **`_output_instructions` spécifique sur les outils de lecture** — quand Albert appelle `getTauxAvancementTerritoire` dans le contexte d'une composition de dashboard, l'instruction de sortie peut rappeler : « ces données serviront à composer un dashboard, ne les restitue pas en texte, demande à l'utilisateur quels indicateurs il souhaite mettre en avant ».
- **Validation Zod stricte côté serveur** — si le LLM tente d'appeler `compose_dashboard` avec un widget mal paramétré (ex : `kpi_card` sans `territoire_code`), l'erreur Zod est renvoyée comme tool result avec un message structuré, et la boucle agent demande au LLM de corriger. Cela transforme la rigueur du schéma en signal d'apprentissage en cours de session.
- **Pattern de workflow nommé** dans le system prompt, sur le modèle des patterns (a) à (f) actuels :
  > *Pattern (g) — Construction d'un tableau de bord*
  > 1. Identifier les paramètres manquants parmi {périmètre, jalon, chantiers, indicateurs}.
  > 2. Poser une question par paramètre manquant, via `display_choices` quand c'est une liste fermée.
  > 3. Reformuler le plan en 3 lignes maximum et demander confirmation textuelle.
  > 4. Appeler `compose_dashboard` une seule fois, avec la définition complète.
  > 5. Ne pas commenter le contenu chiffré du dashboard — il est rendu visuellement.
- **Templates de départ** — proposer immédiatement, dès qu'une intention floue est détectée, un `display_choices` avec 3 ou 4 dashboards pré-câblés (« cockpit territoire », « focus chantier », « comparaison »). Cela amorce la phase 2 sans imposer une longue série de questions.

### 8.3. Quand l'agent doit-il décider seul ?

Tout n'est pas à demander. Heuristique proposée :

- **Décide seul** : choix d'icônes, ordre d'affichage des widgets dans le layout par défaut, intitulés courts, choix d'une carte vs un graphique pour une donnée géographique.
- **Demande confirmation** : périmètre territorial (impact sur la lisibilité), liste des chantiers, jalon, indicateurs précis.
- **Bloque** : tout paramètre qui implique un accès à des données pour lesquelles il faut vérifier les habilitations — Albert doit alors appeler l'outil de lecture pour valider que le territoire / chantier est accessible avant d'inclure une référence dans le dashboard.

---

## 9. Sécurité, factualité et garde-fous

| Risque | Mitigation |
|---|---|
| LLM invente une référence (chantier inexistant, territoire fantôme) | Validation Zod + vérification d'existence côté serveur lors de la composition (lookup en base avant persistance). Réponse d'erreur structurée renvoyée comme tool result si la référence est invalide. |
| LLM embarque des valeurs chiffrées dans un `texte_libre` | Règle explicite dans le system prompt + linter automatique sur le contenu texte (regex sur chiffres avec %). Si détecté, renvoi d'une erreur structurée pour forcer la réécriture. |
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

- 1 nouvel outil Albert : `compose_dashboard`, avec un schéma Zod couvrant 4 à 5 types de widgets (`kpi_card`, `tableau_indicateurs`, `liste_chantiers_alerte`, `comparaison_territoires`, `meteo_carte`).
- Le pattern de workflow (g) ajouté au system prompt avec une liste explicite de paramètres requis et un protocole de clarification.
- 1 nouvelle entité de persistance `dashboard_albert` minimale (sans partage, sans versioning).
- 1 page de rendu de dashboard avec un registre d'adaptateurs React qui réutilise les composants `_commons` existants et appelle les queries tRPC déjà en place.
- 1 moteur de layout en grille 12 colonnes avec packing implicite (cf. §7.4), chaque widget déclarant sa `default_width` et ses `allowed_widths` dans son schéma Zod.
- 1 affichage in-chat du dashboard fraîchement composé (réutilisation du pattern `BaseDisplayTool`).
- Réécriture complète sur édition (pas de patch incrémental).
- Feature flag dédié, ouvert d'abord à un panel restreint.

### Hors périmètre du POC

- Génération de widgets non prévus dans le catalogue.
- Partage entre utilisateurs, gestion fine des droits.
- Versioning, undo conversationnel multi-étapes.
- Snapshots gelés.
- Export PDF du dashboard.
- UI d'édition manuelle (drag & drop).
- Templates pré-câblés (option D) — à viser en V2.

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
