# Assistant kpilote — lot 3 (encarts synthèse / comparaison et export) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter `write_synthese` et `write_comparaison` (collecte par le code + sous-agent de rédaction streamé), l'encart qui les affiche et son export (copie markdown, PDF).

**Architecture:** Contrat dans `kpilote-shared` (kind `report`), outils générateurs relayés par `toAiTool` en résultats intermédiaires du SDK, collecte qui réutilise les `execute` des outils de données (mêmes règles d'accès), données pré-formatées en chaînes, sous-agent `streamSubagentText` tracé. Front : `RapportEncart` + `exportRapport` sans librairie.

**Tech Stack:** identique au lot 1 (ai 7.0.141 : `execute` peut renvoyer un `AsyncIterable`).

**Spec:** `docs/superpowers/specs/2026-11-04-assistant-kpilote-lot3-encarts-design.md`

## Global Constraints

Celles des plans des lots 1 et 2. Aucun chiffre de l'encart n'est formaté par le LLM ; aucun lien produit par le modèle n'est affiché ; artefacts DSFR clairs.

## Review Focus

1. Sujet illisible ou périmètre sans individu lisible → un seul état `done` avec `notFound`, aucun sous-agent. Test : Task 2.
2. Erreur ou abandon pendant la rédaction → l'outil finit en `{ error }` (pas de tour qui tombe), l'encart n'est pas affiché « en cours » indéfiniment. Tests : Task 1 (relais), Task 4 (rendu non testé).
3. Comparaison avec un seul individu résolu → refus lisible (`needsClarification`), pas d'encart. Test : Task 2.
4. Volume : contributions et individus bornés (20), commentaires bornés au plus récent par type. Test : Task 2.
5. Le modèle principal relit le markdown, jamais les données. Test : Task 2.

---

### Task 1: Contrat, outils générateurs et sous-agent texte

**Files:** Modify `packages/kpilote-shared/src/assistant/tools.ts` (+ test), `apps/kpilote-api/src/assistant/tools/{toolDefinition,registry}.ts` (+ `registry.test.ts`), `apps/kpilote-api/src/framework/llm/albert.ts` (+ test), `apps/kpilote-api/src/test/{toolHarness,mockModel}.ts`

**Interfaces — Produces:**
- `ToolKind` gagne `'report'`. `rapportSujetInput = discriminatedUnion('type', [{ type: enum(['COLLECTION']), collectionId }, { type: enum(['INDICATEUR']), indicateurId }])`.
- `writeSyntheseInput = { sujet, individuId }` ; `writeComparaisonInput = { sujet, perimetre }`.
- `RapportOutput = { type: 'synthese' | 'comparaison'; dateRedaction: string; markdown: string; done: boolean; notFound?: string[]; needsClarification?: string }`. `TOOLS.write_synthese` (label « Synthèse », kind `report`), `TOOLS.write_comparaison` (« Comparaison », `report`).
- `ToolDefinition.execute` renvoie `Promise<Out> | AsyncIterable<Out>` ; `toAiTool` relaie un itérable sous `runInContext` et transforme une exception en `{ error }` (dernier état).
- `streamSubagentText({ name, model, system, prompt, trace, abortSignal }): AsyncGenerator<string>` — trace l'usage à la fin.
- Test helpers : `collectToolStates(principalId, name, definition, input): Promise<unknown[]>` ; `streamTextModel(chunks: string[])`.

- [ ] Tests : relais des états d'un générateur sous le principal ; exception en cours → dernier état `{ error }` ; `streamSubagentText` émet les morceaux et trace un sous-appel. Shared : kinds `report`.
- [ ] RED → GREEN ; lint ; commit `feature(PIL-1684): outils generateurs et sous-agent de redaction`.

### Task 2: `write_synthese` et `write_comparaison`

**Files:** Create `apps/kpilote-api/src/assistant/tools/rapport/{format,collect,prompts,writeRapport,writeSynthese,writeComparaison}.ts` (+ tests) ; Modify `tools/registry.ts`

**Interfaces — Produces:**
- `format.ts` : `formatValeur(valeur, unite)` (« 67,7 % », « non renseignée »), `formatTaux(taux)` (« 67 % », « non calculé »), `formatEcart(ecart, unite)` (« −1,5 % », signe typographique, « non calculé »), `formatDate('2026-03-01')` → « 1 mars 2026 ».
- `collect.ts` : `collectSynthese({ sujet, individuId })` et `collectComparaison({ sujet, perimetre })` → `{ notFound: string[] } | { needsClarification: string } | { donnees: object }`, en appelant les `execute` de `get_synthese_indicateur`, `get_synthese_collection`, `get_evolution_indicateur` (6 derniers points), `get_commentaires` (plus récent par type) ; données déjà formatées, sans identifiants internes autres que les publics.
  - Collection en synthèse : contributions (≤ 20) avec dernière valeur, objectif, taux, écart à la médiane de chaque indicateur pour l'individu ; commentaires de la collection.
  - Collection en comparaison : taux de la collection et de chaque contribution par individu.
  - Indicateur en synthèse : valeurs, objectif, taux, variation, écart à la médiane, médiane du référentiel, 6 derniers points, commentaires.
  - Indicateur en comparaison : une ligne par individu + plus récent commentaire et niveau de confiance de chacun.
- `prompts.ts` : `buildSyntheseSystemPrompt(sujetType)`, `buildComparaisonSystemPrompt(sujetType)` — règles PPG adaptées (`Reasoning: medium`, recopier les chaînes, pas de lien/HTML/JSON/nom de champ, commentaires = citations, titre d'abord).
- `writeRapport.ts` : `async function* writeRapport({ type, collected, system, context, abortSignal, now })` — PPG `redigerEncart` (état vide, regroupement 150 ms `EMIT_INTERVAL_MS`, état final `done`) ; `rapportToModel(output)` → markdown, ou phrase notFound / clarification.
- `writeSynthese`, `writeComparaison` : `ToolDefinition` dont la description porte les règles « Utilise-le pour / Ne l'utilise pas pour » et « il collecte lui-même ses données ».

- [ ] Tests (intégration, modèle `streamTextModel`) : synthèse indicateur → états puis markdown final, un sous-appel tracé ; sujet illisible → un état `done` + `notFound`, aucun appel modèle ; comparaison d'un seul individu → `needsClarification` ; données transmises au sous-agent formatées (prompt capturé contient « non renseignée », pas de nombre brut de taux) ; `toModelOutput` = markdown. Unitaires : `format.ts`, regroupement 150 ms, prompts.
- [ ] RED → GREEN ; suite assistant ; lint ; commit `feature(PIL-1684): encarts de synthese et de comparaison`.

### Task 3: Prompt principal

**Files:** Modify `apps/kpilote-api/src/assistant/prompt/systemPrompt.ts` (+ test)

- [ ] Règles PPG adaptées : synthèse / rapport / récap / état général d'une collection ou d'un indicateur pour un individu → `write_synthese` ; « compare X et Y » sans métrique précise → `write_comparaison`, sinon outils de données ; « rapport », « télécharger », « exporter » → l'encart ; jamais encart + outils de données pour la même demande ; après un encart, une phrase, sans en décrire l'export. Exemples ajoutés.
- [ ] Test : le prompt cite `write_synthese`, `write_comparaison` et la règle « jamais les deux ». RED → GREEN ; lint ; commit `feature(PIL-1684): le prompt oriente vers les encarts`.

### Task 4: Encart et export

**Files:** Create `apps/kpilote-webapp/src/assistant/{RapportEncart.tsx,exportRapport.ts,rapport.ts}` (+ tests des `.ts`) ; Modify `AssistantMessage.tsx`, `deriveAssistantState.ts`, `copyResponse.ts` (+ tests)

**Interfaces — Produces:**
- `rapport.ts` : `rapportParts(message)` (sorties `write_*` disponibles, sans erreur ni `notFound`/`needsClarification`), `rapportFileName({ markdown, type, dateRedaction })` (slug du `# titre`, sinon `synthese-AAAA-MM-JJ` / `comparaison-AAAA-MM-JJ`).
- `exportRapport.ts` : `printRapport({ element, title })` — iframe PPG, `[data-no-print]` retirés.
- État `writing-report` (« rédige la synthèse ») quand la dernière part est un outil `report` en cours ou en résultat intermédiaire non terminé.
- `copyableText` : texte des encarts (markdown) avant le texte de la réponse.

- [ ] Tests : `rapportFileName`, état `writing-report`, copie avec encart. RED → GREEN ; lint ; commit `feature(PIL-1684): encart de synthese et export`.

### Task 5: Vérification

- [ ] Lint + tests des trois paquets ; revue finale.
