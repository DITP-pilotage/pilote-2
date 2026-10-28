# Albert : outil des indicateurs sans VI ou VC — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ajouter à Albert l'outil `get_indicateurs_sans_vi_vc`, qui renvoie les indicateurs dont le taux d'avancement ne peut pas être calculé faute de VI ou de VC, avec des evals de niveau 2 mesurées avant et après.

**Architecture :** une query Prisma `GetIndicateursSansViVcQuery` dans le module `chantiers`, sur le modèle de `GetIndicateursNonAJourQuery` ; un outil Albert calqué sur `get_indicateurs_non_a_jour`, dont la résolution du périmètre (accès, chantiers, indicateurs) est extraite dans un helper partagé par les deux outils ; une ligne de lexique dans le prompt et des renvois dans les descriptions voisines.

**Tech Stack :** TypeScript, Prisma 6, `ai` (Vercel AI SDK, `tool`), Zod, Awilix, Vitest, Evalite.

**Spec :** `apps/pilote-ppg/docs/superpowers/specs/2026-10-28-albert-indicateurs-sans-vi-vc-design.md`

Toutes les commandes se lancent depuis `apps/pilote-ppg`.

## Global Constraints

- Nommage : français uniquement pour le vocabulaire métier (indicateur, territoire, chantier, sansViVc, nonAJour, valeursManquantes…), anglais pour le reste (get, execute, missing, scope, count, with…).
- Libellés renvoyés au modèle plutôt que codes : `"valeur initiale"`, `"valeur cible"`.
- Définition, identique au mail PVA : indicateur et chantier `PUBLIE`, `est_applicable = true`, et sans VI = `indicateur_territoire.valeur_initiale` null ; sans VC = une ligne `indicateur_territoire_jalon` du jalon avec `valeur_cible` null. **Pas de ligne pour le jalon : rien n'est remonté.**
- Jalon : toujours `getAnneeDateDeBascule(new Date(), configuration().dateBasculeAffichageValeursAnneePrecedente)`, jamais le jalon de la session.
- Filtre `missing` : `"vi" | "vc" | "vi_or_vc"`, défaut `"vi_or_vc"`.
- Toute demande sur la mise à jour reste sur `get_indicateurs_non_a_jour` seul ; les deux outils seulement si la demande nomme les deux besoins. Pas de clarification.
- Tests : `expect(result).toEqual([{...}])` plutôt que longueur + index ; pas de commentaire hors given/when/then (sauf pour souligner une donnée de setup) ; pas de variable d'1 ou 2 caractères ; pas de test trivial.
- **Commits : proposer le commit à l'utilisateur à chaque étape « Commit », ne commiter qu'avec son accord explicite.**

## Review Focus

1. Un territoire sans VI **et** sans VC : il compte dans les deux compteurs et porte `["valeur initiale", "valeur cible"]` — test dans la tâche 2.
2. Une VC null sur un **autre** jalon que celui de bascule, VC renseignée au jalon de bascule : le territoire n'est pas remonté — test dans la tâche 2.
3. `missing: "vi"` sur un territoire sans VC seulement : ni le territoire ni le compteur `nbTerritoiresSansVc` n'apparaissent — test dans la tâche 2.
4. Un indicateur dont seule la maille DEPT est concernée : la maille NAT n'apparaît pas, `nbTerritoiresApplicables` compte tous les territoires applicables de la maille, concernés ou non — test dans la tâche 2.
5. L'extraction du helper ne change rien au comportement de `get_indicateurs_non_a_jour` — ses tests unitaires existants restent verts sans modification (tâche 3).

---

### Task 1 : cas d'eval de niveau 2 et run de référence

Les cas sont écrits **avant** l'implémentation pour que le run de référence les mesure sur le code actuel (le nouvel outil n'existe pas : ses cas positifs échouent, c'est attendu).

**Files :**
- Create : `evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts`
- Modify : `evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts` (cas négatifs ajoutés avant `toolSelectionEval`)
- Modify : `docs/superpowers/specs/2026-10-28-albert-indicateurs-sans-vi-vc-design.md` (journal)

**Interfaces :**
- Consumes : `toolSelectionEval({ famille: "donnees", tool, cases })`, `ToolCase` de `evals/types.ts`.
- Produces : les fichiers `evals/resultats-sans-vi-vc-avant.json` et `evals/echecs-sans-vi-vc-avant.txt` (ignorés par git), relus à la tâche 5.

- [ ] **Step 1 : écrire la suite `getIndicateursSansViVc.eval.ts`**

  En-tête JSDoc sur le modèle de `getIndicateursNonAJour.eval.ts` (ce que vérifie la suite, les négatifs sur la mise à jour). `toolSelectionEval({ famille: "donnees", tool: "get_indicateurs_sans_vi_vc", cases })` avec ces cas :

  | question | expected / forbidden |
  |---|---|
  | « Quels indicateurs ont un taux d'avancement qui ne peut pas être calculé sur mes chantiers ? » | `[{ toolName: "get_indicateurs_sans_vi_vc" }]` |
  | « Quels sont les indicateurs sans VI ni VC du CH-018 ? » | `[{ toolName: "get_indicateurs_sans_vi_vc", input: { chantier_ids: ["CH-018"] } }]` |
  | « Quels indicateurs n'ont pas de valeur cible sur le chantier CH-018 ? » | `input: { chantier_ids: ["CH-018"], missing: "vc" }` |
  | « Quels indicateurs de mes chantiers n'ont pas de VI ? » | `input: { missing: "vi" }` |
  | « Sur quels territoires l'IND-894 n'a-t-il pas de valeur cible ? » | `input: { indicateur_ids: ["IND-894"], missing: "vc" }` |
  | « Pourquoi le taux d'avancement de l'IND-894 ne peut-il pas être calculé au national ? » | `input: { indicateur_ids: ["IND-894"], territoire_code: "NAT-FR" }` |
  | « La part des locaux raccordables à la fibre a-t-elle une valeur cible partout ? » | `[{ toolName: "search_indicateurs" }, { toolName: "get_indicateurs_sans_vi_vc", input: { indicateur_ids: ["IND-019"], missing: "vc" } }]` |
  | « Quels indicateurs du CH-018 ne sont pas à jour, et lesquels n'ont pas de VI ou de VC ? » | `[{ toolName: "get_indicateurs_non_a_jour", input: { chantier_ids: ["CH-018"] } }, { toolName: "get_indicateurs_sans_vi_vc", input: { chantier_ids: ["CH-018"] } }]` |
  | « Quels indicateurs ne sont pas à jour sur mes chantiers ? » — CAS NÉGATIF : mise à jour | `forbidden: ["get_indicateurs_sans_vi_vc"]` |
  | « Quels indicateurs sont en retard sur le CH-018 ? » — CAS NÉGATIF : retard = mise à jour | `forbidden: ["get_indicateurs_sans_vi_vc"]` |
  | « Quels chantiers sont en retard en Bretagne ? » — CAS NÉGATIF : avancement | `forbidden: ["get_indicateurs_sans_vi_vc"]` |

  Chaque `reason` dit en une ligne ce que le cas vérifie, au format des suites voisines.

- [ ] **Step 2 : ajouter deux négatifs à `getIndicateursNonAJour.eval.ts`**

  - « Quels indicateurs n'ont pas de valeur cible sur le CH-018 ? », reason « CAS NÉGATIF : VC manquante → get_indicateurs_sans_vi_vc », `forbidden: ["get_indicateurs_non_a_jour"]`.
  - « Quels indicateurs ont un taux d'avancement qui ne peut pas être calculé ? », reason « CAS NÉGATIF : taux non calculable → get_indicateurs_sans_vi_vc », `forbidden: ["get_indicateurs_non_a_jour"]`.

  Cas existants inchangés. Compléter la JSDoc d'une phrase sur ces négatifs.

- [ ] **Step 3 : vérifier que les suites se chargent**

  Run : `pnpm eval evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts`
  Expected : la suite tourne jusqu'au bout (score quelconque) ; les cas négatifs passent, les positifs échouent.

- [ ] **Step 4 : run de référence N2 + N3, en arrière-plan**

  Run : `pnpm eval --outputPath evals/resultats-sans-vi-vc-avant.json --threshold 0`
  Expected : code de sortie 0, fichier présent. **Ne pas toucher à `src/` avant la fin du run.**

- [ ] **Step 5 : relever les mesures**

  Les quatre commandes `jq` de l'étape 3 de `docs/superpowers/plans/2026-10-27-albert-refonte-etapes-0-1.md` (tokens du cas « Bonjour », moyenne N2, moyenne N3 hors calibration, échecs répétés), sur `evals/resultats-sans-vi-vc-avant.json`, échecs répétés écrits dans `evals/echecs-sans-vi-vc-avant.txt`. Ajouter le taux de la suite `2.2 · Données · get_indicateurs_sans_vi_vc` :
  `jq '.suites[] | select(.name | endswith("get_indicateurs_sans_vi_vc")) | .averageScore' evals/resultats-sans-vi-vc-avant.json`

- [ ] **Step 6 : remplir le journal de la spec**

  Sous « Journal des mesures » : un tableau Avant / Après (colonne Après vide) avec les lignes Niveau 2, Niveau 3, suite `get_indicateurs_sans_vi_vc`, échecs répétés, tokens du prompt ; le commit mesuré.

- [ ] **Step 7 : Commit** (avec l'accord de l'utilisateur)

  ```bash
  git add evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts docs/superpowers/specs/2026-10-28-albert-indicateurs-sans-vi-vc-design.md
  git commit -m "test(albert): evals de niveau 2 des indicateurs sans VI ou VC, run de référence"
  ```

---

### Task 2 : query `GetIndicateursSansViVcQuery`

**Files :**
- Create : `src/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery.ts`
- Modify : `src/server/chantiers/module.ts` (type des exports ~l.110, liste des exports ~l.198, `register` ~l.337, à côté de `getIndicateursNonAJourQuery`)
- Test : `src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursSansViVcQuery.integration.test.ts`

**Interfaces :**
- Consumes : `indicateursPubliesWhere` de `./indicateurNonAJour`.
- Produces :

  ```ts
  export type MissingValueFilter = "vi" | "vc" | "vi_or_vc";
  export type ValeurManquante = "valeur initiale" | "valeur cible";

  export type TerritoireSansViVc = {
    code: string;
    nom: string | null;
    valeursManquantes: ValeurManquante[]; // toujours dans l'ordre VI puis VC
  };
  export type MailleIndicateurSansViVc = {
    maille: $Enums.Maille;
    nbTerritoiresSansVi?: number; // présent si missing ∈ {vi, vi_or_vc}
    nbTerritoiresSansVc?: number; // présent si missing ∈ {vc, vi_or_vc}
    nbTerritoiresApplicables: number;
    territoires?: TerritoireSansViVc[]; // seulement si withTerritoiresDetail
  };
  export type IndicateurSansViVc = { id: string; nom: string; mailles: MailleIndicateurSansViVc[] };
  export type ChantierIndicateursSansViVc = {
    chantier: { id: string; nom: string };
    indicateurs: IndicateurSansViVc[];
  };

  class GetIndicateursSansViVcQuery {
    constructor(deps: Inject<"prisma">);
    execute(params: {
      chantierIds: string[];
      territoireCodes: string[];
      indicateurIds?: string[];
      jalon: number;
      missing: MissingValueFilter;
      withTerritoiresDetail: boolean;
    }): Promise<ChantierIndicateursSansViVc[]>;
  }
  ```

  Ordre : chantiers puis indicateurs par id croissant, mailles NAT → REG → DEPT, territoires par code croissant (comme `GetIndicateursNonAJourQuery`).

- [ ] **Step 1 : écrire les tests d'intégration**

  Reprendre de `GetIndicateursNonAJourQuery.integration.test.ts` les constantes de territoires (FRANCE, FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR) et `seedChantier`. Les VC se posent avec `fixtures.indicateurTerritoireJalon({ id, territoire_code, code_insee, maille, zone_id, jalon, valeur_cible })`. Jalon des tests : `2026`. Tests :

  - « regroupe les territoires sans VI ou sans VC par chantier, indicateur et maille, avec les valeurs manquantes » : IND-001 sur 29 (VI null, VC 2026 renseignée), 35 (VI renseignée, VC 2026 null), 22 (VI null et VC 2026 null), `missing: "vi_or_vc"`, détail → une maille DEPT `{ nbTerritoiresSansVi: 2, nbTerritoiresSansVc: 2, nbTerritoiresApplicables: 3, territoires: [22 ["valeur initiale","valeur cible"], 29 ["valeur initiale"], 35 ["valeur cible"]] }` (Review Focus 1).
  - « ne remonte pas un territoire sans ligne de jalon, ni une VC manquante sur un autre jalon » : 29 VI renseignée sans aucune ligne de jalon ; 35 VI renseignée, VC 2025 null et VC 2026 renseignée → `[]` (Review Focus 2).
  - « filtre sur la valeur manquante demandée » : même seed que le premier test, `missing: "vi"` → compteur `nbTerritoiresSansVi: 2` seul, territoires 22 et 29 avec `["valeur initiale"]` seulement ; `missing: "vc"` → `nbTerritoiresSansVc: 2` seul, territoires 22 et 35 avec `["valeur cible"]` (Review Focus 3).
  - « sans détail, ne renvoie que les compteurs par maille, et ne compte que les mailles concernées » : IND-001 applicable sur NAT-FR (VI et VC renseignées) et 29, 35 (VI null sur 29) → mailles `[{ maille: "DEPT", nbTerritoiresSansVi: 1, nbTerritoiresSansVc: 0, nbTerritoiresApplicables: 2 }]`, sans `territoires` (Review Focus 4).
  - « exclut les territoires non applicables, hors périmètre, et les chantiers ou indicateurs non publiés » : sur le modèle du test du même nom de la query non à jour → `[]`.

- [ ] **Step 2 : lancer les tests, constater l'échec**

  Run : `pnpm test:server:integration src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursSansViVcQuery.integration.test.ts`
  Expected : FAIL, module `GetIndicateursSansViVcQuery` introuvable.

- [ ] **Step 3 : implémenter la query**

  Un `findMany` sur `indicateur_territoire` avec `indicateursPubliesWhere(...)`, `est_applicable: true` et un `OR` restreint selon `missing` (`{ valeur_initiale: null }` et/ou `{ indicateur_territoire_jalon: { some: { jalon, valeur_cible: null } } }`), en sélectionnant `valeur_initiale` et `indicateur_territoire_jalon` filtré sur `{ jalon }` ; agrégation par indicateur × maille en JS (deux compteurs). Les applicables : le même `groupBy` que la query non à jour. Les compteurs absents du filtre ne sont pas émis ; un compteur émis vaut 0 si aucun territoire de la maille n'est concerné pour cette valeur. Enregistrer la classe dans `chantiers/module.ts` (`asModuleClass`) et l'ajouter aux exports.

- [ ] **Step 4 : lancer les tests, constater le succès**

  Run : même commande. Expected : PASS (5 tests).

- [ ] **Step 5 : Commit** (avec l'accord de l'utilisateur)

  ```bash
  git add src/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery.ts src/server/chantiers/module.ts src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursSansViVcQuery.integration.test.ts
  git commit -m "feat(albert): query des indicateurs sans VI ou VC au jalon"
  ```

---

### Task 3 : helper de périmètre partagé

Les deux outils ont la même résolution d'accès (≈40 lignes) ; on l'extrait plutôt que de la dupliquer.

**Files :**
- Create : `src/server/albert/tools/indicateursScope.ts`
- Modify : `src/server/albert/tools/getIndicateursNonAJour.ts` (l.46-55 et l.85-126 remplacées par l'appel au helper)
- Test : `src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts` (inchangé, doit rester vert)

**Interfaces :**
- Produces :

  ```ts
  export type IndicateursScope =
    | { accesRefuse: true }
    | {
        accesRefuse: false;
        chantierIds: string[];
        territoireCodes: string[];
        indicateurIds?: string[];          // undefined si aucun indicateur demandé
        withTerritoiresDetail: boolean;     // indicateurs demandés ou territoire_code
        chantiersNonAccessibles: string[];
        indicateursNonAccessibles: string[];
      };

  export async function resolveIndicateursScope(params: {
    input: { chantier_ids: string[]; indicateur_ids: string[]; territoire_code?: string };
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
    getIndicateurContexteQuery: GetIndicateurContexteQuery;
  }): Promise<IndicateursScope>;

  export function scopeAccessFields(scope: Extract<IndicateursScope, { accesRefuse: false }>): {
    chantiers_non_accessibles?: string[];
    indicateurs_non_accessibles?: string[];
  };
  ```

  Sémantique : exactement celle de l'actuel `execute` de `getIndicateursNonAJour.ts` (mêmes cas d'`acces_refuse`, même ordre de vérification).

- [ ] **Step 1 : vérifier que les tests de l'outil passent avant refactor**

  Run : `pnpm test:unit src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`
  Expected : PASS.

- [ ] **Step 2 : extraire le helper et y brancher `getIndicateursNonAJour.ts`**

  L'outil garde sa sortie `GetIndicateursNonAJourOutput` à l'identique ; `avecDetailTerritoires` reçoit `scope.withTerritoiresDetail`.

- [ ] **Step 3 : relancer les tests sans les modifier**

  Run : même commande. Expected : PASS, aucun test touché (Review Focus 5).

- [ ] **Step 4 : Commit** (avec l'accord de l'utilisateur)

  ```bash
  git add src/server/albert/tools/indicateursScope.ts src/server/albert/tools/getIndicateursNonAJour.ts
  git commit -m "refactor(albert): extrait la résolution du périmètre des outils d'indicateurs"
  ```

---

### Task 4 : outil `get_indicateurs_sans_vi_vc` et branchements

**Files :**
- Create : `src/server/albert/tools/getIndicateursSansViVc.ts`
- Modify : `src/server/albert/module.ts` (import, type ~l.74, `register` ~l.133), `src/server/albert/AssistantIA.ts` (après `get_indicateurs_non_a_jour`, l.77-79), `src/server/albert/PiloteUIMessage.ts` (import ~l.51, entrée ~l.96), `src/client/components/_commons/ChatUI/SourcesConsultees.tsx` (union l.16-28, libellé l.33-46)
- Test : `src/server/albert/__tests__/tools/getIndicateursSansViVc.unit.test.ts`

**Interfaces :**
- Consumes : `GetIndicateursSansViVcQuery`, `MissingValueFilter`, `ChantierIndicateursSansViVc` (tâche 2) ; `resolveIndicateursScope`, `scopeAccessFields` (tâche 3) ; `getAnneeDateDeBascule` de `@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule`, `configuration` de `@/config`.
- Produces :

  ```ts
  export const getIndicateursSansViVcInputSchema: z.ZodObject<{
    chantier_ids, indicateur_ids, territoire_code, // copiés de getIndicateursNonAJourInputSchema
    missing: z.enum(["vi", "vc", "vi_or_vc"]).optional().default("vi_or_vc"),
  }>;
  export type GetIndicateursSansViVcOutput = {
    jalon: number;
    resultats: ChantierIndicateursSansViVc[];
    acces_refuse?: boolean;
    chantiers_non_accessibles?: string[];
    indicateurs_non_accessibles?: string[];
  };
  export function createGetIndicateursSansViVcTool(deps: {
    getIndicateursSansViVcQuery: GetIndicateursSansViVcQuery;
    getIndicateurContexteQuery: GetIndicateurContexteQuery;
  }): (params: { territoiresAccessibles: string[]; chantiersAccessibles: string[] }) => Tool;
  ```

  Clé dans `AssistantIA` : `get_indicateurs_sans_vi_vc`. Libellé de source : `"Indicateurs sans VI ou VC"`.

- [ ] **Step 1 : écrire les tests unitaires**

  Sur le modèle de `getIndicateursNonAJour.unit.test.ts` (`mock` de `vitest-mock-extended`, `buildTool`). Le jalon attendu se calcule dans le test avec `getAnneeDateDeBascule(new Date(), configuration().dateBasculeAffichageValeursAnneePrecedente)`.

  - « sans argument, interroge les chantiers et territoires accessibles au jalon de bascule, pour les VI ou VC manquantes, sans détail » : `query.execute` appelé avec `{ chantierIds: chantiersAccessibles, territoireCodes: territoiresAccessibles, indicateurIds: undefined, jalon, missing: "vi_or_vc", withTerritoiresDetail: false }` ; résultat `{ jalon, resultats: QUERY_RESULT }`.
  - « transmet la valeur manquante demandée et le détail avec indicateur_ids » : input `{ indicateur_ids: ["IND-001"], missing: "vc" }` → `missing: "vc"`, `indicateurIds: ["IND-001"]`, `withTerritoiresDetail: true`.
  - « signale un accès refusé avec le jalon, sans appeler la query » : `territoire_code: "DEPT-75"` non accessible → `{ jalon, resultats: [], acces_refuse: true }`, query non appelée.

- [ ] **Step 2 : lancer les tests, constater l'échec**

  Run : `pnpm test:unit src/server/albert/__tests__/tools/getIndicateursSansViVc.unit.test.ts`
  Expected : FAIL, module introuvable.

- [ ] **Step 3 : implémenter l'outil**

  `execute` : calcule le jalon, appelle `resolveIndicateursScope`, renvoie `{ jalon, resultats: [], acces_refuse: true }` si refusé, sinon appelle la query et renvoie `{ jalon, resultats, ...scopeAccessFields(scope) }`. Description, texte exact :

  ```
  Renvoie les indicateurs dont le taux d'avancement ne peut pas être calculé parce que leur valeur initiale (VI) ou leur valeur cible (VC) manque, par chantier, indicateur et maille, avec le nombre de territoires concernés. La VC s'apprécie au jalon en cours, renvoyé dans `jalon`.
  - `missing` : "vi" pour les indicateurs sans VI, "vc" pour ceux sans VC, "vi_or_vc" (défaut) pour les deux.
  - Le détail par territoire, avec ses valeurs manquantes, n'est renvoyé qu'avec `indicateur_ids` ou `territoire_code` ; sinon, seulement les compteurs par maille.
  - Liste vide : aucune VI ni VC manquante sur ce périmètre, ce qui ne prouve pas que le taux est calculé partout (l'indicateur peut ne pas être suivi ici, ou son identifiant être erroné).
  - `acces_refuse` : l'utilisateur n'a accès ni à ce territoire, ni à aucun des chantiers ou indicateurs demandés.
  - `chantiers_non_accessibles`, `indicateurs_non_accessibles` : demandés mais hors du périmètre de l'utilisateur ; n'en dis rien d'autre, et ne les présente jamais comme complets.
  Dans ta réponse, dis toujours pourquoi le taux d'avancement ne peut pas être calculé : la valeur initiale, la valeur cible, ou les deux, manquent.
  Utilise-le pour : « taux d'avancement qui ne peut pas être calculé », « indicateurs sans VI », « sans VC », « sans VI ni VC », « valeurs initiales ou cibles manquantes ».
  Ne l'utilise pas pour : la mise à jour des données (« non à jour », « en retard », « données périmées ») → get_indicateurs_non_a_jour.
  ```

  Brancher dans `albert/module.ts`, `AssistantIA.ts`, `PiloteUIMessage.ts` (`input: z.input<typeof getIndicateursSansViVcInputSchema>`, `output: GetIndicateursSansViVcOutput`), `SourcesConsultees.tsx`.

- [ ] **Step 4 : lancer les tests et le typage**

  Run : `pnpm test:unit src/server/albert/__tests__/tools/getIndicateursSansViVc.unit.test.ts && pnpm lint`
  Expected : PASS, aucune erreur de lint ni de typage.

- [ ] **Step 5 : Commit** (avec l'accord de l'utilisateur)

  ```bash
  git add src/server/albert/tools/getIndicateursSansViVc.ts src/server/albert/module.ts src/server/albert/AssistantIA.ts src/server/albert/PiloteUIMessage.ts src/client/components/_commons/ChatUI/SourcesConsultees.tsx src/server/albert/__tests__/tools/getIndicateursSansViVc.unit.test.ts
  git commit -m "feat(albert): outil des indicateurs dont le taux d'avancement ne peut pas être calculé"
  ```

---

### Task 5 : prompt, descriptions voisines et mesure après

**Files :**
- Modify : `src/server/albert/systemPrompt.ts` (lexique de « Comprendre la demande », après la ligne « non à jour », l.111)
- Modify : `src/server/albert/tools/getIndicateursNonAJour.ts` (ligne « Ne l'utilise pas pour » de la description)
- Modify : `src/server/albert/tools/getChantiers.ts:247`, `src/server/albert/tools/searchIndicateurs.ts:71`
- Modify : `src/server/albert/__tests__/systemPrompt.unit.test.ts` seulement s'il casse
- Modify : `docs/superpowers/specs/2026-10-28-albert-indicateurs-sans-vi-vc-design.md` (journal)

- [ ] **Step 1 : modifier le prompt et les descriptions**

  - `systemPrompt.ts`, nouvelle ligne de lexique juste après celle de « non à jour » :
    `- « taux d'avancement qui ne peut pas être calculé », « sans VI », « sans VC », « valeurs initiales ou cibles manquantes » : des valeurs initiales ou cibles manquantes, à ne pas confondre avec la mise à jour des données ;`
  - `getIndicateursNonAJour.ts`, ajouter à « Ne l'utilise pas pour » : `; les valeurs initiales ou cibles manquantes, ou un taux d'avancement non calculable → get_indicateurs_sans_vi_vc`.
  - `getChantiers.ts:247` : ajouter `- les valeurs initiales ou cibles manquantes → get_indicateurs_sans_vi_vc ;` après la ligne de fraîcheur.
  - `searchIndicateurs.ts:71` : ajouter `get_indicateurs_sans_vi_vc` à la liste des outils.

- [ ] **Step 2 : tests du prompt et des outils**

  Run : `pnpm test:unit src/server/albert`
  Expected : PASS (adapter `systemPrompt.unit.test.ts` seulement si une assertion de texte casse).

- [ ] **Step 3 : vérifier la suite ciblée avant le run complet**

  Run : `pnpm eval evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts`
  Expected : chaque cas réussi sur au moins 2 essais sur 3. Sinon, ajuster la description ou le lexique et relancer, avant le run complet.

- [ ] **Step 4 : run après, N2 + N3, en arrière-plan**

  Run : `pnpm eval --outputPath evals/resultats-sans-vi-vc-apres.json --threshold 0`
  Expected : code de sortie 0, fichier présent.

- [ ] **Step 5 : relever les mesures et comparer**

  Mêmes commandes qu'à la tâche 1 (step 5) sur `evals/resultats-sans-vi-vc-apres.json`, échecs dans `evals/echecs-sans-vi-vc-apres.txt`, puis
  `diff evals/echecs-sans-vi-vc-avant.txt evals/echecs-sans-vi-vc-apres.txt`.
  Seuil (spec) : aucun nouvel échec répété sur les suites existantes, chaque nouveau cas réussi sur au moins 2 essais sur 3. Un nouvel échec répété sur une suite existante : vérifier s'il bascule aussi à code égal (relancer la suite seule) avant de l'attribuer au changement ; s'il tient, itérer sur le prompt (par exemple un exemple « demande → appels ») et refaire les steps 4-5.

- [ ] **Step 6 : remplir la colonne Après du journal**

  Avec les échecs résolus et nouveaux, et la décision (seuil atteint ou itération).

- [ ] **Step 7 : Commit** (avec l'accord de l'utilisateur)

  ```bash
  git add src/server/albert/systemPrompt.ts src/server/albert/tools/getIndicateursNonAJour.ts src/server/albert/tools/getChantiers.ts src/server/albert/tools/searchIndicateurs.ts src/server/albert/__tests__/systemPrompt.unit.test.ts docs/superpowers/specs/2026-10-28-albert-indicateurs-sans-vi-vc-design.md
  git commit -m "feat(albert): oriente vers l'outil des indicateurs sans VI ou VC, mesure avant/après"
  ```
