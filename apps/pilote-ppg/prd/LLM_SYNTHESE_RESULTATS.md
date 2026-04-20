# Albert — Assistant d'analyse territoriale de PILOTE

Ce document décrit **Albert**, l'assistant LLM intégré à PILOTE : ses décisions produit, son architecture d'agent, l'outillage mis à sa disposition, et les mécanismes sous-jacents de calcul (TA sur un jalon, répartition territoriale) qu'il expose. Il remplace l'ancien document dédié uniquement au tool `get_taux_avancement_territoire`.

---

## 1. Vision produit

Albert est **l'assistant d'analyse territoriale** de PILOTE. Son rôle est d'aider un profil DITP / coordinateur / responsable à :

- comprendre rapidement l'état d'un territoire (TA, médiane, position),
- identifier les chantiers en retard ou en difficulté,
- comparer des territoires entre eux ou des jalons entre eux,
- produire un rapport structuré (Markdown ou PDF) réutilisable hors PILOTE.

**Positionnement** : Albert **ne formule pas d'opinion** et **n'invente jamais de données**. Il reste cantonné aux données des chantiers publiés visibles par l'utilisateur, et toute affirmation doit pouvoir être tracée à un appel d'outil. Les questions hors périmètre (culture générale, code, opinions) sont explicitement refusées par le system prompt.

**Activation** : l'accès est contrôlé par le feature flag `NEXT_PUBLIC_FF_ASK_AI` et reste ouvert par défaut aux profils `DITP_ADMIN`. Le bouton d'entrée est présent sur la page d'accueil d'un territoire (`BoutonSyntheseTerritoire`).

---

## 2. Décisions produit structurantes

### 2.1. Agent conversationnel à outils, pas un simple « prompt → réponse »

Le choix central est de construire Albert comme un **agent capable d'appeler plusieurs outils en plusieurs étapes**, piloté par la boucle de l'AI SDK (`aiStreamText` + `stopWhen: stepCountIs(50)`). Trois conséquences pratiques :

- **Pas de RAG monolithique** : chaque intention de l'utilisateur est résolue par un ou plusieurs appels d'outils typés (Zod), qui renvoient des données structurées. Le LLM n'a jamais à parcourir du texte libre pour trouver un chiffre : il demande explicitement l'indicateur dont il a besoin.
- **Appels d'outils parallèles encouragés** : le system prompt indique explicitement que plusieurs outils peuvent être appelés en parallèle, et définit des *patterns de workflow* (a → f) qui composent plusieurs outils pour répondre à une intention haute (« synthèse complète », « rapport complet », « classement par écart », etc.).
- **Ouverture à la multi-étape** : la limite `stepCountIs(50)` en streaming (et `stepCountIs(5)` pour les appels texte synchrones depuis tRPC) permet à l'agent d'enchaîner « récupération macro » → « drill-down par chantier » → « export ».

Cette architecture a été préférée à une approche monolithique « un prompt géant qui décrit tout » parce qu'elle :
- rend chaque morceau d'information **vérifiable** (on sait quel outil a été appelé avec quels paramètres),
- découple **le raisonnement** (modèle) de **l'accès aux données** (queries typées côté serveur), et donc permet de faire évoluer le modèle Albert sans toucher à la logique métier,
- permet d'afficher côté UI des **composants riches** à la place d'une simple bulle de texte (ex : tableau d'indicateurs, bouton de téléchargement de rapport).

### 2.2. Les outils sont construits autour des intentions utilisateur, pas des tables SQL

Le catalogue d'outils n'expose pas des opérations CRUD sur les tables PILOTE ; il expose **des réponses à des questions métier** directement interprétables par un non-technicien. Cinq outils de données :

| Tool | Intention métier |
|---|---|
| `get_taux_avancement_territoire` | « Quel est l'état d'un territoire et sa position par rapport à la médiane ? » |
| `get_chantiers_en_retard` | « Quels chantiers décrochent (critère quantitatif : écart <= -10 pts) ? » |
| `get_chantiers_en_difficulte` | « Quels chantiers sont en appui nécessaire (critère qualitatif : météo ORAGE/NUAGE) ? » |
| `get_chantier_indicateurs` | « Quelles sont les valeurs VI / VA / VC / TA d'un chantier sur un territoire ? » |
| `export_rapport` | « Télécharge-moi ce qui vient d'être analysé sous forme de document structuré. » |

Deux outils de présentation :

| Tool | Rôle |
|---|---|
| `display_choices` | Affiche un panneau de boutons cliquables dans l'UI pour les cas d'ambiguïté ou de drill-down proposé. |
| `export_rapport` | Double fonction : outil de données *et* déclencheur de composant UI (`ExportRapportDownload`). |

**Corollaire clé** : `get_chantiers_en_retard` et `get_chantiers_en_difficulte` sont **mutuellement exclusifs par construction**. Un chantier déjà classé « en retard » (critère numérique) n'apparaîtra jamais dans « en difficulté », même si sa météo est ORAGE. Cette règle métier est à la fois **encodée dans les queries SQL** (`GetChantiersEnDifficulteQuery` exclut les chantiers déjà retournés par `GetChantiersEnRetardQuery`) **et rappelée dans le system prompt**, pour que l'agent n'« invente » pas de chevauchement.

### 2.3. Combinaison d'outils dictée par le system prompt (pas par le code)

Plutôt que de coder une orchestration rigide côté serveur, la **combinaison d'outils est enseignée à Albert dans le system prompt**, via des *patterns de workflow* nommés :

- **(a) Synthèse complète d'un territoire** → 3 outils en parallèle (`get_taux_avancement_territoire` + `get_chantiers_en_retard` + `get_chantiers_en_difficulte`), avec un **gabarit de réponse unique** (mono-territoire ou comparaison) qui surcharge les `_output_instructions` individuels.
- **(b) Comparaison temporelle entre jalons** → même outil appelé plusieurs fois avec des jalons différents.
- **(c) Chantiers en retard/difficulté avec indicateurs** → synthèse de niveau 1 puis fan-out `get_chantier_indicateurs` par chantier, en parallèle.
- **(d) Rapport complet en une seule demande** → chaîne (a) + (c) avec `afficher=false` + `export_rapport`.
- **(e) Comparaison de départements pairs** → utilise la hiérarchie territoriale (injectée dans le prompt) pour résoudre les codes avant d'appeler les outils.
- **(f) Classement par écart** → un seul outil, mais avec une consigne de tri côté réponse.

L'avantage : ajouter un nouveau pattern = modifier le prompt (et éventuellement un outil), **sans toucher à la boucle agent**. L'inconvénient : le bon respect de ces patterns repose sur la qualité du modèle (d'où le choix de `openweight-large` par défaut, et `reasoning: high` en en-tête).

### 2.4. Canal de communication outil → modèle : `_output_instructions`

Chaque outil de données retourne, en plus de son payload, un champ **`_output_instructions`** : une directive en langage naturel indiquant comment formater la réponse finale (« paragraphe factuel pour un seul territoire, tableau pour plusieurs », « ne reproduis pas les valeurs des indicateurs dans ton texte, elles seront affichées dans un tableau dans l'UI », etc.).

Pourquoi ce choix :

- **Cohérence de présentation** sans centraliser toute la mise en forme dans le system prompt — chaque outil « sait » comment ses données doivent être restituées.
- **Supervision spécifique au contexte** : par exemple, `get_chantier_indicateurs` change ses instructions selon le paramètre `afficher`. Quand `afficher=true`, les instructions interdisent de reproduire les valeurs VI/VA/VC/TA en texte (un composant React les affichera ; c'est le rôle de `ChantierIndicateursTable`). Quand `afficher=false` (cas de l'export), les valeurs sont conservées pour nourrir le document final.
- **Hiérarchie claire** : le system prompt autorise explicitement à **ignorer** les `_output_instructions` individuelles dans le pattern (a), au profit d'un gabarit global mono_territoire / comparaison.

### 2.5. `display_choices` comme « retour à l'humain » structuré

Plutôt que de laisser l'agent produire des listes d'options en Markdown pur, il peut rendre un vrai composant UI cliquable via `display_choices`. Le prompt lui dit quand le faire (ambiguïté, drill-down, alerte) et lui impose une contrainte forte : **écrire d'abord le message textuel d'accompagnement, puis appeler `display_choices`**. Ce pattern est l'équivalent conversationnel d'un « quick reply » — il réduit les allers-retours en texte libre et rend le suivi de conversation plus prévisible.

### 2.6. `export_rapport` : tool + composant UI + stockage fichier

L'export est modélisé comme un **outil LLM** dont l'`execute` produit réellement le fichier (Markdown ou PDF) et le sauvegarde via `RapportFileStorage` (implémentation `FsRapportFileStorage` pour l'instant, remplaçable par un stockage objet). L'output de l'outil `{ url, format }` est ensuite rendu par le composant `ExportRapportDownload` côté client, qui affiche un bouton de téléchargement — pas un lien en Markdown.

Décision associée : **le modèle ne doit jamais fabriquer lui-même une URL** (règle explicite dans le prompt, renforcée par le fait que les URLs sont générées côté serveur). C'est une mesure anti-hallucination classique : toute URL affichée dans l'UI provient d'un tool call réel.

Le schéma `exportRapportInputSchema` force une structure forte (`titre`, `date`, `resume`, `sections[]` avec `parties[]` discriminées en `paragraphe` | `tableau`). Cette discipline de schéma :
- empêche l'agent de retourner un PDF « vrac »,
- permet de générer Markdown et PDF à partir de la même arborescence (`buildRapportMarkdown` et `genererRapportPDF`),
- rend le rapport **éditoriale-ready** (en-têtes de section, colonnes de tableau nommées).

### 2.7. Factualité et garde-fous

Le system prompt pose des **règles fondamentales** dont plusieurs sont produit, pas juste stylistiques :

- Aucune donnée inventée — si un outil renvoie vide, le dire explicitement.
- Condensation forcée des commentaires textuels issus des synthèses de résultats (1–2 phrases, pas de recopie in extenso).
- Pas de causalité ni de recommandation — Albert constate, il ne prescrit pas.
- Format imposé `CH-XXX — Nom` pour chaque chantier, codes `REG-XX` / `DEPT-XX` pour les territoires.
- Interdiction des tableaux pour les listes de chantiers dans la conversation (mais autorisés dans les rapports exportés et pour les comparaisons multi-territoires).

Ces règles sont **produit** parce qu'elles définissent la relation de confiance entre l'utilisateur et l'assistant : Albert est un *outil d'analyse*, pas un *conseiller*.

### 2.8. Contexte utilisateur injecté par l'UI (`agentContext`)

La page d'accueil d'un territoire passe, en plus du jalon courant, une `instructions` textuelle au système : `« Le territoire courant de l'utilisateur est {nomAffiché} (code : {territoireCode}). Utilise ce territoire par défaut… »`. Ce mécanisme permet de **contextualiser Albert à la page** sans réécrire le prompt :

- L'UI connaît le contexte (territoire ouvert, jalon sélectionné) ; elle l'injecte.
- Le prompt système prévoit une section `<contexte_utilisateur>` qui reçoit cette information et la contraint à rester subordonnée aux règles fondamentales.
- C'est le même endpoint `/api/albert/chat` qui est utilisé partout : l'adaptation à la page se fait uniquement via `agentContext`.

### 2.9. Scénarios pré-câblés dans l'UI

Dans `BoutonSyntheseTerritoire`, une liste de **scenarios** est affichée comme « exemples de questions » à l'utilisateur avant qu'il ne commence à taper. Deux modes :

- `mode: "send"` → envoie directement le message au chat,
- `mode: "fill"` → pré-remplit le champ pour que l'utilisateur complète (ex : « Compare {territoire} avec … »).

Décision UX : **ne pas laisser l'utilisateur face à un champ vide**. Les scénarios sont adaptés dynamiquement au territoire (région vs département) — par exemple, la comparaison « avec les autres départements de la région » n'apparaît que pour un département.

### 2.10. Choix du modèle et traçabilité

- **Modèle par défaut** : `openweight-large` servi par `albert.api.etalab.gouv.fr` (API Etalab). Le choix du provider est dicté par une contrainte produit : **Albert utilise des modèles souverains**. Deux modèles sont aujourd'hui exposés côté UI (`openweight-medium`, `openweight-large`), et le modèle par défaut est le grand.
- **Reasoning forcé** : l'en-tête `Reasoning: high` en première ligne du system prompt active le mode raisonnement du modèle.
- **Chaque appel est tracé** : `Albert.saveLlmCall` upsert dans `llm_calls` le transcript complet du tour à la fin de chaque appel (`onFinish`). Cela permet :
  - de **relire la trace** d'une conversation (outils appelés, arguments, sorties),
  - de **recueillir un feedback utilisateur** (tRPC `albert.evaluer`, enum `POSITIVE`/`NEGATIVE` + commentaire obligatoire pour le négatif),
  - de **mesurer la qualité** en aval via `EvaluerChatUseCase`.

### 2.11. Sécurité & habilitations

Toute exécution d'outil est **bornée aux territoires accessibles à l'utilisateur authentifié** :

- L'endpoint `/api/albert/chat` lit les habilitations depuis la session NextAuth et injecte `territoiresAccessibles` dans chaque factory d'outil.
- Chaque tool valide `input.territoire_code` contre `territoiresAccessibles` avant d'exécuter sa query ; un territoire hors périmètre lève immédiatement une erreur — **pas de contournement possible via le LLM**.
- Le prompt liste les territoires accessibles à l'utilisateur pour aider le modèle à ne pas inventer de codes, mais c'est une aide, pas une barrière de sécurité ; la barrière reste la vérification serveur.
- `get_taux_avancement_territoire` va plus loin : il filtre aussi la liste des chantiers autorisés via `Habilitation.récupérerListeChantiersIdsAccessiblesEnLecture()`.

---

## 3. Architecture technique

### 3.1. Vue d'ensemble

```
 ┌─────────────────────────┐           ┌────────────────────────────────┐
 │  UI (React / AI SDK)    │           │  /api/albert/chat (Next route) │
 │  ChatUI + scenarios +   │ ─stream─► │  - auth()                      │
 │  agentContext           │           │  - buildChatSystemPrompt()     │
 └─────────────────────────┘           │  - résout les factories outils │
            ▲                          │  - Albert.streamText(...)      │
            │ UIMessage stream         └───────────────┬────────────────┘
            │                                          │
            │                                          ▼
            │                           ┌──────────────────────────────┐
            │                           │  Albert (static)             │
            │                           │  - createOpenAI(albert api)  │
            │                           │  - aiStreamText(...)         │
            │                           │  - stopWhen: stepCountIs(50) │
            │                           │  - onFinish → llm_calls      │
            │                           └──────┬───────────────────────┘
            │                                  │ tool calls (ToolSet)
            │                                  ▼
            │           ┌─────────────────────────────────────────────┐
            │           │  Tools (ai.tool())                          │
            │           │  - get_taux_avancement_territoire           │
            │           │  - get_chantiers_en_retard                  │
            │           │  - get_chantiers_en_difficulte              │
            │           │  - get_chantier_indicateurs                 │
            │           │  - display_choices (pass-through)           │
            │           │  - export_rapport (→ storage + fichier)     │
            │           └─────────────────────────────────────────────┘
            │                                  │
            │                                  ▼
            │           ┌─────────────────────────────────────────────┐
            │           │  Queries CQRS côté `chantiers/query/*`      │
            │           │  + legacy use cases (agreger, statistiques) │
            │           │  + TerritoireResolver                       │
            │           └─────────────────────────────────────────────┘
            │
            └───── Tool parts rendus dans `AssistantMessage` comme
                   composants (ToolCallIndicator, ChantierIndicateursTable,
                   ExportRapportDownload, ChoicesPanel)
```

### 3.2. Fichiers clés

**Agent & infrastructure**
- `src/server/albert/Albert.ts` — classe `Albert` avec `streamText` / `generateText`, provider Etalab, persistance `llm_calls`, outils génériques (`displayChoicesTool`, `createExportRapportTool`).
- `src/server/albert/systemPrompt.ts` — construction du system prompt (identité, règles, glossaire, patterns de workflow, gabarits de synthèse, hiérarchie territoriale injectée).
- `src/server/albert/module.ts` — enregistrement DI Awilix du module `albert`.
- `src/app/api/albert/chat/route.ts` — endpoint HTTP streaming (AI SDK), résolution des factories d'outils avec les habilitations session.
- `src/server/infrastructure/api/trpc/routes/albert.ts` — endpoint tRPC `albert.chat` (mode non-stream, limite à `stepCountIs(5)`) + `albert.evaluer` pour le feedback.
- `src/server/albert/PiloteUIMessage.ts` — type `PiloteUIMessage` qui typifie les tool parts côté UI (utilisé par `ChatUI`, `AssistantMessage`).

**Outils**
- `src/server/albert/tools/getTauxAvancementTerritoire.ts`
- `src/server/albert/tools/getChantiersEnRetard.ts`
- `src/server/albert/tools/getChantiersEnDifficulte.ts`
- `src/server/albert/tools/getChantierIndicateurs.ts`
- `src/server/albert/exportRapportSchema.ts` — schéma Zod strict du rapport exportable.
- `src/server/albert/markdown/buildRapportMarkdown.ts`, `src/server/albert/pdf/*` — rendus de sortie Markdown et PDF.

**Domaine / infrastructure auxiliaire**
- `src/server/albert/domain/TerritoireResolver.ts` + `infrastructure/PrismaTerritoireResolver.ts` — résolution `territoire_code + includeSousTerritoires` → liste de codes.
- `src/server/albert/domain/RapportFileStorage.ts` + `infrastructure/FsRapportFileStorage.ts` — stockage des rapports générés.
- `src/server/albert/usecases/EvaluerChatUseCase.ts` — persistance feedback utilisateur.
- `src/server/albert/territoires.ts` — hiérarchie région → départements injectée dans le prompt.

**UI**
- `src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx` — entrée utilisateur depuis la page d'accueil territoriale (modale plein écran + scenarios pré-câblés + `agentContext`).
- `src/client/components/_commons/ChatUI/ChatUI.tsx` — orchestrateur AI SDK React (`useChat`, `DefaultChatTransport`), gère scroll, modèle courant, agentContext.
- `src/client/components/_commons/ChatUI/AssistantMessage.tsx` — rendu des parts (texte, tool calls, `ChantierIndicateursTable`, `ExportRapportDownload`).
- `src/client/components/_commons/ChatUI/ChoicesPanel.tsx` — rendu du tool `display_choices`.
- `src/client/components/_commons/ChatUI/FeedbackBar.tsx` — feedback positif/négatif branché sur `albert.evaluer`.

---

## 4. Annexe — Données sous-jacentes : TA sur un jalon & répartition territoriale

Cette section documente les calculs de taux d'avancement et de répartition territoriale utilisés **à la fois par la page d'accueil classique** et par le tool `get_taux_avancement_territoire` d'Albert (qui les réutilise tels quels).

### 4.1. Calcul du TA pour un jalon donné

La page d'accueil manipule **deux jalons** : celui explicitement sélectionné par l'utilisateur (`jalon`) et celui calculé par défaut à partir de la date courante (`jalonParDefaut`). Les deux sont requêtés ensemble et exposés côte à côte.

**`src/pages/accueil/chantier/[territoireCode]/index.tsx` (lignes 50-54)** :
```typescript
const jalonParDefaut = getAnneeDateDeBascule(
  new Date(),
  configuration().dateBasculeAffichageValeursAnneePrecedente,
);
const jalon = searchParams.jalon ?? jalonParDefaut;
```

**`src/server/chantiers/infrastructure/adapters/PrismaChantierRepository.ts` (lignes 1363-1375)** :
```typescript
chantier_territoire_jalon: {
  select: {
    taux_avancement: true,
    date_taux_avancement: true,
    ecart: true,
    jalon: true,
  },
  where: {
    jalon: { in: jalons },
  },
},
```

**`src/server/chantiers/app/contrats/ChantierAccueilContratV2.ts` (lignes 136-166)** — le présentateur expose trois valeurs d'avancement par territoire :
- **`annuel`** : TA du jalon explicitement sélectionné,
- **`jalonParDefaut`** : TA du jalon par défaut (utilisé par les alertes),
- **`global`** : TA global pour l'ensemble du mandat (`taux_avancement_mandat`).

### 4.2. Répartition territoriale : deux chaînes indépendantes

La répartition territoriale fait intervenir **deux chaînes de calcul indépendantes** qui alimentent des champs distincts passés au composant `PageChantiers` :

1. **`RécupérerStatistiquesAvancementChantiersUseCase`** → calcule `médiane`, `minimum`, `maximum` pour la maille sélectionnée, via la requête Prisma `GetStatistiquesAvancementChantiersQuery` qui agrège `chantier_territoire_jalon.taux_avancement` filtré sur `jalon` (et non plus `chantier_territoire.taux_avancement_mandat` comme dans l'ancienne implémentation legacy — le calcul est désormais **jalon-aware**). Le contrat associé (`AvancementsStatistiquesAccueilContrat`) n'expose plus de champ `moyenne`.
2. **`AgregerAvancementsChantiersUseCase`** + **`AgregateurListeChantiersParTerritoire`** → calcule par territoire les valeurs `global` (moyenne / médiane / min / max) et `annuel` (moyenne) en TypeScript à partir des données brutes chargées par `ChantierSQLRepository.recupererDonneesAvancementChantiers` (lignes 237-282). Le code client `index.tsx` en dérive :
    - **`moyenneTerritoire`** : moyenne annuelle pour le territoire courant,
    - **`avancementsGlobauxTerritoriauxMoyens`** : `{ territoireCode, valeur (global), valeurAnnuelle (annuel) }` pour chaque territoire départemental et régional.

Les deux chaînes sont désormais **complètement indépendantes** : l'agrégateur n'écrase plus les moyennes du contrat `avancementsAgrégés` comme c'était le cas dans une version antérieure.

### 4.3. Consommation par Albert (`get_taux_avancement_territoire`)

Le tool d'Albert **réutilise les deux mêmes chaînes** :

- Il appelle `agregerAvancementsChantiersUseCase.run(chantierIds, jalon)` pour obtenir la moyenne annuelle par territoire (`agregat[maille].territoires[code].repartition.avancements.annuel.moyenne`) → c'est son `taux_avancement_global`.
- Il appelle `récupérerStatistiquesAvancementChantiersUseCase.run(...)` pour obtenir la médiane par maille → c'est son `mediane_repartition`.
- Il en dérive la `position_mediane` en comparant les deux : `EN_AVANCE` si écart ≥ +10, `EN_RETARD` si écart ≤ -10, `DANS_LA_MEDIANE` sinon — **la même règle** que celle documentée dans le system prompt et utilisée pour qualifier les chantiers en retard.

**Point important** : pour une maille `nationale`, la médiane est calculée sur la répartition **départementale** (et non nationale qui n'aurait qu'un seul point) — décision prise dans `getTauxAvancementTerritoire.ts` lignes 114-116.

### 4.4. Références des fichiers

**Calculs TA / répartition**
- `src/pages/accueil/chantier/[territoireCode]/index.tsx` — orchestration serveur des deux jalons et des deux chaînes.
- `src/server/chantiers/infrastructure/adapters/PrismaChantierRepository.ts` — jointure `chantier_territoire_jalon` filtrée sur `{ in: jalons }`.
- `src/server/chantiers/app/contrats/ChantierAccueilContratV2.ts` — contrat exposant `avancement.annuel | jalonParDefaut | global`.
- `src/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat.ts` — contrat de répartition (`médiane | minimum | maximum`).
- `src/server/chantiers/usecases/RécupérerStatistiquesAvancementChantiersUseCase.ts` + `src/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery.ts` — chaîne 1 (statistiques par maille).
- `src/server/chantiers/usecases/AgregerAvancementsChantiersUseCase.ts` + `src/server/infrastructure/accès_données/chantier/ChantierSQLRepository.ts` + `src/client/utils/chantier/agrégateurListeChantiers/agregateur.ts` — chaîne 2 (agrégat par territoire).

**Queries métier exposées comme outils Albert**
- `src/server/chantiers/query/GetChantiersEnRetardQuery.ts`
- `src/server/chantiers/query/GetChantiersEnDifficulteQuery.ts`
- `src/server/chantiers/query/GetChantierIndicateursQuery.ts`
