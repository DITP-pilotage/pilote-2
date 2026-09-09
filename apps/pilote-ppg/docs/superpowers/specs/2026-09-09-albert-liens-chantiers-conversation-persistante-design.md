# Liens internes vers les chantiers et conversation Albert persistante — Design

Date : 2026-09-09
Tickets : PIL-1690, PIL-1693
Statut : À valider

## Contexte

Les réponses d'Albert citent des chantiers au format `CH-XXX — Nom du chantier`, imposé
par le system prompt (`systemPrompt.ts:262`), mais ces références restent du texte brut :
l'utilisateur doit rechercher le chantier à la main pour ouvrir sa fiche.

Les deux tickets forment un seul parcours : rendre ces citations cliquables (PIL-1693), et
faire survivre la conversation à la navigation qui s'ensuit (PIL-1690). Livrer le premier
sans le second dégraderait l'expérience — l'utilisateur perdrait son échange à chaque clic.

Trois contraintes du code actuel structurent le design :

1. **L'assistant n'existe que sur les pages d'accueil.** `BoutonSyntheseTerritoire` est
   monté par `BasePageAccueilLayout.tsx:201` et `PageAccueilLegacy.tsx:192`, et porte à la
   fois l'état d'ouverture, l'identifiant de conversation et la `ModalePleinEcran`
   (`BoutonSyntheseTerritoire.tsx:21-51`). Quitter l'accueil démonte l'ensemble.
2. **L'instance `Chat` du AI SDK vit à l'intérieur de `ChatUI`** (`ChatUI.tsx:58-68`, dans
   un `useRef`), et `ModalePleinEcran` s'appuie sur Radix `Dialog`, qui démonte ses enfants
   à la fermeture. Fermer la modale perd donc les messages en mémoire.
3. **La persistance serveur existe mais est conditionnée à un feature flag.**
   `route.ts:168-176` court-circuite `EnregistrerConversationUseCase` quand
   `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT` est faux.

## Objectifs

1. Rendre chaque chantier cité par Albert cliquable, sans qu'une URL puisse être produite
   par le modèle.
2. Conserver la conversation courante — identifiant, messages, contexte — lors d'une
   navigation interne, sous forme minimisée en bas à droite.
3. Restaurer la conversation à l'identique au clic sur le composant minimisé, et la
   conserver au fil des navigations successives.
4. Ne pas modifier le parcours d'ouverture/fermeture standard de l'assistant.

## Décisions structurantes

**D1 — L'instance `Chat` remonte dans un provider applicatif.** Le
`new Chat<PiloteUIMessage>()` sort de `ChatUI` et vit dans un provider monté sous
`MiseEnPage`. `ChatUI` reçoit l'instance en prop et redevient purement présentationnel.
L'objet `Chat` du AI SDK est conçu pour vivre hors du cycle React — c'est déjà ce que
`useChat({ chat })` consomme (`ChatUI.tsx:73-77`). Tout le reste (dock, restauration,
navigation) découle de ce déplacement.

**D2 — Tout `CH-XXX` cité devient un lien, à l'AST, sans whitelist.** Un plugin `remark`
transforme chaque identifiant reconnu en nœud `link`, l'URL étant construite par
l'application à partir de l'identifiant canonique — jamais par le modèle.

La protection contre un identifiant halluciné ou hors habilitation n'est pas assurée côté
client mais par la page de destination, qui se défend déjà seule :
`RecupererChantierUseCaseV2` appelle `vérifierLesHabilitationsEnLecture`, qui lève un
`ChantierNonAutoriséErreur` — un `ForbiddenError`, donc un `PiloteError` de statut 403 — que
le `getServerSideProps` de `chantier/[id]/[territoireCode].tsx` traduit en `notFound`
(`:281`). Un `CH-999` inventé et un chantier auquel l'utilisateur n'a pas droit aboutissent
donc au même 404 propre, jamais à une 500.

Une whitelist construite depuis les tool-outputs avait d'abord été retenue. Elle a été
abandonnée : elle ne pouvait couvrir que `get_chantiers`, `search_chantiers` et
`search_indicateurs`, si bien qu'un chantier cité après un simple
`get_chantier_commentaires` n'était pas lié. Et elle ne pouvait pas s'étendre à ce tool,
qui ne filtre que sur les territoires et réémet tel quel l'identifiant fourni par le
modèle — l'ajouter aurait blanchi une entrée du LLM en lien.

Ce que cette décision coûte, explicitement : le lien ne couvre plus que l'identifiant, la
source du nom ayant disparu, et l'URL ne peut plus retomber sur `NAT-FR` quand la maille du
territoire courant n'est pas applicable au chantier.

**D3 — `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT` ne pilote plus que l'affichage de l'historique.**
La persistance des conversations devient inconditionnelle. Le libellé admin du flag dit
déjà exactement cela — « Albert — historique des conversations »
(`VariableContenuDisponible.ts:181`) — et ne change pas.

---

## 1. Conversation persistante (PIL-1690)

### 1.1 Le provider

Un `AlbertConversationProvider` est monté dans `MiseEnPage`, au même niveau que
`PiedDePage`, à l'intérieur du `ClientOnly` existant. Il détient :

```ts
type AlbertConversation = {
  chat: Chat<PiloteUIMessage>;
  // Objet muté en place et référencé par le transport : porte agentContext et
  // le modèle sélectionné, que ChatInputForm peut changer en cours de conversation.
  requestBody: { agentContext?: Record<string, unknown>; model: AlbertModel };
  scenarios?: ChatScenarios;
};

type AlbertDisplay = "fullscreen" | "minimized";
```

et expose :

```ts
type AlbertConversationContextValue = {
  conversation: AlbertConversation | null;
  display: AlbertDisplay;
  open: (params: {
    agentContext: Record<string, unknown>;
    scenarios: ChatScenarios;
  }) => void;
  minimize: () => void;
  restore: () => void;
  close: () => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
};
```

Le provider **ne fait aucun contrôle d'accès et n'appelle pas `useEnv`**. C'est
volontaire : `useEnv` s'appuie sur `useSuspenseQuery` (`useEnv.ts:6-8`) et suspendrait
l'application entière au démarrage de chaque page. Le gating reste au point d'entrée —
une conversation ne peut exister que si l'utilisateur a pu ouvrir Albert, ce que
`useAskAIAccess` contrôle déjà en amont dans les layouts d'accueil.

### 1.2 Cycle de vie et transitions

L'affichage n'a pas d'état « fermé » : c'est `conversation === null` qui signifie qu'il n'y
a rien à montrer. Cela évite un état incohérent (fermé mais avec une conversation vivante).

| Déclencheur | Effet |
|---|---|
| `open()` depuis `BoutonSyntheseTerritoire` | Crée une conversation si `null`, sinon réutilise celle en cours → `fullscreen` |
| Clic sur un lien interne dans une réponse | `minimize()` puis `router.push(url)` |
| Clic sur le corps du dock | `restore()` → `fullscreen` |
| Clic sur la croix du dock | `close()` |
| Bouton « Réduire » de la modale | `minimize()` |
| Échap ou clic hors de la modale | `minimize()` |
| Bouton « Fermer » de la modale | `close()` |
| « + Nouvelle conversation » du drawer | `startNewConversation()` |
| Sélection dans le drawer | `selectConversation(id)` |

**Le bouton « Fermer » de la modale ferme bien la conversation**, il ne la minimized pas.
C'est le critère « le parcours standard d'ouverture/fermeture sans clic sur un lien reste
inchangé » de PIL-1690.

**En revanche, Échap et le clic hors de la modale réduisent au lieu de fermer.** Radix
déclenche `onOpenChange(false)` sur ces deux gestes comme sur le bouton « Fermer » ; une
touche Échap réflexe détruisait donc la conversation, récupérable seulement si le flag
d'historique est actif *et* qu'un tour s'est terminé. `ModalePleinEcran` reçoit une prop
requise `onMinimize` : elle affiche un bouton « Réduire » à côté de « Fermer » et
intercepte `onEscapeKeyDown` / `onInteractOutside` pour réduire. La prop est requise et
non optionnelle : la modale n'a qu'un consommateur, et une option non utilisée serait du
YAGNI.

Conséquence assumée : après un Échap, un dock apparaît là où rien n'était visible
auparavant. C'est le prix de la protection contre la perte accidentelle.

`close()` appelle `chat.stop()` si un flux est en cours, met `conversation` à `null` et
purge le sessionStorage. `startNewConversation()` et `selectConversation()`
font de même avant de construire la nouvelle instance.

### 1.3 L'overlay et le dock

Un composant `AlbertOverlay`, rendu par le provider, porte les deux vues :

- `display === "fullscreen"` → la `ModalePleinEcran` existante, avec le
  `ConversationHistoryDrawer` (si le flag d'historique est actif) et `ChatUI` ;
- `display === "minimized"` → le dock, en `position: fixed` bas-droite.

Le dock affiche une icône `SparklingIcon`, le libellé « Reprendre la conversation » et le
titre court dérivé de la conversation, obtenu en réutilisant `deriverTitre(messages)`
(`domain/ChatConversation.ts:17`) — la même fonction que celle qui produit le titre
persisté, donc un libellé identique entre le dock et le drawer d'historique. Il porte une
croix de fermeture distincte de la zone de restauration, avec des `aria-label` explicites
(« Reprendre la conversation » / « Fermer la conversation »).

**Collision à traiter** : le loader de navigation de `MiseEnPage.tsx:36` occupe déjà
`fixed right-16 bottom-16 z-[1751]`. Le dock doit se placer sans le recouvrir ni être
recouvert — c'est ce que vise le critère « ne masque pas les actions essentielles de la
page ». Le dock se positionnera plus bas et à droite du loader, avec un `z-index`
inférieur.

Le rendu du drawer est isolé dans un sous-composant, de sorte que l'appel `useEnv` qu'il
contient ne suspende que le contenu de la modale ouverte, jamais l'application.

### 1.4 Restauration après rechargement

Le sessionStorage porte le strict minimum, sous la clé `albert:conversation` :

```ts
{ id: string; agentContext: Record<string, unknown> }
```

Il est écrit par `minimize()` et purgé par `close()`. Les messages ne sont **pas**
dupliqués côté client : ils sont relus depuis la base.

Au montage, le provider lit le sessionStorage. S'il y trouve une entrée, il appelle
`trpcUtils.albert.conversations.recuperer.fetch({ id })` — un `fetch` impératif plutôt
qu'un `useQuery` avec `enabled` : la requête n'est émise que dans ce cas, et surtout on
évite un état intermédiaire « chargement en cours » doublé d'un effet de transfert vers
`setConversation`. `selectConversation` emprunte exactement le même chemin. En cas de succès, il reconstruit
l'instance `Chat` avec les messages récupérés et se place en `minimized`. En cas d'échec — la procédure résout sur `null` quand la conversation est absente,
purgée, ou qu'aucun tour ne s'est terminé, plutôt que de lever — il purge le sessionStorage
et n'affiche pas de dock — c'est le « repli explicite et sans erreur » du critère
d'acceptation.

Le `scenarios` n'est pas persisté : il n'alimente que l'état vide de `ChatEmptyState`, sans
objet pour une conversation qui a déjà des messages.

**Limite assumée** : la persistance n'a lieu qu'en fin de tour (`route.ts`, `onFinish`).
Minimiser pendant un streaming puis recharger perd le tour en cours. Le dock revient avec
les tours précédents, sans erreur.

### 1.5 Découplage du feature flag

- `route.ts:168-176` : suppression du court-circuit `if (!persistanceActive)`. La réponse
  passe toujours par `toUIMessageStreamResponse` avec `originalMessages` et le `onFinish`
  qui enregistre la conversation.
- `BoutonSyntheseTerritoire.tsx:22` : `ffHistorique` ne conditionne plus que le rendu du
  `ConversationHistoryDrawer`. Le `enabled:` de `conversations.recuperer` (`:34`) s'en
  découple — la restauration en a besoin, flag ou non.

Conséquence assumée : les conversations de tous les utilisateurs d'Albert sont désormais
persistées, pas seulement en environnement flaggé. Le garde-fou existe déjà et est
indépendant du flag — le cron `purge-conversations-albert` applique la rétention de 14
jours décrite par l'ADR 0008. Le coût signalé par cette ADR (réécriture du blob complet à
chaque tour) est désormais payé par tous ; à la volumétrie cible qu'elle documente
(~20 conversations/jour), il reste négligeable.

---

## 2. Liens internes vers les chantiers (PIL-1693)

### 2.1 Construction de l'URL

La destination est `/chantier/{id}/{territoireCode}?jalon={jalon}` — route existante
(`pages/chantier/[id]/[territoireCode].tsx`), `jalon` étant lu par
`loadChantierDetailSearchParams`. **L'identifiant utilisé est toujours l'identifiant
canonique** (`CH-` suivi des chiffres capturés), jamais la chaîne exacte écrite par le
modèle, dont la casse et le tiret varient.

`territoireCode` et `jalon` proviennent de l'`agentContext` de la conversation — le
contexte que l'utilisateur avait en tête en posant sa question, déjà transporté vers l'API
et persisté dans `contexte` (ADR 0008). C'est le sens du « territoire et jalon cohérents
avec la conversation » du ticket. À défaut de territoire dans le contexte, l'URL vise
`NAT-FR`.

`buildChantierUrl` ne dépendant que de l'`agentContext`, les options de linkification sont
mémorisées sur la seule conversation et non sur `messages` : elles ne sont pas recalculées
à chaque jeton pendant le streaming.

### 2.2 Plugin remark

Un plugin `remarkChantierLinks({ buildUrl })` parcourt l'arbre mdast et remplace, dans les
nœuds `text` uniquement, chaque identifiant reconnu par un nœud `link`. Travailler à l'AST
écarte gratuitement les cas que la réécriture de chaîne ferait rater : les blocs de code
(`code` et `inlineCode` ne sont pas de type `text`) et les liens existants (on ne descend
pas dans un nœud `link`).

Le lien couvre l'identifiant seul, pas le libellé qui le suit : sans whitelist, aucune
source ne permet de vérifier qu'un texte suivant est bien le nom du chantier.

Deux tolérances, parce qu'un modèle openweight n'est pas fiable sur la forme exacte :
l'identifiant est reconnu **sans tenir compte de la casse** (`CH-050`, `Ch-050`) et avec
n'importe quel tiret de la famille Unicode (`-`, `‐`, `‑`, `‒`, `–`, `—`, `−`). Ce dernier
point n'est pas théorique : sur une réponse réelle, le modèle écrit `CH‑173` avec un
NON-BREAKING HYPHEN (U+2011). Avec le seul trait d'union ASCII, aucun lien n'était produit.
Le texte affiché conserve la graphie du modèle ; seule l'URL utilise l'identifiant
canonique.

Les options sont exposées via un contexte dédié, `ChantierLinksContext`, et non via
`ChatContext` : celui-ci porte l'état de saisie et de flux (`sendMessage`, `status`,
`stop`), auquel les liens n'ont rien à voir.

**Aucune nouvelle dépendance.** `unist-util-visit` et `@types/mdast` ne sont pas
résolvables depuis l'application (pnpm strict n'expose que `remark-gfm`), et les faire
entrer comme dépendances directes pour une vingtaine de lignes n'en vaut pas le prix. Le
plugin fait sa propre descente récursive sur `children`, avec un type mdast minimal déclaré
localement pour les seuls nœuds manipulés (`text`, `link`, et les nœuds parents).

### 2.3 Interception du clic

`AssistantMessageText` fournit à `ReactMarkdown` un `components.a` personnalisé. Pour un
`href` interne (commençant par `/`), il rend un lien qui, au clic, appelle `minimize()`
puis `router.push(href)` — c'est le point de jonction entre les deux tickets. La navigation
reste dans le même onglet et côté client, donc `_app` n'est jamais démonté et le dock
survit sans dépendre d'aucune persistance. Les liens externes gardent le comportement par
défaut.

Le lien reste un vrai `<a href>` : clic-milieu, `Ctrl`/`Cmd`-clic et « ouvrir dans un
nouvel onglet » continuent de fonctionner, et seul le clic simple est intercepté.

---

## 3. Impacts par fichier

**Créés**

| Fichier | Rôle |
|---|---|
| `client/components/_commons/ChatUI/AlbertConversationProvider.tsx` | Provider : instance `Chat`, état d'affichage, sessionStorage |
| `client/components/_commons/ChatUI/AlbertOverlay.tsx` | Rendu modale ou dock selon l'affichage |
| `client/components/_commons/ChatUI/AlbertDock.tsx` | Composant minimisé bas-droite |
| `client/components/_commons/ChatUI/remarkChantierLinks.ts` | Plugin remark de linkification |
| `client/components/_commons/ChatUI/buildChantierUrl.ts` | URL depuis id canonique + agentContext |
| `client/components/_commons/ChatUI/createAlbertConversation.ts` | Fabrique l'instance `Chat` et son corps de requête |
| `client/components/_commons/ChatUI/minimizedConversationStorage.ts` | Lecture/écriture sessionStorage, validée par zod |
| `client/components/_commons/ChatUI/ChantierLinksContext.tsx` | Contexte dédié aux options de linkification |

**Modifiés**

| Fichier | Modification |
|---|---|
| `ChatUI.tsx` | L'instance `Chat` devient une prop ; options de linkification ; `onModelChange` mute `requestBody` |
| `ModalePleinEcran.tsx` | Prop `onMinimize` ; Échap et clic extérieur réduisent |
| `AssistantMessageText.tsx` | Plugin remark + `components.a` |
| `BoutonSyntheseTerritoire.tsx` | Réduit à un déclencheur appelant `open()` ; le flag ne pilote plus que le drawer |
| `MiseEnPage.tsx` | Monte le provider et l'overlay ; place le dock hors du loader |
| `app/api/albert/chat/route.ts` | Persistance inconditionnelle |

## 4. Stratégie de test

**Unitaires (`--project client`)** — le cœur de la logique est fait de fonctions pures,
testables sans rendu :

- `remarkChantierLinks` : identifiant transformé en lien, libellé qui suit laissé hors du
  lien, casse et tirets Unicode, plusieurs chantiers dans une phrase, nœuds imbriqués,
  code inline et liens existants préservés, texte sans identifiant laissé intact.
- `buildChantierUrl` : territoire et jalon de la conversation, repli `NAT-FR` sans
  territoire de contexte, jalon absent.
- `minimizedConversationStorage` : aller-retour d'écriture/lecture, absence, contenu
  invalide nettoyé.

**Pas de test de composant ni de test E2E.** Un test de rendu de `AssistantMessageText` et
un parcours Playwright avaient été écrits, puis retirés en revue. Ce qui n'est donc couvert
par aucun test : le câblage `[plugin, options]` au travers de `react-markdown`, l'ouverture
et la restauration du dock, et l'interception d'Échap par `ModalePleinEcran`. Ces points
relèvent d'une vérification manuelle.

## 5. Hors périmètre

- Le bouton d'ouverture d'Albert reste sur les pages d'accueil. Hors accueil, seul le dock
  est visible, et uniquement s'il existe une conversation.
- Les liens vers les indicateurs, territoires ou autres objets : le ticket cadre le premier
  cas sur les chantiers. Le plugin est paramétré pour être étendu, mais aucune autre
  entité n'est traitée ici.
- Le drawer d'historique reste derrière son feature flag, inchangé.
- Aucun changement de schéma de base ni de migration.

## 6. Alternatives écartées

**Garder `ChatUI` monté en permanence et le déplacer entre modale et dock.** Oblige à
contourner le démontage des enfants par Radix `Dialog`, et laisse un `ChatUI` vivant mais
caché sur toutes les pages.

**Sérialiser puis réinjecter les messages via `initialMessages` à chaque transition.**
Perdrait un streaming en cours et recréerait une instance `Chat` à chaque aller-retour, en
tension directe avec le critère « restaurer puis minimiser plusieurs fois ne duplique ni la
conversation ni les messages ».

**Réécrire la chaîne markdown avant `ReactMarkdown`** (la piste notée sur PIL-1693).
Linkifierait aussi à l'intérieur des blocs de code et des liens existants, là où l'AST
les écarte sans effort.

**Transformer le texte côté serveur, dans le flux.** On perdrait la main sur le clic — or
il faut minimiser la conversation avant de naviguer, ce qui est un comportement client.

**Stocker les messages en sessionStorage.** Survivrait au rechargement sans dépendre de la
base, mais dupliquerait la source de vérité et déposerait des données métier dans le
navigateur, alors que la persistance serveur existe déjà.

## 7. Risques et limites connues

- **Un lien peut mener à un 404.** Sans whitelist, un identifiant halluciné par le modèle
  produit un lien cliquable qui aboutit à la page « non trouvé ». C'est le compromis assumé
  par D2 : le coût est une navigation infructueuse, jamais une fuite de données ni une
  erreur serveur.
- **Le lien ne couvre que l'identifiant**, pas le libellé qui le suit. La zone cliquable est
  donc étroite, et le libellé du lien n'est pas compréhensible hors contexte — le critère
  d'acceptation correspondant de PIL-1693 n'est pas satisfait.
- **L'URL ne tient plus compte de `mailles_applicables`.** Si le territoire de la
  conversation n'est pas une maille de pilotage du chantier, la fiche s'ouvre avec des
  données vides ; le sélecteur de territoire y reste disponible.
- **La persistance en fin de tour** laisse le tour en cours hors de portée d'un
  rechargement (§1.4).
- **La persistance devient inconditionnelle**, avec le coût d'écriture que l'ADR 0008
  documente, désormais payé sur tous les environnements (§1.5).
- **Deux onglets sur la même conversation** peuvent s'écraser l'un l'autre. C'est la course
  déjà assumée par l'ADR 0008 ; le dock la rend un peu plus atteignable, sans la créer.
