# Assistant IA kpilote — refonte à partir des acquis de PILOTE PPG

Date : 2026-11-04 · Ticket : PIL-1684 · Branche : `feat/PIL-1684-assistant-design` (PR #2359)

## 1. Intention

La PR #2359 a posé un premier assistant kpilote fin août, puis le chantier s'est arrêté pour raison
métier. Pendant ce temps, l'assistant de PILOTE PPG (« Albert ») a beaucoup progressé : refonte du
prompt et des outils mesurée par evals (PIL-1900), centre d'aide, clarification par boutons,
périmètres, accès en base, Matomo, vues et dock (PR #2521, PIL-1940).

On reprend kpilote avec un objectif simple : **avoir PPG en mieux**. Toutes les fonctionnalités de
l'assistant PPG doivent exister dans kpilote, sur une base plus saine. L'agent doit être :

- **facile à faire évoluer** : ajouter un outil touche deux fichiers, pas sept ;
- **compréhensible** : un nouveau dev lit le moteur en une heure ;
- **performant** : bonnes réponses, peu d'étapes, prompt court.

Rien n'est mergé : on peut détruire ce qui ne sert pas cette cible.

## 2. Découpage en lots

Livraison en PR empilées (chaque branche part de la précédente). Ce document spécifie **le lot 1**
en détail ; les lots suivants auront chacun une spec courte au démarrage.

| Lot | Contenu | Référence PPG |
|---|---|---|
| **1. Moteur et chat de base** | refonte de #2359 : agent, outils, prompt, clarification, sécurité, chat façon PPG | PIL-1900, PIL-1855 |
| 2. Centre d'aide | sous-agent `consulter_centre_aide` sur les articles kpilote, encart | PIL-1863 |
| 3. Encarts synthèse / comparaison | rédaction streamée par sous-agent, copie, export markdown / PDF | PIL-1900, PIL-1859 |
| 4. Composition visuelle | tuiles (repart de `compose_view`), aligné sur `create_dashboard`, copie image | `create_dashboard` |
| 5. Vues et cycle de vie | pastille, plein écran / panneau / fenêtre, masquer-reprendre, historique, nouvelle conversation | PR #2521 (PIL-1940) |
| 6. Accès et administration | droits par profils et e-mails + coupure générale dans le panel admin, vue admin conversations + feedbacks | PIL-1871 |
| 7. Matomo | événements `assistant_ia` sur le tracker kpilote existant | PIL-1876 → 1879 |
| 8. Evalite | ticket séparé, branché sur `buildAgent` du lot 1 | PIL-1811 → 1816 |

**Porte d'entrée (décidé)** : la palette ⌘K reste l'entrée principale (« Demander à l'IA »). La
pastille du lot 5 sert seulement à ouvrir ou reprendre l'assistant ; elle ne prend pas ⌘K.

## 3. Objectifs, non-objectifs, anti-objectifs du lot 1

**Objectifs**
- Un moteur à deux couches, comme PPG : plomberie LLM d'un côté, configuration de l'agent de l'autre,
  avec un `buildAgent` unique consommé par la route (et demain par Evalite).
- Des outils écrits pour le modèle, déclarés à un seul endroit.
- La clarification par boutons de choix.
- Un chat qui se comporte comme celui de PPG (états, sources, choix, feedback).
- Les défauts de sécurité et de robustesse relevés sur #2359 corrigés.

**Non-objectifs (lot 1)** : centre d'aide, encarts, tuiles, vues multiples, historique, accès en
base, Matomo, evals. Le lot 1 doit cependant leur laisser la place (registre, types de parts,
contexte) sans refonte.

**Anti-objectifs** — serait un échec même si « ça marche » :
- réintroduire une détection d'intention par mots-clés ou des outils conditionnels (PPG l'a supprimée :
  elle retirait des outils au mauvais moment) ;
- des consignes dans les résultats d'outils (`_output_instructions`) ;
- un prompt monolithique qui regrossit (PPG : 631 → 174 lignes, 9,3k → 3,3k tokens, qualité en hausse) ;
- un agent qui voit plus que l'utilisateur ;
- des listes d'outils dupliquées qui divergent (PPG : `TOOL_NAMES` front incomplet, `compose_dashboard` mort mais câblé).

## 4. Ce qu'on détruit dans #2359

| Supprimé | Pourquoi |
|---|---|
| `tools/deriveTool.ts`, `tools/whitelist.ts`, `tools/fetcher.ts` et les `export` de `createRoute` ajoutés pour eux | Les outils dérivés renvoient le JSON de l'API (codes, pagination, champs inutiles) et des descriptions écrites pour des devs ; ils imposent l'import de côté `@hono/zod-openapi`, l'import dynamique de `../app` et une vérification JWT + lecture en base à chaque appel d'outil. Leçon PPG : la forme des données d'outil compte plus que le prompt. |
| La notion de **surface** (`SURFACES`, `TOOLS_BY_SURFACE`, `SURFACE_PROMPTS`, `ask-libre`) | Une seule porte d'entrée ; PPG expose tous les outils tout le temps. Remplacée par un **contexte de page typé** (§6.6). |
| `compose_view` et `tiles/` (front + shared) | Reportés au lot 4, réalignés sur `create_dashboard`. On les retire du lot 1 plutôt que de les garder à moitié branchés. |
| `ToolCallIndicator`, `SourcesPanel` actuels | Remplacés par le rendu PPG (§7). |
| `jest-extended` + `src/test/setup.ts` | Dépendance ajoutée pour 3 fichiers de test ; matchers vitest natifs. |
| Les 2 specs et 2 plans d'août (`docs/superpowers/{specs,plans}/2026-08-2*-assistant*`, `2026-08-31-assistant-*`) | Remplacés par ce document. |

`clearMocks: false` (commit post-rebase) reste : il corrige un vrai problème de vitest 5 avec les
tests concurrents de kpilote-api, indépendant de l'assistant.

**Conservé et repris** : la route SSE, l'historique relu côté serveur, la persistance
(`assistant_conversation`, `assistant_appel`) et le feedback cloisonné, le pré-filtre lexical de
recherche, l'extraction de sources par clés, `cleanPseudoCalls` / `flattenLatex`, le rendu markdown,
l'entrée ⌘K et `Modale size`.

## 5. Architecture du moteur (`apps/kpilote-api/src/assistant/`)

```
assistant/
  agent.ts               buildAgent({ principal, context, model }) → { system, tools, stopWhen, temperature }
  prompt/                systemPrompt.ts (+ glossaire, exemples), runtimeContext.ts
  tools/
    registry.ts          Record<ToolName, ToolFactory> exhaustif + enveloppe commune
    <un fichier par outil>.ts
    shared/              périmètre, résolution d'identifiants, libellés, bornes
  routes.ts              POST /assistant/chat, POST .../evaluation
  commands/ queries/     persistance conversation, feedback, purge
```

### 5.1 Plomberie LLM (`llm/albert.ts`)

Reprend `Albert.ts` de PPG, adapté :
- fabrique de modèle unique pour tout kpilote-api, dans `framework/llm/albert.ts` (fusion avec
  `valeurImport/helpers/albert.ts`, qui a la même responsabilité) ; modèles autorisés `openweight-large` (défaut) et `openweight-medium` ;
- `streamText` / `generateText` / `generateStructuredOutput` / `streamSubagentText` (celui-ci lit
  `fullStream` et lève sur `error`/`abort`, `textStream` avale les erreurs) ;
- `registerModelWrapper` global appliqué à **tous** les modèles, sous-agents compris (sert aux evals du lot 8) ;
- `convertToModelMessages(messages, { tools })` pour que `toModelOutput` s'applique à l'historique ;
- usage lu sur la **dernière étape** (`ai` v7 cumule `usage`) ;
- **amélioration sur PPG** : chaque appel LLM, sous-agents compris, est tracé (modèle, tokens, durée,
  appel parent) — PPG ne trace pas ses sous-agents. Le classement de recherche utilise le **modèle du tour**.

### 5.2 Configuration de l'agent (`agent.ts`)

`buildAgent({ principal, context, model })` renvoie tout ce qui définit l'agent : prompt système,
`ToolSet`, `stopWhen`, température. La route l'utilise avec `streamText`, Evalite l'utilisera avec
`generateText` : **une eval mesure l'agent de production** (pattern central de PPG).

- Tous les outils sont toujours exposés.
- `stopWhen: [stepCountIs(MAX_STEPS), hasToolCall('clarify_with_choices')]`. `MAX_STEPS` autour de
  15 (PPG 50, #2359 12) : valeur laissée au builder, à documenter.
- Température 0,2 (conversation), 0 (sorties structurées).

### 5.3 Contrat partagé et registre (ajouter un outil = 2 fichiers)

**`packages/kpilote-shared/src/assistant/tools.ts`** — la seule liste :

```ts
export const TOOLS = {
  search_indicateurs: { label: "Recherche d'indicateurs", kind: 'source', input: searchInputSchema },
  clarify_with_choices: { label: 'Question de précision', kind: 'interface', input: clarifyInputSchema },
  …
} as const satisfies Record<string, ToolContract>
export type ToolName = keyof typeof TOOLS
export interface ToolOutputs { search_indicateurs: SearchOutput; … }   // une entrée par outil, forcée
export type KpiloteUITools = { [K in ToolName]: { input: z.input<(typeof TOOLS)[K]['input']>; output: ToolOutputs[K] } }
```

- `kind` pilote le rendu front : `source` (pastille dans « N sources consultées »), `interface`
  (choix ; plus tard encart, tuiles), `help` (centre d'aide, lot 2).
- Le front dérive pastilles, libellés et `cleanPseudoCalls` de `TOOLS` : plus aucune liste à la main.
- Une garde de compilation vérifie que `ToolOutputs` et `TOOLS` ont exactement les mêmes clés.

**`apps/kpilote-api/src/assistant/tools/registry.ts`** — `TOOL_FACTORIES: Record<ToolName, ToolFactory>`.
L'enveloppe commune du registre :
- exécute chaque `execute` dans le contexte ambiant du principal (`runWithDb` + `runWithPrincipal`) —
  plus d'incohérence ALS : les queries appliquent leurs filtres de permission comme pour une route ;
- prend la description et le schéma d'entrée du contrat ;
- garde la mémoire des appels échoués à l'identique dans le tour (idée de #2359, à conserver) ;
- convertit une exception en `{ error }` lisible pour le modèle.

Ajouter un outil = une entrée dans `TOOLS` (+ son type de sortie) et un fichier dans `tools/`.

### 5.4 Conventions des outils (leçons PPG, bilan PIL-1900)

1. **Les données d'outil battent les règles de prompt.** On corrige d'abord ce que l'outil renvoie,
   puis sa description, puis une ligne de prompt, et en dernier on crée un outil.
2. **Description au même gabarit** : ce que l'outil renvoie, puces sur les champs de statut,
   `Utilise-le pour :`, `Ne l'utilise pas pour : <cas voisin> → <autre outil>`. Les `.describe` des
   paramètres donnent sens et défaut.
3. **Un canal par information** : une donnée n'arrive que par un outil (sinon le modèle s'arrête au premier).
4. **Libellés, jamais de codes** dans les sorties ; noms à côté des identifiants (`nom` + `id`).
   HTML saisi (commentaires) converti en texte.
5. **Statuts explicites** plutôt que listes vides ambiguës : `total` / `truncated`, `notFound`
   (identifiants inexistants **ou** non accessibles — l'API ne distingue pas, elle renvoie 404 :
   on ne promet pas au modèle une distinction qu'on ne sait pas faire), `needsClarification`.
   Clés techniques en anglais, termes métier en français (convention kpilote) ; les **valeurs**
   lues par le modèle sont en français.
6. **Bornes explicites** sur toute liste, annoncées dans la sortie.
7. **`toModelOutput`** quand l'interface a besoin de plus que le modèle.
8. **Enums, pas de `literal`/`const`** dans les schémas d'entrée (gpt-oss ignore `const` : 63/136
   appels inventaient le type chez PPG).
9. **Identifiants tolérants au parse** (`z.transform`) : casse, espaces, zéros (`ind 42` → `IND-42`).
   Attention : PR #2243 (slugs, PIL-1688) est ouverte ; la normalisation ne doit pas supposer le
   format `IND-\d+` et doit retomber sur une recherche insensible à la casse si le format change.
10. **Clés camelCase**, comme le reste de kpilote (choix du builder assumé ici).

### 5.5 Catalogue du lot 1

| Outil | Rôle | Notes |
|---|---|---|
| `search_indicateurs` | nom libre → ≤10 `{id, nom}` | pré-filtre lexical de #2359 **corrigé** : le repli catalogue pagine (bug : `pageSize 100` lisait 100 indicateurs et le garde-fou des 300 était mort), au-delà de la borne → `needsClarification`. Classement LLM seulement s'il reste plusieurs candidats. Requêtes légères (`id`, `nom`), pas `listIndicateurs` complet. |
| `search_collections` | idem pour les collections | même socle |
| `search_individus` | nom libre → ≤10 individus `{id, nom, referentiel}`, filtrable par référentiel | **manquait** : la donnée d'avancement est indexée par (entité, individu). **Générique** (décidé) : un individu kpilote peut être n'importe quoi — territoire, bassin versant, académie… et ça va évoluer. Même socle que les autres recherches (pré-filtre lexical en base, classement LLM s'il reste plusieurs candidats). Pas de table d'alias géographiques à la PPG. |
| `get_synthese_indicateur` | identité, unité, objectifs, taux de progression, valeurs remarquables pour un individu ou un périmètre | sans individu → `needsClarification` |
| `get_synthese_collection` | taux de progression et contributions d'une collection pour un individu | |
| `get_evolution_indicateur` | série de valeurs d'un indicateur pour un individu | bornée |
| `get_commentaires` | commentaires d'un indicateur × individu ou d'une collection, groupés et dédoublonnés comme PPG | HTML → texte |
| `clarify_with_choices` | `{ question, choices[{label, value}] (≥2) }`, écho | outil d'interface, arrête la boucle |

**Périmètre** : reprendre l'union discriminée de PPG adaptée aux référentiels kpilote, sans rien
supposer de géographique (`SELECTION` d'individus, `ENFANTS_DE` un individu via `Relation`,
`TOUT_LE_REFERENTIEL`), avec
`descriptionPerimetre` écrit une fois et `resoudrePerimetre` qui renvoie les individus résolus.
Le builder décide quels outils l'acceptent dès le lot 1 (au minimum les synthèses).

**Hallucinations** : tout identifiant produit par un sous-modèle est re-mappé sur la liste de
référence (`filtrerHallucinations` de PPG).

### 5.6 Prompt système

Structure PPG (rôle et périmètre → règles hiérarchisées → métier → méthode → rédaction → contexte),
gardée courte :
- **règles** numérotées avec la hiérarchie écrite une fois (règles > demande explicite > formats par défaut) ;
  factualité (tout chiffre vient d'un outil du tour), pas de LaTeX, pas de nom d'outil ni de lien dans le texte ;
- **métier** : court glossaire kpilote (indicateur, collection, référentiel, individu, valeur
  d'avancement, objectif, taux de progression, niveau de confiance). Le prompt parle d'« individus
  d'un référentiel », jamais de « territoires » en dur : les référentiels sont quelconques ;
- **méthode** : résolution des références, quand clarifier / quand ne pas clarifier (repris de PPG :
  un seul candidat, défaut applicable, oui/non, salutation → pas de clarification), une dizaine
  d'exemples « demande → appels » en prose ;
- **clarification** : appeler `clarify_with_choices` seul, sans texte avant (format harmony de
  gpt-oss : le texte final clôt le tour, 0/4 appels avec la consigne inverse chez PPG) ;
- **contexte** en fin de prompt, construit par le serveur (§6.6) ;
- `Reasoning: high` en tête (directive gpt-oss) — à réévaluer avec les evals du lot 8.

Un test vérifie que tout nom d'outil cité dans le prompt existe dans `TOOLS`.

## 6. Route, sécurité, persistance

### 6.1 Requête

`POST /assistant/chat` : `{ id: uuid, message, model?, context? }`. Le serveur :
- **valide le message entrant** : rôle `user`, parts `text` uniquement (bug #2359 : `z.unknown()` +
  `validateUIMessages` laissait passer un `system` ou un faux résultat d'outil, persisté ensuite) ;
- relit l'historique en base (propriétaire vérifié), ajoute le message, valide avec les outils ;
- `streamText` via `buildAgent`, puis `toUIMessageStreamResponse` avec `llmCallId`
  (= id de `assistant_appel`) dans `messageMetadata` ;
- `onError` francisé et journalisé (les erreurs du flux échappent au `catch`) — sans regex sur les
  messages d'erreur du SDK (fragile, #2359).

### 6.2 Persistance

- `assistant_conversation` (blob JSONB des messages, `contexte` réellement écrit) et `assistant_appel`
  (une ligne par tour : transcript, tokens de la dernière étape, durée, modèle, feedback).
- Appels des sous-agents tracés (§5.1) dans `assistant_sous_appel`, rattachés à leur
  `assistant_appel` ; collectés en mémoire pendant le tour et écrits avec lui.
- **Pas de purge** (décidé) : les conversations sont conservées, PPG a montré que le volume tient.
  Pas de cron de rétention. La FK `assistant_appel` → `assistant_conversation` garde
  `ON DELETE CASCADE` (une suppression ne peut être que volontaire) et son commentaire est aligné.

### 6.3 Feedback

Garder le cloisonnement de #2359 (seul le propriétaire note), mais **rattacher au `llmCallId`** que
le client reçoit, pas au « dernier appel ». Catégories PPG (4, `AUTRE` exige un commentaire).

### 6.4 Accès

Les droits se gèrent comme dans PPG (PIL-1871) : profils et e-mails autorisés, plus une coupure
générale, administrés dans le panel admin (décidé, lot 6). Le lot 1 pose seulement le point de
contrôle unique `checkAssistantAccess(principal)` appelé par la route et par l'entrée de palette
(via un endpoint `/assistant/acces` ou équivalent) ; le lot 6 y branche la règle en base. Choix du
builder assumé ici : d'ici là, la règle refuse les clés API (l'assistant est pour des humains) et
accepte les utilisateurs authentifiés — la pile étant mergée d'un coup, aucune garde temporaire
n'atteint la production.

### 6.5 Sources

Comme PPG : les sources sont les pastilles « N sources consultées », une par appel d'outil
`kind: 'source'` (§7). La part `data-sources` de #2359 (extraction des identifiants par clés,
résolution des libellés) est **supprimée** : elle doublait les pastilles. Les entités citées dans
le texte (`Libellé (IND-42)`) deviennent des liens internes, comme `remarkChantierLinks` chez PPG.

### 6.6 Contexte de page

Remplace les surfaces. Le client envoie un contexte **typé** (ex. `{ indicateurId?, collectionId?,
individuId? }` selon la page) ; le serveur vérifie les droits, résout les libellés et **écrit lui-même**
la phrase de contexte du prompt. Jamais d'instruction libre venue du client (dette PPG :
`agentContext.instructions`). Le lot 1 branche les pages indicateur et collection ; la liste exacte
des champs est au builder.

## 7. Front (`apps/kpilote-webapp/src/assistant/`)

**Principe décidé : copier les comportements PPG plutôt que les « améliorer »** — les utilisateurs
les aiment.

- **Signature + ligne d'état** : sous la signature, « réfléchit », « consulte les sources »,
  « rédige »… avec les trois carrés animés, dérivé de la dernière part (`deriverEtatAssistant` de PPG,
  libellés pilotés par `kind`).
- **« N sources consultées »** : une pastille par part d'outil `source`, état chargement / ✓ / erreur,
  une ouverte à la fois, détail **identique à PPG** : paramètres bruts (`query : …`) et
  « Voir la réponse brute » en JSON. C'est un outil de dev, il reste tel quel (décidé).
- **Boutons de choix** (`ChoicesInline`) sur le dernier message quand le statut est `ready` ; le clic
  envoie le libellé ; lien « Autre chose ? Écrire ma demande ».
- **Markdown** : `react-markdown` + `remark-gfm`, sauts de ligne PPG, `cleanPseudoCalls` (liste
  dérivée de `TOOLS`) et `flattenLatex`, liens internes vers indicateurs / collections.
- **Feedback** : modale PPG (positif / négatif avec catégories), envoi sur `llmCallId`, erreurs gérées.
- **Copier le texte** de la réponse.
- **Palette** : « Demander à l'IA » envoie directement la question saisie (aujourd'hui elle pré-remplit
  seulement) ; la conversation est **conservée** au retour vers la palette (aujourd'hui un nouvel uuid
  à chaque ouverture) ; le hook gère erreurs et retry (`regenerate`).
- Le conteneur reste la modale du lot 1 ; le lot 5 le remplacera par les trois vues de #2521.

Pas de plan de tests front (préférence du projet) ; tests unitaires sur la logique pure (dérivation
d'état, nettoyage, sources).

## 8. Tests du lot 1

- Unitaires : registre (exhaustivité, enveloppe, mémoire d'échecs), normalisation d'identifiants,
  périmètre, conventions de sortie de chaque outil (libellés, statuts, bornes), garde prompt ↔ `TOOLS`,
  validation du message entrant, extraction de sources, règle d'accès (clé API refusée).
- Intégration (base de test) : chaque outil sous deux principaux aux droits différents — **l'agent ne
  voit jamais plus que l'utilisateur** ; persistance et feedback cloisonnés.
- Un test de bout en bout de la route avec `MockLanguageModelV3` (promis par #2359, jamais écrit) :
  enchaînement d'outils, part de sources, persistance, arrêt après clarification.
- Aucun test ne dépend d'un appel réel à Albert ; la qualité conversationnelle est l'affaire du lot 8.

## 9. Laissé au builder

- Découpage interne des fichiers d'outils et des helpers partagés.
- `MAX_STEPS`, bornes exactes des listes.
- Champs exacts du contexte de page.
- Outils qui acceptent le périmètre dès le lot 1.
- Reprise ou non de la migration d'août telle quelle (aucune donnée en production : une migration
  unique propre est permise).
