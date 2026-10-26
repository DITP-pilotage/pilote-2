# Albert : outils de données en trois couches

## Objectif

`get_chantiers` est aujourd'hui couplé aux workflows écrits dans le prompt
système : ses instructions de sortie changent selon la vue, il porte une règle
de synthèse (non-applicabilité au national), et sa description dicte
l'orchestration. Le prompt, de son côté, demande au LLM d'enchaîner trois
appels (`get_taux_avancement_territoire` + `get_chantiers` × 2) puis d'ignorer
leurs instructions et d'appliquer un gabarit injecté par détection de
mots-clés. Résultat : la primitive est difficile à réutiliser hors de ces
workflows, et un workflow ne se construit que par ajout de prose dans le prompt.

Ce refactor sépare trois couches :

1. **Services de lecture** : la logique serveur (résolution des territoires,
   habilitations, masquage, requêtes) sortie des `tool()` pour être réutilisable
   et testable sans LLM.
2. **Primitives** : `get_chantiers` et `get_taux_avancement_territoire` deviennent
   des adaptateurs minces sur ces services.
3. **Livrables** : un outil `synthese_territoire` exécute côté serveur le
   workflow de synthèse en un seul appel et transporte son gabarit.

**Hors périmètre de cette PR** (réfléchi, mis de côté) : périmètre
multi-territoires, tri/limite, sortie plate de `get_chantiers`, option
`inclure_indicateurs` du livrable. Les schémas d'entrée des primitives ne
changent pas.

**Piste retenue pour plus tard** : un livrable `rapport_complet` sous forme de
sous-agent. Les services lisent synthèse et indicateurs, un appel LLM interne
rédige les sections selon le gabarit (`generateStructuredOutput` sur le schéma
d'`export_rapport`), les builders markdown et PDF produisent le fichier, le LLM
principal se contente d'annoncer le téléchargement. `export_rapport` resterait
pour exporter une conversation existante. Motivation : l'eval « Rapport
complet » montre l'export appelé trois fois sur six.

## Décisions

- **Une PR unique**, demandée ainsi. Les evals de niveau 2 et 3 sont réécrites
  dans la même PR.
- **La règle « en retard non applicable au national » descend dans le service
  `ChantiersReader`**, pas dans le livrable. C'est une règle de sens des données
  (l'écart à la médiane suppose des territoires comparables), pas une règle de
  workflow : elle vaut autant pour un utilisateur qui demande directement « les
  chantiers en retard au national ». La primitive et le livrable la renvoient
  tous deux sous la forme `non_applicable: { raison }`.
- **Le gabarit de synthèse voyage avec le livrable**, dans ses
  `_output_instructions`. Le livrable choisit lui-même le gabarit mono-territoire
  ou comparaison d'après le nombre de territoires qu'il renvoie : la section
  `<selection>` du gabarit disparaît, le LLM reçoit directement le bon template.
  La capacity `synthese` et sa détection par mots-clés sont supprimées.
- **La capacity `inclureSousTerritoires` est conservée** telle quelle : elle
  pousse le flag `include_sous_territoires` sur les primitives et sur le
  livrable. Elle n'est pas liée au couplage que l'on défait.
- **La primitive `get_chantiers` garde `view`.** `en_retard` et `en_difficulte`
  sont des filtres métier que les utilisateurs demandent directement (« où ça
  coince »), pas une spécificité de la synthèse.
- **Le rapport complet n'a pas d'outil dédié.** Le pattern devient :
  `synthese_territoire`, puis `get_indicateurs` par chantier, puis
  `export_rapport`. L'option `inclure_indicateurs` est mise de côté.
- **Pas de nouveau module Awilix** : les services sont enregistrés dans le
  module `albert`, qui importe déjà `chantiers`.

## Convention de nommage

Vocabulaire métier en français, vocabulaire technique en anglais, dans les
noms de fichiers, de classes, de fonctions et de variables. Métier : chantier,
territoire, jalon, synthese, rapport, taux d'avancement, meteo, tendance,
habilitations, non applicable (au sens de l'analyse). Technique : read, reader,
result, params, access, scope, mask, template, tool, create, build, execute.
Exemples : `ChantiersReader`, `ReadChantiersParams`, `restrictedTerritoires`,
`syntheseTerritoireTemplates.ts`. Les champs des sorties d'outils exposés au LLM
(`resultats`, `territoire_code`, `non_applicable`, `_output_instructions`)
restent en snake_case français : c'est le contrat existant avec le prompt.

## Architecture

```
Prompt système (patterns a et c réécrits, gabarit retiré)
  │
  ├─ get_chantiers ─────────────────┐            primitives (couche 2)
  ├─ get_taux_avancement_territoire ─┤
  └─ synthese_territoire ───────────┤            livrable (couche 3)
                                    ▼
          ChantiersReader        TauxAvancementTerritoireReader     services (couche 1)
            │  │  │                  │   │
            │  │  └─ masquage        │   └─ recupererTauxAvancementTerritoireQuery
            │  └─ GetChantiersQuery  └─ récupérerStatistiquesAvancementChantiersUseCase
            └─ TerritoireResolver ◄──┘
```

### 1. Services de lecture (`src/server/albert/services/`)

Classes injectées par Awilix (`asModuleClass`), sans dépendance à `ai`.

#### `ChantiersReader`

```ts
type ReadChantiersParams = {
  territoireCode: string;
  jalon: number;
  includeSousTerritoires: boolean;
  chantierIds?: string[];
  view?: "all" | "en_retard" | "en_difficulte";
  tendance?: "HAUSSE" | "BAISSE" | "STAGNATION";
  meteo?: "SOLEIL" | "COUVERT" | "NUAGE" | "ORAGE";
};

type AccessScope = { territoiresAccessibles: string[]; chantiersAccessibles: string[] };

type ReadChantiersResult =
  | { resultats: GetChantiersResult[]; restrictedTerritoires: string[] }
  | { notApplicable: { raison: string } }
  | { noAccessibleChantier: true };

class ChantiersReader {
  constructor(deps: { getChantiersQuery: GetChantiersQuery; territoireResolver: TerritoireResolver })
  execute(params: ReadChantiersParams, access: AccessScope): Promise<ReadChantiersResult>
}
```

Reprend tel quel le corps actuel de `execute` dans `getChantiers.ts` :

1. `NAT-FR` + `view: "en_retard"` + sans sous-territoires → `notApplicable` avec
   la raison actuelle (`NON_APPLICABLE_EN_RETARD_NAT_FR`).
2. `chantierIds` filtrés par `chantiersAccessibles` ; si la liste demandée est
   non vide et la liste filtrée vide → `noAccessibleChantier`.
3. `territoireResolver.resoudre(territoireCode, includeSousTerritoires)`.
4. `getChantiersQuery.execute` par code, en parallèle (inchangé).
5. `maskRestrictedData` (déplacé tel quel).
6. `restrictedTerritoires` : codes des résultats hors `territoiresAccessibles`,
   pour que l'appelant rédige l'avertissement.

#### `TauxAvancementTerritoireReader`

```ts
type ReadTauxAvancementParams = { territoireCode: string; jalon: number; includeSousTerritoires: boolean };

class TauxAvancementTerritoireReader {
  constructor(deps: {
    prisma: PrismaPilote;
    territoireResolver: TerritoireResolver;
    recupererTauxAvancementTerritoireQuery: RecupererTauxAvancementTerritoireQuery;
    récupérerStatistiquesAvancementChantiersUseCase: RecupererStatistiquesAvancementChantiersUseCase;
  })
  execute(params: ReadTauxAvancementParams, habilitations: Habilitations): Promise<GetTauxAvancementTerritoireResult[]>
}
```

Reprend le corps actuel de `getTauxAvancementTerritoire.ts` (chantiers publiés,
taux par territoire, médiane par maille avec `MailleNonAutoriséeErreur`
tolérée, position). Le `getContainer("chantiers")` appelé dans l'outil est
remplacé par l'injection : les deux dépendances sont ajoutées aux `exports` du
module `chantiers`. Le type `GetTauxAvancementTerritoireResult` et
`formatPourcentage` déménagent avec le service.

### 2. Primitives (`src/server/albert/tools/`)

#### `get_chantiers`

- Schéma d'entrée **inchangé**.
- `execute` : appelle `chantiersReader.execute(...)` et traduit :
  - `notApplicable` → `{ resultats: [], non_applicable, _output_instructions }`
    avec l'instruction actuelle (expliquer la raison, ne pas conclure à une
    liste vide) ;
  - `noAccessibleChantier` → `{ resultats: [], _output_instructions:
    "Aucun des chantiers demandés n'est accessible pour cet utilisateur." }` ;
  - sinon `{ resultats, _output_instructions }`.
- `_output_instructions` : **une seule** instruction neutre, qui ne dépend plus
  de `view` ni de `chantier_ids` :
  « Présente les chantiers retournés avec leurs données clés (taux
  d'avancement, écart à la médiane, météo, tendance) et la synthèse si
  disponible. Les flags `est_en_retard` et `est_en_difficulte` indiquent la
  catégorie de chaque chantier ; utilise les libellés utilisateur de la météo,
  jamais les codes internes. »
  L'avertissement de restriction d'accès (texte actuel) est préfixé quand
  `restrictedTerritoires` n'est pas vide : c'est une sémantique des données,
  pas du workflow.
- Description : conserve les filtres, les exemples et le paragraphe sur
  `include_sous_territoires`. Retire la phrase sur les comparaisons entre jalons
  (« un appel par territoire parent ET par jalon… ») : c'est de l'orchestration,
  déjà dans le pattern b du prompt.
- Type de sortie `GetChantiersOutput` inchangé (les evals l'importent).

#### `get_taux_avancement_territoire`

- Schéma d'entrée et type de sortie **inchangés**.
- `execute` : `tauxAvancementTerritoireReader.execute(...)` puis
  `{ resultats, _output_instructions }`.
- Description : même nettoyage de la phrase sur les jalons.

### 3. Livrable `synthese_territoire` (`src/server/albert/tools/syntheseTerritoire.ts`)

```ts
const syntheseTerritoireInputSchema = z.object({
  territoire_code: z.string(),       // même description que les primitives
  jalon: z.number().int().min(2022).max(année courante),
  include_sous_territoires: z.boolean().optional().default(false),  // même description
});

type SyntheseTerritoireOutput = {
  taux_avancement: GetTauxAvancementTerritoireResult[];
  chantiers_en_retard: GetChantiersResult[];
  chantiers_en_difficulte: GetChantiersResult[];
  non_applicable_en_retard?: { raison: string };
  _output_instructions: string;
};
```

Exécution :

1. En parallèle : `tauxAvancementTerritoireReader.execute`,
   `chantiersReader.execute({ view: "en_retard" })`,
   `chantiersReader.execute({ view: "en_difficulte" })`.
2. Si la lecture `en_retard` renvoie `notApplicable` (national sans
   sous-territoires) : `chantiers_en_retard: []` et `non_applicable_en_retard`
   renseigné. Les deux autres blocs sont rendus normalement.
3. `_output_instructions` = avertissement de restriction (union des
   `restrictedTerritoires` des deux lectures, même texte que la primitive) +
   gabarit **mono-territoire** si `taux_avancement.length === 1`, gabarit
   **comparaison** sinon. Les deux templates sont ceux de
   `GABARIT_SYNTHESE_TERRITORIALE`, déplacés dans
   `src/server/albert/tools/syntheseTerritoireTemplates.ts`, sans la section `<selection>`
   ni la phrase « Ce gabarit s'applique UNIQUEMENT quand tu appelles les 3
   outils ensemble ». Quand `non_applicable_en_retard` est présent, une ligne
   est ajoutée en tête : reprendre fidèlement la raison dans la section
   « Chantiers en retard », ne pas écrire « aucun chantier en retard ».

Description de l'outil (à destination du LLM) :

> Produit en un seul appel toutes les données d'une synthèse territoriale :
> taux d'avancement global et médiane, chantiers en retard, chantiers en
> difficulté. À utiliser dès que l'utilisateur demande une synthèse, un état
> des lieux, un résumé ou un point complet sur un territoire sans cibler un
> chantier précis. Ne pas l'utiliser pour une question ciblée (un chantier, une
> seule catégorie, le seul taux d'avancement) : les outils `get_chantiers` et
> `get_taux_avancement_territoire` répondent plus directement. Le résultat
> contient le gabarit de réponse à suivre dans `_output_instructions`.

Câblage : `createSyntheseTerritoireTool({ chantiersReader,
tauxAvancementTerritoireReader })` puis `({ habilitations })`, exposé sous le nom
`synthese_territoire` dans `AssistantIA.construireTools`, toujours (pas de
capacity).

### 3 bis. Client : le livrable est une source consultée

Un outil absent des listes du client est invisible pour l'utilisateur : sans
cette tâche, une demande de synthèse n'afficherait plus aucune puce « source
consultée » (trois aujourd'hui) ni le squelette de chargement pendant le
streaming, qui dépend du nombre de sources.

- `src/server/albert/PiloteUIMessage.ts` : ajouter `synthese_territoire` à
  `PiloteUITools` (entrée et sortie typées comme les autres outils).
- `src/client/components/_commons/ChatUI/SourcesConsultees.tsx` : ajouter
  `tool-synthese_territoire` à `SourceToolPart` et au dictionnaire `LIBELLES`
  avec le libellé « Synthèse territoriale ». La vue « réponse brute » affiche
  la sortie telle quelle ; sa forme (trois blocs) ne nécessite pas d'adaptation.
- `src/client/components/_commons/ChatUI/AssistantMessageText.tsx` : ajouter
  le nom à `TOOL_NAMES` (filet contre les pseudo-appels écrits dans le texte).

### 4. Prompt système (`systemPrompt.ts`)

- Supprimer `GABARIT_SYNTHESE_TERRITORIALE`, `consigneSyntheseWorkflow`,
  `gabaritSection` et le paramètre `capacities.synthese`.
- Pattern **a. Synthèse complète d'un territoire** : « Appelle
  `synthese_territoire` (avec `include_sous_territoires=true` si la demande
  couvre les sous-territoires) et suis le gabarit fourni dans ses
  `_output_instructions`. N'appelle pas `get_chantiers` ni
  `get_taux_avancement_territoire` en plus pour le même périmètre. »
- Pattern **c. Rapport complet** : étape 1 remplacée par `synthese_territoire` ;
  étapes 2 à 4 inchangées.
- Section « Export de rapport », point 1 : « appelle `synthese_territoire` si
  l'utilisateur demande un rapport complet directement ».
- Pattern b, section « Sous-territoires détectés », section « Chantiers
  signalés », table des expressions : mentionner `synthese_territoire` là où
  `get_chantiers` et `get_taux_avancement_territoire` sont cités comme
  destinataires du flag `include_sous_territoires`. Le reste est inchangé.
- La ligne « Chaque outil de données retourne un champ `_output_instructions`.
  Suis ces instructions » reste : elle devient le seul mécanisme qui porte le
  gabarit.

### 5. `detecteurIntention.ts`

Supprimer `MOTS_CLES_SYNTHESE` et `Capacities.synthese`. Mettre à jour
`AssistantIA`, `systemPrompt.unit.test.ts` et `detecteurIntention.unit.test.ts`.

### 6. Module `albert` et module `chantiers`

- `albert/module.ts` : enregistrer `chantiersReader`,
  `tauxAvancementTerritoireReader` (classes) et `createSyntheseTerritoireTool`
  (fonction). Les deux fabriques de primitives reçoivent désormais le service
  au lieu de la query / de prisma.
- `chantiers/module.ts` : ajouter `recupererTauxAvancementTerritoireQuery` et
  `récupérerStatistiquesAvancementChantiersUseCase` aux `exports`.

### 7. Tests

- `services/__tests__/ChantiersReader.unit.test.ts` : query et résolveur mockés.
  Cas : non applicable au national ; chantiers tous inaccessibles ; filtrage
  des `chantierIds` ; masquage sur un territoire restreint et
  `restrictedTerritoires` renseigné ; passage des filtres à la query.
- `services/__tests__/TauxAvancementTerritoireReader.unit.test.ts` : seulement
  si l'extraction change une signature ; sinon la couverture reste celle des
  evals de niveau 2 (pas de test trivial).
- `__tests__/tools/syntheseTerritoire.unit.test.ts` : services mockés. Cas :
  choix du gabarit mono / comparaison ; `non_applicable_en_retard` propagé avec
  les deux autres blocs rendus ; avertissement de restriction présent.
- `__tests__/tools/getChantiers.unit.test.ts` : service mocké, les trois
  traductions de résultat. Il n'existe pas de test unitaire aujourd'hui pour
  cet outil : celui-ci se justifie par la traduction service → sortie LLM.

### 8. Evals

- **Niveau 2** :
  - `getChantiers.eval.ts` et `getTauxAvancementTerritoire.eval.ts` : ajouter
    `synthese_territoire` aux outils interdits sur les cas ciblés (« quels
    chantiers en retard », « quel est le taux d'avancement »), pour mesurer la
    concurrence primitive / livrable.
  - Nouveau `2-tools/2.2-donnees/syntheseTerritoire.eval.ts` : « fais-moi la
    synthèse de… », « état des lieux », « résume la situation » →
    `synthese_territoire` ; avec « et ses départements » →
    `include_sous_territoires: true` ; cas négatifs : question ciblée →
    `synthese_territoire` interdit.
  - Le cas « Récap des chantiers sur l'Auvergne » de `getChantiers.eval.ts`
    garde `get_chantiers` en attendu, sans interdire le livrable : « récap des
    chantiers » est une liste, mais on ne pénalise pas l'autre lecture.
- **Niveau 3, suites de synthèse** (`syntheseTerritoire`,
  `syntheseDepartements`, `syntheseDifficultes`) : le triplet attendu est
  remplacé par un appel `synthese_territoire` et les deux primitives sont
  **interdites** (`forbidden`) : le but du livrable est précisément que le LLM
  n'orchestre plus lui-même. `rapportComplet` attend `synthese_territoire` à la
  place du triplet mais **n'interdit rien** : le détour par `get_indicateurs`
  et `export_rapport` rend une interdiction trop sévère.
- **Niveau 3, suites de comparaison** (`3.2-comparaison`) : elles n'attendent
  aujourd'hui que `get_taux_avancement_territoire` et restent **inchangées**,
  sans `forbidden`. La comparaison de territoires reste un usage des
  primitives ; si le LLM préfère le livrable, on le tolère et on le lit dans
  les scores. `tableauDeBord` et `chantiersEnRetard` restent inchangés pour la
  même raison.
- Les commentaires d'en-tête des suites qui décrivent le triplet sont mis à
  jour.
- `evidence.ts` : ajouter `synthese_territoire` à `OUTILS_QUI_MASQUENT` et
  lire ses territoires dans `chantiers_en_retard` et `chantiers_en_difficulte`
  (pas `resultats`). Même extension dans `criteria/commentaires.ts`, qui lit
  les commentaires territoriaux reçus par `get_chantiers` pour le critère « Pas
  de recopie ».
- `groundTruth.ts` et `dataTools.ts` : inchangés, la vérité continue de se
  lire par les primitives.
- Les suites de niveau 3 touchées sont relancées avant la PR et leurs scores
  notés dans les en-têtes, comme les runs précédents.

## Ce qui est laissé au constructeur

- Le découpage exact des fichiers de `services/` et le nom des types internes.
- L'ordre des étapes, sous réserve que chaque étape laisse `pnpm test:unit` et
  `pnpm lint` au vert.
- Le texte précis des descriptions d'outils et des cas d'eval, dans l'esprit
  décrit ici.
