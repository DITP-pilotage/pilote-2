# Indicateurs à mettre à jour — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer `get_valeurs_avancement_non_a_jour` et `get_valeurs_initiales_cibles_manquantes` par `get_indicateurs_a_completer`, qui demande lui-même la précision VA/VI/VC quand le type n'est pas nommé, n'envoie au modèle qu'un résumé plat rédigé par le code, et affiche toujours le détail dans un tableau.

**Architecture:** Quatre unités côté serveur : la décision de demander la précision (lecture des messages), la fusion des deux requêtes existantes en lignes, le résumé (phrases et totaux), et l'outil qui les enchaîne et réduit sa sortie pour le modèle avec `toModelOutput`. Côté client, le tableau et les choix de la branche `feat/albert-indicateurs-a-completer`, adaptés à la nouvelle sortie.

**Tech Stack:** TypeScript, AI SDK 7 (`tool`, `toModelOutput`, `ToolExecutionOptions.messages`), Zod, Prisma, React + Tailwind (ChatUI), Vitest, Evalite.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-11-05-albert-indicateurs-a-mettre-a-jour-design.md`

Branche : `feat/albert-indicateurs-a-mettre-a-jour` (depuis `origin/dev`). Réserve de code : `feat/albert-indicateurs-a-completer`, lue avec `git show "feat/albert-indicateurs-a-completer:apps/pilote-ppg/<chemin>"` (guillemets obligatoires sous zsh). Toutes les commandes se lancent depuis `apps/pilote-ppg`.

## Global Constraints

- Outil `get_indicateurs_a_completer`, fabrique `createGetIndicateursACompleterTool`, libellé de source « Indicateurs à compléter ».
- Motifs `"va" | "vi" | "vc"`, toujours dédoublonnés et dans cet ordre ; libellés « VA non à jour », « VI manquante », « VC manquante » ; total « tous motifs confondus ».
- `SEUIL_INDICATEURS_RESUME = 20` indicateurs distincts.
- Le modèle ne reçoit jamais de lignes, de noms de territoires concernés ni de dates.
- Définitions métier inchangées : `GetIndicateursNonAJourQuery` et `GetIndicateursSansViVcQuery` ne gagnent que `territoireNomAffiche`.
- Ne pas toucher à `stopWhen` ni à `prepareStep` dans `Albert.ts`.
- Nommage : métier en français, technique en anglais. Pas de tests triviaux ; côté client, tests seulement là où la branche en a déjà.
- Tests : `expect(result).toEqual(...)` sur des objets entiers ; pas de variables d'une ou deux lettres ; pas de commentaires hors given/when/then.
- **Pas de commit sans demande explicite de Triko** : les étapes « Commit » ne se font que s'il l'a autorisé pour cette exécution.
- Evals : un seul chemin par `pnpm eval` ; résultats exportés avec `--outputPath evals/resultats-maj-<avant|apres>-<suite>.json` (ignorés par git) ; rejouer une à une les suites touchées par des 503/429.

## Review Focus

1. **Historique avec les anciens outils** : une conversation rechargée contient des parts `tool-get_valeurs_…`. Une question de suivi doit répondre sans erreur. Vérification manuelle, tâche 6.
2. **Libellé cliqué** : « Valeurs d'avancement non à jour … sur le CH-018 » contient une apostrophe, des pluriels et un code ; il doit passer la règle 1. Test, tâche 2.
3. **Message utilisateur en parts** : le contenu d'un message `user` peut être un tableau de parts texte, pas une chaîne. Test, tâche 2.
4. **Historique vu par l'outil** : les résultats précédents arrivent dans `messages` sous leur version modèle (`toModelOutput` appliqué), donc avec `en_bref` ou `precision_demandee`, jamais `resume`. Test, tâche 2.
5. **Demandes explicites contre filtre d'accès** : `resoudreAccesIndicateurs` ajoute le chantier d'un indicateur nommé, et prend tous les chantiers accessibles quand aucun n'est demandé. `sans_valeur_a_completer` ne doit lister que ce que l'utilisateur a nommé. Test, tâche 5.

---

### Task 1: Scénario N3 final et mesure avant

On écrit le scénario dans sa version finale et on le mesure sur `dev`, avec les anciens outils.

**Files:**
- Create: `evals/3-scenarios/3.4-forme/seedValeursACompleter.ts` (copie de la branche, telle quelle)
- Create: `evals/3-scenarios/3.4-forme/valeursACompleter.criteria.ts`
- Create: `evals/3-scenarios/3.4-forme/valeursACompleter.eval.ts`

**Interfaces:**
- Consumes: `scenarioEval` (`evals/3-scenarios/scenarioEval.ts`), `withBase`, `judged`, `BASE_IDS` (`evals/3-scenarios/criterion.ts`).
- Produces: `VALEURS_A_COMPLETER_CRITERIA`, rejoué tel quel à la tâche 8.

- [ ] **Step 1: Copier la graine** depuis la branche, sans changement.

- [ ] **Step 2: Écrire les critères**

Partir de `valeursACompleter.criteria.ts` de la branche (`omit: [BASE_IDS.chantierFormat]`). Critères `judged`, dans cet ordre :
- `Périmètre cité` : la réponse dit sur quel périmètre portent ses chiffres.
- `Pas de somme entre indicateurs` : repris de la branche ; tout nombre de territoires annoncé figure dans la sortie de l'outil.
- `Mailles à zéro` : repris de la branche.
- `Motifs justes` : un motif défini l'est comme suit : VA, date de prochaine mise à jour dépassée ou aucune valeur ; VI ou VC, valeur manquante, avec le jalon pour la VC. Un motif cité sans définition est conforme.
- `Un seul territoire` : si la demande porte sur un seul territoire, la réponse ne donne aucun nombre de territoires.
- `Pas de liste au-delà du seuil` : si la sortie de l'outil ne liste pas d'indicateurs, la réponse n'en liste pas.
- `Aucun territoire hors demande` : la réponse ne nomme aucun territoire absent de la demande.
- `Tableau introduit` : si l'outil a renvoyé des valeurs à compléter, la réponse se termine par une phrase qui renvoie au tableau du détail.

Les quatre derniers critères commencent leur instruction par : « Si aucune sortie d'outil ne contient le champ `en_bref`, ce critère est conforme. » Ils restent ainsi neutres sur `dev`.

- [ ] **Step 3: Écrire les cas**

Les cinq cas de `valeursACompleter.eval.ts` de la branche, plus :

```ts
{
  history: ["Qu'est-ce que je dois mettre à jour dans le Finistère ?"],
  question:
    "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes en DEPT-29",
  reason: "Un seul territoire : chantiers et indicateurs par motif, aucun nombre de territoires",
  truthScope: { territoires: ["REG-53"] },
},
```

Réécrire l'en-tête du fichier : les critères visés, et la référence observée, à remplir à l'étape 5.

- [ ] **Step 4: Vérifier le monde d'evals**

Run: `pnpm eval evals/3-scenarios/3.4-forme/valeursACompleter.eval.ts`
Expected : chaque cas appelle un outil de valeurs avec des résultats non vides. Le cas Finistère doit avoir au moins une ligne en DEPT-29 ; sinon, ajoutez-en une dans la graine (VA datée dans le passé ou VC absente sur DEPT-29).

- [ ] **Step 5: Mesure avant**, une suite par commande :

```bash
pnpm eval evals/2-tools/2.2-donnees/getValeursAvancementNonAJour.eval.ts --outputPath evals/resultats-maj-avant-getValeursAvancementNonAJour.json
pnpm eval evals/2-tools/2.2-donnees/getValeursInitialesCiblesManquantes.eval.ts --outputPath evals/resultats-maj-avant-getValeursInitialesCiblesManquantes.json
pnpm eval evals/2-tools/2.3-rendu/clarifyWithChoices.eval.ts --outputPath evals/resultats-maj-avant-clarifyWithChoices.json
pnpm eval evals/2-tools/2.2-donnees/getIndicateurs.eval.ts --outputPath evals/resultats-maj-avant-getIndicateurs.json
pnpm eval evals/2-tools/2.2-donnees/getChantiers.eval.ts --outputPath evals/resultats-maj-avant-getChantiers.json
pnpm eval evals/2-tools/2.2-donnees/getChantiersSignales.eval.ts --outputPath evals/resultats-maj-avant-getChantiersSignales.json
pnpm eval evals/3-scenarios/3.4-forme/valeursACompleter.eval.ts --outputPath evals/resultats-maj-avant-valeursACompleter.json
```

Expected : sept fichiers. Notez la moyenne de chaque suite, et les cas sous 2/3 de la clarification, dans l'en-tête du N3 et dans le message de commit.

- [ ] **Step 6: Commit** (si autorisé)

```bash
git add evals/3-scenarios/3.4-forme/
git commit -m "test(albert): scénario N3 des indicateurs à mettre à jour et mesure avant"
```

---

### Task 2: Décision de demander la précision

**Files:**
- Create: `src/server/albert/tools/precisionTypeDeValeurs.ts`
- Test: `src/server/albert/__tests__/tools/precisionTypeDeValeurs.unit.test.ts`

**Interfaces:**
- Consumes: `ModelMessage` (`ai`).
- Produces:

```ts
export function nommeUnTypeDeValeurs({ texte }: { texte: string }): boolean;
export function doitDemanderPrecision({ messages }: { messages: ModelMessage[] }): boolean;
```

Règles de `nommeUnTypeDeValeurs` :
- Sigles, sur les mots du texte brut : `VA` seulement en majuscules ; `VI`, `VC` sans distinction de casse.
- Expressions, sur le texte en minuscules, sans accents (`normaliserChaîneDeCaractères` de `@/client/utils/strings`), découpé sur tout ce qui n'est pas une lettre, sans les mots de moins de 3 lettres, et sans le `s` final de chaque mot. Une expression est trouvée si ses mots apparaissent consécutivement.
- Comparaison d'un mot : exacte sous 5 lettres ; à partir de 5 lettres, une erreur tolérée (insertion, suppression, substitution ou inversion de deux lettres voisines).
- Expressions VA : « valeur d'avancement », « valeur actuelle », « dernière valeur », « périmé », « retard de mise à jour », « saisie en retard », « fraîcheur ». VI : « valeur initiale ». VC : « cible ».

Règles de `doitDemanderPrecision` (dans cet ordre) :
1. Texte du dernier message `role: "user"` : une chaîne, ou la concaténation de ses parts `type: "text"`. S'il nomme un type → `false`.
2. Avant ce message, une part `type: "tool-result"` avec `toolName: "get_indicateurs_a_completer"`, `output.type: "json"`, et une valeur qui contient `en_bref` ou `precision_demandee` → `false`.
3. Sinon → `true`.

- [ ] **Step 1: Écrire les tests**

```ts
describe("nommeUnTypeDeValeurs", () => {
  test.each([
    "Quelles valeurs d'avancement ne sont pas à jour ?",
    "Quelles valeurs d'avnacement ne sont pas à jour ?",
    "Quels indicateurs n'ont pas de cilbe en 2027 ?",
    "Quelles données sont périmées sur l'IND-894 ?",
    "Quels indicateurs ont un retard de mise a jour ?",
    "Les VA du CH-018",
    "les vi et vc manquantes",
    "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes sur le CH-018 en REG-53",
  ])("nomme un type : %s", (texte) => {
    expect(nommeUnTypeDeValeurs({ texte })).toEqual(true);
  });

  test.each([
    "Quels indicateurs sont non à jour sur le CH-018 ?",
    "Le CH-018 est-il à jour en Bretagne ?",
    "Qu'est-ce qui va devoir être mis à jour ?",
    "Qu'est-ce que je dois renseigner dans le Nord ?",
    "Les remontées du Nord sont-elles à jour ?",
  ])("ne nomme aucun type : %s", (texte) => {
    expect(nommeUnTypeDeValeurs({ texte })).toEqual(false);
  });
});
```

`doitDemanderPrecision`, un test par cas, avec des `ModelMessage[]` écrits à la main :
- `[user "Quels indicateurs sont non à jour sur le CH-018 ?"]` → `true`
- `[user { content: [{ type: "text", text: "Quelles VA ne sont pas à jour ?" }] }]` → `false`
- tour précédent clos par une demande de précision : `[user "Quels sont les chantiers à mettre à jour ?", assistant tool-call, tool tool-result { type: "json", value: { precision_demandee: true } }, assistant "Choisissez une option pour continuer.", user "les trois"]` → `false`
- tour précédent avec des données (`value: { en_bref: "Périmètre : …" }`), puis user « Et sur le CH-019 ? » → `false`
- tour précédent arrêté sur un accès refusé (`value: { acces_refuse: true }`), puis user « Qu'est-ce qui est à mettre à jour sur le CH-018 ? » → `true`
- même tour : `[user "Quels indicateurs sont non à jour sur le CH-018 ?", assistant tool-call, tool tool-result { precision_demandee: true }]` → `true`

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/precisionTypeDeValeurs.unit.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3: Implémenter** `nommeUnTypeDeValeurs` et `doitDemanderPrecision` selon les règles ci-dessus.

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent** (même commande). Expected : PASS.

- [ ] **Step 5: Commit** (si autorisé) — `feat(albert): décide en code quand demander le type de valeurs à mettre à jour`

---

### Task 3: Fusion des motifs et lignes du détail

**Files:**
- Modify: `src/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery.ts`, `GetIndicateursSansViVcQuery.ts` et leurs tests d'intégration (`src/server/chantiers/__tests__/infrastructure/queries/`) : reprendre le diff de la branche (`territoireNomAffiche`, lu dans `territoire.nom_affiche`).
- Create: `src/server/albert/tools/indicateursACompleter.ts`
- Test: `src/server/albert/__tests__/tools/indicateursACompleter.unit.test.ts`

**Interfaces:**
- Consumes: `LigneIndicateurNonAJour`, `LigneIndicateurSansViVc` (avec `territoireNomAffiche`), `libelleMaille`.
- Produces:

```ts
export type Motif = "va" | "vi" | "vc";
export type LibelleMotif = "VA non à jour" | "VI manquante" | "VC manquante";
export type LibelleMaille = ReturnType<typeof libelleMaille>;
export const MOTIFS_ORDER: Motif[]; // ["va", "vi", "vc"]
export const LIBELLES_MOTIF: Record<Motif, LibelleMotif>;

export type LigneFusionnee = {
  chantierId: string; chantierNom: string;
  indicateurId: string; indicateurNom: string;
  maille: $Enums.Maille;
  territoireCode: string; territoireNom: string | null; territoireNomAffiche: string;
  motifs: Set<Motif>;
  va?: LigneIndicateurNonAJour;
  viVc?: LigneIndicateurSansViVc;
};
export type LigneACompleter = {
  chantier_id: string; chantier_nom: string;
  indicateur_id: string; indicateur_nom: string;
  territoire_code: string; territoire_nom: string | null; territoire_nom_affiche: string;
  maille: LibelleMaille;
  motifs: LibelleMotif[];
  date_derniere_valeur?: string | null;         // si motif VA
  mise_a_jour_attendue_depuis?: string | null;  // si motif VA
  derniere_vc_connue?: { valeur: number; jalon: number } | null; // si motif VC
};
export function fusionnerLignes(params: {
  motifs: Motif[]; lignesVa: LigneIndicateurNonAJour[]; lignesViVc: LigneIndicateurSansViVc[];
}): LigneFusionnee[]; // triées par chantier, indicateur, territoire
export function versLigneACompleter(ligne: LigneFusionnee): LigneACompleter;
```

`fusionnerLignes` et `versLigneACompleter` reprennent ceux de `indicateursACompleter.ts` de la branche ; `LigneACompleter` gagne `chantier_nom`, et `territoire_nom_affiche` devient obligatoire. Le reste de ce fichier de la branche (compteurs, `par_territoire`, définitions, seuil à 30) n'est pas repris.

- [ ] **Step 1: Reporter le diff des deux requêtes et de leurs tests d'intégration**, puis lancer `pnpm vitest run --project server-integration src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursNonAJourQuery.integration.test.ts src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursSansViVcQuery.integration.test.ts`. Expected : PASS.

- [ ] **Step 2: Écrire les tests de la fusion**, repris de `indicateursACompleter.unit.test.ts` de la branche pour ce qui concerne la fusion et les lignes :
  - un même territoire en VA non à jour et sans VC → une ligne, `motifs: ["VA non à jour", "VC manquante"]`, avec les dates et la dernière VC connue ;
  - `motifs: ["vi"]` alors que la ligne de la requête porte `vcManquante: true` → la ligne ne garde que « VI manquante », sans `derniere_vc_connue` ;
  - tri par chantier, indicateur, territoire ;
  - `chantier_nom` et `territoire_nom_affiche` présents.

- [ ] **Step 3: Lancer les tests** — `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/indicateursACompleter.unit.test.ts`. Expected : FAIL.

- [ ] **Step 4: Implémenter**, puis relancer. Expected : PASS.

- [ ] **Step 5: Commit** (si autorisé) — `feat(albert): fusionne les lignes des valeurs à compléter`

---

### Task 4: Résumé envoyé au modèle

**Files:**
- Create: `src/server/albert/tools/resumeIndicateursACompleter.ts`
- Test: `src/server/albert/__tests__/tools/resumeIndicateursACompleter.unit.test.ts`

**Interfaces:**
- Consumes: `LigneFusionnee`, `Motif`, `LibelleMotif`, `LIBELLES_MOTIF`, `MOTIFS_ORDER` (tâche 3).
- Produces:

```ts
export const SEUIL_INDICATEURS_RESUME = 20;
export type CleResume = LibelleMotif | "tous motifs confondus";
export type PhrasesParMotif = Partial<Record<CleResume, string>>;
export type IndicateurResume = { indicateur: string } & PhrasesParMotif;
export type ChantierResume = { chantier: string; indicateurs?: IndicateurResume[] } & PhrasesParMotif;
export type ResumeIndicateursACompleter = {
  en_bref: string;
  jalon_vc?: number;
  ensemble: PhrasesParMotif;
  chantiers: ChantierResume[];
  sans_valeur_a_completer?: string[];
};
export function resumerIndicateursACompleter(params: {
  lignes: LigneFusionnee[];
  motifs: Motif[];              // dédoublonnés, ordre va, vi, vc
  mailles: $Enums.Maille[];     // mailles interrogées, ordre NAT, REG, DEPT
  unSeulTerritoire: boolean;
  perimetre: string;            // ex. "Bretagne et ses départements"
  jalon?: number;               // présent si "vc" est demandé
  demandesExplicites: string[]; // CH-… et IND-… nommés par l'utilisateur et accessibles
}): ResumeIndicateursACompleter;
```

Textes fixés (les tests les vérifient mot pour mot) :
- Mailles, toutes celles de `mailles`, dans l'ordre, séparées par « , » : NAT « 1 territoire national » / « aucun territoire national » ; REG « 1 région » / « n régions » / « aucune région » ; DEPT « 1 département » / « n départements » / « aucun département ». Des territoires distincts.
- Comptes : « 1 chantier » / « n chantiers », « 1 indicateur » / « n indicateurs ».
- Plusieurs territoires : `ensemble` « {chantiers}, {indicateurs} · {mailles} » ; chantier « {indicateurs} · {mailles} » ; indicateur « {mailles} ».
- Un seul territoire : `ensemble` « {chantiers}, {indicateurs} » ; chantier « {indicateurs} » ; indicateur « à compléter ».
- `ensemble` : tous les motifs demandés ; un motif sans ligne vaut « aucun indicateur ». Chantiers et indicateurs : seulement les motifs concernés.
- « tous motifs confondus » : dans `ensemble` et les chantiers, si `motifs.length >= 2`.
- Libellés « {id} · {nom} » ; chantiers triés par nombre d'indicateurs distincts décroissant, puis par identifiant ; indicateurs par identifiant.
- `indicateurs` présents si le nombre d'indicateurs distincts de toutes les lignes est `<= SEUIL_INDICATEURS_RESUME`.
- `en_bref` avec lignes : « Périmètre : {perimetre}. {chantiers} et {indicateurs} ont des valeurs à compléter ({motifs}). » Sans ligne : « Périmètre : {perimetre}. Aucune valeur à compléter ({motifs}). » `{motifs}` : libellés séparés par « , », la VC écrite « VC manquante pour le jalon {jalon} ».
- `jalon_vc` si `"vc"` est demandé ; `sans_valeur_a_completer` : les `demandesExplicites` sans aucune ligne, dans leur ordre, absent si vide.

- [ ] **Step 1: Écrire les tests**
  - `plusieurs territoires` : lignes VA IND-894 sur REG-53, DEPT-22, DEPT-29, DEPT-35 ; VA IND-912 sur DEPT-29 ; VC IND-912 sur DEPT-29, DEPT-56 ; CH-038 « Accès aux soins » ; `mailles: ["REG", "DEPT"]`, `perimetre: "Bretagne et ses départements"`, `jalon: 2026`, motifs `["va", "vc"]` → `toEqual` sur l'exemple « Plusieurs territoires » de la spec, à l'identique.
  - `un seul territoire` : les mêmes indicateurs sur DEPT-59 seul, `perimetre: "Nord"`, `unSeulTerritoire: true` → l'exemple « Un seul territoire » de la spec.
  - `liste des indicateurs` : 20 indicateurs distincts → listes présentes ; 21 → aucun chantier n'a de clé `indicateurs`.
  - `ensemble compte une fois` : DEPT-29 concerné dans deux chantiers, motif `["va"]` → `ensemble: { "VA non à jour": "2 chantiers, 2 indicateurs · 1 département" }`, sans « tous motifs confondus ».
  - `motif sans ligne` : motifs `["va", "vi"]`, lignes VA seulement → `ensemble["VI manquante"]` vaut « aucun indicateur », et aucun chantier n'a de clé « VI manquante ».
  - `national` : `mailles: ["NAT", "REG", "DEPT"]`, une ligne NAT → la phrase commence par « 1 territoire national, aucune région, aucun département ».
  - `aucune ligne` : `en_bref` « Périmètre : Nord. Aucune valeur à compléter (VC manquante pour le jalon 2026). », `chantiers: []`.
  - `sans valeur à compléter` : `demandesExplicites: ["CH-018", "CH-038"]`, lignes sur CH-038 seulement → `sans_valeur_a_completer: ["CH-018"]`.

- [ ] **Step 2: Lancer les tests** — `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/resumeIndicateursACompleter.unit.test.ts`. Expected : FAIL.

- [ ] **Step 3: Implémenter** `resumerIndicateursACompleter`, puis relancer. Expected : PASS.

- [ ] **Step 4: Commit** (si autorisé) — `feat(albert): résumé plat des indicateurs à compléter`

---

### Task 5: L'outil `get_indicateurs_a_completer`

**Files:**
- Create: `src/server/albert/tools/getIndicateursACompleter.ts`
- Test: `src/server/albert/__tests__/tools/getIndicateursACompleter.unit.test.ts` (harnais `buildTool` repris de la branche, avec un mock de `GetTerritoiresIdentiteQuery`)

**Interfaces:**
- Consumes: `doitDemanderPrecision` (tâche 2) ; `fusionnerLignes`, `versLigneACompleter`, `Motif`, `MOTIFS_ORDER`, `LigneACompleter` (tâche 3) ; `resumerIndicateursACompleter`, `ResumeIndicateursACompleter` (tâche 4) ; `resoudreAccesIndicateurs`, `chantierIdsIndicateursSchema`, `indicateurIdsSchema`, `perimetreIndicateursSchema`, `CONSIGNE_ACCES_REFUSE`, `ChampsAcces` (`socleValeursIndicateurs.ts`) ; `GetTerritoiresIdentiteQuery` ; `ClarifyWithChoicesOutput`.
- Produces:

```ts
export const getIndicateursACompleterInputSchema; // motifs: z.array(z.enum(["va","vi","vc"])).min(1).max(3), + chantier_ids, indicateur_ids, perimetre du socle
export type DetailIndicateursACompleter = {
  motifs: Motif[]; jalon?: number; perimetre: string; lignes: LigneACompleter[];
};
export type GetIndicateursACompleterOutput =
  | (ChampsAcces & { clarification: ClarifyWithChoicesOutput })
  | (ChampsAcces & { resume: ResumeIndicateursACompleter; detail: DetailIndicateursACompleter })
  | ChampsAcces;
export function indicateursACompleterVersModele(params: {
  output: GetIndicateursACompleterOutput;
}): { type: "json"; value: JSONValue };
export function createGetIndicateursACompleterTool(deps: {
  getIndicateursNonAJourQuery: GetIndicateursNonAJourQuery;
  getIndicateursSansViVcQuery: GetIndicateursSansViVcQuery;
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
  territoireResolver: TerritoireResolver;
}): (habilitations: { territoiresAccessibles: string[]; chantiersAccessibles: string[] }) => Tool;
```

Comportement de `execute(input, { messages })` :
1. `resoudreAccesIndicateurs` ; `sans_resultat` → les champs d'accès seuls.
2. `doitDemanderPrecision({ messages })` → `{ clarification, ...champsAcces }`. `clarification()` et `libellePerimetre()` sont repris de la branche (libellés avec les codes : « sur le CH-018 en REG-53 »).
3. Jalon (`getAnneeDateDeBascule`), puis les deux requêtes en parallèle selon les motifs, comme sur la branche (`valeursRecherchees`).
4. `perimetre` : préfixe des `indicateur_ids` demandés, sinon des `chantier_ids` demandés, séparés par « , », puis « , » et la partie territoires : `TOUS_TERRITOIRES` « tous vos territoires » ; `TOUTES_REGIONS` « toutes vos régions » ; `TOUS_DEPARTEMENTS` « tous vos départements » ; `FRANCE_ET_SES_REGIONS` « France et ses régions » ; `REGION_ET_SES_DEPARTEMENTS` « {nom de la région} et ses départements » ; `SELECTION` les noms séparés par « , ». Les noms viennent de `getTerritoiresIdentiteQuery`, le code s'il est inconnu.
5. `resumerIndicateursACompleter` avec `mailles` déduites des codes résolus (préfixes `NAT-`, `REG-`, `DEPT-`), `unSeulTerritoire: acces.territoireCodes.length === 1` et `demandesExplicites` = indicateurs demandés retenus par l'accès, puis chantiers demandés accessibles (jamais ceux que l'accès ajoute).

`indicateursACompleterVersModele` : clarification → `{ precision_demandee: true, ...champsAcces }` ; données → `{ ...resume, ...champsAcces }` ; sinon la sortie telle quelle.

Description : le contenu de la section « Description de l'outil » de la spec, dont la phrase exacte « Choisissez une option pour continuer. ».

- [ ] **Step 1: Écrire les tests** (`execute` appelé avec `{ toolCallId: "appel-1", messages }`) :
  - `demande la précision` : messages `[user "Quels indicateurs sont non à jour sur le CH-018 ?"]` → sortie `{ clarification: { question: "Quelles valeurs voulez-vous vérifier sur le CH-018 ?", choices: [...] } }` ; aucune requête de valeurs appelée.
  - `accès refusé` : un territoire inaccessible → `{ acces_refuse: true }`, sans `clarification`.
  - `type nommé` : messages `[user "Quelles VA et VC ne sont pas à jour ?"]`, motifs `["vc", "va", "va"]` → `detail.motifs: ["va", "vc"]`, `detail.lignes` fusionnées, `resume.en_bref` qui commence par « Périmètre : tous vos territoires. ».
  - `seuls les motifs demandés` : motifs `["vi"]` → requête VA non appelée, requête VI/VC appelée avec `valeurs: "vi"`.
  - `un seul territoire accessible` : `territoiresAccessibles: ["DEPT-29"]`, `TOUS_TERRITOIRES` → phrases sans territoires (« à compléter » au niveau de l'indicateur).
  - `région et ses départements` : `perimetre: { type: "REGION_ET_SES_DEPARTEMENTS", region_code: "REG-53" }` → `detail.perimetre: "Bretagne et ses départements"`.
  - `demandes explicites` : `indicateur_ids: ["IND-894"]` sans ligne → `resume.sans_valeur_a_completer: ["IND-894"]`, sans le chantier de l'indicateur.
  - `version modèle` : `indicateursACompleterVersModele` sur une sortie de données → la valeur ne contient ni `detail` ni `lignes` ; sur une clarification → `{ precision_demandee: true }`.

- [ ] **Step 2: Lancer les tests** — `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/getIndicateursACompleter.unit.test.ts`. Expected : FAIL.

- [ ] **Step 3: Implémenter**, puis relancer. Expected : PASS.

- [ ] **Step 4: Commit** (si autorisé) — `feat(albert): outil get_indicateurs_a_completer`

---

### Task 6: Branchement, retrait des anciens outils, prompt système

**Files:**
- Modify: `src/server/albert/module.ts` (imports l. 13-14, types l. 75-80, enregistrement l. 137-142)
- Modify: `src/server/albert/AssistantIA.ts:77-82`
- Modify: `src/server/albert/PiloteUIMessage.ts` (imports l. 50-57, types l. 100-107)
- Modify: `src/client/components/_commons/ChatUI/SourcesConsultees.tsx` (diff de la branche)
- Modify: `src/client/components/_commons/ChatUI/AssistantMessageText.tsx` (`TOOL_NAMES` : ajouter `"get_indicateurs_a_completer"`)
- Modify: `src/server/albert/tools/getChantiers.ts`, `src/server/albert/tools/searchIndicateurs.ts` (anciens noms → `get_indicateurs_a_completer`)
- Modify: `src/server/albert/tools/socleValeursIndicateurs.ts` (retirer `SEUIL_LIGNES_TERRITOIRES`, `CONSIGNE_DETAIL_TROP_VOLUMINEUX`, `resoudreDetail`, `ChampsDetail`, `renvoyerChantiers`, `ChantierRenvoye` et `MAILLES_ORDER` s'ils n'ont plus d'usage)
- Modify: `src/server/albert/systemPrompt.ts` (l. 116-117, 139-142, mention de `detail_trop_volumineux` l. 144, exemples l. 172-179)
- Modify: `src/server/albert/tools/clarifyWithChoices.ts` (description)
- Delete: `src/server/albert/tools/getValeursAvancementNonAJour.ts`, `getValeursInitialesCiblesManquantes.ts` et leurs tests dans `src/server/albert/__tests__/tools/`

**Interfaces:**
- Consumes: `createGetIndicateursACompleterTool`, `getIndicateursACompleterInputSchema`, `GetIndicateursACompleterOutput` (tâche 5).
- Produces: `PiloteUITools["get_indicateurs_a_completer"]`, utilisé par l'interface (tâche 7).

- [ ] **Step 1: Brancher l'outil et retirer les anciens**, avec les lignes de la liste ci-dessus.

- [ ] **Step 2: Prompt système**, comme décrit dans la section « Prompt système » de la spec :
  - garder la ligne 115 (« données périmées »…) ;
  - ajouter la ligne de vocabulaire et les deux exemples ;
  - dans `clarifyWithChoices.ts`, ajouter « Jamais pour le type de valeurs à mettre à jour (« non à jour », « à mettre à jour », « à compléter ») : get_indicateurs_a_completer demande lui-même la précision. »

- [ ] **Step 3: Vérifier**

Run : `grep -rn -E "get_valeurs_|getValeurs(AvancementNonAJour|InitialesCiblesManquantes)|detail_trop_volumineux" src`
Expected : aucun résultat.

Run : `pnpm lint`, puis `pnpm vitest run --project server-unit src/server/albert`
Expected : 0 erreur, tests verts, `systemPrompt.unit.test.ts` compris.

- [ ] **Step 4: Historique avec un ancien outil** (Review Focus 1)

Dans `pnpm dev`, rouvrez une conversation qui a appelé `get_valeurs_avancement_non_a_jour`, puis posez une question de suivi.
Expected : une réponse, sans erreur de `convertToModelMessages` ni de l'API Albert. En cas d'erreur, retirez dans `Albert.streamText`, avant la conversion, les parts d'outils absents de `tools`.

- [ ] **Step 5: Commit** (si autorisé) — `refactor(albert): remplace les deux outils de valeurs par get_indicateurs_a_completer`

---

### Task 7: Interface — choix et tableau du détail

**Files:**
- Move: `src/client/components/PageAnnuaire/SelecteurGroupement.tsx` → `src/client/components/_commons/SelecteurGroupement/SelecteurGroupement.tsx`, et ses imports dans `PageAnnuaire/TableauCoordinateurs.tsx` et `TableauResponsables.tsx` (diff de la branche)
- Modify: `src/client/components/_commons/MultiSelectFiltre/MultiSelectFiltre.tsx` (`classNameContenu`, diff de la branche)
- Create, depuis la branche : `src/client/components/_commons/ChatUI/TableauIndicateursACompleter.tsx`, `useTableauIndicateursACompleter.tsx`, `detailIndicateursACompleter.ts`, `csvIndicateursACompleter.ts`, et leurs tests (`TableauIndicateursACompleter.integration.test.tsx`, `detailIndicateursACompleter.unit.test.ts`, `csvIndicateursACompleter.unit.test.ts`)
- Modify: `src/client/components/_commons/ChatUI/assistantEvents.ts` (`choixPresentes`, `choicesPresentedEvent`) et `assistantEvents.unit.test.ts`
- Modify: `src/client/components/_commons/ChatUI/AssistantMessage.tsx` (bloc des choix l. 213-225, rendu du tableau après `CentreAideEncart`) et `AssistantMessage.integration.test.tsx`

**Interfaces:**
- Consumes: `DetailIndicateursACompleter`, `GetIndicateursACompleterOutput` (tâche 5) ; `LigneACompleter`, `LibelleMotif` (tâche 3).
- Produces:

```ts
export const TableauIndicateursACompleter: (props: { detail: DetailIndicateursACompleter }) => JSX.Element;
export const choixPresentes: (part: PiloteUIMessage["parts"][number]) => ClarifyWithChoicesOutput | null;
```

Adaptations par rapport à la branche :
- les composants lisent `detail` au lieu de la sortie entière ; `lignesDetail({ lignes })` prend `chantier_nom` sur la ligne ;
- titre : « Détail par territoire · {detail.perimetre} · {motifs} · {n} lignes · {n} chantier(s) », où `{motifs}` reprend les libellés séparés par « , », la VC écrite « VC manquante (jalon {jalon}) » ;
- `choixPresentes` : `tool-clarify_with_choices`, ou `tool-get_indicateurs_a_completer` dont la sortie contient `clarification` ;
- `AssistantMessage` :
  - un seul `ChoicesInline` : celui de la dernière part pour laquelle `choixPresentes` renvoie des choix ;
  - un tableau par part `tool-get_indicateurs_a_completer` en `output-available` dont `detail.lignes` n'est pas vide, quand `!isStreaming`.

- [ ] **Step 1: Reporter les fichiers de la branche** (déplacement, filtre, tableau, CSV, détail) et les adapter comme ci-dessus.

- [ ] **Step 2: Écrire ou adapter les tests**
  - `TableauIndicateursACompleter` : titre exact « Détail par territoire · Bretagne et ses départements · VA non à jour, VC manquante (jalon 2026) · 2 lignes · 1 chantier » ; export CSV repris de la branche.
  - `AssistantMessage` :
    - le tableau s'affiche avec une ligne ;
    - il ne s'affiche pas avec `lignes: []`, sur une sortie `clarification`, ni pendant le streaming ;
    - deux parts de clarification dans un message → un seul bloc de choix, celui de la seconde.
  - `assistantEvents` : `choicesPresentedEvent` compte les choix d'une clarification de `get_indicateurs_a_completer`.

- [ ] **Step 3: Lancer les tests**

Run : `pnpm vitest run --project client src/client/components/_commons/ChatUI`
Expected : PASS. Puis `pnpm lint` : 0 erreur.

- [ ] **Step 4: Vérifier dans l'application**

Dans `pnpm dev`, posez « Quels indicateurs sont non à jour sur le CH-018 ? ».
Expected : trois boutons, dont « Valeurs d'avancement non à jour sur le CH-018 ».

Cliquez ce bouton.
Expected : une réponse qui reprend `en_bref`, puis le tableau replié avec le titre complet ; le CSV s'ouvre dans un tableur avec les accents corrects.

- [ ] **Step 5: Commit** (si autorisé) — `feat(albert): choix et tableau du détail des indicateurs à compléter`

---

### Task 8: Evals N2 et mesure après

**Files:**
- Create: `evals/2-tools/2.2-donnees/getIndicateursACompleter.eval.ts` (depuis la branche)
- Delete: `evals/2-tools/2.2-donnees/getValeursAvancementNonAJour.eval.ts`, `getValeursInitialesCiblesManquantes.eval.ts`
- Modify: `evals/2-tools/2.3-rendu/clarifyWithChoices.eval.ts`, `evals/2-tools/2.2-donnees/getChantiers.eval.ts`, `getChantiersSignales.eval.ts`, `getIndicateurs.eval.ts` (diffs de la branche, adaptés)
- Modify: `evals/scoreExpectedTools.ts` et `evals/scoreExpectedTools.unit.test.ts` (`CLES_ENSEMBLE_EXACT = ["motifs"]`, diff de la branche)

**Interfaces:**
- Consumes: `toolSelectionEval`, `ToolCase` ; `VALEURS_A_COMPLETER_CRITERIA` et le scénario de la tâche 1.

- [ ] **Step 1: `scoreExpectedTools`**

Reporter le diff de la branche et son test, puis lancer `pnpm vitest run --project server-unit evals/scoreExpectedTools.unit.test.ts`.
Expected : PASS.

- [ ] **Step 2: Evals N2**

Reporter `getIndicateursACompleter.eval.ts` de la branche. Les cas qui attendaient `motifs: "non_precise"` attendent désormais `{ toolName: "get_indicateurs_a_completer" }` sans `input`, avec `forbidden: ["clarify_with_choices"]`. Mettre à jour l'en-tête (la précision est décidée par le code, garantie par les tests de la tâche 2).

Reporter les diffs de la branche sur `clarifyWithChoices`, `getChantiers`, `getChantiersSignales` et `getIndicateurs`, sans aucune mention de `non_precise`.

Run : `grep -rn -E "get_valeurs_|non_precise" evals --include="*.ts"`
Expected : aucun résultat.

- [ ] **Step 3: Mesure après**, mêmes commandes qu'à la tâche 1, avec `apres` dans `--outputPath`. Les deux suites supprimées sont remplacées par `evals/2-tools/2.2-donnees/getIndicateursACompleter.eval.ts`.

Expected :
- `valeursACompleter` (N3) : chaque critère au moins au niveau avant ; `Un seul territoire`, `Aucun territoire hors demande` et `Tableau introduit` à 2/3 au moins par cas.
- `clarifyWithChoices`, `getIndicateurs`, `getChantiers`, `getChantiersSignales` : pas de baisse au-delà du bruit (un essai sur trois).

Sous ces seuils, notez les cas en échec et rapportez-les à Triko avant toute itération de description.

- [ ] **Step 4: Référence** : reporter les moyennes avant et après dans l'en-tête de `valeursACompleter.eval.ts` et de `getIndicateursACompleter.eval.ts`.

- [ ] **Step 5: Commit** (si autorisé) — `test(albert): evals de get_indicateurs_a_completer et mesure après`
