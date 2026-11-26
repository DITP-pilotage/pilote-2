# Albert lit tous les commentaires et dit lesquels — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sur une demande de synthèse des commentaires d'un chantier par territoire, l'assistant lit tous les types de commentaires avec `get_chantier_commentaires`, n'invente aucune absence, et termine sa réponse par la liste des types consultés ; sans régression mesurée sur les suites voisines.

**Architecture:** `get_chantiers` ne renvoie plus de commentaire (la collecte partagée avec les encarts garde la synthèse) ; `get_chantier_commentaires` renvoie les libellés des types consultés ; le prompt système demande la ligne « Commentaires consultés : … » ; les tableaux de bord perdent tout lien entre `widget_paragraph` et la météo ou le commentaire. Les evals changent d'abord et sont mesurées sur le code de `dev`, puis chaque changement produit est mesuré avec les mêmes suites.

**Tech Stack:** TypeScript, Next.js, Vercel AI SDK (`tool`), Prisma, Vitest, Evalite.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-11-26-albert-commentaires-lus-et-cites-design.md`

## Global Constraints

- Tout le travail est dans `apps/pilote-ppg` ; aucune dépendance à un package `@pilote/kpilote-*`. Chemins ci-dessous relatifs à `apps/pilote-ppg/`.
- Branche tirée de `origin/dev` : `feat/albert-commentaires-lus-et-cites`. Aucun code de la PR #2785 (branche `fix/albert-get-chantiers-sans-synthese`) n'est repris.
- Commits : un par tâche, au format `type(ppg): description en français`, terminé par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Aucun commit sans l'accord explicite de l'utilisateur** (donné une fois pour l'exécution, ou commit par commit).
- Commentaires, messages d'erreur, descriptions d'outils et textes affichés en français. Métier en français, technique en anglais dans les identifiants.
- Tests : `expect(result).toEqual([...])` plutôt que `toHaveLength` + index ; Given / When / Then ; pas de variable d'un ou deux caractères ; `$Enums` de `@prisma/client` pour les statuts.
- Tests unitaires : `pnpm -F @pilote/ppg exec vitest run --project server-unit <fichiers>` (client : `--project client`) ; intégration : `--project server-integration` (base de test `.env.test` démarrée).
- Avant chaque commit : `pnpm -F @pilote/ppg lint:tsc`, `pnpm -F @pilote/ppg exec oxlint --type-aware <fichiers modifiés>`, et depuis la racine `pnpm exec prettier --write <fichiers modifiés>` (jamais sur un dossier).
- `trialCount` reste à 3 dans `evals/3-scenarios/scenarioEval.ts` et `evals/2-tools/toolSelectionEval.ts` : chaque suite est lancée deux fois pour obtenir 6 essais par cas.
- La mention s'écrit sur la dernière ligne, exactement ouverte par « Commentaires consultés : », suivie des libellés séparés par des virgules.
- Pas de mention après un tableau de bord, un encart (`rediger_synthese_territoire`, `rediger_synthese_chantier`, `rediger_comparaison_territoires`) ou une clarification (`clarify_with_choices`).
- Les encarts ne changent pas : ni code, ni prompt, ni mention.
- La fiche de vérité des scénarios existants ne change pas ; le monde partagé (`evals/3-scenarios/mondeTerritorial.ts`) ne change pas.
- Seuils : nouveau scénario, `get_chantier_commentaires` appelé et « Tous les types de commentaires », « Pas d'absence inventée » à au moins 5/6 par question ; mention à au moins 5/6 là où elle s'applique ; suites voisines, aucune baisse de plus d'un essai sur 6 sur un critère sans explication essai par essai.

## Review Focus

1. Utilisateur sans accès au national (profil régional ou départemental) qui demande les commentaires d'un département : les types nationaux ne figurent pas dans `types_consultes`, restent dans `types_non_accessibles`. → test de la tâche 4.
2. Plusieurs appels à `get_chantier_commentaires` dans un même tour (un par chantier) : une seule ligne de mention qui réunit leurs types, sans doublon. → test de `checkTypesConsultes`, tâche 8.
3. Chantier dont la seule synthèse est un brouillon : après le correctif, la collecte n'a plus de synthèse pour lui (`synthese: null`), au lieu du brouillon. → test d'intégration, tâche 10.
4. `get_chantiers` sur un territoire en accès restreint : le chantier n'a plus de champ `synthese` du tout (il était renvoyé masqué). → test unitaire, tâche 6.
5. Ancien message du bouton « Tableau de bord du territoire » dans une conversation existante : le tableau de bord ne reprend ni météo ni commentaire, et la phrase qui l'accompagne le dit. → cas d'eval, tâche 5.

---

### Préalable : branche de travail

- [ ] **Créer la branche** depuis la racine du dépôt : `git fetch origin dev && git switch -c feat/albert-commentaires-lus-et-cites origin/dev`. La spec et ce plan, non suivis, suivent le changement de branche ; ils sont ajoutés au premier commit.
- [ ] **Vérifier l'état de départ** : `pnpm -F @pilote/ppg exec vitest run --project server-unit src/server/albert evals` → tout passe.

---

### Task 1: Fiche de vérité — synthèses lues par la collecte, commentaires sur chaque territoire

Changement neutre : la fiche lit les mêmes synthèses par la collecte que les encarts, et gagne une option pour lire les commentaires sur tous les territoires d'un scénario.

**Files:**
- Modify: `evals/3-scenarios/dataTools.ts`
- Modify: `evals/3-scenarios/groundTruth.ts:46-53` (lecture des vues), `:78-91` (lecture des commentaires)
- Modify: `evals/3-scenarios/truth.ts:14-24` (`TruthScope`)
- Test: `evals/3-scenarios/groundTruth.integration.test.ts`

**Interfaces:**
- Produces: `createDataTools(...).collecterChantiers(input: CollecteChantiersInput)`, qui appelle `collecterChantiers` de `src/server/albert/tools/getChantiers.ts` avec `getChantiersQuery` et `territoireResolver` résolus dans le conteneur `albert`, et les accès du profil.
- Produces: `TruthScope.commentairesSurChaqueTerritoire?: boolean` — avec `true`, la fiche lit les commentaires de chaque `chantiersCommentes` sur chacun des `territoires` (un appel `SELECTION` de tous les codes) ; sans, sur le premier seulement, comme aujourd'hui.

- [ ] **Step 1: Écrire les tests qui échouent** dans `groundTruth.integration.test.ts` (même mise en place que les tests existants : `seedEvalWorld`, `seedMondeTerritorial`, profil `ditp`) :

```ts
it("lit les commentaires d'un chantier sur chacun des territoires quand l'option est posée", ...)
// Then
expect(truth.commentaires.flatMap((sortie) => sortie.resultats.map((resultat) => resultat.territoire_code)))
  .toEqual(["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"]); // territoires ayant au moins un commentaire publié de CH-005 dans le monde
it("sans l'option, ne lit les commentaires que sur le premier territoire", ...)
```

Ajuster la liste attendue du premier test aux territoires qui portent effectivement des commentaires de CH-005 dans le monde (ils ont tous une synthèse).

- [ ] **Step 2: Lancer les tests, vérifier l'échec** : `pnpm -F @pilote/ppg exec vitest run --project server-integration evals/3-scenarios/groundTruth.integration.test.ts` → le premier échoue (un seul territoire lu).
- [ ] **Step 3: Implémenter** l'option dans `TruthScope` et `readGroundTruth`, et faire lire `chantiersEnRetard` / `chantiersEnDifficulte` par `tools.collecterChantiers({ perimetre, jalon, view })` au lieu de l'outil `getChantiers`.
- [ ] **Step 4: Lancer les tests** : même commande, plus `pnpm -F @pilote/ppg exec vitest run --project server-unit evals` → tout passe (les tests existants prouvent que les fiches ne changent pas).
- [ ] **Step 5: Commit** (avec accord) : `test(ppg): la fiche de vérité lit les synthèses par la collecte et peut lire les commentaires de chaque territoire` — avec la spec et ce plan.

---

### Task 2: Nouveau scénario « Synthèse des commentaires d'un chantier par département », et cas périmé

**Files:**
- Create: `evals/3-scenarios/3.1-synthese/seedCommentairesDepartementsBretons.ts`
- Create: `evals/3-scenarios/3.1-synthese/syntheseCommentairesDepartements.criteria.ts`
- Create: `evals/3-scenarios/3.1-synthese/syntheseCommentairesDepartements.eval.ts`
- Test: `evals/3-scenarios/3.1-synthese/seedCommentairesDepartementsBretons.integration.test.ts`
- Modify: `evals/2-tools/2.2-donnees/getChantiers.eval.ts:113-118`

**Interfaces:**
- Consumes: `TruthScope.commentairesSurChaqueTerritoire` (tâche 1) ; `scenarioEval({ seedSupplementaire })` ; `fixtures.commentaire`, `getPrisma()`.
- Produces: `seedCommentairesDepartementsBretons(): Promise<void>` ; `SYNTHESE_COMMENTAIRES_DEPARTEMENTS_CRITERIA: Criterion[]`.

Les données, semées pour ce seul fichier, retouchent CH-005 au jalon courant :

| Département | Niveau de confiance | Synthèse | Commentaires typés |
|---|---|---|---|
| DEPT-22 Côtes-d'Armor | `COUVERT` (n'est plus en difficulté) | celle du monde | un `commentaires_sur_les_donnees` sur la régulation (piège : il ne doit pas apparaître) |
| DEPT-29 Finistère | `NUAGE` | remplacée par un texte propre au Finistère | `commentaires_sur_les_donnees` : fermetures de nuit des urgences (Carhaix) ; `autres_resultats_obtenus` : maison médicale de garde ouverte à Quimperlé |
| DEPT-35 Ille-et-Vilaine | `NUAGE` | **supprimée** (cas de la recette) | `commentaires_sur_les_donnees` : fermetures de nuit des urgences (Redon) ; `autres_resultats_obtenus` : trois médecins régulateurs recrutés par contrat de territoire |
| DEPT-56 Morbihan | `NUAGE` | **supprimée** | aucun |

Sujet commun : les fermetures de nuit des urgences (Finistère, Ille-et-Vilaine). Sujets propres : la maison médicale de garde (Finistère), les recrutements (Ille-et-Vilaine). Le niveau de confiance se change sur `chantier_territoire.meteo` (le filtre `en_difficulte` de `GetChantiersQuery` le lit) et sur la synthèse qui reste.

- [ ] **Step 1: Écrire le test d'intégration du semis** : après `seedEvalWorld`, `seedMondeTerritorial` et `seedCommentairesDepartementsBretons`, `collecterChantiers` (vue `en_difficulte`, CH-005, les quatre départements) et `get_chantier_commentaires` (CH-005, les quatre départements) donnent :

```ts
expect(departementsEnDifficulte).toEqual(["DEPT-29", "DEPT-35", "DEPT-56"]);
expect(typesParDepartement).toEqual({
  "DEPT-22": ["commentaires_sur_les_donnees", "synthese_des_resultats"],
  "DEPT-29": ["autres_resultats_obtenus", "commentaires_sur_les_donnees", "synthese_des_resultats"],
  "DEPT-35": ["autres_resultats_obtenus", "commentaires_sur_les_donnees"],
});
// DEPT-56 n'apparaît dans aucun résultat de commentaires
```

- [ ] **Step 2: Lancer le test, vérifier l'échec** (`seedCommentairesDepartementsBretons` n'existe pas).
- [ ] **Step 3: Implémenter `seedCommentairesDepartementsBretons`** (modèle : `evals/3-scenarios/3.4-forme/seedValeursACompleter.ts`).
- [ ] **Step 4: Lancer le test** → PASS.
- [ ] **Step 5: Écrire les critères** dans `syntheseCommentairesDepartements.criteria.ts`, avec `withBase` et ces critères jugés (instructions fondées sur la FICHE DE VÉRITÉ, avec les exemples du tableau ci-dessus) :
  - `"Départements en difficulté"` : traite chaque département où le chantier est en difficulté selon la fiche, et seulement eux ; un département omis ou ajouté est cité dans la preuve.
  - `"Tous les types de commentaires"` : pour chaque département, rend compte de ses commentaires quel que soit leur type ; s'appuyer sur la seule synthèse quand la fiche donne d'autres commentaires est non conforme.
  - `"Pas d'absence inventée"` : ne dit « sans commentaire » que d'un département qui n'en a aucun dans la fiche ; le dire d'un département qui a des commentaires sans synthèse est non conforme.
  - `"Sujets récurrents"` : un sujet présenté comme récurrent apparaît dans au moins deux départements, nommés ; un sujet propre à un seul département présenté comme récurrent est non conforme.
  - `PAS_DE_RECOPIE` (de `evals/3-scenarios/criteria/commentaires.ts`).
- [ ] **Step 6: Écrire le scénario** dans `syntheseCommentairesDepartements.eval.ts` : `scenarioEval({ suite: "Synthèse des commentaires d'un chantier par département", group: "synthese", seedSupplementaire: seedCommentairesDepartementsBretons, ... })`, profil par défaut (`ditp`), deux cas :
  - « Fais-moi la synthèse des commentaires du CH-005 pour chaque département breton en difficulté. Mets en évidence les sujets récurrents. »
  - « Que disent les commentaires du CH-005 dans les départements de Bretagne où il est en difficulté ? Quels sujets reviennent ? »
  - pour les deux : `truthScope: { territoires: ["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"], chantiersCommentes: ["CH-005"], commentairesSurChaqueTerritoire: true }` ; `expected: [{ toolName: "get_chantiers", input: { view: "en_difficulte", chantier_ids: ["CH-005"] } }, { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-005" } }]`.
  - En tête de fichier : la demande de recette d'origine, ce que le scénario prouve, et la répartition des départements.
- [ ] **Step 7: Remplacer le cas périmé** de `getChantiers.eval.ts` (« Où en est le CH-005 en Bretagne ? », que le prompt envoie vers l'encart depuis PIL-1966) par « Quel est le niveau de confiance du CH-005 en Bretagne ? », même `expected`, `reason` mise à jour.
- [ ] **Step 8: Lancer** `pnpm -F @pilote/ppg exec vitest run --project server-unit evals` → PASS (la calibration n'est pas touchée).
- [ ] **Step 9: Commit** (avec accord) : `test(ppg): scénario de synthèse des commentaires par département, cas périmé de get_chantiers`.

---

### Task 3: Reproduire le défaut, puis passage de référence

Aucun changement produit. Toutes les commandes depuis `apps/pilote-ppg`, en arrière-plan (plusieurs dizaines de minutes).

- [ ] **Step 1: Lancer le nouveau scénario seul, deux fois** :

```bash
for passe in 1 2; do pnpm eval evals/3-scenarios/3.1-synthese/syntheseCommentairesDepartements.eval.ts --outputPath "evals/resultats-commentaires-reproduction-$passe.json"; done
```

Attendu : dans la majorité des 12 essais, « Outils attendus » échoue (pas de `get_chantier_commentaires`), et « Tous les types de commentaires » ou « Pas d'absence inventée » échoue. Sinon : ajuster les données ou la reformulation (au plus deux fois, en restant au plus près de la demande de recette), relancer ; après deux échecs, s'arrêter et rendre compte à l'utilisateur.

- [ ] **Step 2: Passage de référence** : la liste des suites, utilisée à l'identique aux tâches 7 et 9.

```bash
SUITES=(
  evals/2-tools/2.2-donnees/getChantiers.eval.ts
  evals/2-tools/2.2-donnees/getChantierCommentaires.eval.ts
  evals/2-tools/2.3-rendu/createDashboard.eval.ts
  evals/2-tools/2.3-rendu/redigerSyntheseChantier.eval.ts
  evals/3-scenarios/3.0-calibration/calibration.eval.ts
  evals/3-scenarios/3.1-synthese/syntheseCommentaires.eval.ts
  evals/3-scenarios/3.1-synthese/syntheseCommentairesDepartements.eval.ts
  evals/3-scenarios/3.1-synthese/syntheseChantier.eval.ts
  evals/3-scenarios/3.1-synthese/syntheseTerritoire.eval.ts
  evals/3-scenarios/3.1-synthese/syntheseDepartements.eval.ts
  evals/3-scenarios/3.1-synthese/syntheseDifficultes.eval.ts
  evals/3-scenarios/3.1-synthese/chantiersEnRetard.eval.ts
  evals/3-scenarios/3.1-synthese/tableauDeBord.eval.ts
  evals/3-scenarios/3.1-synthese/dashboardSansChantier.eval.ts
  evals/3-scenarios/3.4-forme/commentairesRestitues.eval.ts
  evals/3-scenarios/3.5-suivi/questionsDeSuivi.eval.ts
  evals/3-scenarios/3.6-personnes/personnesCitees.eval.ts
)
for passe in 1 2; do for suite in "${SUITES[@]}"; do
  pnpm eval "$suite" --outputPath "evals/resultats-commentaires-avant-$(basename "$suite" .eval.ts)-$passe.json"
done; done
```

- [ ] **Step 3: Relever les scores** par suite et par critère, essais « sans objet » exclus, en notant le premier et le dernier `runs.id` du passage :

```bash
sqlite3 -header -column evals/evalite.db "
select s.name as suite, sc.name as critere, cast(sum(sc.score) as int) as reussis, count(*) as essais
from runs r join suites s on s.run_id = r.id join evals e on e.suite_id = s.id join scores sc on sc.eval_id = e.id
where r.id between <premier> and <dernier> and coalesce(sc.metadata, '') <> '\"sans objet\"'
group by s.name, sc.name order by s.name, sc.name;" > evals/resultats-commentaires-avant.txt
```

Attendu : un relevé complet ; les essais en erreur (service indisponible) sont relancés avant de figer.

---

### Task 4: `get_chantier_commentaires` renvoie les types consultés

**Files:**
- Modify: `src/server/chantiers/query/GetChantierCommentairesQuery.ts:66-122`
- Modify: `src/server/albert/tools/getChantierCommentaires.ts:75-80` (sortie), `:159-170` (description), `:213-232` (réunion des résultats)
- Test: `src/server/chantiers/__tests__/query/GetChantierCommentairesQuery.integration.test.ts`
- Test: `src/server/albert/__tests__/tools/getChantierCommentaires.unit.test.ts`
- Modify: `src/server/albert/__tests__/tools/redigerSyntheseChantier.unit.test.ts` (le mock de la query gagne `types_consultes`)

**Interfaces:**
- Produces: `GetChantierCommentairesQueryResult.types_consultes: TypeContenuChantier[]` — les types interrogés par la query (sur le territoire et, si inclus, au national), dans l'ordre de `typesContenuChantier`.
- Produces: `GetChantierCommentairesOutput.types_consultes: string[]` — les libellés (`libelleTypeCommentaire`) des types consultés sur tous les territoires de l'appel, sans doublon, dans l'ordre de `typesContenuChantier`.
- Produces: `GetChantierCommentairesOutput.types_non_accessibles` — désormais sans les types consultés sur un autre territoire de l'appel.

- [ ] **Step 1: Tests d'intégration de la query qui échouent** : ajouter les assertions dans les tests existants

```ts
// « remonte les types nationaux sur NAT-FR quand ils sont demandés depuis un territoire local et accessibles »
expect(result.types_consultes).toEqual(["freins_a_lever"]);
// « signale les types nationaux non accessibles sans interroger NAT-FR »
expect(result.types_consultes).toEqual([]);
// premier test (types territoriaux demandés sur DEPT-75) : les types territoriaux demandés, même sans contenu
```

- [ ] **Step 2: Tests unitaires de l'outil qui échouent** :

```ts
test("renvoie les libellés des types consultés sur tous les territoires, sans doublon, même sans commentaire trouvé", ...)
// query mockée : REG-75 → types_consultes ["autres_resultats_obtenus", "synthese_des_resultats"], DEPT-75 → ["commentaires_sur_les_donnees", "synthese_des_resultats"]
expect(result.types_consultes).toEqual(["Commentaires sur les données", "Autres résultats obtenus", "Synthèse des résultats"]);

test("plusieurs territoires avec accès au national : un type national lu sur le premier n'est pas signalé non accessible", ...)
// query mockée selon inclureCommentairesNationaux : true → consultés ["freins_a_lever"], non accessibles [] ; false → consultés [], non accessibles ["freins_a_lever"]
expect({ types_consultes: result.types_consultes, types_non_accessibles: result.types_non_accessibles })
  .toEqual({ types_consultes: ["Freins à lever"], types_non_accessibles: [] });

test("sans accès au national : les types nationaux ne sont pas consultés et restent non accessibles", ...) // Review Focus 1
// territoiresAccessibles sans NAT-FR ; query mockée : consultés ["commentaires_sur_les_donnees"], non accessibles ["freins_a_lever"]
expect({ ... }).toEqual({ types_consultes: ["Commentaires sur les données"], types_non_accessibles: ["freins_a_lever"] });
```

Mettre à jour l'attendu complet du test « retourne les commentaires d'un chantier accessible en texte, avec le nom du chantier » (nouveau champ).

- [ ] **Step 3: Lancer, vérifier l'échec** : `pnpm -F @pilote/ppg exec vitest run --project server-unit src/server/albert/__tests__/tools/getChantierCommentaires.unit.test.ts` et la commande d'intégration sur le test de la query.
- [ ] **Step 4: Implémenter** dans la query (dériver des `appels`), puis dans l'outil (réunion, libellés, correctif de `types_non_accessibles`). Description de l'outil : une ligne « `types_consultes` : les types de commentaires interrogés, même sans contenu, hors types non accessibles. » — **sans** encore la règle de la mention (tâche 8).
- [ ] **Step 5: Lancer** les deux commandes, plus `src/server/albert/__tests__/tools/redigerSyntheseChantier.unit.test.ts` → PASS.
- [ ] **Step 6: Commit** (avec accord) : `feat(ppg): get_chantier_commentaires renvoie les types consultés et ne signale plus non accessible un type national déjà lu`.

---

### Task 5: Tableaux de bord sans météo ni commentaire

**Files:**
- Modify: `src/server/albert/tools/createDashboard.ts:14-34` (`chantierContextSchema`), `:209-247` (`pourLeSousAgent`, `buildSubagentPrompt`), `:257-266` (description)
- Modify: `src/server/albert/subagents/dashboardSystemPrompt.ts:64-91` (paragraphe et variante), `:105-116` (modèles), `:139-143` (exemple 2), `:150` (règle 4)
- Modify: `src/server/albert/tools/composeDashboard.ts:216-222` (description de `variant`)
- Modify: `src/server/albert/tools/libelles.ts` (retirer `codeMeteoDepuisLibelle` s'il n'a plus d'usage) et `src/server/albert/__tests__/tools/libelles.unit.test.ts` (son `describe`)
- Modify: `src/client/components/PageAccueil/scenariosTerritoire.ts:77`
- Test: `src/server/albert/__tests__/subagents/dashboardSystemPrompt.unit.test.ts`
- Test: `src/client/components/PageAccueil/scenariosTerritoire.unit.test.ts`
- Modify: `evals/3-scenarios/3.1-synthese/tableauDeBord.eval.ts`, `tableauDeBord.criteria.ts`
- Modify: `evals/3-scenarios/3.0-calibration/references.ts:623-760` (question, `sectionChantier` sans paragraphe)

**Interfaces:**
- Produces: `ChantierContext = { id: string; nom: string; statut?: "en_retard" | "en_difficulte" }`.

- [ ] **Step 1: Tests qui échouent** :

```ts
// dashboardSystemPrompt.unit.test.ts — remplace « introduit un chantier par son niveau de confiance… »
it("ne lie plus le paragraphe à la météo ni au commentaire d'un chantier", () => {
  const prompt = buildDashboardSystemPrompt();
  expect(prompt).not.toContain("Niveau de confiance :");
  expect(prompt).not.toContain("champ \`commentaire\`");
  expect(prompt).toContain("n'y reprends ni météo ni commentaire"); // la consigne du paragraphe, mot pour mot
});
// scenariosTerritoire.unit.test.ts
test("le tableau de bord du territoire ne demande plus la météo ni le commentaire de synthèse", () => {
  const scenarios = scenariosTerritoireDITP({ territoireCode: "REG-53", jalon: 2026, estDITPAdmin: true });
  const messages = scenarios.kind === "grouped"
    ? scenarios.groups.flatMap((groupe) => groupe.scenarios).filter((scenario) => scenario.id === "tableau_de_bord_territoire").map((scenario) => scenario.message)
    : [];
  expect(messages).toEqual([expect.not.stringContaining("la météo et le commentaire de synthèse")]);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** (`--project server-unit` et `--project client` sur ces deux fichiers).
- [ ] **Step 3: Implémenter** :
  - `chantierContextSchema` sans `niveau_de_confiance` ni `commentaire` ; plus de `pourLeSousAgent` (les chantiers passent tels quels au `<context>`).
  - Description de `create_dashboard` : une ligne « Un dashboard n'affiche ni le niveau de confiance ni les commentaires d'un chantier : dis-le en une phrase si on te les demande. »
  - Prompt du sous-agent : `widget_paragraph` reste du texte libre, avec la consigne qu'on n'y reprend ni météo ni commentaire ; plus de section « Niveau de confiance + commentaire d'un chantier » ni de table des emojis ; les modèles « Focus chantier » et « Indicateurs d'un chantier » et l'exemple 2 sans paragraphe ; la règle 4 du protocole sans « widget_paragraph pour météo/commentaire » ; la variante `warning` ne s'appuie plus sur la météo (sans donnée pour la déclencher, la retirer du prompt, et décrire `variant` dans `composeDashboard.ts` comme une mise en garde rédigée, sans exemple de météo).
  - Message du bouton : « …avec un titre reprenant le nom du chantier, la cartographie météo en pleine largeur et le tableau de ses indicateurs. »
- [ ] **Step 4: Lancer** les tests de l'étape 2, plus `src/server/albert/__tests__/tools/libelles.unit.test.ts`, `composeDashboard.unit.test.ts`, `validateDashboardIdentifiers.test.ts` → PASS.
- [ ] **Step 5: Adapter les evals du tableau de bord** :
  - `tableauDeBord.eval.ts` : la question du cas existant devient le nouveau message du bouton (avec « Bretagne ») ; ajouter un second cas avec l'ancien message, `reason` « Ancien message du bouton, dans une conversation existante », même `expected`.
  - `tableauDeBord.criteria.ts` : retirer « (un paragraphe pour la météo et le commentaire de synthèse) » de « Widgets conformes à la demande » ; ajouter le critère jugé `"Ni météo ni commentaire"` : « Aucun widget_paragraph ne reprend un niveau de confiance ou un commentaire de chantier. Si la demande les cite, le texte d'accompagnement dit qu'ils ne sont pas affichés dans le tableau de bord. »
  - `references.ts` : `DASHBOARD_QUESTION` suit le nouveau message, `sectionChantier` sans paragraphe ; les mutants du tableau de bord restent valides.
- [ ] **Step 6: Lancer** `pnpm -F @pilote/ppg exec vitest run --project server-unit evals` → PASS.
- [ ] **Step 7: Commit** (avec accord) : `feat(ppg): les tableaux de bord ne reprennent plus la météo ni le commentaire de synthèse d'un chantier`.

---

### Task 6: `get_chantiers` sans commentaire

**Files:**
- Modify: `src/server/albert/tools/getChantiers.ts:100-147` (types), `:165-229` (collecte et masquage), `:386-432` (outil et description)
- Modify: `src/server/albert/tools/encart.ts:5-30, 125-130` (types de la collecte)
- Modify: `src/server/albert/tools/encartChantier.ts:6-10, 46`
- Test: `src/server/albert/__tests__/tools/getChantiers.unit.test.ts`
- Modify: `src/server/albert/__tests__/tools/redigerEncart.unit.test.ts:18, 100` (`ChantierCollecte`)
- Modify (evals): `evals/3-scenarios/truth.ts`, `groundTruth.ts` (types `ResultatCollecte`), `criteria/commentaires.ts:20-72`, `3.6-personnes/personnesCitees.eval.ts:81-91`, `mondeTerritorial.integration.test.ts:168-226`, `3.0-calibration/references.ts:16, 109-145, 212-229`

**Interfaces:**
- Produces, dans `getChantiers.ts` :
  - `ChantierCollecte` — le type actuel `ChantierRenvoye`, avec `synthese` ;
  - `ChantierRenvoye = Omit<ChantierCollecte, "synthese">` ;
  - `ResultatCollecte = Omit<GetChantiersResult, "chantiers"> & { acces_restreint?: true; chantiers: ChantierCollecte[] }` ;
  - `ResultatChantiers = Omit<ResultatCollecte, "chantiers"> & { chantiers: ChantierRenvoye[] }` ;
  - `CollecteChantiers = { resultats: ResultatCollecte[]; non_applicable?: { territoire_code: string; raison: string }[]; acces_refuse?: true }` ;
  - `GetChantiersOutput = Omit<CollecteChantiers, "resultats"> & { resultats: ResultatChantiers[]; total?: number; tronque?: true }` ;
  - `collecterChantiers(...): Promise<CollecteChantiers>` (signature d'entrée inchangée) ;
  - `sansSynthese(collecte: CollecteChantiers): GetChantiersOutput` — la frontière de l'outil ;
  - `classerChantiers({ sortie: GetChantiersOutput, tri?, limite? }): GetChantiersOutput` inchangé.
- Consumes (evals) : `createDataTools(...).collecterChantiers` (tâche 1), désormais typé `CollecteChantiers`.

- [ ] **Step 1: Tests qui échouent** dans `getChantiers.unit.test.ts` :
  - `chantierRenvoye` (helper) perd `synthese` ; le test « renvoie les libellés… » est renommé « …et les personnes par leur référence, sans aucun commentaire » ;
  - le test « hors périmètre… » attend des chantiers sans clé `synthese` (Review Focus 4) et est renommé sans « les commentaires » ;
  - nouveau `describe("collecterChantiers")` :

```ts
test("garde pour les encarts la synthèse en texte avec son auteur, et la masque hors périmètre", ...)
expect(collecte.resultats.map((resultat) => ({ territoire_code: resultat.territoire_code, syntheses: resultat.chantiers.map((chantier) => chantier.synthese) })))
  .toEqual([
    { territoire_code: "REG-75", syntheses: [{ commentaire: "Deux postes restent vacants.", date_commentaire: "2026-01-12", auteur: personReference(AUTEUR_SYNTHESE_ID) }] },
    { territoire_code: "REG-53", syntheses: [{ commentaire: null, date_commentaire: null }] },
  ]);
```

- [ ] **Step 2: Lancer, vérifier l'échec** : `pnpm -F @pilote/ppg exec vitest run --project server-unit src/server/albert/__tests__/tools/getChantiers.unit.test.ts`.
- [ ] **Step 3: Implémenter** les types et `sansSynthese` ; `execute` = `classerChantiers({ sortie: sansSynthese(await collecterChantiers(...)), ... })`. Description : retirer « et le commentaire de la synthèse des résultats » (remplacer par « Aucun commentaire. »), « le commentaire de synthèse » de la ligne `acces_restreint`, « et l'`auteur` de la synthèse » de la ligne des personnes ; dernière ligne : « les commentaires d'un chantier, synthèse des résultats comprise (freins, actions, décisions, résultats…) → get_chantier_commentaires : ils ne sont pas ici. » Encarts : remplacer les types par `CollecteChantiers` / `ChantierCollecte`, sans autre changement.
- [ ] **Step 4: Lancer** `pnpm -F @pilote/ppg exec vitest run --project server-unit src/server/albert` → PASS.
- [ ] **Step 5: Adapter les evals** :
  - `truth.ts`, `groundTruth.ts` : `ResultatCollecte` au lieu de `ResultatChantiers`.
  - `criteria/commentaires.ts` : supprimer `contenusDesCommentairesRecus` et son type local ; `commentairesSources` = synthèses de la fiche + `contenusDeGetChantierCommentaires`.
  - `personnesCitees.eval.ts`, cas « Qui a rédigé la synthèse des résultats… » : `expected: [{ toolName: "get_chantier_commentaires", input: { chantier_id: "CH-005" } }]`, `reason` « seul get_chantier_commentaires renvoie la synthèse et ses auteurs ».
  - `mondeTerritorial.integration.test.ts` : le test « rend les personnes de CH-005 en Bretagne… » ne lit plus `auteur` ni `modifiePar` dans `get_chantiers` ; l'auteur et la modificatrice de la synthèse restent vérifiés par le test « rend l'auteur de chaque commentaire de CH-005 en Bretagne, synthèse comprise ».
  - `references.ts` : le helper `chantier` renvoie un `ChantierCollecte` ; les sorties `get_chantiers` de `TOOL_RESULTS_BRETAGNE` (et des autres fiches figées) passent par `sansSynthese`, pour refléter ce que l'agent reçoit.
- [ ] **Step 6: Lancer** `pnpm -F @pilote/ppg exec vitest run --project server-unit evals` et `--project server-integration evals/3-scenarios/mondeTerritorial.integration.test.ts` → PASS ; `pnpm -F @pilote/ppg lint:tsc` → aucune erreur.
- [ ] **Step 7: Commit** (avec accord) : `feat(ppg): get_chantiers ne renvoie plus de commentaire, get_chantier_commentaires porte aussi la synthèse`.

---

### Task 7: Premier passage après (sans la règle de la mention)

- [ ] **Step 1: Lancer les 17 suites deux fois**, comme à la tâche 3, avec `--outputPath "evals/resultats-commentaires-apres-outils-…"`.
- [ ] **Step 2: Relever** avec la requête de la tâche 3 → `evals/resultats-commentaires-apres-outils.txt`.
- [ ] **Step 3: Comparer** au passage de référence, critère par critère. Attendu : seuils du nouveau scénario atteints ; aucune baisse de plus d'un essai sur 6 sans explication essai par essai (lire la réponse et les appels d'outils des essais en cause dans `evalite.db`).
- [ ] **Step 4: Si un seuil n'est pas atteint** : ajuster les descriptions des deux outils, et au besoin ajouter dans la partie « Exemples » du prompt système (`src/server/albert/systemPrompt.ts:150-174`) la demande de recette → « get_chantiers avec la vue en_difficulte, puis get_chantier_commentaires sur les départements trouvés ». Relancer le nouveau scénario et les suites touchées, puis les 17. Au plus deux tours ; ensuite, s'arrêter et rendre compte. Chaque ajustement est commité avec la tâche 6 (accord requis).

---

### Task 8: La mention dans le texte

**Files:**
- Modify: `src/server/albert/systemPrompt.ts:176-196` (partie « Rédiger »)
- Test: `src/server/albert/__tests__/systemPrompt.unit.test.ts`
- Modify: `src/server/albert/tools/getChantierCommentaires.ts` (description : renvoi à la règle)
- Modify: `evals/3-scenarios/mechanicalChecks.ts`, `evals/3-scenarios/criterion.ts:45-139`
- Test: `evals/3-scenarios/mechanicalChecks.unit.test.ts`
- Modify: `evals/3-scenarios/3.0-calibration/references.ts` (références avec `get_chantier_commentaires`)

**Interfaces:**
- Consumes: `GetChantierCommentairesOutput.types_consultes: string[]` (tâche 4).
- Produces: `checkTypesConsultes({ text, typesConsultes }: { text: string; typesConsultes: string[] }): CheckResult` — prend la dernière ligne qui commence par « Commentaires consultés : » (après `normalize`), découpe sa liste sur les virgules et « et », retire le point final, et compare à `typesConsultes` comme ensembles normalisés.
- Produces: `BASE_IDS.typesConsultes = "Types de commentaires consultés"` et le critère mécanique du socle.

- [ ] **Step 1: Tests qui échouent** :

```ts
// systemPrompt.unit.test.ts
it("termine une réponse tirée des commentaires par les types consultés, sauf après un dashboard, un encart ou une clarification", () => {
  expect(prompt).toContain("Commentaires consultés :");
  expect(prompt).toContain("types_consultes");
});
// mechanicalChecks.unit.test.ts — describe("checkTypesConsultes")
test("accepte une dernière ligne qui réunit les types de plusieurs appels, dans un autre ordre et en minuscules", ...) // Review Focus 2
// typesConsultes ["Commentaires sur les données", "Synthèse des résultats", "Autres résultats obtenus"]
// text "…\n\nCommentaires consultés : synthèse des résultats, autres résultats obtenus et commentaires sur les données."
expect(result).toEqual({ ok: true, detail: "types consultés mentionnés" });
test("signale un type reçu absent de la mention, même cité plus haut", ...)
expect(result).toEqual({ ok: false, detail: "absents de la mention : autres résultats obtenus" });
test("signale un type cité qui n'a pas été consulté", ...)
// typesConsultes ["Commentaires sur les données"] ; mention « …: commentaires sur les données, freins à lever. »
expect(result).toEqual({ ok: false, detail: "non consultés : freins à lever" });
test("ne confond pas « Autres résultats obtenus » et « Autres résultats obtenus non corrélés aux indicateurs »", ...)
test("signale une réponse sans mention", ...)
expect(result).toEqual({ ok: false, detail: "aucune ligne « Commentaires consultés »" });
```

- [ ] **Step 2: Lancer, vérifier l'échec** (`--project server-unit` sur les deux fichiers).
- [ ] **Step 3: Implémenter** :
  - Prompt système, dans « Rédiger », après la ligne « commentaires et objectifs » : « Une réponse rédigée à partir de get_chantier_commentaires se termine par une ligne « Commentaires consultés : … », qui reprend les `types_consultes` de tous ses appels, sans doublon ; pas de cette ligne après un dashboard, un encart ou une clarification. » Ne pas écrire « météo » (test existant « ne parle pas de météo »).
  - Description de `get_chantier_commentaires` : compléter la ligne `types_consultes` par « à reprendre en fin de réponse (voir Rédiger) ».
  - `checkTypesConsultes` dans `mechanicalChecks.ts`.
  - Dans `criterion.ts` : `typesConsultesRecus(evidence: Evidence): string[]` (réunion des `types_consultes` des sorties `get_chantier_commentaires`) ; le critère du socle, `rule` « Rédiger : une réponse tirée des commentaires se termine par les types consultés », `applicable` = `typesConsultesRecus(evidence).length > 0` et aucun appel à `create_dashboard`, `rediger_synthese_territoire`, `rediger_synthese_chantier`, `rediger_comparaison_territoires` ni `clarify_with_choices` ; `check` sur `evidence.answer`.
  - Calibration : ajouter `types_consultes` aux sorties `get_chantier_commentaires` des références, la ligne de mention à leurs réponses de référence, et un mutant mécanique « Mention des types absente » dont `broken` est `"Types de commentaires consultés"`.
- [ ] **Step 4: Lancer** `pnpm -F @pilote/ppg exec vitest run --project server-unit src/server/albert evals` → PASS (dont `references.unit.test.ts`).
- [ ] **Step 5: Commit** (avec accord) : `feat(ppg): une réponse tirée des commentaires se termine par les types consultés`.

---

### Task 9: Second passage après (avec la règle de la mention)

- [ ] **Step 1: Lancer les 17 suites deux fois** (`--outputPath "evals/resultats-commentaires-apres-mention-…"`), relever → `evals/resultats-commentaires-apres-mention.txt`.
- [ ] **Step 2: Comparer** au premier passage après. Attendu : « Types de commentaires consultés » à au moins 5/6 là où il s'applique ; aucune autre baisse de plus d'un essai sur 6 sans explication.
- [ ] **Step 3: Si un seuil n'est pas atteint** : seules la règle du prompt et la ligne de description du champ bougent ; au plus deux tours, puis s'arrêter et rendre compte. Ajustements commités avec la tâche 8 (accord requis).

---

### Task 10: Correctif des brouillons

**Files:**
- Modify: `src/server/chantiers/query/GetChantiersQuery.ts:92-95`
- Test: `src/server/chantiers/__tests__/query/GetChantiersQuery.integration.test.ts`

- [ ] **Step 1: Tests d'intégration qui échouent**, dans un `describe("GetChantiersQuery — synthèse des résultats")` (fixtures `chantierIdentite`, `chantierTerritoire`, `syntheseDesResultats`) :

```ts
it("renvoie la dernière synthèse publiée, pas un brouillon plus récent", ...)
// synthèse PUBLIE « <p>Synthèse publiée</p> » au 2026-05-01, BROUILLON « <p>Test brouillon</p> » au 2026-11-10
expect(chantiers.map((chantierResult) => chantierResult.synthese?.commentaire)).toEqual(["<p>Synthèse publiée</p>"]);
it("n'a pas de synthèse quand la seule est un brouillon", ...) // Review Focus 3
expect(chantiers.map((chantierResult) => chantierResult.synthese)).toEqual([null]);
```

- [ ] **Step 2: Lancer, vérifier l'échec** : `pnpm -F @pilote/ppg exec vitest run --project server-integration src/server/chantiers/__tests__/query/GetChantiersQuery.integration.test.ts`.
- [ ] **Step 3: Implémenter** : `where: { statut: $Enums.statut_publication.PUBLIE }` sur `syntheses_des_resultats`.
- [ ] **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** (avec accord) : `fix(ppg): l'assistant lit la dernière synthèse publiée, pas un brouillon plus récent`.

---

### Task 11: Vérification finale

- [ ] **Step 1: Tests et lint complets** : `pnpm -F @pilote/ppg test:unit`, `pnpm -F @pilote/ppg test:server:integration`, `pnpm -F @pilote/ppg lint` → tout passe.
- [ ] **Step 2: Vérification dans l'app** (config « pilote-ppg » de `.claude/launch.json`, base `pilote_demo`, utilisateur avec accès au national) : « Fais-moi la synthèse des commentaires du chantier 70 pour chaque département en difficulté. Mets en évidence les sujets récurrents. » Attendu : `get_chantiers` puis `get_chantier_commentaires` dans les sources ; des commentaires pour les Yvelines, l'Essonne et les Hauts-de-Seine ; une dernière ligne « Commentaires consultés : … ». Puis le bouton « Tableau de bord du territoire » (profil DITP admin) : aucun paragraphe de météo ou de commentaire.
- [ ] **Step 3: Préparer la description de PR** (constat, changements, tableau des trois passages, points ouverts de la spec) et demander à l'utilisateur s'il faut lancer les e2e (`pnpm -F @pilote/ppg test:e2e`) et ouvrir la PR (titre suffixé du ticket Jira s'il en donne un).
