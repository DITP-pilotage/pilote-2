# Assistant kpilote — moteur et première surface

Date : 2026-08-28 · Révisée le 2026-08-31
Épic : PIL-1684 · US couvertes : PIL-1706, PIL-1707 (partiel), PIL-1708, PIL-1709 (partiel), PIL-1710
Statut : proposition, à valider avant plan d'implémentation

## 1. Contexte

kpilote doit accueillir un assistant conversationnel. PILOTE PPG en exploite déjà un en
production — Albert — et son équipe a documenté sa propre rétrospective (`apps/pilote-ppg/prd/SYSTEM_PROMPT.md`,
`apps/pilote-ppg/docs/LLM_DASHBOARD_ITERATION_2.md`). Cette spec s'appuie sur ce retour
d'expérience plutôt que de repartir de zéro.

L'épic tel que rédigé est une coquille de refinement. La demande réelle est plus large que
« un chat » : un moteur unique atteignable depuis plusieurs points d'entrée — question libre
depuis la palette, question portant sur une entité désignée, question depuis la page courante,
synthèse de la page courante — et des réponses dont on peut remonter la source.

Le périmètre est découpé en trois sous-projets. **Cette spec couvre le premier.**

## 2. Périmètre

### Dans le périmètre

- Le moteur (`AssistantRuntime`) et le contrat de surface.
- Le registry d'outils : couche dérivée de l'OpenAPI + couche métier.
- Le typage des entrées et sorties d'outils, partagé entre le serveur et le front.
- La dérivation et l'émission des sources.
- **Une seule surface implémentée** : `ask-libre`, atteinte par `Tab` sur l'état initial de la palette `⌘K`.
- Le panneau de sources et la barre de retour utilisateur.
- La persistance (conversation + audit) et l'observabilité.

### Préparé, pas implémenté

`contexteEntiteSchema` — le contexte `focus` + `cadrage` que consommeront les trois surfaces
suivantes — est écrit et testé dès maintenant. C'est la seule pièce dont la forme était en doute :
une page peut porter une collection *vue pour un individu donné*, ce qu'un contexte mono-entité ne
sait pas exprimer. Le valider maintenant évite de renégocier le contrat quand la deuxième surface
arrivera.

Rien d'autre n'est écrit d'avance : pas de prompt de surface inutilisé, pas de branche de requête
sans consommateur. Les surfaces à venir sont documentées en commentaire à côté de `SURFACES`.

### Hors périmètre, traité dans les sous-projets suivants

- Sous-projet 2 : les surfaces `ask-entite` (entité désignée dans la palette), `ask-page` (entité
  de la route courante) et `synthese-page` (synthèse de la page courante).
- Sous-projet 3 : historique et reprise de conversation, conversation réduite intégrée à la page,
  export, vue d'administration.

### Explicitement hors d'atteinte, et il faut le dire

Reproduire la composition de tableaux de bord d'Albert suppose un catalogue de widgets nominaux
que kpilote n'a pas : son modèle `Widget` décrit une configuration de cartographie (`type`,
`joinKey` pour rattacher un individu à un polygone), et le front n'expose que `CarteFranceWidget`.
Construire ce catalogue est un projet en soi, pas une extension du moteur. Le design ne l'interdit
pas — il ne le rend pas gratuit non plus.

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
| D8 | **Pas de harnais d'évals.** L'observabilité du tour en tient lieu | Décision révisée — voir §12. Un jeu de cas fige une stratégie d'appel d'outils plutôt que de vérifier une réponse, et incite à ajuster le prompt pour faire passer le test. Les logs de tour donnent le même signal sur du trafic réel, sans cette incitation. |
| D9 | Entrées **et sorties** d'outils typées dans le contrat partagé | Chez ppg le rendu riche dépend de `PiloteUITools` ; sans lui, `part.output` est `unknown` et aucun outil produisant de l'interface n'est rendable. Le typage doit exister avant d'en avoir besoin, sinon il faut refondre le contrat. |
| D10 | La recherche d'entité **pré-filtre de façon déterministe** avant d'appeler le modèle | ppg injecte tout son catalogue dans le prompt — viable pour 60 chantiers, pas pour des centaines d'indicateurs. Coût, latence et précision se dégradent tous les trois. |
| D11 | Le registry reçoit sa fonction de requête par **injection** | Importer `@/app` depuis un outil crée un cycle et, en test, réintroduit `databaseContext` par-dessus la transaction de test — ce contre quoi `buildTestApp` met explicitement en garde. |

## 4. Architecture

### 4.1 `packages/kpilote-shared/src/assistant/` — le contrat

Source only, comme le reste du package. `ai` s'ajoute en `peerDependency` (usage type-only),
à côté de `zod`. Chaque module obtient son entrée dans `exports` du `package.json`.

```
assistant/
  sources.ts     types ReferenceSource / Source, extraction guidée par les clés
  surfaces.ts    SURFACES, contexteEntiteSchema, chatRequestSchema, modèles autorisés
  tools.ts       NOMS_OUTILS, schémas d'input, types d'output, KpiloteUITools, LIBELLES_OUTILS
  message.ts     KpiloteUIMessage
  feedback.ts    evaluerBodySchema, catégories de problème
```

`tools.ts` est la pièce qui supprime deux classes de bug observées chez ppg.

La première est la duplication : `AssistantMessageText.tsx` y déclare 7 noms d'outils quand la
route en expose 11, donc les pseudo-appels des 4 manquants ne sont pas filtrés ; `ToolCallIndicator.tsx`
duplique la même liste une troisième fois. Ici le nettoyage des pseudo-appels et les libellés se
dérivent du registre.

La seconde est l'absence de typage des sorties. `KpiloteUITools` associe à chaque nom d'outil son
type d'entrée et son type de sortie, et `KpiloteUIMessage` en dérive des parts discriminées : le
front peut écrire `part.type === 'tool-get_synthese_indicateur'` et lire `part.output` typé. Sans
ce paramètre, tout rendu autre que du texte est impossible — c'est exactement ce qui bloquerait
l'ajout d'un outil produisant de l'interface.

Les schémas d'input sont du zod : ils sont la source de vérité, le serveur les utilise tels quels
pour construire ses outils. Les types de sortie sont des types TypeScript : pour la couche métier
ils sont vérifiés à la compilation par l'annotation de retour d'`execute` ; pour la couche dérivée
ils reprennent le modèle de réponse documenté par la route, ce que les tests de route garantissent.

### 4.2 `apps/kpilote-api/src/assistant/` — le moteur

```
assistant/
  routes.ts                POST /assistant/chat, POST /assistant/conversations/{id}/evaluation
  runtime/modele.ts        provider et modèles autorisés
  runtime/AssistantRuntime.ts  orchestration d'un tour
  runtime/sources.ts       résolution des références en sources
  prompts/socle.ts         invariants
  prompts/runtime.ts       contexte du tour
  prompts/surfaces/askLibre.ts
  prompts/construireSystemPrompt.ts
  tools/deriverTool.ts     createRoute → tool
  tools/whitelist.ts       routes exposées et nom d'outil
  tools/metier/            recherche et synthèses
  tools/registry.ts        assemblage par surface
  commands/                enregistrerConversation.ts, evaluerReponse.ts
  evals/                   jeu de cas et exécuteur
```

Ajouter `"@/assistant/*": ["./src/assistant/*"]` dans `apps/kpilote-api/tsconfig.json` — le
mapping y est par dossier explicite, un nouveau sous-système ne résout pas sans.

`modele.ts` reprend `valeurImport/helpers/albert.ts` : `createOpenAI({ baseURL, apiKey })` et une
constante de modèle par défaut, surchargeable par requête depuis une liste fermée.

### 4.3 `apps/kpilote-webapp/src/assistant/` — les surfaces

Hook `useAssistant`, composants de rendu (message, indicateur d'appel d'outil, panneau de sources,
barre de retour), et un point d'entrée : une `CommandAction` « Demander à l'IA » sur l'état initial
de la palette, branchée sur le mécanisme `Tab` existant de `src/lib/commands/types.ts`.

Dépendances à ajouter : `ai`, `@ai-sdk/react`. La CSP autorise déjà `apiOrigin` dans `connectSrc`,
le flux SSE passe sans modification.

## 5. Le contrat de surface

Une surface = un identifiant, un contexte optionnel, une liste d'outils autorisés et une couche de
prompt. Les deux premiers sont partagés ; les deux derniers restent côté API — c'est du
comportement, pas du contrat.

```ts
// Une surface est un point d'entrée de l'assistant. L'appelant la DÉCLARE : le moteur ne
// déduit jamais l'intention du texte.
//
// À venir, chacune consommant contexteEntiteSchema :
// - 'ask-entite'    question portant sur une entité désignée dans la palette. Le focus est
//                   le sujet : l'assistant n'en sort pas sans y être invité.
// - 'ask-page'      question posée depuis une page. Le focus est le sujet PAR DÉFAUT, mais la
//                   question peut porter ailleurs.
// - 'synthese-page' synthèse de la page courante. Question pré-remplie par le front et envoyée
//                   comme message utilisateur : même endpoint, même transport, et la synthèse
//                   devient le premier tour d'une conversation qu'on peut poursuivre.
export const SURFACES = ['ask-libre'] as const
export type Surface = (typeof SURFACES)[number]

export const MODELES = ['openweight-large', 'openweight-medium'] as const

const referenceEntiteSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('indicateur'), publicId: indicateurPublicIdSchema }),
  z.object({ type: z.literal('collection'), publicId: collectionPublicIdSchema }),
  z.object({ type: z.literal('individu'), publicId: individuPublicIdSchema }),
  z.object({ type: z.literal('referentiel'), publicId: referentielPublicIdSchema }),
])

/**
 * Le contexte qu'une surface fournit au moteur.
 *
 * `focus` est le sujet ; `cadrage` sont les entités qui le restreignent. Une page peut porter
 * une collection VUE POUR un individu : focus = collection, cadrage = [individu]. Un contexte
 * mono-entité ne sait pas l'exprimer, d'où cette forme.
 */
export const contexteEntiteSchema = z.object({
  focus: referenceEntiteSchema,
  cadrage: z.array(referenceEntiteSchema).max(4).default([]),
})

export const chatRequestSchema = z.discriminatedUnion('surface', [
  z.object({
    surface: z.literal('ask-libre'),
    conversationId: z.uuid(),
    messages: z.array(z.unknown()),
    modele: z.enum(MODELES).optional(),
  }),
])
```

`modele` est exposé dès la v1. Sans ce levier, les évals mesurent un modèle que l'usage réel ne
confirme jamais — or on prévoit d'en changer.

C'est ce contrat qui remplace `detecteurIntention.ts` de ppg.

## 6. Le registry d'outils

### 6.1 Couche dérivée de l'OpenAPI

Les `createRoute` de kpilote-api portent déjà ce qu'il faut : une `description` rédigée pour être
lue (`GET /indicateurs` explique la pagination cursor-based et le rôle de `hasMore`), des schémas
`request.params` / `request.query` en zod, et un handler qui applique les droits.

Un outil dérivé rejoue en interne l'appel documenté. **La fonction de requête lui est injectée**,
elle n'est pas importée :

```ts
export type Requeteur = (url: string) => Promise<Response>

const deriverTool = ({ route }: EntreeWhitelist, requeteur: Requeteur) => tool({ … })
```

Deux raisons, toutes deux vérifiées. Importer `app` depuis `@/app` créerait un cycle, puisque
`@/app` monte les routes de l'assistant. Et surtout, en test, `buildTestApp` exclut délibérément
`databaseContext` — son commentaire dit qu'il « écraserait le contexte db transactionnel
d'`integrationTest` et rendrait les fixtures invisibles ». Un outil qui rappellerait le vrai `app`
réintroduirait ce middleware et ne verrait pas les fixtures de son propre test.

En production, le requêteur est `app.request` avec l'en-tête d'autorisation de l'appelant : pas de
socket, mais toute la chaîne de middlewares s'exécute, donc les habilitations s'appliquent et
l'outil ne peut pas voir plus que son appelant.

Le **nom** de l'outil est déclaré explicitement dans la whitelist à côté de la route. Une
dérivation automatique du nom depuis le chemin serait fragile pour un gain nul.

### 6.2 Couche métier

Écrite à la main. Son rôle est de **composer**, pas de réécrire l'API : la différence avec la
couche dérivée est le nombre d'appels qu'elle épargne au modèle.

**Les outils de synthèse** composent plusieurs requêtes en parallèle via le même requêteur : les
queries sous-jacentes prennent un `params` typé par leur schéma de query string, que reconstruire
à la main dupliquerait sans bénéfice. Une branche en échec devient `null` **avec sa raison**
plutôt qu'un `null` nu — sans quoi le modèle interprète l'absence comme « pas de données » là où
il s'agit d'un refus de droit.

**Les outils de recherche** résolvent un libellé approximatif vers des identifiants, en trois temps.

1. **Pré-filtre déterministe.** La requête est normalisée (minuscules, sans diacritiques), découpée
   en termes d'au moins trois caractères, les mots vides retirés. Chaque terme donne un appel
   `listIndicateurs({ recherche: terme, pageSize: 100 })` — le filtre `recherche` existe déjà et
   est documenté comme insensible à la casse sur le nom. L'union est dédoublonnée et classée par
   nombre de termes satisfaits.
2. **Court-circuit.** Zéro candidat après filtre et sans repli possible : on renvoie vide en
   disant pourquoi, sans appeler le modèle. Un seul candidat : on le renvoie directement. Ces deux
   cas couvrent une grande part des requêtes et ne coûtent aucun jeton.
3. **Classement par sous-modèle** sur les candidats restants, plafonnés à 60, suivi du filtrage
   contre le catalogue réellement récupéré.

**Le repli sémantique.** Le pré-filtre est un `LIKE` : il échoue précisément là où PPG brillait, sur
les acronymes — « les VSS » ne trouvera pas « violences sexistes et sexuelles ». Quand il ne ramène
rien, on retombe donc sur le catalogue complet, borné à 300 entrées, et l'événement est **journalisé
comme repli** pour qu'on mesure sa fréquence.

Au-delà de 300 entrées accessibles, on ne tronque pas : on renvoie explicitement que le catalogue
est trop large pour une recherche exhaustive et qu'il faut préciser la demande. Une troncature
silencieuse se lit comme un « rien trouvé », ce qui est un mensonge.

Convention de nommage : verbe anglais + entité française, comme le reste de kpilote.

- `search_indicateurs`, `search_collections`
- `get_synthese_indicateur`, `get_synthese_collection`

### 6.3 Ce que la surface `ask-libre` expose

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
`objectifs`, `synthese-individus`) **ne sont pas exposées** : les laisser disponibles offrirait au
modèle un chemin plus verbeux vers le même résultat, et c'est le risque identifié de l'approche
hybride. Elles restent dérivables, et le jeu d'évals dira si l'une manque.

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

Les identifiants collectés sont dédoublonnés puis résolus en lot pour obtenir libellé et
destination.

**Les quatre types sont résolus, pas seulement deux.** Indicateurs et collections pointent vers
leur page de détail. Individus et référentiels n'en ont pas dans le front : ils sont résolus pour
leur libellé et affichés **sans lien**. C'est délibéré — une réponse entièrement fondée sur des
individus afficherait sinon « aucune source », ce qui serait une régression visible contre la
promesse alors que la réponse est parfaitement sourcée.

`listCollectionsQuerySchema` ne porte pas de filtre `ids` là où `listIndicateursQuerySchema` en a
un. Cette asymétrie est une lacune de l'API, pas une décision : on ajoute `ids` aux collections par
symétrie plutôt que de contourner côté assistant.

La résolution repasse par les queries, donc par les filtres d'habilitation : **une source que
l'utilisateur ne peut pas lire disparaît du panneau**. Le sourcing est aussi un dernier filet de
sécurité.

Les sources partent dans le flux comme une part typée `data-sources`.

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

**Couche de surface** — politique de dialogue et politique de rendu, pour cette porte uniquement.
`PROMPTS_SURFACE` est un `Record<Surface, string>` : chaque surface ajoutée à `SURFACES` exige
son prompt à la compilation. Le compilateur tient la liste de ce qui reste à faire.

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

- **Format des identifiants** : les schémas d'entrée réutilisent les regex de
  `kpilote-shared/publicIds`. Un `IND-quarante-deux` est rejeté par zod, le SDK renvoie l'erreur au
  modèle qui corrige.
- **Identifiants hors droits** : traversent le filtre de permission de la query et ressortent vides.
  Pas de fuite, pas d'erreur exploitable pour énumérer.
- **Sorties de sous-modèle** : tout identifiant produit par `search_*` est filtré contre le
  catalogue réellement récupéré avant d'être renvoyé.
- **Borne d'exécution** : `stopWhen: stepCountIs(12)` pour `ask-libre`, `abortSignal` propagé.
  ppg est à 50, ce qui autorise une conversation à partir en vrille.
- **Pseudo-appels d'outil** : le nettoyage est alimenté par le registre partagé, donc il ne peut
  plus se désynchroniser.
- **Contextes ambiants pendant le flux** : les callbacks du flux s'exécutent **après** que le
  handler a rendu la `Response` et que la chaîne de middlewares s'est dénouée. Le principal et le
  client de base sont donc capturés avant, puis **rétablis explicitement** dans les callbacks —
  `runWithDb(prisma, () => runWithPrincipal(principal, …))`. Sans cela, la persistance et la
  résolution des sources dépendraient de la propagation de l'`AsyncLocalStorage` dans le moteur de
  flux, qui n'est pas garantie : on obtiendrait un `dbStore is empty` ou un `UnauthorizedError`
  levés dans le flux, par intermittence.

## 10. Persistance

Deux tables, deux usages — c'est l'ADR 0008 de ppg, et son raisonnement tient ici.

**`AssistantConversation`** — `id` (uuid), `utilisateurId`, `titre`, `surface`, `messages` (JSONB),
`contexte` (JSONB nullable), `createdAt`, `updatedAt`. Le blob complet des `KpiloteUIMessage[]` est
réécrit en upsert à chaque tour. Index sur `(utilisateurId, updatedAt DESC)` et sur `updatedAt`
pour la purge. Rétention 14 jours.

Les `parts` sont polymorphes et définies par le SDK : une table normalisée par message ne servirait
qu'à les re-sérialiser, et il n'y a pas de besoin de recherche plein texte.

**`AssistantAppel`** — audit brut, une ligne par tour : `conversationId`, `utilisateurId`, `modele`,
`surface`, `transcript` (JSONB), `inputTokens`, `outputTokens`, `dureeMs`, plus `evaluation` et
`categoriesProbleme` renseignés a posteriori. Alimente le suivi et le harnais d'évals.

`AssistantAppel.conversationId` référence `AssistantConversation.id` : **la conversation est
écrite avant l'appel**, dans cet ordre, sans quoi la contrainte de clé étrangère échoue au premier
tour.

Piège hérité de ppg à reproduire : sérialiser le transcript par aller-retour
`JSON.parse(JSON.stringify(…))`. Le sérialiseur de Prisma plante sur les schémas zod attachés aux
définitions d'outils présentes dans les parts.

## 11. Observabilité et retour utilisateur

Logs `pino` structurés sur le modèle de `valeurImport` :
`{ event: 'assistant.tour.done', conversationId, surface, modele, durationMs, inputTokens, outputTokens, outils }`.
Plus un événement dédié au repli sémantique de la recherche
(`{ event: 'assistant.recherche.repli', nbCandidatsPrefiltre, tailleCatalogue }`), pour mesurer si
le pré-filtre suffit.

Le module de retour de ppg est repris tel quel
(`apps/pilote-ppg/docs/superpowers/specs/2026-06-05-llm-module-feedback-utilisateur-design.md`) :
évaluation binaire, catégories multi-sélectionnables `PROBLEME_TECHNIQUE` / `INCOMPREHENSION` /
`SUGGESTION` / `AUTRE`, commentaire optionnel des deux côtés, obligatoire si `AUTRE` est cochée.
Écriture sur la dernière ligne `AssistantAppel` de la conversation.

## 12. Comment on saura que ça marche

**Décision révisée le 2026-09-02.** La v1 prévoyait un harnais d'évaluation — un jeu de cas
figés vérifiant les décisions d'outils. Il a été écrit, puis retiré avant la mise en revue.

### Pourquoi il a été retiré

Un cas d'éval de ce type affirme « pour cette question, appelle `search_indicateurs` puis
`get_synthese_indicateur` ». Ce n'est pas une vérification de la réponse, c'est le **gel d'une
stratégie**. Un meilleur modèle qui résoudrait l'entité autrement ferait échouer le test alors
qu'il ferait mieux — et la pente naturelle serait d'ajuster le prompt pour faire repasser le
test plutôt que pour mieux servir l'utilisateur.

À la relecture des huit cas écrits : deux portaient sur de la prose et ne prouvaient rien,
un doublonnait des tests déterministes existants (l'absence de fuite en sources est vérifiée
unitairement dans `resoudreSources`), et quatre figeaient une stratégie. Un seul gardait une
décision réelle — la préférence pour la synthèse composée, qui protège la whitelist resserrée.

### Ce qui le remplace

**L'observabilité du tour.** Chaque tour émet
`{ event: 'assistant.tour.done', conversationId, surface, modele, durationMs, inputTokens, outputTokens, outils }`.
La liste des outils appelés, la durée et les jetons suffisent à voir une régression
d'enchaînement — le modèle qui se met à faire quatre appels là où un suffisait — **sur du
trafic réel plutôt que sur sept prompts artificiels**, et sans avoir figé de stratégie.

**Le passage par les environnements.** Un changement de modèle traverse dev puis preprod,
essayé à la main avant d'atteindre la production.

**Le paramètre `modele` de la requête.** Il permet de faire tourner deux modèles côte à côte
sur les mêmes questions réelles, ce qui est une comparaison plus honnête qu'un score sur un
jeu fermé.

**Le retour utilisateur** (§11), qui reste le seul instrument capable d'attraper ce qu'aucun
test automatique ne voit : une réponse correcte mais mal formulée, ou des exemples inventés.

### Ce qu'on accepte de perdre

La capacité à répondre par un chiffre à « ce nouveau modèle est-il meilleur ? ». On y répondra
par l'essai en dev et par les retours, pas par un score. C'est un choix assumé : un score sur
un jeu fermé aurait donné une fausse assurance sur une question — la qualité conversationnelle
— qui ne se mesure pas ainsi.

## 13. Tests

**Unitaires** — extraction de sources, avec les cas pièges (`READ` et `PUBLIC` en valeurs de champs
non identifiants) ; forme du contexte composite `focus` + `cadrage` ; pré-filtre de recherche et
ses court-circuits ; composition du prompt par couches ; dérivation d'un outil depuis une
`createRoute` ; nettoyage des pseudo-appels.

**Intégration** — la route SSE avec le `MockLanguageModelV3` du SDK `ai` : pas d'appel réseau, on
vérifie l'orchestration, l'application des habilitations, l'émission des sources et la persistance
du tour. Les outils reçoivent le requêteur du test, donc voient les fixtures de leur transaction.

Tous les tests sont déterministes et tournent en CI. Rien ne dépend d'un appel à Albert.

Conformément à l'usage du projet, pas de plan de tests pour les composants front.

## 14. Points à trancher au démarrage de l'implémentation

- **Modèle du sous-agent de recherche** : le même que le modèle principal, ou `openweight-medium`
  qui suffirait à un classement. À essayer en dev ; par défaut, le même.
- **Seuil de rétention** : 14 jours repris de ppg. À confirmer côté DITP au regard des données
  personnelles contenues dans les transcripts.
- **Bornes de la recherche** : 60 candidats après pré-filtre, 300 entrées pour le repli sémantique.
  Ces valeurs sont des points de départ à ajuster une fois la taille réelle du parc connue et le
  taux de repli mesuré — l'événement `assistant.recherche.repli` le donne.
