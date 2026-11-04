# Assistant kpilote — lot 2 (centre d'aide) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'outil `consult_centre_aide` (sous-agent en deux appels sur le centre d'aide kpilote) et son rendu.

**Architecture:** Contrat dans `kpilote-shared` (`TOOLS`, kind `help`), sommaire et pages lus en base via la query publique existante, deux `generateStructured` tracés, encart déterministe côté front.

**Tech Stack:** identique au lot 1.

**Spec:** `docs/superpowers/specs/2026-11-04-assistant-kpilote-lot2-centre-aide-design.md`

## Global Constraints

Celles du plan du lot 1 (`docs/superpowers/plans/2026-11-04-assistant-kpilote-rework-lot1.md`) s'appliquent. Aucun lien produit par le modèle n'est affiché.

## Review Focus

1. Page masquée, non publiée ou sous un groupe masqué → jamais dans le sommaire ni lue. Test : Task 1.
2. Le sous-agent invente un id à la sélection ou à la réponse → filtré ; `found` sans source → `found: false`. Test : Task 2.
3. Question hors centre d'aide → encart de contact, aucune affirmation. Test : Task 2 (sortie), Task 3 (rendu non testé, front).

---

### Task 1: Contrat et sommaire

**Files:** Modify `packages/kpilote-shared/src/assistant/tools.ts` (+ test) ; Create `apps/kpilote-api/src/assistant/tools/centreAide/sommaire.ts` (+ `sommaire.test.ts`)

**Interfaces — Produces:**
- `ToolKind = 'source' | 'interface' | 'help'` ; `consultCentreAideInput = { question: string 1..500 }` ; `CentreAideOutput` (spec) ; entrée `consult_centre_aide` dans `TOOLS` et `ToolOutputs`.
- `type HelpPage = { id: string; titre: string; chemin: string[]; intertitres: string[]; contenu: string; url: string }`
- `listHelpPages(): Promise<HelpPage[]>` — pages `type PAGE` de `listerArticlesCentreAidePublies`, titre `titreAffiche || titre`, `chemin` = titres des groupes ancêtres de la racine vers la page, `intertitres` = textes des `h1`–`h6` du HTML (sans doublon), `contenu` = `textFromHtml(contenu)`, `url` = `/centre-aide?article=<id>`.

- [ ] Tests : `listHelpPages` exclut une page non publiée et une page sous un groupe masqué ; donne le chemin des groupes ; extrait les intertitres. Shared : `consult_centre_aide` a le kind `help`.
- [ ] RED → implémenter → GREEN ; lint shared + api ; commit `feature(PIL-1684): contrat et sommaire du centre d'aide pour l'assistant`.

### Task 2: Outil `consult_centre_aide`

**Files:** Create `apps/kpilote-api/src/assistant/tools/centreAide/{prompts,consultCentreAide}.ts` (+ `consultCentreAide.test.ts`) ; Modify `tools/registry.ts`, `prompt/systemPrompt.ts` (+ test)

**Interfaces — Produces:** `consultCentreAide: ToolDefinition<'consult_centre_aide'>`. `MAX_HELP_PAGES = 3`. Sélection `{ ids: string[], reasoning: string }` (sans `max`), réponse `{ found: boolean, answer: string, sourcesIds: string[] }`, via `generateStructured` (`consult_centre_aide.selection` / `.reponse`, modèle du tour).

- [ ] Tests (modèle simulé par `registerModelWrapper`, pages en base) : aucune page retenue → `{ found: false, answer: '', sources: [] }` et un seul sous-appel tracé ; id inventé à la sélection filtré ; `found: true` sans source réelle → `found: false` ; succès → sources avec titre, chemin et URL. Prompt : cite `consult_centre_aide` et la règle « jamais de mémoire ».
- [ ] RED → implémenter → GREEN ; suite assistant ; lint ; commit `feature(PIL-1684): outil consult_centre_aide`.

### Task 3: Rendu

**Files:** Modify `apps/kpilote-webapp/src/assistant/{deriveAssistantState,AssistantMessage,copyResponse}.ts(x)` (+ tests) ; Create `apps/kpilote-webapp/src/assistant/CentreAideEncart.tsx`

**Interfaces — Produces:** état `consulting-help` (« consulte le centre d'aide ») ; `CentreAideEncart({ output })` ; `copyableText` ajoute « Pages du centre d'aide : titre — URL absolue » quand la dernière consultation a trouvé.

- [ ] Tests : état `consulting-help` ; copie avec pages. RED → implémenter → GREEN ; lint ; commit `feature(PIL-1684): encart du centre d'aide dans le chat`.

### Task 4: Vérification

- [ ] Lint + tests des trois paquets ; revue finale.
