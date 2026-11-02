# Albert : indicateurs sans VI ou sans VC (PIL-1939) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'outil `get_indicateurs_sans_vi_vc` et faire clarifier l'assistant quand une demande de mise à jour ne précise pas le type de valeurs.

**Architecture:** Une query plate `GetIndicateursSansViVcQuery` renvoie les seules lignes concernées, l'outil les regroupe par chantier, indicateur et maille. La résolution des accès est extraite de `getIndicateursNonAJour.ts` pour être partagée. Les recherches combinées ne sont pas croisées dans le code : l'assistant appelle les deux outils en parallèle et rédige la synthèse.

**Tech Stack:** TypeScript, Vercel AI SDK (`tool`), Zod, Prisma, Vitest, evalite.

**Spec:** `docs/superpowers/specs/2026-11-02-albert-indicateurs-sans-vi-vc-design.md`

## Global Constraints

- Branche `feat/albert-indicateurs-sans-vi-vc-pil-1939`, créée depuis `feat/albert-indicateurs-non-a-jour-rationalisation`. Ne pas réutiliser `feat/albert-indicateurs-sans-vi-vc`, abandonnée.
- Toutes les commandes se lancent depuis `apps/pilote-ppg`.
- Seuil de repli : plus de 800 lignes territoire en detail `territoires`.
- Jalon : `getAnneeDateDeBascule(new Date(), configuration().dateBasculeAffichageValeursAnneePrecedente)`, calculé dans `execute`.
- Vocabulaire métier en français, technique en anglais ; contrat de l'outil en snake_case, mailles en libellés via `libelleMaille`.
- Tests : `expect(result).toEqual(...)` plutôt que `toHaveLength` et accès par index ; pas de variable de 1 ou 2 caractères ; commentaires limités à given/when/then.
- Base de test : `prisma migrate reset` est bloqué pour l'agent, utiliser `migrate deploy`. Un échec préexistant sur `MinistèreSQLRepository` ne relève pas de ce travail.
- Ne pas pousser ni ouvrir de PR sans demande de Triko. Les commits listés ici sont couverts par la validation du plan ; tout correctif hors plan attend sa demande.

## Review Focus

1. Un territoire sans VI ni VC : une seule entrée avec les deux motifs, compté dans les deux compteurs.
2. Recherche `vc` sur un territoire qui a aussi perdu sa VI : aucun motif « valeur initiale », et l'inverse pour `vi`.
3. Dernière VC à 0 : rendue comme `{ valeur: 0, jalon }`, pas comme « aucune valeur cible connue ».
4. Jalon antérieur intermédiaire sans cible (2025 null, 2024 à 100) : la dernière VC connue reste 2024.
5. VI manquante et VC renseignée au jalon : pas de champ `derniere_vc_connue`.

---

### Task 1 : Evals et run de référence

**Files:**
- Create: `evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts`
- Modify: `evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts`, `evals/2-tools/2.3-rendu/clarifyWithChoices.eval.ts`

**Interfaces:**
- Produces: les cas d'eval attendus par la Task 5.

- [ ] **Step 1 : Créer la branche**

Run: `git switch -c feat/albert-indicateurs-sans-vi-vc-pil-1939`

- [ ] **Step 2 : Écrire la suite `getIndicateursSansViVc.eval.ts`**

Même forme que `getIndicateursNonAJour.eval.ts` (`toolSelectionEval`, `famille: "donnees"`). Cas :

| Question | Attendu |
|---|---|
| « Quels indicateurs du CH-018 n'ont pas de cible ? » | `get_indicateurs_sans_vi_vc`, `chantier_ids: ["CH-018"]`, `valeurs: "vc"` |
| « Quels indicateurs n'ont pas de valeur initiale ? » | `valeurs: "vi"` |
| « Sur quels territoires manque-t-il une valeur initiale ou une cible pour l'IND-894 ? » | `indicateur_ids: ["IND-894"]`, `valeurs: "vi_et_vc"`, `detail: "territoires"` |
| « Quels indicateurs n'ont ni VI ni VC au national ? » | `valeurs: "vi_et_vc"`, `perimetre` NAT-FR |
| « Quels indicateurs n'ont pas de cible en 2027 ? » | `valeurs: "vc"` |
| « Quelles valeurs d'avancement ne sont pas à jour et quels indicateurs n'ont pas de cible ? » | les deux outils, `valeurs: "vc"` |
| « Toutes les valeurs à compléter : VA non à jour, VI et VC manquantes » | les deux outils, `valeurs: "vi_et_vc"` |
| « Quels chantiers ont un taux d'avancement non calculé ? » | interdit : `get_indicateurs_sans_vi_vc` |
| « Quels chantiers sont en retard en Bretagne ? » | interdit : `get_indicateurs_sans_vi_vc` |
| « Quelles sont les valeurs des indicateurs du CH-004 au national ? » | interdit : `get_indicateurs_sans_vi_vc` |

- [ ] **Step 3 : Adapter `getIndicateursNonAJour.eval.ts`**

Les cas positifs reformulent leur question avec « valeurs d'avancement » pour garder la vérification de leurs arguments. Exemple : « Quelles valeurs d'avancement ne sont pas à jour sur le chantier CH-018 ? ». Mettre à jour le commentaire d'en-tête. Les négatifs ne changent pas.

- [ ] **Step 4 : Ajouter les cas à `clarifyWithChoices.eval.ts`**

Attendu `clarify_with_choices`, et interdits `get_indicateurs_non_a_jour` et `get_indicateurs_sans_vi_vc` :
« Quels sont les indicateurs à mettre à jour ? », « Quels indicateurs sont non à jour sur le CH-018 ? », « Quels indicateurs ont un retard de mise à jour ? », « Quelles données sont périmées sur l'IND-894 ? ».

Attendu sans clarification, `clarify_with_choices` interdit : « Quels indicateurs n'ont pas de cible ? », « Quelles valeurs d'avancement ne sont pas à jour ? ».

- [ ] **Step 5 : Lancer le run de référence**

Run : `pnpm eval` pour le niveau 2 et le niveau 3 (3 essais par cas, réglés par `trialCount`). Rejouer une à une les suites perdues sur 503 ou 429 : `pnpm eval <chemin>`.
Expected : les cas nouveaux échouent, l'outil n'existant pas. Noter le taux N2, le taux N3, le taux par suite, les échecs répétés et les tokens du prompt. Ils serviront à la Task 6.

- [ ] **Step 6 : Commit**

```bash
git add evals/2-tools docs/superpowers
git commit -m "test(albert): spec, plan et evals des indicateurs sans VI ou VC"
```

### Task 2 : Mutualiser la résolution des accès

**Files:**
- Create: `src/server/albert/tools/rechercheIndicateurs.ts`
- Modify: `src/server/albert/tools/getIndicateursNonAJour.ts`
- Test: `src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts` (inchangé)

**Interfaces:**
- Produces, depuis `rechercheIndicateurs.ts` :
  - `SEUIL_LIGNES_TERRITOIRES = 800`, `MAILLES_ORDER`
  - `perimetreIndicateursSchema`, `chantierIdsIndicateursSchema` et `indicateurIdsSchema`, les schémas Zod aujourd'hui en ligne, avec leurs descriptions
  - `type ListesSignalees = { chantiers_non_accessibles?: string[]; indicateurs_non_accessibles?: string[]; indicateurs_introuvables?: string[] }`
  - `type AccesResolus`, inchangé
  - `resoudreAccesIndicateurs({ chantierIds, indicateurIds, perimetre, territoiresAccessibles, chantiersAccessibles, territoireResolver, getIndicateursIdentiteQuery }): Promise<AccesResolus>`

- [ ] **Step 1 : Déplacer le code, sans changer son comportement**

`resoudreAcces` devient `resoudreAccesIndicateurs` et reçoit `chantierIds` et `indicateurIds` à la place de `input`. `listesSignalees` reste privée au module.

- [ ] **Step 2 : Vérifier la non-régression**

Run : `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`
Expected : PASS, sans modification du fichier de test.

- [ ] **Step 3 : Commit**

```bash
git add src/server/albert/tools
git commit -m "refactor(albert): mutualise la résolution des accès aux indicateurs"
```

### Task 3 : Query des indicateurs sans VI ou VC

**Files:**
- Create: `src/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery.ts`
- Modify: `src/server/chantiers/module.ts` (type, liste des dépendances et `asModuleClass`, aux trois endroits où figure `getIndicateursNonAJourQuery`)
- Test: `src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursSansViVcQuery.integration.test.ts`

**Interfaces:**
- Produces :

```ts
export type ValeursRecherchees = "vi" | "vc" | "vi_et_vc";

export type LigneIndicateurSansViVc = {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  indicateurNom: string;
  maille: $Enums.Maille;
  territoireCode: string;
  territoireNom: string | null;
  viManquante: boolean;
  vcManquante: boolean;
  derniereVcConnue: { valeur: number; jalon: number } | null;
};

execute(params: {
  chantierIds: string[];
  territoireCodes: string[];
  indicateurIds?: string[];
  jalon: number;
  valeurs: ValeursRecherchees;
}): Promise<LigneIndicateurSansViVc[]>
```

- [ ] **Step 1 : Écrire les tests d'intégration**

Jeu de données avec `fixtures.indicateurTerritoire` et `fixtures.indicateurTerritoireJalon`, seed repris du test de `GetIndicateursNonAJourQuery`. `jalon: 2026`. Chaque test vérifie la liste complète avec `toEqual` :

- `signale la VI nulle` ; `ne signale pas une VI à 0` ;
- `signale la VC nulle au jalon` ; `ne signale pas une VC à 0` ;
- `ignore un territoire sans ligne pour le jalon` ; `ignore une VC nulle sur un autre jalon` ;
- `ignore un territoire non applicable`, `un indicateur non publié`, `un chantier non publié`, `un territoire hors périmètre` ;
- `signale VI sur un territoire et VC sur un autre, chacun avec son motif` ;
- `donne une seule ligne, avec les deux motifs, pour un territoire sans VI ni VC` ;
- `en recherche vc, ne remonte pas un territoire seulement sans VI et ne marque pas viManquante` ; le même test inversé pour `vi` ;
- `dernière VC connue : le jalon antérieur le plus récent non nul` (2024 = 100, 2025 null, 2026 null → `{ valeur: 100, jalon: 2024 }`) ;
- `dernière VC connue à 0` (2025 = 0 → `{ valeur: 0, jalon: 2025 }`) ;
- `dernière VC connue : ignore un jalon postérieur` (2027 = 50 seul → `null`) ;
- `derniereVcConnue est null pour une ligne en VI manquante seule`.

- [ ] **Step 2 : Vérifier l'échec**

Run : `pnpm vitest run --project server-integration GetIndicateursSansViVcQuery`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : Implémenter la query**

`where` : `AND` de `indicateursPubliesWhere(params)`, `est_applicable: true`, et un `OR` selon `valeurs` entre `{ valeur_initiale: null }` et `{ indicateur_territoire_jalon: { some: { jalon, valeur_cible: null } } }`. `select` : charger les lignes de jalon `{ jalon: { lte: jalon } }`, triées par jalon décroissant. Même `orderBy` que `GetIndicateursNonAJourQuery`. `derniereVcConnue` n'est calculée que si `vcManquante`, depuis la première ligne de jalon antérieur dont la cible n'est pas nulle (comparer à `null`, jamais en truthy).

- [ ] **Step 4 : Vérifier le succès**

Même commande. Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/server/chantiers
git commit -m "feat(albert): query des indicateurs sans VI ou VC au jalon par défaut"
```

### Task 4 : L'outil et ses branchements

**Files:**
- Create: `src/server/albert/tools/getIndicateursSansViVc.ts`
- Modify: `src/server/albert/module.ts`, `src/server/albert/AssistantIA.ts`, `src/server/albert/PiloteUIMessage.ts`, `src/client/components/_commons/ChatUI/SourcesConsultees.tsx`
- Test: `src/server/albert/__tests__/tools/getIndicateursSansViVc.unit.test.ts`

**Interfaces:**
- Consumes : `rechercheIndicateurs.ts` (Task 2), `GetIndicateursSansViVcQuery` et ses types (Task 3).
- Produces : `getIndicateursSansViVcInputSchema`, `type GetIndicateursSansViVcOutput` (forme de la spec, section Sortie), `createGetIndicateursSansViVcTool({ getIndicateursSansViVcQuery, getIndicateursIdentiteQuery, territoireResolver })`, puis `({ territoiresAccessibles, chantiersAccessibles }) => tool(...)`.

- [ ] **Step 1 : Écrire les tests unitaires**

Harnais `buildTool` de `getIndicateursNonAJour.unit.test.ts`, avec la query mockée. Tests, chacun en `toEqual` sur la sortie :

- `transmet le jalon par défaut et les valeurs à la query` ; `valeurs vaut vi_et_vc par défaut` ;
- `compteurs : un territoire sans VI ni VC compte dans les deux compteurs, sans clé territoires` ;
- `valeurs vc : pas de nb_territoires_sans_vi` ; `valeurs vi : pas de nb_territoires_sans_vc` ;
- `compteurs : aucune dernière VC` ;
- `détail : valeurs_manquantes vaut ["valeur initiale", "valeur cible"] pour les deux motifs` ;
- `détail, VC manquante : derniere_vc_connue vaut { valeur: 100, jalon: 2024 }` ; `vaut null sans cible connue` ; `conserve { valeur: 0, jalon: 2025 }` ;
- `détail, VI seule manquante : pas de clé derniere_vc_connue` ;
- `800 lignes : détail conservé` ; `801 lignes : compteurs et detail_trop_volumineux` ;
- `aucune ligne : resultats vide et jalon présent` ;
- `acces_refuse`, `chantiers_non_accessibles`, `indicateurs_non_accessibles`, `indicateurs_introuvables` : un test par champ ;
- `mailles dans l'ordre nationale, régionale, départementale`.

- [ ] **Step 2 : Vérifier l'échec**

Run : `pnpm vitest run --project server-unit getIndicateursSansViVc`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : Implémenter l'outil**

Regroupement sur le modèle de `renvoyerChantiersNonAJour`. Description : contenu de la section « Description » de la spec, dont la consigne de repli `detail_trop_volumineux` reprise de `getIndicateursNonAJour.ts`, et la phrase sur le jalon :

« Une VC manquante s'entend toujours sur le jalon renvoyé dans `jalon`, le jalon en cours : cite-le dans ta réponse, y compris si la demande vise une autre année. Ce jalon prime sur celui de la session. »

Les résultats n'indiquent pas la cause d'un taux non calculable : ne pas présenter une liste vide comme la preuve que tous les taux le sont.

- [ ] **Step 4 : Brancher l'outil**

`get_indicateurs_sans_vi_vc` dans `AssistantIA.ts`, avec les mêmes arguments que `get_indicateurs_non_a_jour` ; `createGetIndicateursSansViVcTool` dans `module.ts` ; types dans `PiloteUIMessage.ts` ; `"tool-get_indicateurs_sans_vi_vc": "Indicateurs sans VI ou VC"` et son entrée de type dans `SourcesConsultees.tsx`.

- [ ] **Step 5 : Vérifier**

Run : `pnpm vitest run --project server-unit getIndicateursSansViVc` puis `pnpm lint`
Expected : PASS, sans erreur de lint ni de type.

- [ ] **Step 6 : Commit**

```bash
git add src/server/albert src/client/components/_commons/ChatUI/SourcesConsultees.tsx
git commit -m "feat(albert): outil des indicateurs sans VI ou VC"
```

### Task 5 : Routage et clarification

**Files:**
- Modify: `src/server/albert/systemPrompt.ts`, `src/server/albert/tools/getIndicateursNonAJour.ts`, `src/server/albert/tools/getChantiers.ts`, `src/server/albert/tools/searchIndicateurs.ts`
- Test: `src/server/albert/__tests__/systemPrompt.unit.test.ts` si besoin

**Interfaces:**
- Consumes : l'outil de la Task 4, les evals de la Task 1.

- [ ] **Step 1 : Modifier `systemPrompt.ts`**

- Lexique, ligne « non à jour » : ajouter « à mettre à jour », préciser que sans type de valeurs la demande est à clarifier, et ajouter une ligne « sans cible », « sans VI », « valeurs manquantes » → `get_indicateurs_sans_vi_vc`.
- « Clarifier plutôt que deviner » : ajouter le cas d'une demande de mise à jour sans type de valeurs précisé ni connu des échanges, y compris pour un seul indicateur, et ses trois choix : VA non à jour, VI et VC manquantes, les trois, chaque libellé reprenant le périmètre.
- Exemple : « Sur quels territoires le CH-018 a des valeurs d'avancement non à jour ? ». Ajouter un exemple « VA et VC » → les deux outils en parallèle, `valeurs: "vc"`, avec une synthèse par chantier, indicateur et maille qui distingue les motifs.

- [ ] **Step 2 : Modifier les descriptions**

- `getIndicateursNonAJour.ts` : réserver l'appel direct aux demandes qui mentionnent la VA, la valeur d'avancement ou la dernière valeur ; adapter les exemples ; ajouter « Ne l'utilise pas pour : les VI ou VC manquantes → `get_indicateurs_sans_vi_vc` ; une demande de mise à jour sans type de valeurs → `clarify_with_choices` ».
- `searchIndicateurs.ts` : ajouter `get_indicateurs_sans_vi_vc` à la liste des outils.
- `getChantiers.ts` : ajouter le renvoi « les VI ou VC manquantes → `get_indicateurs_sans_vi_vc` ».

- [ ] **Step 3 : Vérifier**

Run : `pnpm vitest run --project server-unit src/server/albert/__tests__` puis `pnpm eval evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts`, et de même pour les suites `getIndicateursNonAJour` et `clarifyWithChoices`.
Expected : tests PASS. Chaque nouveau cas réussit au moins 2 essais sur 3 ; sinon, ajuster les descriptions ou ajouter un exemple au prompt.

- [ ] **Step 4 : Commit**

```bash
git add src/server/albert evals/2-tools
git commit -m "feat(albert): clarifie les demandes de mise à jour sans type de valeurs"
```

### Task 6 : Mesure et journal

**Files:**
- Modify: `docs/superpowers/specs/2026-11-02-albert-indicateurs-sans-vi-vc-design.md`

- [ ] **Step 1 : Lancer le run après implémentation**

Mêmes commandes que Task 1 Step 5, en rejouant une à une les suites perdues sur 503 ou 429.
Expected : aucun nouvel échec répété attribuable sur les suites existantes, chaque nouveau cas à au moins 2 essais sur 3. Sinon, itérer via la Task 5 et relancer les suites touchées.

- [ ] **Step 2 : Consigner le journal**

Ajouter une section « Journal des mesures » en fin de spec : tableau avant/après (N2, N2 hors nouvelle suite, suite de l'outil, suite `get_indicateurs_non_a_jour`, N3, échecs répétés, tokens), essais perdus, échecs nouveaux et leur attribution. Ne pas committer les fichiers de résultats bruts `evals/resultats-*`.

- [ ] **Step 3 : Vérification finale**

Run : `pnpm test:unit` puis `pnpm test:server:integration` et `pnpm lint`
Expected : PASS, à l'exception de l'échec préexistant `MinistèreSQLRepository`.

- [ ] **Step 4 : Commit**

```bash
git add docs/superpowers
git commit -m "docs(albert): journal des mesures des indicateurs sans VI ou VC"
```
