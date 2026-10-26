# Albert : outils de données en trois couches — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sortir la logique serveur des outils `get_chantiers` et `get_taux_avancement_territoire` dans des services réutilisables, amincir ces primitives, et livrer un outil `synthese_territoire` qui exécute le workflow de synthèse côté serveur en portant son gabarit.

**Architecture:** Deux services Awilix dans `src/server/albert/services/` (`ChantiersReader`, `TauxAvancementTerritoireReader`) sans dépendance au SDK `ai`. Les deux primitives deviennent des adaptateurs sur ces services, à schéma d'entrée et type de sortie inchangés. Le livrable `synthese_territoire` compose les deux services, choisit le gabarit (mono ou comparaison) et le renvoie dans `_output_instructions`. Le prompt système perd la section gabarit, la capacity `synthese` et les patterns qui orchestraient trois appels.

**Tech Stack:** Next.js, Vercel AI SDK (`tool`), Zod, Awilix (module-system maison), Prisma, Vitest + vitest-mock-extended, Evalite.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-10-26-albert-outils-en-trois-couches-design.md`

## Global Constraints

- Toutes les commandes partent de la racine du repo : `pnpm -C apps/pilote-ppg <script>`. pnpm uniquement.
- **Aucun commit sans demande explicite de l'utilisateur.** Les tâches se terminent par une vérification, pas par un commit.
- Nommage : vocabulaire métier en français (chantier, territoire, jalon, synthese, taux d'avancement, meteo, tendance, habilitations), technique en anglais (read, reader, result, params, access, scope, mask, template, tool, create, build). Les champs des sorties d'outils lus par le LLM restent en snake_case français (`resultats`, `territoire_code`, `non_applicable`, `_output_instructions`).
- Pas de variable d'une ou deux lettres. Pas de commentaire dans le code hors `// Given` / `// When` / `// Then` des tests, sauf pour souligner une donnée de test indispensable.
- Tests : `expect(result).toEqual(...)` plutôt que `toHaveLength` + index. Pas de test trivial.
- Les schémas d'entrée de `get_chantiers` et `get_taux_avancement_territoire` et leurs types de sortie (`GetChantiersOutput`, `GetTauxAvancementTerritoireOutput`, `GetTauxAvancementTerritoireResult`) ne changent pas : les evals et le client les importent.
- Lint avant de déclarer une tâche finie : `pnpm -C apps/pilote-ppg lint` (prisma generate + oxlint + tsc + prettier). Tests unitaires : `pnpm -C apps/pilote-ppg test:unit`, scopés au fichier quand c'est possible (`pnpm -C apps/pilote-ppg vitest run --project server-unit <chemin>`).
- Base de test locale : jamais `migrate reset` ; si la base est injoignable, demander à l'utilisateur de vérifier Docker.
- Hors périmètre, ne pas y toucher : multi-territoires, tri/limite, sortie plate, `inclure_indicateurs`, outil `rapport_complet`.

## Review Focus

- `synthese_territoire` sur `NAT-FR` sans sous-territoires : le bloc en retard est non applicable, mais le taux et les chantiers en difficulté doivent être rendus normalement — testé en Task 4.
- `get_chantiers` sur `NAT-FR`, vue `en_retard`, **avec** `include_sous_territoires=true` : la règle de non-applicabilité ne s'applique pas, la query est appelée — testé en Task 2.
- Synthèse d'un coordinateur sur un territoire hors périmètre (ex. REG-52) : l'avertissement de restriction doit précéder le gabarit dans `_output_instructions` — testé en Task 4.
- `get_chantiers` avec `chantier_ids` dont aucun n'est accessible : message dédié, aucune query exécutée — testé en Task 2 (service) et Task 3 (traduction).
- Conversations persistées antérieures contenant des parts `tool-get_chantiers` avec `non_applicable` : le type `GetChantiersOutput` reste identique, le client les rend sans changement — garanti par la contrainte « types de sortie inchangés », vérifié par `tsc` en Task 3.

---

### Task 1 : `TauxAvancementTerritoireReader` et primitive `get_taux_avancement_territoire`

**Files:**
- Modify: `apps/pilote-ppg/src/server/chantiers/module.ts` (liste `exports`, lignes 184-198)
- Create: `apps/pilote-ppg/src/server/albert/services/TauxAvancementTerritoireReader.ts`
- Modify: `apps/pilote-ppg/src/server/albert/tools/getTauxAvancementTerritoire.ts`
- Modify: `apps/pilote-ppg/src/server/albert/module.ts`

**Interfaces:**
- Consumes : `RecupererTauxAvancementTerritoireQuery.executePourTerritoires({ territoireCodes, jalon })`, `RecupererStatistiquesAvancementChantiersUseCase.run(chantierIds, maille, habilitations, jalon)`, `TerritoireResolver.resoudre(code, includeSousTerritoires)`.
- Produces :
  ```ts
  export type ReadTauxAvancementParams = { territoireCode: string; jalon: number; includeSousTerritoires: boolean };
  export type TauxAvancementTerritoireResult = {
    territoire_code: string; jalon: number; taux_avancement_global: string;
    mediane_repartition: string; position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null;
  };
  export class TauxAvancementTerritoireReader {
    constructor(deps: {
      prisma: PrismaPilote; territoireResolver: TerritoireResolver;
      recupererTauxAvancementTerritoireQuery: RecupererTauxAvancementTerritoireQuery;
      récupérerStatistiquesAvancementChantiersUseCase: RecupererStatistiquesAvancementChantiersUseCase;
    });
    execute(params: ReadTauxAvancementParams, habilitations: Habilitations): Promise<TauxAvancementTerritoireResult[]>;
  }
  ```
  Le fichier outil garde `export type GetTauxAvancementTerritoireResult = TauxAvancementTerritoireResult` et `createGetTauxAvancementTerritoireTool({ tauxAvancementTerritoireReader })` → `({ habilitations })` → `tool`.

Pas de test unitaire dédié : la logique est déplacée à l'identique et couverte par l'eval de niveau 2 `getTauxAvancementTerritoire.eval.ts` (Task 7).

- [ ] **Step 1 : exporter les deux dépendances du module `chantiers`**

Ajouter `"recupererTauxAvancementTerritoireQuery"` et `"récupérerStatistiquesAvancementChantiersUseCase"` à `exports` dans `src/server/chantiers/module.ts`.

- [ ] **Step 2 : créer `TauxAvancementTerritoireReader`**

Déplacer dans `execute` le corps actuel de `getTauxAvancementTerritoire.ts` (lignes 80-165), `formatPourcentage` et le type résultat. Remplacer les deux `chantiersContainer.resolve(...)` par les dépendances injectées. Supprimer l'import de `getContainer`.

- [ ] **Step 3 : réécrire la primitive**

`createGetTauxAvancementTerritoireTool({ tauxAvancementTerritoireReader })` ; `execute` appelle le reader puis renvoie `{ resultats, _output_instructions: getOutputInstructions() }`. Description : retirer les trois phrases « Cette règle s'applique aussi pour les comparaisons entre jalons … par parent et par jalon. » ; garder le reste.

- [ ] **Step 4 : câbler dans `albert/module.ts`**

Ajouter `tauxAvancementTerritoireReader: TauxAvancementTerritoireReader` au cradle (`asModuleClass`). La fabrique reçoit le reader par le cradle, rien d'autre à changer dans `AssistantIA`.

- [ ] **Step 5 : vérifier**

Run : `pnpm -C apps/pilote-ppg lint`
Expected : aucun échec tsc ni oxlint.

---

### Task 2 : `ChantiersReader` et son test unitaire

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/services/ChantiersReader.ts`
- Test: `apps/pilote-ppg/src/server/albert/__tests__/services/ChantiersReader.unit.test.ts`

**Interfaces:**
- Consumes : `GetChantiersQuery.execute(params: GetChantiersParams): Promise<GetChantiersResult>`, `TerritoireResolver.resoudre`.
- Produces :
  ```ts
  export type ReadChantiersParams = {
    territoireCode: string; jalon: number; includeSousTerritoires: boolean;
    chantierIds?: string[]; view?: "all" | "en_retard" | "en_difficulte";
    tendance?: "HAUSSE" | "BAISSE" | "STAGNATION"; meteo?: "SOLEIL" | "COUVERT" | "NUAGE" | "ORAGE";
  };
  export type AccessScope = { territoiresAccessibles: string[]; chantiersAccessibles: string[] };
  export type ReadChantiersResult =
    | { kind: "resultats"; resultats: GetChantiersResult[]; restrictedTerritoires: string[] }
    | { kind: "notApplicable"; raison: string }
    | { kind: "noAccessibleChantier" };
  export const NON_APPLICABLE_EN_RETARD_NAT_FR: string; // texte actuel de getChantiers.ts:62-63
  export class ChantiersReader {
    constructor(deps: { getChantiersQuery: GetChantiersQuery; territoireResolver: TerritoireResolver });
    execute(params: ReadChantiersParams, access: AccessScope): Promise<ReadChantiersResult>;
  }
  ```

- [ ] **Step 1 : écrire le test**

Fixtures : `mock<GetChantiersQuery>` et `mock<TerritoireResolver>` (vitest-mock-extended), un `GetChantiersResult` minimal par territoire avec un chantier portant `tendance: "HAUSSE"`, `synthese: { meteo: "SOLEIL", commentaire: "texte", date_meteo: "d", date_commentaire: "d" }`, `commentaires: { donnees: { contenu: "c", date: "d" }, autresResultats: null }`, `est_en_retard: true`.

```ts
describe("ChantiersReader", () => {
  test("rend notApplicable pour la vue en_retard au national sans sous-territoires", ...)
    // Then expect(result).toEqual({ kind: "notApplicable", raison: NON_APPLICABLE_EN_RETARD_NAT_FR }); expect(query.execute).not.toHaveBeenCalled();
  test("interroge la query pour la vue en_retard au national avec sous-territoires", ...)
    // Given resoudre → ["NAT-FR", "REG-53"] ; Then result.kind === "resultats" et query.execute appelée 2 fois
  test("rend noAccessibleChantier quand aucun chantier demandé n'est accessible", ...)
    // Given chantierIds ["CH-001"], chantiersAccessibles ["CH-002"] ; Then toEqual({ kind: "noAccessibleChantier" }), query non appelée
  test("ne passe à la query que les chantiers accessibles et les filtres", ...)
    // Given chantierIds ["CH-001","CH-002"], accessibles ["CH-002"], view "en_difficulte", tendance "BAISSE", meteo "ORAGE"
    // Then expect(query.execute).toHaveBeenCalledWith({ territoireCode: "REG-53", jalon: 2025, chantierIds: ["CH-002"], view: "en_difficulte", tendance: "BAISSE", meteo: "ORAGE" })
  test("masque les données d'un territoire hors périmètre et le liste dans restrictedTerritoires", ...)
    // Given resoudre → ["REG-53", "REG-52"], territoiresAccessibles ["REG-53"]
    // Then le chantier de REG-52 a tendance null, est_en_retard false, est_en_difficulte false, synthese.commentaire null, date_commentaire null, commentaires { donnees: null, autresResultats: null } ; celui de REG-53 est intact ; restrictedTerritoires toEqual(["REG-52"])
});
```

- [ ] **Step 2 : lancer le test, vérifier l'échec**

Run : `pnpm -C apps/pilote-ppg vitest run --project server-unit src/server/albert/__tests__/services/ChantiersReader.unit.test.ts`
Expected : FAIL, module `services/ChantiersReader` introuvable.

- [ ] **Step 3 : implémenter `ChantiersReader`**

Déplacer de `getChantiers.ts` : `NON_APPLICABLE_EN_RETARD_NAT_FR`, `toQueryParams` (renommé `toQueryParams(params, territoireCode)` sur `ReadChantiersParams`), `masquerDonneesNonAccessibles` renommé `maskRestrictedData` (fonction locale). `execute` suit les six étapes de la spec §1 ; `restrictedTerritoires` = codes des résultats absents de `territoiresAccessibles`, dédoublonnés, dans l'ordre des résultats.

- [ ] **Step 4 : lancer le test, vérifier le succès**

Run : même commande.
Expected : 5 tests PASS.

---

### Task 3 : primitive `get_chantiers` sur le reader

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/tools/restrictionWarning.ts`
- Modify: `apps/pilote-ppg/src/server/albert/tools/getChantiers.ts`
- Modify: `apps/pilote-ppg/src/server/albert/module.ts`
- Test: `apps/pilote-ppg/src/server/albert/__tests__/tools/getChantiers.unit.test.ts`

**Interfaces:**
- Consumes : `ChantiersReader` (Task 2).
- Produces :
  ```ts
  // restrictionWarning.ts
  export function buildRestrictionWarning(restrictedTerritoires: string[]): string;
  // "" si vide ; sinon le texte actuel de getChantiers.ts:93 (« ⚠️ Restriction d'accès — territoires X, Y : … dans ta réponse quand ces champs sont retournés.\n\n »)
  // getChantiers.ts
  export const getChantiersInputSchema; // inchangé
  export type GetChantiersOutput; // inchangé
  export function createGetChantiersTool({ chantiersReader }: { chantiersReader: ChantiersReader }):
    ({ territoiresAccessibles, chantiersAccessibles }: AccessScope) => Tool;
  ```

- [ ] **Step 1 : écrire le test**

Même squelette que `getChantiersSignales.unit.test.ts` (`buildTool` avec `mock<ChantiersReader>`, `executeTool` qui appelle `tool.execute!`).

```ts
describe("createGetChantiersTool execute", () => {
  test("traduit notApplicable en non_applicable avec une liste vide", ...)
    // Then toEqual({ resultats: [], non_applicable: { raison: "r" }, _output_instructions: expect.stringContaining("non_applicable.raison") })
  test("traduit noAccessibleChantier en message dédié", ...)
    // Then toEqual({ resultats: [], _output_instructions: "Aucun des chantiers demandés n'est accessible pour cet utilisateur." })
  test("rend les résultats avec l'instruction neutre, identique quelle que soit la vue", ...)
    // Given reader → { kind: "resultats", resultats: [r], restrictedTerritoires: [] } ; deux appels, view "all" puis "en_retard"
    // Then les deux _output_instructions sont strictement égales et ne commencent pas par "⚠️"
  test("préfixe l'avertissement de restriction quand des territoires sont restreints", ...)
    // Given restrictedTerritoires ["REG-52"] ; Then _output_instructions commence par "⚠️ Restriction d'accès — territoires REG-52"
  test("passe le flag include_sous_territoires et l'accès au reader", ...)
    // Then expect(reader.execute).toHaveBeenCalledWith({ territoireCode: "REG-53", jalon: 2025, includeSousTerritoires: true, chantierIds: undefined, view: "all", tendance: undefined, meteo: undefined }, { territoiresAccessibles: ["REG-53"], chantiersAccessibles: ["CH-001"] })
});
```

- [ ] **Step 2 : lancer le test, vérifier l'échec**

Run : `pnpm -C apps/pilote-ppg vitest run --project server-unit src/server/albert/__tests__/tools/getChantiers.unit.test.ts`
Expected : FAIL (la fabrique attend encore `getChantiersQuery`).

- [ ] **Step 3 : implémenter**

`restrictionWarning.ts` puis `getChantiers.ts` : supprimer `getOutputInstructions`, `toQueryParams`, `masquerDonneesNonAccessibles`, la constante NAT-FR et les imports devenus inutiles. Constante `OUTPUT_INSTRUCTIONS` avec le texte de la spec §2 (« Présente les chantiers retournés … jamais les codes internes. »). `execute` : `switch (result.kind)`. Description : retirer les trois phrases sur les comparaisons entre jalons. Dans `albert/module.ts`, enregistrer `chantiersReader: ChantiersReader` (`asModuleClass`).

- [ ] **Step 4 : lancer le test, vérifier le succès**

Run : même commande.
Expected : 5 tests PASS.

- [ ] **Step 5 : vérifier**

Run : `pnpm -C apps/pilote-ppg lint`
Expected : vert, en particulier `tsc` sur `evals/3-scenarios/groundTruth.ts` et `src/client/.../SourcesConsultees.tsx` qui importent `GetChantiersOutput`.

---

### Task 4 : livrable `synthese_territoire`

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/tools/syntheseTerritoireTemplates.ts`
- Create: `apps/pilote-ppg/src/server/albert/tools/syntheseTerritoire.ts`
- Modify: `apps/pilote-ppg/src/server/albert/module.ts`
- Modify: `apps/pilote-ppg/src/server/albert/AssistantIA.ts` (`construireTools`)
- Test: `apps/pilote-ppg/src/server/albert/__tests__/tools/syntheseTerritoire.unit.test.ts`

**Interfaces:**
- Consumes : `ChantiersReader`, `TauxAvancementTerritoireReader`, `buildRestrictionWarning`.
- Produces :
  ```ts
  // syntheseTerritoireTemplates.ts
  export const SYNTHESE_MONO_TERRITOIRE_TEMPLATE: string; // bloc <mono_territoire> actuel de systemPrompt.ts, sans la balise, instructions + template
  export const SYNTHESE_COMPARAISON_TEMPLATE: string;     // bloc <comparaison> actuel
  export function buildSyntheseInstructions(params: {
    nombreTerritoires: number; nonApplicableEnRetard: boolean; restrictedTerritoires: string[];
  }): string;
  // syntheseTerritoire.ts
  export const syntheseTerritoireInputSchema = z.object({ territoire_code, jalon, include_sous_territoires }); // descriptions copiées de getChantiers.ts
  export type SyntheseTerritoireOutput = {
    taux_avancement: GetTauxAvancementTerritoireResult[];
    chantiers_en_retard: GetChantiersResult[];
    chantiers_en_difficulte: GetChantiersResult[];
    non_applicable_en_retard?: { raison: string };
    _output_instructions: string;
  };
  export function createSyntheseTerritoireTool({ chantiersReader, tauxAvancementTerritoireReader }):
    ({ habilitations }: { habilitations: Habilitations }) => Tool;
  ```
  `buildSyntheseInstructions` = `buildRestrictionWarning(restrictedTerritoires)` + (si `nonApplicableEnRetard`) « L'analyse des chantiers en retard n'est pas applicable sur ce périmètre : dans la section « Chantiers en retard », reprends fidèlement la raison fournie dans `non_applicable_en_retard.raison`. N'écris pas « aucun chantier en retard ».\n\n » + template mono si `nombreTerritoires === 1`, comparaison sinon. Les templates perdent la phrase « Ce gabarit s'applique UNIQUEMENT… » et la section `<selection>` ; les phrases « Ce template s'applique quand les résultats des outils contiennent UN SEUL / PLUSIEURS territoires » sont retirées aussi (le choix est fait côté serveur).

- [ ] **Step 1 : écrire le test**

```ts
describe("createSyntheseTerritoireTool execute", () => {
  test("rend les trois blocs et le gabarit mono-territoire pour un seul territoire", ...)
    // Given taux reader → [t1] ; chantiers reader → resultats [r] pour en_retard, [] pour en_difficulte
    // Then toEqual({ taux_avancement: [t1], chantiers_en_retard: [r], chantiers_en_difficulte: [], _output_instructions: expect.stringContaining("# Synthèse pour") }) ; et not.stringContaining("# Comparaison")
  test("choisit le gabarit comparaison pour plusieurs territoires", ...)
    // Given taux reader → [t1, t2] ; Then _output_instructions contient "# Comparaison" et pas "# Synthèse pour"
  test("propage non_applicable_en_retard au national sans sous-territoires en rendant les deux autres blocs", ...)
    // Given chantiers reader → { kind: "notApplicable", raison: "r" } pour en_retard, resultats [r2] pour en_difficulte
    // Then chantiers_en_retard toEqual([]), non_applicable_en_retard toEqual({ raison: "r" }), chantiers_en_difficulte toEqual([r2]), _output_instructions contient "non_applicable_en_retard.raison"
  test("préfixe l'avertissement de restriction avec l'union des territoires restreints", ...)
    // Given en_retard restrictedTerritoires ["REG-52"], en_difficulte ["REG-52", "DEPT-44"]
    // Then _output_instructions commence par "⚠️ Restriction d'accès — territoires REG-52, DEPT-44"
  test("appelle les readers avec le même périmètre et les deux vues", ...)
    // Then chantiersReader.execute appelé avec view "en_retard" puis "en_difficulte", mêmes territoireCode/jalon/includeSousTerritoires, access dérivé de habilitations.lecture
});
```

- [ ] **Step 2 : lancer le test, vérifier l'échec**

Run : `pnpm -C apps/pilote-ppg vitest run --project server-unit src/server/albert/__tests__/tools/syntheseTerritoire.unit.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : implémenter templates, outil, câblage**

Description de l'outil : texte de la spec §3. `execute` : `Promise.all` des trois lectures ; `noAccessibleChantier` ne peut pas survenir (pas de `chantierIds`), le traiter comme une liste vide. Dans `albert/module.ts` : `createSyntheseTerritoireTool` (`asModuleFunction`). Dans `AssistantIA.construireTools` : `synthese_territoire: container.resolve("createSyntheseTerritoireTool")({ habilitations })`, toujours exposé.

- [ ] **Step 4 : lancer le test, vérifier le succès**

Run : même commande.
Expected : 5 tests PASS.

- [ ] **Step 5 : vérifier**

Run : `pnpm -C apps/pilote-ppg lint`
Expected : vert.

---

### Task 5 : client, le livrable est une source consultée

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/PiloteUIMessage.ts` (`PiloteUITools`)
- Modify: `apps/pilote-ppg/src/client/components/_commons/ChatUI/SourcesConsultees.tsx` (`SourceToolPart`, `LIBELLES`)
- Modify: `apps/pilote-ppg/src/client/components/_commons/ChatUI/AssistantMessageText.tsx` (`TOOL_NAMES`)

**Interfaces:**
- Consumes : `syntheseTerritoireInputSchema`, `SyntheseTerritoireOutput` (Task 4).

Pas de test client : les composants voisins n'en ont pas.

- [ ] **Step 1 : typer l'outil côté UI**

Dans `PiloteUITools`, ajouter `synthese_territoire: { input: z.input<typeof syntheseTerritoireInputSchema>; output: SyntheseTerritoireOutput }`.

- [ ] **Step 2 : l'afficher comme source**

`SourcesConsultees.tsx` : ajouter `"tool-synthese_territoire"` à l'union de `SourceToolPart` et `"tool-synthese_territoire": "Synthèse territoriale"` à `LIBELLES`. `AssistantMessageText.tsx` : ajouter `"synthese_territoire"` à `TOOL_NAMES`.

- [ ] **Step 3 : vérifier**

Run : `pnpm -C apps/pilote-ppg lint`
Expected : vert (le `Record<SourceToolPart["type"], string>` force la cohérence).

---

### Task 6 : prompt système et détection d'intention

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/systemPrompt.ts`
- Modify: `apps/pilote-ppg/src/server/albert/detecteurIntention.ts`
- Test: `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.unit.test.ts`
- Test: `apps/pilote-ppg/src/server/albert/__tests__/detecteurIntention.unit.test.ts`

**Interfaces:**
- Produces : `Capacities = { dashboard: boolean; exportRapport: boolean; inclureSousTerritoires: boolean }` ; `buildChatSystemPrompt` inchangé en signature. `AssistantIA` ne construit pas de `Capacities` à la main (il propage `detecterCapacities`) : aucun changement attendu, `tsc` le confirme.

- [ ] **Step 1 : adapter les tests**

`detecteurIntention.unit.test.ts` : supprimer les trois cas « détecte une demande de synthèse… » ; retirer `synthese` des objets attendus des autres cas. `systemPrompt.unit.test.ts` : retirer `synthese: false` des capacities ; ajouter :

```ts
it("route la synthèse vers synthese_territoire sans gabarit dans le prompt", () => {
  const prompt = buildChatSystemPrompt({ territoiresAccessibles: ["NAT-FR"], agentContext: null, capacities: { dashboard: false, exportRapport: false, inclureSousTerritoires: false } });
  expect(prompt).toContain("synthese_territoire");
  expect(prompt).not.toContain("Gabarit de synthèse territoriale");
  expect(prompt).not.toContain("get_chantiers(view='en_retard'), get_chantiers(view='en_difficulte')");
});
```

- [ ] **Step 2 : lancer les tests, vérifier l'échec**

Run : `pnpm -C apps/pilote-ppg vitest run --project server-unit src/server/albert/__tests__/systemPrompt.unit.test.ts src/server/albert/__tests__/detecteurIntention.unit.test.ts`
Expected : FAIL (tsc sur `Capacities`, et le nouveau cas).

- [ ] **Step 3 : réécrire le prompt et la détection**

`detecteurIntention.ts` : supprimer `MOTS_CLES_SYNTHESE` et `Capacities.synthese`. `systemPrompt.ts` :
- supprimer `GABARIT_SYNTHESE_TERRITORIALE`, `consigneSyntheseWorkflow`, `gabaritSection` et leur interpolation finale ;
- pattern a : protocole en deux points — « 1. Appelle `synthese_territoire` (avec `include_sous_territoires=true` si la demande couvre les sous-territoires). 2. Suis le gabarit fourni dans ses `_output_instructions`. N'appelle pas `get_chantiers` ni `get_taux_avancement_territoire` en plus pour le même périmètre. » ;
- pattern c : étape 1 « Appelle `synthese_territoire` » ; étapes 2-4 inchangées ;
- section « Export de rapport » point 1 : « … ou appelle `synthese_territoire` si l'utilisateur demande un rapport complet directement » ;
- section « Sous-territoires détectés » : « pour CHAQUE appel à `get_taux_avancement_territoire`, `get_chantiers` ou `synthese_territoire` » ;
- ligne 534 (`search_territoires`) : ajouter `synthese_territoire` à la liste des destinataires du code.
Le reste du prompt est inchangé.

- [ ] **Step 4 : lancer les tests, vérifier le succès**

Run : même commande.
Expected : PASS.

- [ ] **Step 5 : vérifier l'ensemble**

Run : `pnpm -C apps/pilote-ppg lint && pnpm -C apps/pilote-ppg test:unit`
Expected : vert.

---

### Task 7 : evals de niveau 2

**Files:**
- Modify: `apps/pilote-ppg/evals/2-tools/2.2-donnees/getChantiers.eval.ts`
- Modify: `apps/pilote-ppg/evals/2-tools/2.2-donnees/getTauxAvancementTerritoire.eval.ts`
- Create: `apps/pilote-ppg/evals/2-tools/2.2-donnees/syntheseTerritoire.eval.ts`

**Interfaces:**
- Consumes : `toolSelectionEval({ famille: "donnees", tool, cases })`, `ToolCase` (`expected`, `forbidden`).

- [ ] **Step 1 : interdire le livrable sur les cas ciblés**

`getChantiers.eval.ts` : ajouter `forbidden: ["synthese_territoire"]` aux cas « Quels chantiers en retard sur la Corse ? », « Quels PPG en retard en Corse ? », « Quels chantiers sont en baisse en Bretagne ? », « Où en est le CH-005 en Bretagne ? ». Laisser « Récap des chantiers sur l'Auvergne » sans `forbidden` et mettre à jour sa `reason` : « « récap des chantiers » est une liste ; le livrable n'est pas interdit ». Mettre à jour le commentaire d'en-tête (les `view` ne viennent plus d'un gabarit). `getTauxAvancementTerritoire.eval.ts` : `forbidden: ["synthese_territoire"]` sur « Quel est le taux d'avancement de la Bretagne ? » et « Quel est le TA de la Normandie ? ».

- [ ] **Step 2 : créer la suite du livrable**

```ts
const CASES: ToolCase[] = [
  { question: "Fais-moi la synthèse de la Bretagne", reason: "mot « synthèse »", expected: [{ toolName: "synthese_territoire" }], forbidden: ["get_chantiers", "get_taux_avancement_territoire"] },
  { question: "Donne-moi un état des lieux de la Bretagne", reason: "« état des lieux »", expected: [{ toolName: "synthese_territoire" }], forbidden: [...] },
  { question: "Résume la situation en Bretagne", reason: "« résume »", expected: [{ toolName: "synthese_territoire" }], forbidden: [...] },
  { question: "Fais-moi la synthèse de la Bretagne et de ses départements", reason: "sous-territoires : flag sur le parent", expected: [{ toolName: "synthese_territoire", input: { include_sous_territoires: true } }] },
  { question: "Quels chantiers en retard en Bretagne ?", reason: "CAS NÉGATIF : une seule catégorie → get_chantiers", forbidden: ["synthese_territoire"] },
  { question: "Quel est le taux d'avancement de la Bretagne ?", reason: "CAS NÉGATIF : le seul taux → get_taux_avancement_territoire", forbidden: ["synthese_territoire"] },
  { question: "Où en est le CH-005 en Bretagne ?", reason: "CAS NÉGATIF : chantier précis", forbidden: ["synthese_territoire"] },
];
toolSelectionEval({ famille: "donnees", tool: "synthese_territoire", cases: CASES });
```

- [ ] **Step 3 : lancer les trois suites**

Run : `pnpm -C apps/pilote-ppg eval evals/2-tools/2.2-donnees/syntheseTerritoire.eval.ts evals/2-tools/2.2-donnees/getChantiers.eval.ts evals/2-tools/2.2-donnees/getTauxAvancementTerritoire.eval.ts`
Expected : la suite `synthese_territoire` au-dessus de 80 % sur « Outils attendus » ; les deux autres sans baisse par rapport à leur dernier score noté. Noter les scores dans le commentaire d'en-tête de chaque suite, à la suite des runs précédents, avec la date.

---

### Task 8 : evals de niveau 3

**Files:**
- Modify: `apps/pilote-ppg/evals/3-scenarios/evidence.ts` (`OUTILS_QUI_MASQUENT`, `maskedTerritories`)
- Modify: `apps/pilote-ppg/evals/3-scenarios/criteria/commentaires.ts` (`contenusDesCommentairesRecus`)
- Modify: `apps/pilote-ppg/evals/3-scenarios/3.1-synthese/syntheseTerritoire.eval.ts`
- Modify: `apps/pilote-ppg/evals/3-scenarios/3.1-synthese/syntheseDepartements.eval.ts`
- Modify: `apps/pilote-ppg/evals/3-scenarios/3.1-synthese/syntheseDifficultes.eval.ts`
- Modify: `apps/pilote-ppg/evals/3-scenarios/3.1-synthese/rapportComplet.eval.ts`

**Interfaces:**
- Consumes : `SyntheseTerritoireOutput` (Task 4), `scenarioEval` cases avec `expected` et `forbidden`.

- [ ] **Step 1 : lire la sortie du livrable dans l'outillage**

`evidence.ts` : `maskedTerritories` lit, pour `toolName === "synthese_territoire"`, les `territoire_code` de `chantiers_en_retard` et `chantiers_en_difficulte` ; les autres outils gardent `resultats`. Mettre `synthese_territoire` dans `OUTILS_QUI_MASQUENT` et adapter le commentaire. `commentaires.ts` : pour `synthese_territoire`, concaténer `chantiers_en_retard` et `chantiers_en_difficulte` et appliquer la même extraction que pour `get_chantiers`.

- [ ] **Step 2 : réécrire les attentes des suites de synthèse**

Dans `syntheseTerritoire`, `syntheseDepartements`, `syntheseDifficultes` : remplacer `workflowSynthese(code)` / le triplet par `[{ toolName: "synthese_territoire", input: { territoire_code } }]` (avec `include_sous_territoires: true` pour `syntheseDepartements`) et ajouter `forbidden: ["get_chantiers", "get_taux_avancement_territoire"]` à chaque cas. Dans `rapportComplet`, cas 1 : remplacer les trois premiers appels attendus par `{ toolName: "synthese_territoire", input: territoire }`, sans `forbidden` ; cas 2 inchangé. Mettre à jour les commentaires d'en-tête qui décrivent le triplet ou le mot-clé « synthèse » (notamment `syntheseDifficultes` : « suit le workflow de synthèse que déclenche le mot « synthèse » » devient « passe par `synthese_territoire` »).

- [ ] **Step 3 : vérifier le typage**

Run : `pnpm -C apps/pilote-ppg lint`
Expected : vert.

- [ ] **Step 4 : relancer les suites touchées**

Run : `pnpm -C apps/pilote-ppg eval evals/3-scenarios/3.1-synthese`
Expected : « Outils attendus » à 100 % sur `syntheseTerritoire`, `syntheseDepartements`, `syntheseDifficultes` (un seul appel, déterministe) ; `rapportComplet` sans baisse ; forme et fond sans baisse par rapport au run du 2026-10-14 noté dans chaque en-tête. Noter les scores et les échecs dans l'en-tête de chaque suite, au format des runs précédents (« Run du 2026-10-26, juge … : outils X %, forme Y %, fond Z % ; échecs : … »).

- [ ] **Step 5 : contrôle de non-régression sur la comparaison**

Run : `pnpm -C apps/pilote-ppg eval evals/3-scenarios/3.2-comparaison/comparerDepartements.eval.ts`
Expected : « Outils attendus » sans baisse. Si le LLM appelle `synthese_territoire` à la place de `get_taux_avancement_territoire`, le noter dans l'en-tête sans changer l'attente : c'est un signal à lire, pas une régression à masquer.

---

### Task 9 : vérification finale

- [ ] **Step 1 : tout relancer**

Run : `pnpm -C apps/pilote-ppg lint && pnpm -C apps/pilote-ppg test:unit && pnpm -C apps/pilote-ppg test:server:integration`
Expected : vert (l'échec préexistant de `MinistèreSQLRepository` est connu et hors périmètre).

- [ ] **Step 2 : relire le diff contre la spec**

Vérifier : aucun `getContainer` dans `src/server/albert/tools/getTauxAvancementTerritoire.ts` ; aucune occurrence de `GABARIT_SYNTHESE_TERRITORIALE` ni de `capacities.synthese` dans `src/` ; `grep -rn "synthese_territoire" src evals` liste bien `AssistantIA`, `PiloteUIMessage`, `SourcesConsultees`, `AssistantMessageText`, `systemPrompt`, `evidence`, `commentaires` et les suites.

- [ ] **Step 3 : rendre compte**

Tableau fait / reste à l'utilisateur, avec les scores d'evals avant / après. Proposer de lancer `pnpm test:e2e` (cross-cutting), sans le lancer. Ne pas commiter.
