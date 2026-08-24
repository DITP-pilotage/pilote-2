# Albert — Fiabilisation `include_sous_territoires` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fiabiliser le déclenchement de `include_sous_territoires=true` par le LLM Albert quand l'utilisateur demande un territoire et ses sous-territoires, afin d'éviter l'énumération qui sature `stepCountIs(50)`.

**Architecture:** Approche double — (1) prompt engineering passif sur descriptions Zod, descriptions de tools et workflow comparaison-jalons du system prompt ; (2) détection d'intention keyword-based via `detecteurIntention.ts` qui injecte conditionnellement un bloc d'instruction impérative dans le system prompt.

**Tech Stack:** TypeScript, AI SDK (`ai`), Zod, Jest.

**Branche** : `feat/albert-fiabilisation-sous-territoires` (déjà créée depuis `dev`).

**Spec source** : `docs/superpowers/specs/2026-05-22-albert-fiabilisation-include-sous-territoires-design.md`

---

## File Structure

**Modifications** :
- `apps/pilote-ppg/src/server/albert/detecteurIntention.ts` — nouvelle liste `MOTS_CLES_SOUS_TERRITOIRES`, champ `inclureSousTerritoires` dans `Capacities`
- `apps/pilote-ppg/src/server/albert/systemPrompt.ts` — bloc conditionnel injecté, workflow (b) complété
- `apps/pilote-ppg/src/server/albert/tools/getTauxAvancementTerritoire.ts` — description Zod enrichie, description tool enrichie
- `apps/pilote-ppg/src/server/albert/tools/getChantiers.ts` — description Zod enrichie, description tool enrichie
- `apps/pilote-ppg/src/server/albert/__tests__/detecteurIntention.test.ts` — mise à jour des `toEqual` existants + nouveau bloc de tests

**Création** :
- `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.test.ts` — tests d'injection conditionnelle

---

### Task 1 : Étendre `Capacities` avec `inclureSousTerritoires`

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/__tests__/detecteurIntention.test.ts`
- Modify: `apps/pilote-ppg/src/server/albert/detecteurIntention.ts`

Cette task fait évoluer la signature de `Capacities` et corrige les tests existants qui utilisent `toEqual` avec l'objet complet. Sans ça, ces tests cassent dès l'ajout du champ.

- [ ] **Step 1 : Écrire les nouveaux tests positifs et négatifs (TDD)**

Ajouter dans `apps/pilote-ppg/src/server/albert/__tests__/detecteurIntention.test.ts`, à la suite des tests existants du `describe("detecterCapacities", ...)` (avant sa fermeture ligne 168), ce bloc :

```ts
  it.each([
    "Compare les TA pour la région Pays de la Loire et ses départements",
    "Donne-moi le détail pour REG-52 et les départements qui la composent",
    "Synthèse de la France et ses sous-territoires",
    "État des lieux détaillé par département pour la Bretagne",
    "Compare REG-52 et REG-32 décomposé par département",
  ])("détecte inclureSousTerritoires sur : %s", (message) => {
    // when
    const result = detecterCapacities(message);

    // then
    expect(result.inclureSousTerritoires).toBe(true);
  });

  it.each([
    "Quel est le taux d'avancement de la France ?",
    "Compare REG-52 et REG-32",
    "Synthèse de la région Pays de la Loire",
  ])("ne détecte pas inclureSousTerritoires sur : %s", (message) => {
    // when
    const result = detecterCapacities(message);

    // then
    expect(result.inclureSousTerritoires).toBe(false);
  });
```

- [ ] **Step 2 : Mettre à jour les `toEqual` existants pour inclure `inclureSousTerritoires: false`**

Dans `apps/pilote-ppg/src/server/albert/__tests__/detecteurIntention.test.ts`, les 6 assertions `expect(result).toEqual({...})` (lignes 14, 28, 40, 54, 68, 110, 132, 146) doivent ajouter `inclureSousTerritoires: false` pour rester valides. Ajouter aussi `inclureSousTerritoires: true` au test mixte (ligne 132) si le message contient un mot-clé sous-territoires — vérifier la chaîne *"Fais une synthèse puis un dashboard et exporte en PDF"* : aucun mot-clé sous-territoires, donc `false`.

Exemple pour le premier (ligne 14) :

```ts
    expect(result).toEqual({
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    });
```

Faire de même pour chaque `toEqual` complet existant.

- [ ] **Step 3 : Lancer les tests pour vérifier qu'ils échouent (le user lance lui-même)**

Indiquer au user :
> Lance `pnpm --filter @pilote/ppg test:server -- detecteurIntention` pour confirmer que les nouveaux tests échouent (`inclureSousTerritoires` est undefined ou n'existe pas dans le type).

Attendu : échec côté tests sur `inclureSousTerritoires` non présent dans `Capacities`.

- [ ] **Step 4 : Implémenter la détection**

Modifier `apps/pilote-ppg/src/server/albert/detecteurIntention.ts`.

Ajouter, juste après la déclaration `MOTS_CLES_EXPORT` (ligne 43) :

```ts
const MOTS_CLES_SOUS_TERRITOIRES = [
  "et ses départements",
  "et ses departements",
  "et les départements qui",
  "et les departements qui",
  "et ses sous-territoires",
  "et ses sous territoires",
  "détaille par département",
  "detaille par departement",
  "détaillé par département",
  "detaille par departement",
  "décomposé par",
  "decompose par",
  "et ses régions",
  "et ses regions",
  "par sous-territoire",
  "par sous territoire",
];
```

Étendre l'interface `Capacities` :

```ts
export interface Capacities {
  synthese: boolean;
  dashboard: boolean;
  exportRapport: boolean;
  inclureSousTerritoires: boolean;
}
```

Étendre `detecterCapacities` :

```ts
export function detecterCapacities(message: string): Capacities {
  const normalise = message.toLowerCase();
  const contient = (motCle: string) => normalise.includes(motCle);
  return {
    synthese: MOTS_CLES_SYNTHESE.some(contient),
    dashboard: MOTS_CLES_DASHBOARD.some(contient),
    exportRapport: MOTS_CLES_EXPORT.some(contient),
    inclureSousTerritoires: MOTS_CLES_SOUS_TERRITOIRES.some(contient),
  };
}
```

- [ ] **Step 5 : Le user relance les tests, attendu : tous verts**

Indiquer au user : `pnpm --filter @pilote/ppg test:server -- detecteurIntention`.

- [ ] **Step 6 : Vérifier que rien d'autre ne casse côté TS**

Le champ `inclureSousTerritoires` étant requis (non optional) dans `Capacities`, tous les constructeurs de `Capacities` ailleurs doivent maintenant le fournir. Chercher tous les sites :

```bash
grep -rn "capacities:" apps/pilote-ppg/src --include="*.ts"
grep -rn "Capacities" apps/pilote-ppg/src --include="*.ts"
```

Si un test ou un usage construit un littéral `{ synthese, dashboard, exportRapport }` sans `inclureSousTerritoires`, l'ajouter. Lancer `pnpm --filter @pilote/ppg lint` pour confirmer (le user lance).

- [ ] **Step 7 : Commit**

```bash
git add apps/pilote-ppg/src/server/albert/detecteurIntention.ts apps/pilote-ppg/src/server/albert/__tests__/detecteurIntention.test.ts
git commit -m "feat(albert): détecter l'intention 'inclure les sous-territoires' dans la prompt utilisateur"
```

---

### Task 2 : Injection conditionnelle du bloc d'instruction dans le system prompt

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.test.ts`
- Modify: `apps/pilote-ppg/src/server/albert/systemPrompt.ts`

- [ ] **Step 1 : Créer le fichier de test avec deux cas (TDD)**

Créer `apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.test.ts` :

```ts
import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";

describe("buildChatSystemPrompt — inclureSousTerritoires", () => {
  it("injecte le bloc d'instruction quand la capacity est activée", () => {
    // when
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["NAT-FR"],
      agentContext: null,
      capacities: {
        synthese: false,
        dashboard: false,
        exportRapport: false,
        inclureSousTerritoires: true,
      },
    });

    // then
    expect(prompt).toContain("Sous-territoires détectés dans la demande");
    expect(prompt).toContain("include_sous_territoires=true");
  });

  it("n'injecte pas le bloc d'instruction quand la capacity est désactivée", () => {
    // when
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["NAT-FR"],
      agentContext: null,
      capacities: {
        synthese: false,
        dashboard: false,
        exportRapport: false,
        inclureSousTerritoires: false,
      },
    });

    // then
    expect(prompt).not.toContain("Sous-territoires détectés dans la demande");
  });
});
```

- [ ] **Step 2 : Le user lance les tests, attendu : le premier test échoue, le second passe**

Indiquer au user : `pnpm --filter @pilote/ppg test:server -- systemPrompt`.

Le second passe parce que la chaîne n'existe nulle part ; le premier échoue car la chaîne attendue n'est pas encore injectée.

- [ ] **Step 3 : Implémenter le bloc conditionnel dans `systemPrompt.ts`**

Modifier `apps/pilote-ppg/src/server/albert/systemPrompt.ts`.

Dans `buildChatSystemPrompt`, ajouter juste après le calcul de `agentContextSection` (vers ligne 190, avant `const consigneSyntheseWorkflow`) :

```ts
  const consigneSousTerritoires = capacities.inclureSousTerritoires
    ? `
## ⚠️ Sous-territoires détectés dans la demande

L'utilisateur a explicitement demandé un territoire **et ses sous-territoires**.

**Règle impérative** : pour CHAQUE appel à \`get_taux_avancement_territoire\` ou \`get_chantiers\`, passe \`include_sous_territoires=true\` sur le territoire parent.

N'énumère **JAMAIS** les sous-territoires manuellement (pas d'appel séparé pour chaque département/région). Un seul appel sur le parent avec le flag suffit.

Cette règle prime sur tout autre protocole : même en comparaison entre jalons, tu fais **un seul appel par jalon** avec le flag, pas un appel par couple (sous-territoire × jalon).
`
    : "";
```

Puis injecter dans le template du `return`. Localiser `${agentContextSection}` dans le template literal (ligne 324) et ajouter `${consigneSousTerritoires}` juste après, avant `# Territoires accessibles` :

```ts
${agentContextSection}
${consigneSousTerritoires}
# Territoires accessibles
```

- [ ] **Step 4 : Le user relance les tests, attendu : tous verts**

Indiquer au user : `pnpm --filter @pilote/ppg test:server -- systemPrompt`.

- [ ] **Step 5 : Commit**

```bash
git add apps/pilote-ppg/src/server/albert/systemPrompt.ts apps/pilote-ppg/src/server/albert/__tests__/systemPrompt.test.ts
git commit -m "feat(albert): injecter un bloc d'instruction impérative quand sous-territoires détectés"
```

---

### Task 3 : Compléter le workflow (b) du system prompt

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/systemPrompt.ts:369-374`

Modification de contenu pur (chaîne de caractères dans un template literal). Pas de TDD utile — c'est un changement passif.

- [ ] **Step 1 : Remplacer le bloc workflow (b) dans le system prompt**

Dans `apps/pilote-ppg/src/server/albert/systemPrompt.ts`, localiser le bloc actuel :

```
### b. Comparaison temporelle entre jalons
**Déclencheur** : l'utilisateur demande de comparer entre deux jalons/années.

**Protocole** :
1. Appelle le(s) outil(s) pertinent(s) une fois par jalon demandé (ex: get_taux_avancement_territoire avec jalon=2024, puis avec jalon=2025)
2. Compare les résultats et présente l'évolution
```

Le remplacer par :

```
### b. Comparaison temporelle entre jalons
**Déclencheur** : l'utilisateur demande de comparer entre deux jalons/années.

**Protocole** :
1. Appelle le(s) outil(s) pertinent(s) une fois par jalon demandé (ex: get_taux_avancement_territoire avec jalon=2024, puis avec jalon=2025)
2. **Si la comparaison porte aussi sur un territoire ET ses sous-territoires** (ex: « France + région + ses départements »), passe \`include_sous_territoires=true\` sur le territoire parent. **Un appel par jalon**, pas un appel par couple (territoire × jalon). N'énumère jamais les sous-territoires manuellement.
3. Compare les résultats et présente l'évolution

**Exemple** : « Compare les TA de France entre 2025 et 2026 pour la région Pays de la Loire et ses 5 départements »
→ 2 appels seulement : \`get_taux_avancement_territoire(territoire_code='REG-52', jalon=2025, include_sous_territoires=true)\` et \`get_taux_avancement_territoire(territoire_code='REG-52', jalon=2026, include_sous_territoires=true)\`. Si NAT-FR est aussi demandé, +1 appel par jalon avec NAT-FR (sans include_sous_territoires).
```

⚠️ Attention au scope du template literal : les backticks utilisés dans l'exemple doivent être échappés avec `\`` puisque le template literal englobant utilise déjà des backticks.

- [ ] **Step 2 : Vérifier que les tests existants passent toujours (rien ne casse)**

Indiquer au user : `pnpm --filter @pilote/ppg test:server -- albert`.

- [ ] **Step 3 : Commit**

```bash
git add apps/pilote-ppg/src/server/albert/systemPrompt.ts
git commit -m "docs(albert): compléter workflow comparaison jalons avec dimension sous-territoires"
```

---

### Task 4 : Enrichir la description Zod du paramètre `include_sous_territoires`

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/tools/getTauxAvancementTerritoire.ts:22-28`
- Modify: `apps/pilote-ppg/src/server/albert/tools/getChantiers.ts:20-26`

Modification de chaînes passives.

- [ ] **Step 1 : Mettre à jour `getTauxAvancementTerritoire.ts`**

Remplacer (lignes 22-28) :

```ts
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Si true, inclut les données des sous-territoires (ex: départements d'une région)",
    ),
```

Par :

```ts
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Mets `true` quand la demande couvre un territoire ET ses sous-territoires " +
        "(ex: « la région X et ses départements », « la région X et les départements qui la composent », " +
        "« détaille par département », « décomposé par sous-territoire »). " +
        "Dans ce cas, fais UN SEUL appel sur le territoire parent avec ce flag à true, " +
        "plutôt que d'énumérer chaque sous-territoire avec des appels séparés.",
    ),
```

- [ ] **Step 2 : Mettre à jour `getChantiers.ts`**

Remplacer (lignes 20-26) :

```ts
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Si true, inclut les données des sous-territoires (ex: départements d'une région)",
    ),
```

Par exactement la même nouvelle description que pour `getTauxAvancementTerritoire.ts` (Step 1).

- [ ] **Step 3 : Vérifier que les tests passent (rien ne casse)**

Indiquer au user : `pnpm --filter @pilote/ppg test:server -- albert`.

- [ ] **Step 4 : Commit**

```bash
git add apps/pilote-ppg/src/server/albert/tools/getTauxAvancementTerritoire.ts apps/pilote-ppg/src/server/albert/tools/getChantiers.ts
git commit -m "docs(albert): enrichir description Zod de include_sous_territoires avec tournures et règle anti-énumération"
```

---

### Task 5 : Enrichir la description des tools

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/tools/getTauxAvancementTerritoire.ts:61-67`
- Modify: `apps/pilote-ppg/src/server/albert/tools/getChantiers.ts:106-117`

- [ ] **Step 1 : Mettre à jour la description de `getTauxAvancementTerritoire`**

Localiser le `description` actuel dans l'appel `tool({...})` (ligne 61) :

```ts
      description: `Récupère le taux d'avancement global d'un territoire, la médiane de répartition et la position du territoire par rapport à la médiane.
Quand include_sous_territoires=true, retourne aussi les données de chaque sous-territoire.

Utilise cet outil quand l'utilisateur demande :
- Le taux d'avancement d'un territoire
- La position d'un territoire par rapport à la médiane
- Une vue d'ensemble rapide d'un territoire`,
```

Remplacer par :

```ts
      description: `Récupère le taux d'avancement global d'un territoire, la médiane de répartition et la position du territoire par rapport à la médiane.
Quand include_sous_territoires=true, retourne aussi les données de chaque sous-territoire.

⚠️ Si la demande couvre un territoire ET ses sous-territoires (ex: « région X et ses départements »),
fais UN SEUL appel avec include_sous_territoires=true plutôt que N appels individuels.
Cette règle s'applique aussi pour les comparaisons entre jalons : un appel par jalon avec
include_sous_territoires=true, pas un appel par (territoire × jalon).

Utilise cet outil quand l'utilisateur demande :
- Le taux d'avancement d'un territoire
- La position d'un territoire par rapport à la médiane
- Une vue d'ensemble rapide d'un territoire`,
```

- [ ] **Step 2 : Mettre à jour la description de `getChantiers`**

Localiser le `description` actuel (lignes 106-117). Elle se termine par :

```
Retourne pour chaque chantier : météo, tendance, écart, taux d'avancement, synthèse, et les flags est_en_retard / est_en_difficulte.
Quand include_sous_territoires=true, retourne aussi les chantiers de chaque sous-territoire.
```

Ajouter immédiatement après cette dernière phrase, dans le même template literal, ce paragraphe (avant la fermeture backtick + virgule) :

```
⚠️ Si la demande couvre un territoire ET ses sous-territoires (ex: « région X et ses départements »),
fais UN SEUL appel avec include_sous_territoires=true plutôt que N appels individuels.
Cette règle s'applique aussi pour les comparaisons entre jalons : un appel par jalon avec
include_sous_territoires=true, pas un appel par (territoire × jalon).
```

Résultat final de la description (extrait) :

```ts
      description: `Outil principal pour obtenir des données sur les chantiers (PPG). C'est l'outil à utiliser dès qu'un utilisateur mentionne un chantier (CH-XXX) ou demande des informations sur des chantiers.

Tous les filtres sont combinables :
- chantier_ids : restreint à des chantiers spécifiques (ex: ['CH-001', 'CH-042'])
- view : "all" (tous), "en_retard" (écart <= -10 pts vs médiane), "en_difficulte" (météo ORAGE/NUAGE, hors retard)
- tendance : HAUSSE, BAISSE, STAGNATION
- meteo : SOLEIL, COUVERT, NUAGE, ORAGE

Exemples : récupérer CH-001 et CH-042, chercher tous les chantiers en retard, ou encore filtrer parmi CH-001/CH-002/CH-003 ceux en baisse.

Retourne pour chaque chantier : météo, tendance, écart, taux d'avancement, synthèse, et les flags est_en_retard / est_en_difficulte.
Quand include_sous_territoires=true, retourne aussi les chantiers de chaque sous-territoire.

⚠️ Si la demande couvre un territoire ET ses sous-territoires (ex: « région X et ses départements »),
fais UN SEUL appel avec include_sous_territoires=true plutôt que N appels individuels.
Cette règle s'applique aussi pour les comparaisons entre jalons : un appel par jalon avec
include_sous_territoires=true, pas un appel par (territoire × jalon).`,
```

- [ ] **Step 3 : Vérifier que les tests passent**

Indiquer au user : `pnpm --filter @pilote/ppg test:server -- albert`.

- [ ] **Step 4 : Lancer le lint complet**

Indiquer au user : `pnpm --filter @pilote/ppg lint`.

- [ ] **Step 5 : Commit**

```bash
git add apps/pilote-ppg/src/server/albert/tools/getTauxAvancementTerritoire.ts apps/pilote-ppg/src/server/albert/tools/getChantiers.ts
git commit -m "docs(albert): ajouter règle anti-énumération dans les descriptions des tools territoriaux"
```

---

## Self-Review — couverture du spec

- ✅ Section 1 (Zod descriptions) → Task 4
- ✅ Section 2 (tool descriptions) → Task 5
- ✅ Section 3 (workflow b) → Task 3
- ✅ Section 4a (detecteurIntention) → Task 1
- ✅ Section 4b (systemPrompt injection) → Task 2
- ✅ Section 5a (tests detecteurIntention) → Task 1 Step 1-2
- ✅ Section 5b (tests systemPrompt) → Task 2 Step 1
- ✅ Section 5c (pas de tests sur contenus passifs) → respecté pour Tasks 3, 4, 5

Type consistency : `Capacities` étendue en Task 1, consommée en Task 2. Le nom `inclureSousTerritoires` est strictement identique partout (camelCase français cohérent avec `exportRapport`).

Ordre des tasks : Task 1 (capacity) doit précéder Task 2 (qui consomme la capacity), sinon le test de Task 2 ne compile pas. Tasks 3, 4, 5 sont indépendantes entre elles et indépendantes de 1-2 ; on les fait en dernier pour éviter de polluer les commits TDD avec des changements passifs.

Pas de placeholder, pas de "similar to". Chaque code block est complet.
