# Encart de synthèse et de comparaison d'Albert — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** deux outils (`rediger_synthese_territoire`, `rediger_comparaison_territoires`) collectent eux-mêmes les données, font rédiger l'ancien gabarit par un sous-agent et streament le markdown dans un encart « note administrative ».

**Architecture:** les outils réutilisent la collecte de `get_taux_avancement_territoire` et `get_chantiers` (extraite en fonctions), lancent un sous-agent en streaming via `Albert.streamSubagentText`, et leur `execute` est un `async function*` qui `yield` un `EncartOutput` à chaque morceau. `toModelOutput` ne rend que le markdown au modèle principal. Côté client, un composant `EncartSynthese` rend la part d'outil, résultats intermédiaires compris.

**Tech Stack:** AI SDK `ai` 7.0.93, Zod 4, Awilix, Next.js / React, Tailwind + DSFR, Vitest, Evalite.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-10-27-albert-encart-synthese-design.md`

## Global Constraints

- Noms d'outils exacts : `rediger_synthese_territoire`, `rediger_comparaison_territoires`.
- Comparaison : `territoire_codes` de 2 à 5, **ou** `territoire_code` + `include_sous_territoires: true` (sans limite).
- Gabarit : « Niveau de confiance » à la place de « Météo » ; aucun `&nbsp;`, aucun `\` de fin de ligne, aucun HTML ; « Commentaire non accessible (restriction d'accès) » sur un commentaire masqué ; « Pas de commentaire disponible » sinon ; maille nommée selon le territoire.
- Encart : en-tête « Synthèse territoriale » / « Comparaison territoriale », « Jalon {jalon} », date de rédaction, « À partir des données publiées dans PILOTE » ; liseré bleu France de 5 px ; « Rédaction en cours… » tant que la rédaction n'est pas terminée ; débord d'environ 64 px de chaque côté sur grand écran.
- Après l'encart, le modèle principal écrit une seule phrase.
- Conventions du repo : exports nommés, paramètres en objet, `expect(...).toEqual(...)`, commentaires de test given/when/then seulement, pas de variable d'1 ou 2 caractères, textes en français, commits `feat(PIL-1900): …` terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Tests depuis `apps/pilote-ppg` : `pnpm vitest run <fichier>` ; types : `pnpm tsc --noEmit` (après `DOTENV_CONFIG_PATH=.env.test pnpm prisma generate` si besoin).

## Review Focus

1. **Historique de conversation** : au tour suivant, `convertToModelMessages` doit appliquer `toModelOutput`, sinon le modèle principal relit les données brutes (commentaires compris). Testé en Task 4.
2. **Evals non streamées** : `generateText` doit retenir le dernier `yield`, pas le premier (markdown vide). Testé en Task 4.
3. **Aucun chantier accessible** : pas de sous-agent, pas d'encart, accès refusé rendu au modèle. Testé en Tasks 4 et 6.
4. **NAT-FR** : la vue `en_retard` est `non_applicable` ; le sous-agent doit le dire, pas lister. Testé en Task 4 (données passées) et couvert par le gabarit (Task 3).
5. **Rechargement** : une part `output-available` sans `preliminary` et `termine: true` s'affiche sans « Rédaction en cours… ». Testé en Task 6.

---

### Task 1: Extraire la collecte des outils de données

**Files:**
- Modify: `src/server/albert/tools/getChantiers.ts`
- Modify: `src/server/albert/tools/getTauxAvancementTerritoire.ts`
- Test: `src/server/albert/__tests__/tools/getChantiers.unit.test.ts`, `src/server/albert/__tests__/tools/getTauxAvancementTerritoire.unit.test.ts` (existants, inchangés)

**Interfaces:**
- Produces:
  - `export async function collecterChantiers({ input, getChantiersQuery, territoireResolver, territoiresAccessibles, chantiersAccessibles }: { input: GetChantiersInput; getChantiersQuery: GetChantiersQuery; territoireResolver: TerritoireResolver; territoiresAccessibles: string[]; chantiersAccessibles: string[] }): Promise<GetChantiersOutput>` — le corps actuel de `execute` de `get_chantiers` (NAT-FR, accès refusé, résolution, masquage).
  - `export async function collecterTauxAvancement({ input, territoireResolver, getTerritoiresIdentiteQuery, habilitations }: { input: { territoire_code: string; jalon: number; include_sous_territoires?: boolean }; territoireResolver: TerritoireResolver; getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery; habilitations: Habilitations }): Promise<GetTauxAvancementTerritoireOutput>` — le corps actuel de `execute` de `get_taux_avancement_territoire`.
  - `export type GetChantiersInput` (déjà inféré du schéma ; l'exporter s'il ne l'est pas).

- [ ] **Step 1: Déplacer chaque corps d'`execute` dans la fonction exportée, `execute` l'appelle.** Refactor pur : aucun comportement ne change.
- [ ] **Step 2: Lancer les tests existants.** Run: `pnpm vitest run src/server/albert/__tests__/tools/getChantiers.unit.test.ts src/server/albert/__tests__/tools/getTauxAvancementTerritoire.unit.test.ts` — Expected: PASS (7 tests).
- [ ] **Step 3: Commit** `refactor(PIL-1900): collecte des chantiers et du taux réutilisable hors des outils`.

### Task 2: Streaming d'un sous-agent et historique avec `toModelOutput`

**Files:**
- Modify: `src/server/albert/Albert.ts`

**Interfaces:**
- Produces: `static streamSubagentText({ systemPrompt, prompt, abortSignal }: { systemPrompt: string; prompt: string; abortSignal?: AbortSignal }): AsyncIterable<string>` — `aiStreamText` avec `createModel(DEFAULT_MODEL)`, `temperature: TEMPERATURE_STREAM_TEXT`, sans outils ni persistance ; renvoie `result.textStream`.
- Change: dans `Albert.streamText` et `Albert.generateText`, `convertToModelMessages(messages, { tools })` (aujourd'hui sans `tools`) : c'est ce qui applique `toModelOutput` à l'historique.

- [ ] **Step 1: Implémenter les deux changements.** Pas de test unitaire sur ce wrapper fin : il est couvert par les tests de la Task 4 (mock) et par la mesure de la Task 8.
- [ ] **Step 2: Vérifier les types.** Run: `pnpm tsc --noEmit` — Expected: aucune erreur.
- [ ] **Step 3: Commit** `feat(PIL-1900): streaming d'un sous-agent et historique converti avec les outils`.

### Task 3: Les gabarits du sous-agent

**Files:**
- Create: `src/server/albert/subagents/encartSystemPrompts.ts`
- Test: `src/server/albert/__tests__/subagents/encartSystemPrompts.unit.test.ts`

**Interfaces:**
- Produces: `export function buildSyntheseTerritoireSystemPrompt(): string` et `export function buildComparaisonTerritoiresSystemPrompt(): string`.

Source du contenu : `GABARIT_SYNTHESE_TERRITORIALE` de `git show dev:apps/pilote-ppg/src/server/albert/systemPrompt.ts` (balises `<mono_territoire>` et `<comparaison>`), adapté selon les Global Constraints. Chaque prompt commence par « Reasoning: medium », dit au sous-agent qu'il reçoit les données en JSON dans le message et ne doit citer qu'elles, reprend les règles « français ; pas d'opinion, de recommandation ni de causalité absente des données », et explique : NAT-FR sans analyse « en retard » (`non_applicable`) → l'écrire au lieu de lister ; vue vide → « aucun chantier » ; `acces_restreint` → commentaire non accessible ; maille → « du département », « de la région », « national ». La comparaison sépare chantiers communs à au moins 2 territoires et chantiers propres à chacun.

- [ ] **Step 1: Écrire les tests.**

```ts
describe.each([
  ["synthèse", buildSyntheseTerritoireSystemPrompt],
  ["comparaison", buildComparaisonTerritoiresSystemPrompt],
])("gabarit de %s", (_nom, build) => {
  it("parle de niveau de confiance, jamais de météo", () => {
    // When
    const prompt = build();
    // Then
    expect(prompt).toContain("Niveau de confiance");
    expect(prompt).not.toMatch(/m[ée]t[ée]o|SOLEIL|COUVERT|NUAGE|ORAGE/i);
  });
  it("n'utilise aucun bricolage de mise en forme", () => {
    // When
    const prompt = build();
    // Then
    expect(prompt).not.toContain("&nbsp;");
    expect(prompt).not.toMatch(/\\\\$/m);
  });
  it("distingue un commentaire masqué d'un commentaire absent", () => {
    // When
    const prompt = build();
    // Then
    expect(prompt).toContain("Commentaire non accessible (restriction d'accès)");
    expect(prompt).toContain("Pas de commentaire disponible");
  });
});
```

Plus, pour la comparaison : `toContain("Communs à plusieurs territoires")` et `toContain("| Territoire |")`.

- [ ] **Step 2: Lancer, voir échouer.** Run: `pnpm vitest run src/server/albert/__tests__/subagents/encartSystemPrompts.unit.test.ts` — Expected: FAIL, module introuvable.
- [ ] **Step 3: Écrire les deux prompts.**
- [ ] **Step 4: Lancer, voir passer.** Même commande — Expected: PASS.
- [ ] **Step 5: Commit** `feat(PIL-1900): gabarits de synthèse et de comparaison pour le sous-agent`.

### Task 4: Les deux outils

**Files:**
- Create: `src/server/albert/tools/encart.ts` (types + générateur partagés)
- Create: `src/server/albert/tools/redigerSyntheseTerritoire.ts`
- Create: `src/server/albert/tools/redigerComparaisonTerritoires.ts`
- Test: `src/server/albert/__tests__/tools/redigerEncart.unit.test.ts`

**Interfaces:**
- Consumes: `collecterChantiers`, `collecterTauxAvancement` (Task 1), `Albert.streamSubagentText` (Task 2), les deux `build…SystemPrompt` (Task 3).
- Produces, dans `encart.ts` :

```ts
export type DonneesEncart = {
  taux: GetTauxAvancementTerritoireResult[];
  chantiers_en_retard: GetChantiersOutput;
  chantiers_en_difficulte: GetChantiersOutput;
};

export type EncartOutput = {
  type: "synthese" | "comparaison";
  jalon: number;
  /** AAAA-MM-JJ */
  date_redaction: string;
  markdown: string;
  termine: boolean;
  acces_refuse?: true;
  /** Seulement dans le dernier yield : les données lues par le juge des evals. */
  donnees?: DonneesEncart;
};

export async function* redigerEncart(params: {
  type: EncartOutput["type"];
  jalon: number;
  systemPrompt: string;
  donnees: DonneesEncart;
  abortSignal?: AbortSignal;
  maintenant?: Date;
}): AsyncGenerator<EncartOutput>;

export const encartVersModele: ({ output }: { output: EncartOutput }) =>
  { type: "text"; value: string };
```

  - `redigerEncart` : si les deux vues de chantiers ont `acces_refuse`, un seul `yield { …, markdown: "", termine: true, acces_refuse: true }`. Sinon un premier `yield` avec `markdown: ""`, puis un `yield` du markdown accumulé à chaque morceau de `streamSubagentText` (prompt = `JSON.stringify(donnees)`), puis un dernier avec `termine: true` et `donnees`.
  - `encartVersModele` : le markdown ; en cas d'accès refusé, « Accès refusé : l'utilisateur n'a accès à aucun chantier. ».
- `export function createRedigerSyntheseTerritoireTool({ getChantiersQuery, territoireResolver, getTerritoiresIdentiteQuery })` → `({ habilitations }: { habilitations: Habilitations }) => Tool`. Entrée `{ territoire_code: string; jalon: number }` (`jalon` borné comme `get_taux_avancement_territoire`). Collecte le taux et les vues `en_retard` / `en_difficulte` sans sous-territoires, `chantiersAccessibles = habilitations.lecture.chantiers`, `territoiresAccessibles = habilitations.lecture.territoires`. `execute` est un `async function*` qui délègue à `redigerEncart` ; `toModelOutput: encartVersModele`.
- `export function createRedigerComparaisonTerritoiresTool({ … mêmes dépendances })`, même forme. Entrée `{ jalon; territoire_codes?: string[] (2 à 5); territoire_code?: string; include_sous_territoires?: boolean }`, avec un `.refine` : exactement une des deux formes. Avec `territoire_codes`, une collecte par code puis concaténation des `resultats` ; avec `territoire_code`, une seule collecte avec `include_sous_territoires: true`.
- Descriptions selon le modèle de la refonte, avec les exemples du tableau de déclenchement de la spec. « Utilise-le pour » : synthèse ou comparaison générique (dont « la synthèse des difficultés de X », « où en est X », « compare X avec ses départements » pour la comparaison). « Ne l'utilise pas pour » : un critère ciblé, un chantier ou un indicateur précis, « où en sont X et ses départements » → `get_taux_avancement_territoire` ; un rapport → `export_rapport` ; un graphique → `create_dashboard`. Dire que l'interface affiche l'encart : écrire ensuite une seule phrase.

- [ ] **Step 1: Écrire les tests** (mock de `@/server/albert/Albert` : `streamSubagentText` renvoie un itérable de `["# Synthèse", " pour le Nord"]` ; mock de `@/server/dependances` comme dans `getTauxAvancementTerritoire.unit.test.ts` ; `getChantiersQuery` comme dans `getChantiers.unit.test.ts`).
  - `rédige la synthèse en streaming puis rend les données` : les `yield` collectés valent, dans l'ordre, `markdown` `""`, `"# Synthèse"`, `"# Synthèse pour le Nord"`, puis le même avec `termine: true` et `donnees` (`taux`, `chantiers_en_retard`, `chantiers_en_difficulte` attendus en entier, `toEqual`).
  - `passe au sous-agent les données collectées` : le `prompt` reçu par `streamSubagentText` est `JSON.stringify` des `donnees` du dernier `yield`.
  - `sans aucun chantier accessible, ne lance pas le sous-agent` : un seul `yield` `{ type: "synthese", jalon: 2025, date_redaction: "2026-10-27", markdown: "", termine: true, acces_refuse: true }` et `streamSubagentText` jamais appelé.
  - `compare des territoires désignés` : `territoire_codes: ["DEPT-59", "DEPT-33"]` → `donnees.taux` contient les deux territoires.
  - `compare un territoire et ses sous-territoires` : `territoire_code: "REG-76", include_sous_territoires: true` → `territoireResolver.resoudre` appelé avec `("REG-76", true)`.
  - `refuse une entrée qui mélange les deux formes` : `safeParse` du schéma avec `territoire_codes` et `territoire_code` → `success: false`.
  - `ne rend au modèle que le markdown, y compris dans l'historique` : `convertToModelMessages` (de `ai`) sur un message assistant portant une part `tool-rediger_synthese_territoire` `output-available` avec `donnees`, avec `{ tools: { rediger_synthese_territoire: outil } }` → le contenu du résultat d'outil est `{ type: "text", value: "# Synthèse pour le Nord" }`.
  - `generateText retient le dernier yield` : `generateText` avec `MockLanguageModelV4` de `ai/test` qui appelle l'outil puis répond → `steps[0].toolResults[0].output.termine` vaut `true`.
- [ ] **Step 2: Lancer, voir échouer.** Run: `pnpm vitest run src/server/albert/__tests__/tools/redigerEncart.unit.test.ts` — Expected: FAIL, modules introuvables.
- [ ] **Step 3: Implémenter `encart.ts` puis les deux outils.** `date_redaction` : `maintenant ?? new Date()`, formatée en AAAA-MM-JJ.
- [ ] **Step 4: Lancer, voir passer.** Même commande — Expected: PASS (8 tests).
- [ ] **Step 5: Commit** `feat(PIL-1900): outils de rédaction de synthèse et de comparaison en streaming`.

### Task 5: Brancher les outils et adapter le prompt principal

**Files:**
- Modify: `src/server/albert/module.ts` (enregistrer `createRedigerSyntheseTerritoireTool`, `createRedigerComparaisonTerritoiresTool` avec `asModuleFunction`)
- Modify: `src/server/albert/AssistantIA.ts` (`rediger_synthese_territoire`, `rediger_comparaison_territoires`, construits avec `{ habilitations }`)
- Modify: `src/server/albert/PiloteUIMessage.ts` (les deux outils : `input` via `z.input<…>`, `output: EncartOutput`)
- Modify: `src/server/albert/systemPrompt.ts`
- Test: `src/server/albert/__tests__/systemPrompt.unit.test.ts`

Changements du prompt, tels que décidés dans la spec :
- Lexique : remplacer la ligne « « les difficultés » ou « la situation » d'un territoire… » par : une synthèse ou une comparaison sur des critères génériques (« la synthèse du Nord », « où en est la Gironde », « la synthèse des difficultés de la Bretagne », « compare le Nord et la Gironde », « compare la Bretagne avec ses départements ») → `rediger_synthese_territoire` ou `rediger_comparaison_territoires` ; une demande précise (un critère, un chantier, un indicateur, « où en sont X et ses départements ») → les outils de données.
- Collecter les données : supprimer « Une synthèse de territoire couvre son taux d'avancement, ses chantiers en retard et ses chantiers en difficulté. »
- Exemples : « Compare le Nord et la Gironde » → une seule recherche (DEPT-59, DEPT-33) puis `rediger_comparaison_territoires` ; ajouter « Fais-moi la synthèse du Nord » → `search_territoires` (DEPT-59) puis `rediger_synthese_territoire`.
- Rédiger : « Après un dashboard, un encart de synthèse ou de comparaison, un export ou une clarification, écris une seule phrase ».

- [ ] **Step 1: Écrire les tests.** `oriente une synthèse générique vers l'encart` : `toContain("rediger_synthese_territoire")` et `toContain("rediger_comparaison_territoires")` ; `ne décrit plus la composition d'une synthèse` : `not.toContain("Une synthèse de territoire couvre")`.
- [ ] **Step 2: Lancer, voir échouer.** Run: `pnpm vitest run src/server/albert/__tests__/systemPrompt.unit.test.ts` — Expected: FAIL sur les 2 nouveaux tests.
- [ ] **Step 3: Modifier le prompt et brancher les outils.**
- [ ] **Step 4: Lancer les tests et les types.** Run: `pnpm vitest run src/server/albert && pnpm tsc --noEmit` — Expected: PASS, aucune erreur de type.
- [ ] **Step 5: Commit** `feat(PIL-1900): l'agent rédige les synthèses et comparaisons génériques dans un encart`.

### Task 6: L'encart côté client

**Files:**
- Create: `src/client/components/_commons/ChatUI/EncartSynthese.tsx`
- Create: `src/client/components/_commons/ChatUI/texteEncarts.ts`
- Modify: `src/client/components/_commons/ChatUI/AssistantMessage.tsx`
- Modify: `src/client/components/_commons/ChatUI/deriverEtatAssistant.ts`
- Modify: `src/client/components/_commons/ChatUI/chatMarkdownStyles.ts`
- Test: `src/client/components/_commons/ChatUI/EncartSynthese.integration.test.tsx`, `texteEncarts.unit.test.ts`, `deriverEtatAssistant.unit.test.ts`

**Interfaces:**
- Consumes: `EncartOutput` (Task 4), `PiloteUIMessage` (Task 5).
- Produces:
  - `export const EncartSynthese = ({ output }: { output: EncartOutput }) => JSX.Element | null` — `null` si `acces_refuse`. Rend l'en-tête (type, « Jalon {jalon} », date en `fr-FR` « 27 octobre 2026 », « À partir des données publiées dans PILOTE »), « Rédaction en cours… » tant que `!termine`, puis le markdown via `AssistantMessageText` (`streaming={!termine}`), dans un conteneur `albert-encart`.
  - `export const texteEncarts = ({ message }: { message: PiloteUIMessage }): string[]` — le markdown des parts d'encart `output-available` dont l'accès n'est pas refusé.
  - État `"redige-l-encart"` libellé « rédige la synthèse », pour une dernière part `tool-rediger_*` en cours.

Style (variante B de la maquette `.superpowers/brainstorm/25414-1793122425/content/encart-synthese.html`) : fond blanc, `border border-dsfr-grey-925`, `border-t-[5px] border-t-dsfr-blue-france-sun-113` (ou l'équivalent DSFR du `#000091` déjà utilisé dans le projet), ombre légère, `px-8 py-8 lg:-mx-16 lg:px-16`. Dans `chatMarkdownStyles`, sous `.albert-encart` : `h1` à 22 px, `hr` en filet `#dddddd`, `blockquote` sur fond `#f5f5fe` avec bordure gauche bleu France.

Dans `AssistantMessage.tsx` : les parts `tool-rediger_synthese_territoire` et `tool-rediger_comparaison_territoires` → `null` si `output-error`, `<EncartSynthese output={part.output} />` si `output-available` (intermédiaire ou final), sinon l'en-tête seul avec « Rédaction en cours… » (rendre `EncartSynthese` avec un `EncartOutput` vide construit à partir de l'input : `type` d'après le nom d'outil, `jalon` de l'input, `markdown: ""`, `termine: false`, date du jour). `copierTexte` ajoute `...texteEncarts({ message })` avant le texte du message.

- [ ] **Step 1: Écrire les tests.**
  - `EncartSynthese` : en cours (`termine: false`, markdown `"# Synthèse pour le Nord"`) → textes « Synthèse territoriale », « Jalon 2025 », « 27 octobre 2026 », « Rédaction en cours… », « Synthèse pour le Nord » ; terminé → pas de « Rédaction en cours… » ; `type: "comparaison"` → « Comparaison territoriale » ; `acces_refuse` → rien n'est rendu.
  - `texteEncarts` : un message avec une part d'encart terminée et une part `acces_refuse` → `["# Synthèse pour le Nord"]`.
  - `deriverEtatAssistant` : dernière part `tool-rediger_synthese_territoire` en `input-available` → `"redige-l-encart"`.
- [ ] **Step 2: Lancer, voir échouer.** Run: `pnpm vitest run src/client/components/_commons/ChatUI/EncartSynthese.integration.test.tsx src/client/components/_commons/ChatUI/texteEncarts.unit.test.ts src/client/components/_commons/ChatUI/deriverEtatAssistant.unit.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Lancer, voir passer.** Même commande, puis `pnpm vitest run src/client/components/_commons/ChatUI` — Expected: PASS.
- [ ] **Step 5: Vérifier dans le navigateur** (serveur de dev `pilote-ppg-refonte-prompt`) : « Fais-moi la synthèse du Nord » → l'encart apparaît, se remplit, déborde de la colonne sur grand écran ; recharger la conversation → l'encart revient sans « Rédaction en cours… ». Capture d'écran pour l'utilisateur.
- [ ] **Step 6: Commit** `feat(PIL-1900): encart de synthèse dans la discussion`.

### Task 7: Evals de l'encart

**Files:**
- Create: `evals/2-tools/2.3-rendu/redigerEncart.eval.ts`
- Modify: `evals/2-tools/2.2-donnees/getTauxAvancementTerritoire.eval.ts` (« Où en est la France sur l'ensemble des chantiers ? » sort de cette suite)
- Modify: `evals/2-tools/2.2-donnees/getChantiers.eval.ts` (« Compare les chantiers de la Corse et ses départements » sort de cette suite)
- Modify: `evals/3-scenarios/evidence.ts` (`MatterKind` gagne `"encart"` ; `extractMatter` : `ENCART RÉDIGÉ :` + le markdown de chaque résultat d'encart, puis le texte ; `maskedTerritories` lit aussi `donnees.chantiers_en_retard.resultats` et `donnees.chantiers_en_difficulte.resultats` des deux outils)
- Modify: `evals/3-scenarios/mechanicalChecks.ts` (contrôles du groupe `encart`)
- Create: `evals/3-scenarios/criteria/encart.ts`
- Modify: `evals/3-scenarios/3.1-synthese/syntheseTerritoire.eval.ts`, `syntheseDifficultes.eval.ts`, `syntheseDepartements.eval.ts`, `evals/3-scenarios/3.2-comparaison/comparerTerritoires.eval.ts`, `comparerDepartements.eval.ts` (`matter: "encart"`, `expected` = l'outil d'encart)
- Test: `evals/3-scenarios/evidence.unit.test.ts`, `evals/3-scenarios/mechanicalChecks.unit.test.ts`

**N2** (`redigerEncart.eval.ts`, format `ToolCase`) :
- attendu `rediger_synthese_territoire` : « Fais-moi la synthèse du Nord », « Où en est la Gironde ? », « La situation en Bretagne », « Fais-moi la synthèse des difficultés de la Bretagne », « Où en est la France sur l'ensemble des chantiers ? » (`territoire_code: "NAT-FR"`) ;
- attendu `rediger_comparaison_territoires` : « Compare le Nord et la Gironde », « Bretagne ou Normandie, qui avance le mieux ? », « Compare la Bretagne avec ses départements » (`include_sous_territoires: true`), « Compare les chantiers de la Corse et ses départements » ;
- `forbidden` des deux outils : « Les chantiers en retard du Nord », « Le taux d'avancement de la Gironde », « Les difficultés en Hauts-de-France », « Compare le CH-062 entre le Nord et la Gironde », « Où en sont l'Occitanie et ses départements ? », « Fais-moi un rapport sur la Gironde », « Trace la courbe de l'indicateur 1023 dans le Nord ».

**N3** : `expected` = `search_territoires` si le territoire est désigné par un nom ou un numéro (comme aujourd'hui), puis l'outil d'encart avec le bon `territoire_code` / `territoire_codes` / `include_sous_territoires`. Les grilles existantes restent ; `ENCART_CRITERIA` (groupe `encart`, rapporté à part) s'ajoute à ces cinq scénarios :
- `checkEncartChantiers` : chaque chantier des `donnees` apparaît dans l'encart avec son identifiant, son écart arrondi et son niveau de confiance ;
- `checkMailleNommee` : un département n'est jamais dit « la région », une région jamais « le département » ;
- `checkRestrictionEncart` : si une vue a `acces_restreint` avec des commentaires masqués, l'encart contient « Commentaire non accessible (restriction d'accès) » ;
- `checkNoHtml` existant appliqué à l'encart.

- [ ] **Step 1: Écrire les tests unitaires** de `extractMatter` (`kind: "encart"` → `"ENCART RÉDIGÉ :\n# Synthèse pour le Nord\n\nVoici la synthèse."`), de `maskedTerritories` (encart avec `donnees` sur `REG-52` restreint → `["REG-52"]`) et des trois contrôles (un cas conforme, un cas non conforme chacun).
- [ ] **Step 2: Lancer, voir échouer.** Run: `pnpm vitest run evals/3-scenarios/evidence.unit.test.ts evals/3-scenarios/mechanicalChecks.unit.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implémenter, puis réécrire les suites N2 et N3 listées.**
- [ ] **Step 4: Lancer, voir passer.** Même commande, plus `pnpm tsc --noEmit` — Expected: PASS.
- [ ] **Step 5: Commit** `test(PIL-1900): evals de l'encart de synthèse et de comparaison`.

### Task 8: Mesure de l'étape 4

- [ ] **Step 1: Lancer N2 puis N3**, suite par suite comme à l'étape 3 (`pnpm eval <chemin> --outputPath evals/resultats-etape-4-<suite>.json --threshold 0`, trois essais, en arrière-plan), puis fusionner dans `evals/resultats-etape-4.json`. Rejouer à part les suites touchées par des timeouts de l'API Albert.
- [ ] **Step 2: Comparer à l'étape 3** (`dead2dc` : N2 90,5 %, N3 93,6 %, 36 échecs répétés) à grille constante, et rapporter le groupe `encart` à part. Appliquer le seuil de bascule de la spec : un échec répété de « Chiffres exacts » ou de `checkEncartChantiers` sur un scénario d'encart → le signaler comme entrée de l'étape 5 (option du squelette posé par le code).
- [ ] **Step 3: Écrire la section « Étape 4 » du journal** dans `docs/superpowers/specs/2026-10-27-albert-refonte-system-prompt-design.md` (même forme que les étapes précédentes), mettre à jour la mémoire projet.
- [ ] **Step 4: Commit** `docs(PIL-1900): mesure de l'étape 4`.
