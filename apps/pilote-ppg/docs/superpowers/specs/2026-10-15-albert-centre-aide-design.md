# L'assistant répond à partir du centre d'aide

Ticket : PIL-1863. Maquettes : https://claude.ai/artifact/Gfb2JDUgCywuzXbSwycLS3

## Objectif

Un utilisateur pose une question métier à l'assistant (« comment est calculé le
taux d'avancement ? », « comment importer mes mesures ? ») et reçoit une réponse
**fondée sur les pages publiées du centre d'aide**, avec un lien vers ces pages.
Si le centre d'aide ne permet pas de répondre, l'assistant le dit, n'affirme
rien, et oriente vers l'équipe PILOTE.

Critères d'acceptation du ticket :

1. Une question couverte par une page visible reçoit une réponse pertinente et
   un lien vers cette page.
2. Une question non couverte : l'assistant signale sa limite et n'affirme pas
   de réponse non étayée.
3. La mise à jour d'une page est prise en compte selon la fréquence retenue.
   **Fréquence retenue : immédiate.** Les pages sont lues en base à chaque
   appel, sans index ni cache.

## Décisions

- **Un sous-agent support exposé comme un outil** (`consulter_centre_aide`),
  sur le modèle des `search_*`. On a écarté deux alternatives :
  - deux outils de lecture branchés directement sur l'agent principal : le
    glossaire du prompt principal entre alors en concurrence avec le centre
    d'aide ;
  - un routeur LLM en amont vers deux agents : il ajoute de la latence à toutes
    les questions et casse le cas frontière aide / donnée.

  Le sous-agent ne voit que le centre d'aide, ce qui en fait sa seule source de
  vérité. L'agent principal garde la conversation et peut combiner la réponse
  avec les données.
- **Pas d'embeddings ni d'index.** Le corpus compte 53 articles, dont 43
  pages avec contenu (export du 2026-10-15). Le
  sous-agent choisit ses pages à partir d'un sommaire, puis les lit.
- **Les liens ne passent pas par le LLM.** L'interface rend un encart
  déterministe à partir des `sources` renvoyées par l'outil. Le texte de la
  réponse ne recopie pas de lien.
- **Le support passe par le bouton existant** `BoutonContacterEquipePilote`
  (`mailto:pilote.ditp@modernisation.gouv.fr`), réutilisé tel quel.

## Architecture

```
Agent principal (prompt actuel, glossaire inclus)
  └─ consulter_centre_aide({ question })
       ├─ GetSommaireCentreAideQuery ─┐
       ├─ 1. Sélection (LLM) ◄────────┘  question + sommaire → ≤ 3 ids
       ├─ GetPagesCentreAideQuery ────┐
       └─ 2. Réponse (LLM) ◄──────────┘  question + pages → { trouve, reponse, sourcesIds }
  ◄── { trouve, reponse, sources: [{ id, titre, chemin, url }], _output_instructions }

Interface : la part tool-consulter_centre_aide affiche l'encart des pages
(si trouve) ou l'encart support (sinon).
```

### 1. Données : module `parametrageCentreAide`

Le module n'exporte rien aujourd'hui (`NoExports`). Il exporte désormais deux
queries (type `ParametrageCentreAideExports`), et le module `albert` l'importe,
comme il importe déjà `chantiers`. Une query par besoin d'outil, comme dans
`ChantierExports`.

**Règle de visibilité : `pagesVisibles(articles)`**, une fonction pure dans
`parametrage-centre-aide/domain/`.

- Elle garde les articles `estPublie && !estMasque` **dont tous les ancêtres
  sont aussi publiés et non masqués**. C'est le comportement de la page
  publique (`PageCentreAidePilote.tsx`), mais appliqué côté serveur.
- Elle renvoie tous les articles visibles qui ont un `contenu`, groupes
  compris : un groupe avec contenu s'affiche comme une page
  (`estGroupeSansContenu` dans `PageCentreAidePilote`).
- Elle ne lit que les champs publiés : `titre`, `titreAffiche`, `contenu`.
  Les champs `*_brouillon` ne sortent jamais.
- Le titre retenu est `titreAffiche || titre` (un `titreAffiche` vide retombe
  sur `titre`, comme sur la page publique).
- L'ordre est celui de l'arbre (`ordre`, en profondeur d'abord).

**`GetSommaireCentreAideQuery.execute()`** renvoie
`{ id, titre, chemin, intertitres, url }[]` :

- `chemin` : la liste des titres des groupes ancêtres, de la racine vers la
  page.
- `intertitres` : les titres de tous niveaux du contenu, titres d'accordéon
  compris, sans doublon, extraits du markdown converti. Le centre d'aide réel
  structure ses pages en `h4` à `h6` (la FAQ pose ses questions en `h5`/`h6`) :
  se limiter aux niveaux 1 à 3 laissait 39 pages sur 43 sans intertitre.
- Le markdown est compacté pour le LLM : un `<br>` devient un simple retour,
  un `<br>` en tête de titre est ignoré, les lignes vides sont regroupées et
  le texte n'est pas échappé.
- `url` : `/centre-aide-pilote?article=<id>`.

**`GetPagesCentreAideQuery.execute({ ids })`** renvoie
`{ id, titre, chemin, url, contenuMarkdown }[]` pour les ids qui sont visibles.
Un id inconnu ou non visible est ignoré en silence : c'est l'appelant qui
compare.

**Conversion `convertirHtmlEnMarkdown(html)`**, avec `turndown` (nouvelle
dépendance) et des règles pour les blocs de l'éditeur
(`EditeurRiche/extensions/`) :

| Bloc | HTML | Markdown |
|---|---|---|
| Accordéon | `div[data-type="accordion-item"][data-title]` | titre `####` (texte de `data-title`) suivi du contenu, déplié |
| Callout | `div[data-type="callout"]` | citation `>` |
| Vidéo | `div[data-type="video"]`, `iframe` | `[Vidéo disponible sur la page]` |
| Image | `img` | `[Image : <alt>]`, ou `[Image disponible sur la page]` sans `alt` |
| Icône | `span[data-type="icone"]` | supprimée |

Les deux queries lisent la table à chaque appel, via le repository existant
(`lister()`). Pour une trentaine de lignes, ça ne pose pas de problème.

### 2. L'outil `consulter_centre_aide`

Fichier : `src/server/albert/tools/consulterCentreAide.ts`. Prompts des
sous-agents : `src/server/albert/subagents/centreAideSelectionSystemPrompt.ts`
et `centreAideReponseSystemPrompt.ts`.

**Entrée** : `{ question: string }`. La description de l'outil demande à l'agent
principal une **question autonome**, avec le contexte utile à la recherche :
« comment est calculé le taux d'avancement d'un indicateur » et non « comment
est calculé ce taux ». Les valeurs chiffrées de la conversation ne sont pas
transmises : le sous-agent ne traite pas les données.

**Description** (pour la sélection par l'agent principal). L'outil sert pour :

- les définitions de notions PILOTE (taux d'avancement, météo, jalon…) ;
- les méthodes de calcul ;
- les procédures (saisie, import, export des données, PVA, gestion des
  utilisateurs) ;
- le fonctionnement de l'outil.

Il ne sert pas pour une question sur les valeurs d'un chantier, d'un indicateur
ou d'un territoire.

**Pipeline**, en deux appels `Albert.generateStructuredOutput` (température 0),
sans boucle d'agent :

1. **Sélection.** Le prompt contient la question et le sommaire au format JSON.
   Le schéma de sortie est `{ ids: string[], reasoning: string }`, sans `max` :
   un sous-agent qui renverrait quatre ids ferait échouer la validation. Les
   ids qui ne sont pas dans le sommaire sont écartés avec
   `filtrerHallucinations`, puis on garde les 3 premiers. S'il ne reste aucun id, on renvoie `trouve: false`
   sans faire le second appel.
2. **Réponse.** Le prompt contient la question et les pages sélectionnées en
   markdown, chacune balisée avec son id. Le schéma de sortie est
   `{ trouve: boolean, reponse: string, sourcesIds: string[] }`. Les
   `sourcesIds` sont filtrés sur les pages fournies. Si `trouve` est vrai et
   qu'aucune source ne survit au filtre, on bascule en `trouve: false`.

Règles du prompt de réponse :

- ne répondre qu'avec le contenu des pages fournies ;
- ne rien ajouter de connaissances générales ;
- citer dans `sourcesIds` les pages réellement utilisées ;
- si les pages ne permettent pas de répondre, `trouve: false` et `reponse`
  vide ;
- rédiger en français, sans lien ni URL dans `reponse`.

**Sortie** :

```ts
type ConsulterCentreAideOutput = {
  trouve: boolean;
  reponse: string;
  sources: { id: string; titre: string; chemin: string[]; url: string }[];
  _output_instructions: string;
};
```

`_output_instructions` :

- **Si `trouve`** :
  - restituer fidèlement `reponse`, sans la compléter avec le glossaire ni
    d'autres connaissances ;
  - l'illustrer, si c'est utile, avec des valeurs déjà présentes dans la
    conversation ;
  - ne pas écrire de lien : les pages sont affichées sous la réponse.
- **Sinon** :
  - dire que le centre d'aide ne couvre pas la question ;
  - n'affirmer aucune réponse ;
  - indiquer que l'équipe PILOTE peut répondre : le bouton de contact est
    affiché sous la réponse.

**Erreurs** : une exception du sous-agent remonte comme une erreur d'outil
(`output-error`). Les règles actuelles du prompt (« Gestion des erreurs ») s'en
chargent, et aucun encart n'est affiché.

**Câblage** :

- `module.ts` (type et `asModuleFunction`) ;
- `AssistantIA.construireTools`, où l'outil est **toujours exposé**, sans
  capacity ;
- `PiloteUITools` dans `PiloteUIMessage.ts`.

### 3. Prompt principal (`systemPrompt.ts`)

- **`# Identité et périmètre`** : ajout de « Expliquer le fonctionnement de
  PILOTE et ses notions, à partir du centre d'aide ». La règle hors sujet
  reste la même.
- **Règle sur les PVA**, précisée : leur fonctionnement relève du centre d'aide
  (outil `consulter_centre_aide`), leur contenu reste indisponible.
- **Nouvelle section `## consulter_centre_aide`** dans le protocole
  d'utilisation des outils. Elle couvre :
  - quand l'appeler (définition, calcul, procédure, fonctionnement) ;
  - que, pour **expliquer** une notion à l'utilisateur, le centre d'aide prime
    sur le glossaire, qui sert à interpréter les résultats des outils ;
  - **le cas frontière** : « comment est calculé ce taux ? » après un
    affichage. On appelle l'outil avec une question autonome, puis on applique
    la définition aux valeurs déjà présentes dans la conversation. Pas de
    question de clarification par défaut, et pas d'outil de données en plus
    si les valeurs sont déjà là.
- **Le glossaire n'est pas modifié.**

### 4. Interface (`ChatUI`)

- **`SourcesConsultees`** : la puce « Centre d'aide ». On ajoute
  `tool-consulter_centre_aide` à `SourceToolPart` et à `LIBELLES`.
- **`deriverEtatAssistant`** : un nouvel état, `consulte-le-centre-d-aide`
  (« consulte le centre d'aide »), quand la dernière part est cet outil en
  cours.
- **Nouveau composant `CentreAideEncart.tsx`**, rendu dans
  `AssistantMessage` pour la part `tool-consulter_centre_aide` à l'état
  `output-available` :
  - **Si `trouve` et des sources** : un encart en cartes, sous le texte et
    au-dessus de Copier.
    - Titre : « Pour plus d'informations », avec une icône livre.
    - Une ligne par page : son chemin en gris au-dessus de son titre en bleu,
      et une flèche.
    - Un clic a le même comportement que les liens internes actuels
      (`MarkdownLink`) : navigation dans l'app et réduction du chat.
  - **Sinon** : l'encart support, avec une phrase d'accroche et
    `BoutonContacterEquipePilote`, importé depuis `PageAccueil/` comme le font
    déjà `EnTete` et `BaseNavigation`.
  - Les deux encarts sont marqués `markCopyableBlock("text")` : le bouton
    Copier les inclut, avec leurs liens.
- **Rendu de référence** : la variante « Cartes » des maquettes.

### 5. Tests et evals

**Tests unitaires** :

- `pagesVisibles` :
  - page publiée sous un groupe masqué ;
  - page publiée sous un groupe dépublié ;
  - champs de brouillon ignorés ;
  - un groupe avec contenu est une page ;
  - ordre de l'arbre.
- `convertirHtmlEnMarkdown` : un cas par bloc de l'éditeur, et l'extraction
  des intertitres.
- `consulterCentreAide`, avec `Albert.generateStructuredOutput` et les queries
  mockés :
  - ids hallucinés filtrés à la sélection et dans les sources ;
  - aucune page sélectionnée : `trouve: false` sans second appel ;
  - `trouve` sans source valide : `trouve: false` ;
  - construction des `sources` (titre, chemin, url).
- `deriverEtatAssistant` : le nouvel état.

**Tests d'intégration** des deux queries sur la base de test : filtrage et
absence des champs de brouillon dans la sortie.

**Evals de niveau 2**, nouveau dossier `evals/2-tools/2.4-centre-aide/consulterCentreAide.eval.ts` :

- **Positifs** : définition du taux d'avancement, sens de la météo, import des
  mesures, export des données, fonctionnement des PVA, gestion des
  utilisateurs.
- **Négatifs** (`forbidden`) : questions de données pures (« avancement de
  CH-007 en Bretagne », « chantiers en retard »).
- Le test central : l'agent principal **ne répond pas avec son glossaire** à
  une question de définition.

**Evals de niveau 3**, nouveau dossier `evals/3-scenarios/3.3-centre-aide/`. On
sème en base quelques pages visibles, une page masquée, un groupe dépublié
contenant une page publiée, et une page avec un brouillon. Les contenus
masqués et brouillons contiennent un marqueur unique.

- **Contrôles mécaniques** :
  - l'outil est appelé ;
  - les `sources` font partie des pages visibles semées ;
  - aucun marqueur de contenu masqué ou brouillon n'apparaît dans la réponse ;
  - la réponse ne contient pas d'URL ;
  - sur une question hors corpus, `trouve: false`.
- **Critères jugés** :
  - fidélité à `reponse`, sans ajout de l'agent principal ;
  - sur une question hors corpus, aucune affirmation et un renvoi vers
    l'équipe PILOTE ;
  - dans le cas frontière, la définition est appliquée aux valeurs de la
    conversation.

## Hors périmètre

- Les ancres vers une section précise d'une page (des ids sur les titres dans
  `RenduContenuHtml`, puis un défilement).
- L'audit de cohérence entre le glossaire et le centre d'aide, et l'analyse du
  lexique (points à arbitrer du ticket).
- La remontée aux admins des questions restées sans réponse.
- La route tRPC `parametrageCentreAide.lister`, qui expose les brouillons à tout
  utilisateur connecté : tâche séparée.

## Points d'attention

- **Cohabitation avec `clarify_with_choices`** (PIL-1855, mergée dans `dev`) :
  - dans `AssistantMessage`, les choix « ferment la réponse ». L'encart du
    centre d'aide se place donc sous le texte et **au-dessus** de
    `ChoicesInline`, qui reste le dernier élément ;
  - dans le prompt, la section `## clarify_with_choices` liste les cas où ne
    pas l'utiliser. On y ajoute le cas frontière aide / donnée, qui se traite
    avec `consulter_centre_aide` et non par une question de clarification.
- **Latence** : le sous-agent fait deux appels LLM. Le nouvel état de
  chargement rend l'attente visible. Si c'est trop lent, on pourra passer le
  sous-agent sur `openweight-medium`.
