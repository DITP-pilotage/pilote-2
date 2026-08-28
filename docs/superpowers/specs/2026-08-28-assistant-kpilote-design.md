# Assistant kpilote — moteur et première surface

Date : 2026-08-28
Épic : PIL-1684 · US couvertes : PIL-1706, PIL-1707 (partiel), PIL-1708, PIL-1709 (partiel), PIL-1710
Statut : proposition, à valider avant plan d'implémentation

## 1. Contexte

kpilote doit accueillir un assistant conversationnel. PILOTE PPG en exploite déjà un en
production — Albert — et son équipe a documenté sa propre rétrospective (`apps/pilote-ppg/prd/SYSTEM_PROMPT.md`,
`apps/pilote-ppg/docs/LLM_DASHBOARD_ITERATION_2.md`). Cette spec s'appuie sur ce retour
d'expérience plutôt que de repartir de zéro.

L'épic tel que rédigé est une coquille de refinement. La demande réelle est plus large que
« un chat » : un moteur unique atteignable depuis plusieurs points d'entrée — question libre
depuis la palette, question portant sur un résultat de recherche, synthèse de la page courante,
accès contextuel selon la route — et des réponses dont on peut remonter la source.

Le périmètre est découpé en trois sous-projets. **Cette spec couvre le premier.**

## 2. Périmètre

### Dans le périmètre

- Le moteur (`AssistantRuntime`) et le contrat de surface.
- Le registry d'outils : couche dérivée de l'OpenAPI + couche métier.
- La dérivation et l'émission des sources.
- La surface `ask-libre`, atteinte par `Tab` sur l'état initial de la palette `⌘K`.
- Le panneau de sources et la barre de retour utilisateur.
- La persistance (conversation + audit) et l'observabilité.
- Le harnais d'évaluation.

### Hors périmètre, traité dans les sous-projets suivants

- Sous-projet 2 : les surfaces `ask-entite` (résultat de palette), `synthese-page`, et l'accès
  contextuel par route.
- Sous-projet 3 : historique et reprise de conversation, conversation réduite intégrée à la page,
  export, vue d'administration.

### Contraintes actées

- **Provider** : Albert Etalab (`https://albert.api.etalab.gouv.fr/v1`), modèle en constante
  surchargeable par requête. Un changement de modèle est attendu ; le design ne doit pas en dépendre.
- **Le moteur vit dans `kpilote-api`**, le contrat dans `kpilote-shared`. L'API n'héberge donc pas
  de format de présentation : elle consomme un contrat, comme le front.

## 3. Décisions structurantes

| # | Décision | Motif |
|---|---|---|
| D1 | La surface est **déclarée par l'appelant**, jamais déduite du texte | ppg matche des mots-clés (`« vue »`, `« carte »`, `« affiche »`) pour activer des modes. Imprévisible et intestable. |
| D2 | La connaissance d'usage d'un outil vit dans sa **`description`**, pas dans le prompt système | Conclusion de ppg après refacto (commit `6138cbd69`) : DRY, localité au moment de la décision d'appel, et allègement du prompt envoyé à chaque tour. |
| D3 | Les outils sont **nominaux**, jamais paramétrés par un enum qui change leur nature | ppg §1.1 : `kpi_card` + `metric ∈ {…}` faisait confondre les métriques au modèle. Un enum ne peut porter qu'un périmètre. |
| D4 | Les outils renvoient des **références**, le rendu résout | ppg §1.2 : la factualité cesse d'être une consigne pour devenir structurellement garantie. Alimente aussi le sourcing. |
| D5 | Les habilitations sont **ambiantes**, jamais transmises à la main | `framework/auth/userContext.ts` porte le `Principal` dans un `AsyncLocalStorage` et les queries filtrent déjà. Un outil oublié ne peut pas fuiter. |
| D6 | Les sources sont **extraites par le moteur**, jamais citées par le modèle | Ni oubli ni invention possibles. Coût nul par outil ajouté. |
| D7 | Pas de `_output_instructions` | ppg mélange donnée et directive de rendu dans le même payload, d'où le conflit de priorité que son PRD documente. La politique de rendu appartient à la couche de surface. |
| D8 | Un harnais d'**évals** dès la v1 | ppg n'en a aucun et ne peut pas répondre à « ce modèle est-il meilleur ? ». On prévoit de changer de modèle. |

## 4. Architecture

### 4.1 `packages/kpilote-shared/src/assistant/` — le contrat

Source only, comme le reste du package. `ai` s'ajoute en `peerDependency` (usage type-only),
à côté de `zod`. Chaque module obtient son entrée dans `exports` du `package.json`.

```
assistant/
  surfaces.ts    identifiants de surface, schémas de contexte, schéma de requête
  tools.ts       noms des outils, schémas d'input, types d'output
  message.ts     KpiloteUIMessage
  sources.ts     type Source, regex d'identité, extraction
  feedback.ts    évaluation et catégories de problème
```

`tools.ts` est ce qui supprime une classe de bug observée chez ppg : `AssistantMessageText.tsx`
y déclare 7 noms d'outils quand la route en expose 11, donc les pseudo-appels des 4 manquants
ne sont pas filtrés ; `ToolCallIndicator.tsx` duplique la même liste une troisième fois. Ici,
le nettoyage des pseudo-appels et les libellés d'outil se dérivent du registre partagé.

### 4.2 `apps/kpilote-api/src/assistant/` — le moteur

```
assistant/
  routes.ts                POST /assistant/chat — valide et délègue
  runtime/
    AssistantRuntime.ts    compose le prompt, résout les outils, streame, émet les sources
    modele.ts              provider Albert + modèle configurable
    sources.ts             extraction et résolution des identifiants publics
  prompts/
    socle.ts               invariants
    surfaces/askLibre.ts   politique de dialogue et de rendu de la surface
    runtime.ts             contexte du tour
  tools/
    registry.ts            assemblage des deux couches
    derives/
      whitelist.ts         routes exposées + nom de l'outil associé
      deriverTool.ts       createRoute → tool
    metier/
      searchIndicateurs.ts searchCollections.ts
      getSyntheseIndicateur.ts getSyntheseCollection.ts
  commands/                enregistrerConversation.ts, evaluerReponse.ts
  queries/                 listerConversations.ts, recupererConversation.ts
```

Ajouter `"@/assistant/*": ["./src/assistant/*"]` dans `apps/kpilote-api/tsconfig.json` — le
mapping y est par dossier explicite, un nouveau sous-système ne résout pas sans.

`modele.ts` reprend `valeurImport/helpers/albert.ts` : `createOpenAI({ baseURL, apiKey })` et une
constante de modèle par défaut surchargeable. C'est le point de bascule quand un meilleur modèle
Etalab arrive.

### 4.3 `apps/kpilote-webapp/src/assistant/` — les surfaces

Hook `useAssistant` (`useChat` + `DefaultChatTransport`), composants de rendu (message, indicateur
d'appel d'outil, panneau de sources, barre de retour), et un point d'entrée par surface. Pour la v1 :
une `CommandAction` « Demander à l'IA » sur l'état initial de la palette, branchée sur le mécanisme
`Tab` existant de `src/lib/commands/types.ts`.

Dépendances à ajouter : `ai`, `@ai-sdk/react`. La CSP autorise déjà `apiOrigin` dans `connectSrc`,
le flux SSE passe sans modification.

## 5. Le contrat de surface

Une surface = un identifiant, un schéma de contexte, une liste d'outils autorisés. Les deux
premiers sont partagés ; la liste d'outils et le prompt restent côté API — c'est du comportement,
pas du contrat.

```ts
// kpilote-shared/src/assistant/surfaces.ts
export const chatRequestSchema = z.discriminatedUnion('surface', [
  z.object({
    surface: z.literal('ask-libre'),
    conversationId: z.uuid(),
    messages: z.array(z.unknown()),
  }),
])
```

L'union discriminée garantit qu'un couple surface/contexte incohérent est rejeté à la
compilation côté front et à la validation côté API. Les surfaces du sous-projet 2 s'ajoutent
comme branches supplémentaires, sans nouvelle route.

C'est ce qui remplace `detecteurIntention.ts` de ppg.

## 6. Le registry d'outils

### 6.1 Couche dérivée de l'OpenAPI

Les `createRoute` de kpilote-api portent déjà ce qu'il faut : une `description` rédigée pour être
lue (`GET /indicateurs` explique la pagination cursor-based et le rôle de `hasMore`), des schémas
`request.params` / `request.query` en zod, et un handler qui applique les droits.

```ts
const deriverTool = ({ route, nom }: EntreeWhitelist) => tool({
  description: route.description,
  inputSchema: fusionner(route.request?.params, route.request?.query),
  execute: async (params) => {
    const reponse = await app.request(construireUrl(route.path, params), {
      headers: { authorization: `Bearer ${jeton}` },
    })
    return reponse.json()
  },
})
```

`app.request()` est le mécanisme in-process de Hono : pas de socket, mais toute la chaîne de
middlewares s'exécute (`databaseContext`, `authContext`, `requireAuthentication`, puis les filtres
de permission des queries). Le jeton porteur est celui de la requête entrante, propagé par le
runtime.

Deux propriétés : la description et le schéma d'un outil suivent l'évolution de sa route sans
intervention, et aucun chemin ne permet à un outil dérivé de voir plus que son appelant.

Le **nom** de l'outil est déclaré explicitement dans la whitelist à côté de la route. Une
dérivation automatique du nom depuis le chemin serait fragile (singularisation) pour un gain nul.

### 6.2 Couche métier

Écrite à la main. Son rôle est de **composer**, pas de réécrire l'API : la différence avec la
couche dérivée est le nombre d'appels qu'elle épargne au modèle, pas son mode d'accès aux données.

Les outils de synthèse composent plusieurs `app.request()` en parallèle, comme la couche dérivée :
les queries sous-jacentes prennent un objet `params` typé par leur schéma de query string, que
reconstruire à la main dupliquerait sans bénéfice. Les outils de recherche, eux, appellent
`listIndicateurs` / `listCollections` directement, car ils ont besoin du catalogue complet plutôt
que d'une page.

Dans les deux cas les habilitations s'appliquent : par la chaîne de middlewares pour le premier
mode, par le `AsyncLocalStorage` du principal pour le second.

Convention de nommage : verbe anglais + entité française, comme le reste de kpilote.

- `search_indicateurs` — résout une requête en langage naturel vers des `IND-XXX`. Récupère le
  catalogue accessible (id + nom), délègue à un sous-modèle en sortie structurée, puis **filtre
  les résultats contre le catalogue réel** avant de renvoyer. C'est le pattern `filtrerHallucinations`
  de ppg, généralisé.
- `search_collections` — même mécanisme pour les `COL-XXX`.
- `get_synthese_indicateur` — compose en un appel ce que l'agent irait chercher en quatre :
  identité, taux de progression, valeurs remarquables, objectifs, synthèse par individu.
- `get_synthese_collection` — identité et taux de progression d'une collection.

### 6.3 Ce que la surface `ask-libre` expose en v1

Douze outils : les quatre métier ci-dessus, plus huit dérivés.

| Outil | Route |
|---|---|
| `get_indicateurs` | `GET /indicateurs` |
| `get_indicateur` | `GET /indicateurs/{id}` |
| `get_indicateur_valeurs` | `GET /indicateurs/{id}/valeurs` |
| `get_collections` | `GET /collections` |
| `get_collection` | `GET /collections/{id}` |
| `get_individu_dernieres_valeurs` | `GET /individus/{id}/dernieres-valeurs` |
| `get_referentiels` | `GET /referentiels` |
| `get_referentiel_individus` | `GET /referentiels/{id}/individus` |

Les routes que `get_synthese_indicateur` compose déjà (`taux-progression`, `valeurs-remarquables`,
`objectifs`, `synthese-individus`) **ne sont pas exposées** à cette surface : les laisser
disponibles offrirait au modèle un chemin plus verbeux vers le même résultat, et c'est le risque
identifié de l'approche hybride. Elles restent dérivables, et le jeu d'évals dira si l'une manque.

Les domaines `apiKey`, `feature`, `permission`, `utilisateur`, `me`, `whoami` et les brouillons de
commentaire ne sont dérivés dans aucune surface : ils relèvent de l'administration, pas de l'analyse.

## 7. Le sourcing

### 7.1 Extraction

À la fin du tour, le runtime parcourt les sorties d'outils et en extrait les identifiants publics.

**L'extraction est guidée par les clés, pas par les valeurs.** Tester toutes les chaînes contre
`individuPublicIdSchema` (`^[A-Z][A-Z0-9-]{0,19}$`) ramasserait `READ`, `PUBLIC`, `WRITE`. On ne
lit que les clés qui portent une identité — `publicId`, `id`, `indicateurId`, `collectionId`,
`referentielId`, `individuId` — et on valide la valeur contre la regex correspondante de
`kpilote-shared/publicIds`.

Les préfixes `IND-` / `COL-` / `REF-` / `WID-` lèvent l'ambiguïté de type. `individu` est le seul
format libre, et il n'est atteignable que par une clé qui le nomme.

### 7.2 Résolution et émission

Les identifiants collectés sont dédoublonnés puis résolus en batch par les queries existantes
(`listIndicateurs({ ids })`, `listCollections({ ids })`) pour obtenir libellé et route front.

Cette résolution repasse par les filtres d'habilitation : **une source que l'utilisateur ne peut
pas lire disparaît du panneau**. Le sourcing est aussi un dernier filet de sécurité.

Les sources partent dans le flux comme une part typée `data-sources`, écrite via le writer de
`createUIMessageStream` après fusion du flux de `streamText`.

## 8. La composition du prompt

```ts
const construireSystemPrompt = (surface, contexte) => [
  SOCLE,
  PROMPTS_SURFACE[surface],
  construireContexteRuntime(contexte),
].join('\n\n')
```

**Socle** — invariant, envoyé à chaque tour : identité, périmètre kpilote, interdiction d'inventer,
règle anti pseudo-appel d'outil, style de réponse. Quelques dizaines de lignes.

**Couche de surface** — politique de dialogue (quand demander une précision) et politique de rendu,
pour cette porte d'entrée uniquement.

**Couche runtime** — ce qui change au tour : date courante, contexte fourni par la surface.

### Ce qui n'y figure pas, et pourquoi

**Le glossaire métier.** ppg y consacre une soixantaine de lignes. Chez nous il vit déjà dans les
`.describe()` des schémas partagés et dans les `description` des routes — `individuPublicIdSchema`
donne son format et ses exemples, `mePermissionsApiModelSchema` explique la propagation des droits.
Le modèle le reçoit avec les outils, au moment pertinent. **C'est la réponse à PIL-1708** : le
vocabulaire n'est pas à rédiger, il est à ne pas dupliquer.

**Le périmètre accessible.** ppg injecte la hiérarchie territoriale complète à chaque tour ; son
propre PRD qualifie cela de mauvais usage du contexte. Un utilisateur kpilote peut avoir des
centaines d'indicateurs accessibles : on n'en injecte aucun, la résolution est le travail de
`search_indicateurs`.

**`Reasoning: high`.** ppg le porte en en-tête et son PRD recommande de le retirer faute de gain
mesuré. On ne l'ajoute pas.

## 9. Garde-fous

- **Format des identifiants** : les `inputSchema` réutilisent les regex de `kpilote-shared/publicIds`.
  Un `IND-quarante-deux` est rejeté par zod, le SDK renvoie l'erreur au modèle qui corrige.
- **Identifiants hors droits** : traversent le filtre de permission de la query et ressortent vides.
  Pas de fuite, pas d'erreur exploitable pour énumérer.
- **Sorties de sous-modèle** : tout identifiant produit par `search_*` est filtré contre le catalogue
  réellement récupéré avant d'être renvoyé.
- **Borne d'exécution** : `stopWhen: stepCountIs(12)` pour `ask-libre`, `abortSignal` propagé depuis
  la requête. ppg est à 50, ce qui autorise une conversation à partir en vrille.
- **Pseudo-appels d'outil** : les petits modèles recrachent parfois la syntaxe d'appel en texte.
  Le nettoyage repris de `stripPseudoToolCalls` est alimenté par le registre partagé, donc il ne
  peut plus se désynchroniser.

## 10. Persistance

Deux tables, deux usages — c'est l'ADR 0008 de ppg, et son raisonnement tient ici.

**`AssistantConversation`** — `id` (uuid), `utilisateurId`, `titre`, `messages` (JSONB), `surface`,
`contexte` (JSONB nullable), `createdAt`, `updatedAt`. Le blob complet des `KpiloteUIMessage[]` est
réécrit en upsert à chaque tour, via le `onFinish` de `toUIMessageStreamResponse`. Index sur
`(utilisateurId, updatedAt DESC)` et sur `updatedAt` pour la purge. Rétention 14 jours.

Les `parts` sont polymorphes et définies par le SDK : une table normalisée par message ne servirait
qu'à les re-sérialiser, et il n'y a pas de besoin de recherche plein texte.

**`AssistantAppel`** — audit brut, une ligne par tour : `conversationId`, `utilisateurId`, `modele`,
`surface`, `transcript` (JSONB), `inputTokens`, `outputTokens`, `dureeMs`, plus `evaluation` et
`categoriesProbleme` renseignés a posteriori. Alimente le suivi et le harnais d'évals.

Piège hérité de ppg à reproduire : sérialiser le transcript par aller-retour `JSON.parse(JSON.stringify(…))`.
Le sérialiseur de Prisma plante sur les schémas zod attachés aux outils.

## 11. Observabilité et retour utilisateur

Logs `pino` structurés sur le modèle de `valeurImport` :
`{ event: 'assistant.tour.done', conversationId, surface, durationMs, inputTokens, outputTokens, outils }`.

Le module de retour de ppg est repris tel quel (`apps/pilote-ppg/docs/superpowers/specs/2026-06-05-llm-module-feedback-utilisateur-design.md`) : évaluation binaire, catégories multi-sélectionnables `PROBLEME_TECHNIQUE` /
`INCOMPREHENSION` / `SUGGESTION` / `AUTRE`, commentaire optionnel des deux côtés, obligatoire si
`AUTRE` est cochée. Écriture sur la dernière ligne `AssistantAppel` de la conversation.

## 12. Évals

Un jeu de cas figés, versionné avec le code, exécuté par un script dédié (`pnpm eval`) et non par
la CI — pour ne pas taper Albert à chaque commit.

Le principe : **on n'évalue pas la prose, on évalue les décisions vérifiables.** Le texte d'un
modèle est instable et le noter demanderait un juge, donc du bruit. « Quel outil a-t-il appelé »,
« avec quels paramètres », « quelles sources a-t-il émises » sont des faits binaires, extraits du
transcript qu'on stocke déjà.

```ts
{
  question: "l'indicateur sur la fraude fiscale, il en est où ?",
  surface: 'ask-libre',
  attendu: {
    outilsAppeles: ['search_indicateurs', 'get_synthese_indicateur'],
    sourcesContiennent: ['IND-42'],
  },
}
```

Le jeu initial couvre : résolution d'entité depuis un libellé approximatif, question sur une entité
nommée explicitement, question hors périmètre (l'assistant doit le dire), question portant sur une
entité inaccessible (aucune fuite), et question ambiguë (l'assistant demande une précision).

C'est ce qui permettra de trancher un changement de modèle autrement qu'à l'intuition.

## 13. Tests

**Unitaires** — extraction de sources, avec les cas pièges (`READ` et `PUBLIC` en valeurs de champs
non identifiants, `publicId` valide sous une clé attendue) ; composition du prompt par couches ;
dérivation d'un outil depuis une `createRoute` ; nettoyage des pseudo-appels.

**Intégration** — la route SSE avec le `MockLanguageModelV3` du SDK `ai` : pas d'appel réseau, on
vérifie l'orchestration, l'application des habilitations, l'émission des sources et la persistance
du tour.

Conformément à l'usage du projet, pas de plan de tests pour les composants front.

## 14. Points à trancher au démarrage de l'implémentation

- **Modèle du sous-agent `search_*`** : le même que le modèle principal, ou un modèle plus léger
  d'Albert. À mesurer sur le jeu d'évals ; par défaut, le même.
- **Seuil de rétention** : 14 jours repris de ppg. À confirmer côté DITP au regard des données
  personnelles contenues dans les transcripts.
