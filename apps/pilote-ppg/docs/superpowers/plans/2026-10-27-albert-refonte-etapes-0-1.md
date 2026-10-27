# Refonte du prompt d'Albert, étapes 0 et 1 — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objectif :** mesurer le prompt actuel (étape 0), puis le remplacer par la
réécriture minimale de la spec et la mesurer de la même façon (étape 1).

**Architecture :**
- L'étape 0 (tâches 1 à 6) ne touche que les evals : on aligne les critères
  sur les décisions D1 à D3, on ajoute les cas manquants et on lance le run de
  référence.
- L'étape 1 (tâches 7 à 11) change le code de prod d'Albert :
  - tous les tools sont exposés en permanence ;
  - les tools renvoient des libellés au lieu de codes ;
  - les `_output_instructions` disparaissent ;
  - les descriptions des tools suivent un modèle commun ;
  - le prompt système est réécrit selon le plan I à VI.

  Puis on mesure de nouveau.

**Stack :** AI SDK `ai` 7, Zod 4, Evalite 1.0.0-beta.16, Vitest (projets
`server-unit` et `client`), jq.

**Spec :** `apps/pilote-ppg/docs/superpowers/specs/2026-10-27-albert-refonte-system-prompt-design.md`.

## Contraintes globales

- Toutes les commandes partent de `apps/pilote-ppg`.
- **Étape 0 : aucun fichier sous `src/` ne change.** Le run de référence
  (tâche 6) doit tourner sur ce code. On ne modifie pas `src/` pendant qu'il
  tourne : Evalite exécute le code de l'arbre de travail.
- **Étape 1 :**
  - les sous-agents (`src/server/albert/subagents/`) ne changent pas ;
  - les queries partagées (`src/server/chantiers/…`) ne changent pas.
    `GetChantiersQuery` sert aussi le tRPC : les libellés se posent dans la
    couche tools d'Albert ;
  - aucun nouveau tool. Les champs de statut existants restent
    (`non_applicable`, `acces_refuse`, `categories_non_applicables`,
    `types_non_accessibles`, `introuvable`, `agrege_bloque`,
    `besoin_precision`, `trouve`).
- **Décisions de la spec :**
  - D1 : les codes météo ne sont plus exposés au modèle ;
  - D2 : les commentaires sont restitués fidèlement par défaut, résumés
    seulement sur demande ;
  - D3 : « le 84 » désigne DEPT-84 ;
  - D4 : tous les tools sont toujours exposés.
- Chaque critère d'eval nouveau ou modifié cite dans son `rule` la décision
  qu'il vérifie, ou PIL-1900.
- **Conventions :**
  - `expect(...).toEqual(...)` ;
  - commentaires de test en given / when / then seulement ;
  - pas de variable d'un ou deux caractères ;
  - exports nommés ;
  - paramètres objet.
- **Commits :** un par tâche, message en français terminé par la ligne
  `Co-Authored-By` de la session.
  - `test(PIL-1900):` pour les evals ;
  - `feat(PIL-1900):` pour le code de prod ;
  - `docs(PIL-1900):` pour la spec.

## Choix faits par ce plan, à valider en relecture

1. **Le libellé de la météo s'appelle `niveau_de_confiance`** dans les
   résultats des tools. C'est le synonyme que PILOTE emploie dans la
   cartographie, et il décrit bien les quatre libellés.
2. **La catégorie de signalement « Météo et synthèse non renseignées » garde
   son libellé officiel** dans l'outil des signalés (point ouvert de D1). Le
   prompt ne liste pas les catégories, il ne contient donc pas le mot.
3. **Le filtre `meteo` de `get_chantiers` est retiré.** La vue `en_difficulte`
   couvre le besoin.
4. **Les deux phrases fixes déjà mesurées restent**, chacune dans la
   description de son tool :
   - « Choisissez une option pour continuer. » (clarification, correctif F2) ;
   - « Votre rapport est disponible au téléchargement. » (export).
5. **Les explications des champs de statut** (`besoin_precision`,
   `agrege_bloque`, `types_non_accessibles`, `trouve`…) passent dans la
   description de leur tool : la description dit ce que le tool renvoie.
6. **Le sous-agent du dashboard ne change pas.** `create_dashboard` reçoit le
   libellé et le reconvertit en code pour lui. Ses widgets écrivent toujours
   « Météo : … » : c'est un point ouvert pour une étape suivante (point 4 du
   ticket).
7. **Le niveau 1 des evals (`evals/1-keywords`) et le script `eval:rapide`**
   disparaissent avec le détecteur d'intention.

## Points de vigilance

Étape 0 :
1. `checkFrench` sur un mot français qui contient un mot anglais (« thé »,
   « thème ») : doit passer. Test en tâche 3.
2. `checkVerbatim` quand l'agent restitue un commentaire sur plusieurs
   paragraphes : doit passer. Test en tâche 4.
3. `checkVerbatim` sur une source HTML : les balises ne comptent pas. Test en
   tâche 4.
4. `checkTableChantiers` avec un tiret insécable (« CH‑005 ») : doit passer ;
   avec un chantier cité hors du tableau : doit échouer. Tests en tâche 4.
5. `checkDashboardNonVide` sur un dashboard de titres et de paragraphes
   répartis en plusieurs conteneurs : doit échouer. Test en tâche 5.

Étape 1 :
6. Territoire hors périmètre : après la mise en forme des libellés, le
   masquage doit toujours vider `tendance` et les commentaires, et garder
   `niveau_de_confiance`. Test en tâche 8.
7. Météo `NON_RENSEIGNEE` ou `null` : le libellé vaut « Non renseignée » ou
   `null`, jamais le code. Test en tâche 8.
8. `mailles_applicables` vide : `maille_de_pilotage` vaut `null`. Test en
   tâche 8.
9. `create_dashboard` reçoit un libellé hors des quatre niveaux (« Non
   renseignée ») : le sous-agent ne reçoit pas de météo. Test en tâche 8.
10. Prompt sans `agentContext` : jalon 2025 et aucun bloc de contexte
    utilisateur. Test en tâche 10.

## Prérequis d'environnement

- `.env.evals.local` présent dans le worktree. S'il manque, le copier depuis le
  checkout principal du dépôt.
- La base Postgres de test démarrée (port 7433).
- `DOTENV_CONFIG_PATH=.env.test pnpm exec prisma generate` avant tout
  `pnpm lint:tsc`.

---

# Étape 0 : ligne de base

### Tâche 1 : des synthèses sans gabarit (D1, D2)

**Fichiers :**
- Modifier : `evals/3-scenarios/criteria/commentaires.ts`
- Modifier : `evals/3-scenarios/3.1-synthese/syntheseTerritoire.criteria.ts`
- Modifier : `evals/3-scenarios/3.1-synthese/syntheseDepartements.criteria.ts`
- Modifier : `evals/3-scenarios/3.1-synthese/chantiersEnRetard.criteria.ts`
- Modifier : `evals/3-scenarios/mechanicalChecks.ts`
- Modifier : `evals/3-scenarios/3.0-calibration/references.ts`
- Tests : `evals/3-scenarios/3.0-calibration/references.unit.test.ts`
  (existant), `evals/3-scenarios/mechanicalChecks.unit.test.ts`

**Interfaces :**
- Produit : `COMMENTAIRES_FIDELES`, critère jugé d'id `"Commentaires fidèles"`,
  exporté par `criteria/commentaires.ts`. `PAS_DE_RECOPIE` reste exporté.
- Supprime : `COMMENTAIRES_DU_GABARIT`, `ABSENCE_SIGNALEE`,
  `checkAbsenceSignalee`.

- [ ] **Étape 1 : retirer les critères du gabarit**

  - `syntheseTerritoire.criteria.ts` : supprimer « Écart et météo » ;
    remplacer `...COMMENTAIRES_DU_GABARIT` par `COMMENTAIRES_FIDELES`.
  - `syntheseDepartements.criteria.ts` : remplacer
    `...COMMENTAIRES_DU_GABARIT` par `COMMENTAIRES_FIDELES`.
  - `criteria/commentaires.ts` :
    - renommer `RESUMES_FIDELES` en `COMMENTAIRES_FIDELES` et l'exporter, avec :
      - `id` : `"Commentaires fidèles"`
      - `rule` : `"Factualité : ce que la réponse rapporte des commentaires y figure (D2)"`
      - `instruction` : `"Tout ce que la réponse rapporte des commentaires de synthèse (résumé, citation ou reprise) ne contient que des idées présentes dans ces commentaires. Une cause, un chiffre, une action ou une conséquence qui n'y figure pas est non conforme. Une réponse qui ne rapporte aucun commentaire est conforme : la couverture relève d'autres critères."`
    - supprimer `ABSENCE_SIGNALEE`, `chantiersSansCommentaire` et
      `COMMENTAIRES_DU_GABARIT`, et réécrire le commentaire d'en-tête en
      conséquence ;
    - `PAS_DE_RECOPIE.rule` devient
      `"Demande de synthèse : ne recopie pas un commentaire in extenso (D2)"`.
  - `chantiersEnRetard.criteria.ts`, critère « Écart par chantier » :
    - `rule` : `"Chantiers en retard : l'écart à la médiane en points, qui fait le retard (D1 : sans météo)"`
    - `instruction` : `"Chaque chantier en retard porte son écart à la médiane en points. L'exactitude des chiffres relève de « Chiffres exacts »."`

- [ ] **Étape 2 : vérifier que la calibration échoue**

  Commande : `pnpm vitest run --project server-unit evals/3-scenarios/3.0-calibration`
  Attendu : FAIL. Les mutants « Écart omis » (synthèse territoriale) et
  « Cause inventée dans un résumé » sont orphelins. Les mutants mécaniques
  « Pas de recopie » de `syntheseTerritoire` et `syntheseDepartements`, et
  « Commentaire manquant non signalé », ne cassent plus rien.

- [ ] **Étape 3 : mettre à jour `references.ts`**

  - Supprimer le mutant « Écart omis » de `SUITES.syntheseTerritoire`
    (`broken: "Écart et météo"`).
  - Mutant « Cause inventée dans un résumé » : `broken: "Commentaires fidèles"`.
  - Dans `MECHANICAL_MUTANTS`, supprimer les mutants « Pas de recopie » des
    suites `syntheseTerritoire` et `syntheseDepartements`, ainsi que
    « Commentaire manquant non signalé ». Garder les deux mutants « Pas de
    recopie » de `syntheseCommentaires`.

- [ ] **Étape 4 : supprimer `checkAbsenceSignalee`**

  Retirer la fonction de `mechanicalChecks.ts`, avec ses tests : le
  `describe("checkAbsenceSignalee")` et le cas qui l'appelle dans
  `describe("typographie d'Albert")`.

- [ ] **Étape 5 : tests et typecheck**

  Commande : `pnpm vitest run --project server-unit evals/3-scenarios && pnpm lint:tsc`
  Attendu : PASS.

- [ ] **Étape 6 : recalibrer le juge sur le critère réécrit**

  Commande : `pnpm eval evals/3-scenarios/3.0-calibration`
  Attendu : sur 3 essais sur 3, « Commentaires fidèles » détecte le mutant
  « Cause inventée dans un résumé » et laisse passer les références. Sinon,
  le noter comme non fiable dans le journal de la spec : on ne conclura rien
  sur lui.

- [ ] **Étape 7 : commit**

  ```bash
  git add evals/3-scenarios
  git commit -m "test(PIL-1900): les critères des synthèses ne suivent plus le gabarit"
  ```

---

### Tâche 2 : « le 84 » désigne le département (D3)

**Fichiers :**
- Modifier : `evals/2-tools/2.3-rendu/clarifyWithChoices.eval.ts`
- Modifier : `evals/2-tools/2.1-recherche/searchTerritoires.eval.ts`

- [ ] **Étape 1 : la clarification n'est plus attendue**

  Dans `clarifyWithChoices.eval.ts`, le cas « Quel est le taux d'avancement
  dans le 84 ? » devient un cas négatif :
  - `reason` : `"CAS NÉGATIF : « le 84 » désigne le département (D3)"`
  - `forbidden` : `["clarify_with_choices"]`, sans `expected`
  - le placer avec les autres cas négatifs.

  Dans le commentaire d'en-tête, la phrase sur « Le 84 » devient : « Le 84 »
  désigne le département DEPT-84 (D3) : ce n'est pas une ambiguïté.

- [ ] **Étape 2 : la recherche reste attendue**

  Dans `searchTerritoires.eval.ts`, même question : `reason` devient
  `"numéro seul : le département 84 (D3), code à résoudre"` et `expected` ne
  change pas. Dans l'en-tête, « choisir entre les candidats relève de la suite
  de la conversation » devient : un numéro seul désigne le département (D3) ;
  il passe quand même par la recherche pour obtenir le code.

- [ ] **Étape 3 : typecheck**

  Commande : `pnpm lint:tsc`
  Attendu : PASS.

- [ ] **Étape 4 : commit**

  ```bash
  git add evals/2-tools
  git commit -m "test(PIL-1900): « le 84 » désigne le département dans les evals"
  ```

---

### Tâche 3 : la réponse est en français (critère du socle)

Le ticket l'exige (« les réponses, y compris après un appel d'outil, sont en
français »), et aucune eval ne le mesure aujourd'hui.

**Fichiers :**
- Modifier : `evals/3-scenarios/mechanicalChecks.ts`
- Modifier : `evals/3-scenarios/criterion.ts`
- Tests : `evals/3-scenarios/mechanicalChecks.unit.test.ts`

**Interfaces :**
- Produit : `checkFrench({ text }: { text: string }): CheckResult` ;
  `BASE_IDS.french = "Réponse en français"`.

- [ ] **Étape 1 : écrire les tests, qui doivent échouer**

  ```ts
  describe("checkFrench", () => {
    test("signale la phrase anglaise observée après une clarification (PIL-1900, F2)", () => {
      expect(
        checkFrench({
          text: "I'm waiting for your choice. Please select one of the options above.",
        }),
      ).toEqual({
        ok: false,
        detail: "mots anglais : i'm, waiting, your, please, select, the, above",
      });
    });

    test("laisse passer la phrase de clôture française", () => {
      expect(
        checkFrench({ text: "Choisissez une option pour continuer." }),
      ).toEqual({ ok: true, detail: "réponse en français" });
    });

    test("ne confond pas un mot anglais avec un mot français qui le contient", () => {
      expect(checkFrench({ text: "Un thème, un thé et une option." }).ok).toBe(
        true,
      );
    });
  });
  ```

- [ ] **Étape 2 : lancer les tests**

  Commande : `pnpm vitest run --project server-unit evals/3-scenarios/mechanicalChecks.unit.test.ts`
  Attendu : FAIL, `checkFrench` n'existe pas.

- [ ] **Étape 3 : implémenter `checkFrench` dans `mechanicalChecks.ts`**

  - Passer d'abord le texte par `typographie`, pour que « I’m » devienne
    « I'm ».
  - Mots cherchés, sans tenir compte de la casse : `the`, `please`, `your`,
    `you`, `i'm`, `waiting`, `select`, `choose`, `above`.
  - Les frontières sont des lettres Unicode (`(?<!\p{L})` / `(?!\p{L})`, drapeau
    `u`), pour que « thé » ne soit pas lu comme « the ».
  - `detail` : les mots trouvés, en minuscules, sans doublon, dans l'ordre de
    première apparition.

- [ ] **Étape 4 : ajouter le critère au socle, dans `criterion.ts`**

  ```ts
  mechanical({
    id: BASE_IDS.french,
    rule: "Langue : réponds toujours en français, y compris après un appel d'outil (PIL-1900)",
    check: (evidence) => checkFrench({ text: evidence.answer }),
  }),
  ```

  Le critère porte sur `evidence.answer` et non sur `matter` : la matière d'un
  dashboard décrit des widgets, pas du texte rédigé.

- [ ] **Étape 5 : tests et typecheck**

  Commande : `pnpm vitest run --project server-unit evals/3-scenarios && pnpm lint:tsc`
  Attendu : PASS. Les références de calibration, rédigées en français, passent
  le nouveau critère.

- [ ] **Étape 6 : commit**

  ```bash
  git add evals/3-scenarios
  git commit -m "test(PIL-1900): les scénarios vérifient que la réponse est en français"
  ```

---

### Tâche 4 : la forme demandée (cloisonnement, D2)

Deux cas que rien ne couvre aujourd'hui : un tableau demandé sur une liste de
chantiers, et des commentaires demandés sans demande de synthèse. Le résumé
demandé est déjà couvert par le scénario « Synthèse des commentaires ».

**Fichiers :**
- Modifier : `evals/3-scenarios/mechanicalChecks.ts`
- Modifier : `evals/3-scenarios/criteria/commentaires.ts`
- Modifier : `evals/3-scenarios/scenarioEval.ts` (`GROUPS`)
- Créer : `evals/3-scenarios/3.4-forme/tableauDemande.criteria.ts`
- Créer : `evals/3-scenarios/3.4-forme/tableauDemande.eval.ts`
- Créer : `evals/3-scenarios/3.4-forme/commentairesRestitues.criteria.ts`
- Créer : `evals/3-scenarios/3.4-forme/commentairesRestitues.eval.ts`
- Tests : `evals/3-scenarios/mechanicalChecks.unit.test.ts`

**Interfaces :**
- Produit :
  - `checkTableChantiers({ text, chantierIds }: { text: string; chantierIds: string[] }): CheckResult`
  - `checkVerbatim({ text, sources }: { text: string; sources: string[] }): CheckResult`
  - `COMMENTAIRES_RESTITUES`, critère mécanique d'id `"Commentaires restitués"`
  - `GROUPS.forme = "3.4 · Forme de la réponse"`

- [ ] **Étape 1 : écrire les tests, qui doivent échouer**

  ```ts
  describe("checkTableChantiers", () => {
    const tableau = "| Chantier | Écart |\n|---|---|\n| CH‑005 — Urgences | -14 |";

    test("trouve un chantier dans une ligne du tableau, quel que soit le tiret", () => {
      expect(
        checkTableChantiers({ text: tableau, chantierIds: ["CH-005"] }),
      ).toEqual({ ok: true, detail: "chantiers dans le tableau" });
    });

    test("signale un chantier cité hors du tableau", () => {
      expect(
        checkTableChantiers({
          text: `${tableau}\n\nCH-006 est aussi concerné.`,
          chantierIds: ["CH-005", "CH-006"],
        }),
      ).toEqual({ ok: false, detail: "chantiers absents du tableau : CH-006" });
    });
  });

  describe("checkVerbatim", () => {
    const source =
      "<p>Deux postes d'urgentistes sont vacants à Brest et Quimper.</p><p>Le délai médian de passage a remonté au premier semestre.</p>";

    test("reconnaît un commentaire restitué sur deux paragraphes", () => {
      expect(
        checkVerbatim({
          text: "Deux postes d'urgentistes sont vacants à Brest et Quimper.\n\nLe délai médian de passage a remonté au premier semestre.",
          sources: [source],
        }),
      ).toEqual({ ok: true, detail: "commentaires restitués" });
    });

    test("signale un commentaire résumé", () => {
      expect(
        checkVerbatim({
          text: "Des postes vacants et des délais en hausse.",
          sources: [source],
        }).ok,
      ).toBe(false);
    });
  });
  ```

- [ ] **Étape 2 : lancer les tests**

  Commande : `pnpm vitest run --project server-unit evals/3-scenarios/mechanicalChecks.unit.test.ts`
  Attendu : FAIL, les deux fonctions n'existent pas.

- [ ] **Étape 3 : implémenter les deux checks dans `mechanicalChecks.ts`**

  - `checkTableChantiers` : chaque identifiant doit apparaître dans une ligne
    rendue par `tableRows`, qui applique déjà `typographie`.
  - `checkVerbatim` : réutilise `mots`, `motsCommunsDansLOrdre` et
    `SEUIL_RECOPIE`. Chaque source non vide est comparée à **tout** le texte,
    pas paragraphe par paragraphe : une restitution peut répartir un
    commentaire sur plusieurs paragraphes. Le check passe si chaque source
    atteint le seuil. Sinon, `detail` vaut
    `commentaire restitué à N % : « <80 premiers caractères sans balises>… »`
    pour la première source sous le seuil.

- [ ] **Étape 4 : lancer les tests**

  Même commande qu'à l'étape 2. Attendu : PASS.

- [ ] **Étape 5 : ajouter le critère `COMMENTAIRES_RESTITUES` dans `criteria/commentaires.ts`**

  Extraire la branche `get_chantier_commentaires` de
  `contenusDesCommentairesRecus` dans
  `contenusDeGetChantierCommentaires(evidence: Evidence): string[]`, que
  `contenusDesCommentairesRecus` appelle. Puis :

  ```ts
  export const COMMENTAIRES_RESTITUES = mechanical({
    id: "Commentaires restitués",
    rule: "Commentaires : restitués fidèlement par défaut, résumés seulement sur demande (D2)",
    check: (evidence) =>
      checkVerbatim({
        text: evidence.matter,
        sources: contenusDeGetChantierCommentaires(evidence),
      }),
    applicable: (evidence) =>
      contenusDeGetChantierCommentaires(evidence).length > 0,
  });
  ```

- [ ] **Étape 6 : déclarer le groupe et les deux scénarios**

  - `scenarioEval.ts` : ajouter `forme: "3.4 · Forme de la réponse"` à
    `GROUPS`.
  - `tableauDemande.criteria.ts` exporte `TABLEAU_DEMANDE_CRITERIA` :
    - `withBase`, avec `omit: [BASE_IDS.chantierFormat]` et ce commentaire :
      dans un tableau, le code et le nom d'un chantier peuvent occuper deux
      colonnes ;
    - critère mécanique `"Tableau"`, `rule`
      `"Forme : la demande explicite prime sur les formats par défaut (PIL-1900)"`,
      check `checkHasTable({ text: evidence.matter })` ;
    - critère mécanique `"Chantiers en retard dans le tableau"`, `rule`
      `"Demande : les chantiers en retard du territoire"`, check
      `checkTableChantiers` sur
      `chantiersAttendus({ truth: evidence.truth, view: "en_retard" })`.
  - `tableauDemande.eval.ts` :
    - suite `"Tableau demandé"`, groupe `forme` ;
    - un cas, question `"Fais-moi un tableau des chantiers en retard en Bretagne"`,
      `reason` `"Tableau demandé sur une liste de chantiers : le prompt actuel l'interdit"`,
      `truthScope: { territoires: ["REG-53"] }`, `expected` :
      `get_chantiers` avec `{ territoire_code: "REG-53", view: "en_retard" }` ;
    - un commentaire d'en-tête qui dit ce que le cas mesure (une règle de
      format née d'un usage ne bloque pas une autre demande).
  - `commentairesRestitues.criteria.ts` exporte
    `COMMENTAIRES_RESTITUES_CRITERIA = withBase({ criteria: [COMMENTAIRES_RESTITUES] })`.
  - `commentairesRestitues.eval.ts` :
    - suite `"Commentaires restitués"`, groupe `forme`, profil `coordinateur` ;
    - un cas, question `"Quels sont les commentaires du CH-001 en Bretagne ?"`,
      `reason` `"Restitution par défaut, sans demande de synthèse (D2)"`,
      `truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-001"] }`,
      `expected` : `get_chantier_commentaires` avec
      `{ chantier_id: "CH-001", territoire_code: "REG-53" }`.

- [ ] **Étape 7 : tests, typecheck et une exécution des suites**

  Commandes : `pnpm vitest run --project server-unit evals/3-scenarios && pnpm lint:tsc`,
  puis `pnpm eval evals/3-scenarios/3.4-forme`
  Attendu : PASS pour les tests. Les deux suites s'exécutent sans erreur ;
  leurs scores sont ceux du prompt actuel (le tableau échouera probablement :
  c'est ce qu'on mesure).

- [ ] **Étape 8 : commit**

  ```bash
  git add evals/3-scenarios
  git commit -m "test(PIL-1900): scénarios de forme demandée (tableau, commentaires restitués)"
  ```

---

### Tâche 5 : un dashboard sans chantier (critère d'acceptation)

**Fichiers :**
- Modifier : `evals/3-scenarios/mechanicalChecks.ts`
- Créer : `evals/3-scenarios/3.1-synthese/dashboardSansChantier.criteria.ts`
- Créer : `evals/3-scenarios/3.1-synthese/dashboardSansChantier.eval.ts`
- Tests : `evals/3-scenarios/mechanicalChecks.unit.test.ts`

**Interfaces :**
- Produit : `checkDashboardNonVide({ dashboard }: { dashboard: { containers: DashboardContainer[] } | null }): CheckResult`

- [ ] **Étape 1 : écrire les tests, qui doivent échouer**

  ```ts
  describe("checkDashboardNonVide", () => {
    const titre = { type: "widget_titre_section" };
    const paragraphe = { type: "widget_paragraph" };

    test("laisse passer l'absence de dashboard", () => {
      expect(checkDashboardNonVide({ dashboard: null })).toEqual({
        ok: true,
        detail: "aucun dashboard composé",
      });
    });

    test("signale un dashboard fait seulement de titres et de paragraphes", () => {
      expect(
        checkDashboardNonVide({
          dashboard: {
            containers: [{ widgets: [titre] }, { widgets: [paragraphe] }],
          },
        }),
      ).toEqual({ ok: false, detail: "dashboard sans widget de données" });
    });

    test("laisse passer un dashboard qui affiche une donnée", () => {
      expect(
        checkDashboardNonVide({
          dashboard: {
            containers: [
              { widgets: [titre] },
              { widgets: [{ type: "widget_taux_avancement_territoire" }] },
            ],
          },
        }).ok,
      ).toBe(true);
    });
  });
  ```

- [ ] **Étape 2 : lancer les tests**

  Commande : `pnpm vitest run --project server-unit evals/3-scenarios/mechanicalChecks.unit.test.ts`
  Attendu : FAIL.

- [ ] **Étape 3 : implémenter `checkDashboardNonVide` dans `mechanicalChecks.ts`**

  Le check passe si le dashboard est absent, ou si au moins un widget n'est ni
  `widget_titre_section` ni `widget_paragraph`. Si le dashboard est présent
  et ne contient que ces deux types de widgets, il échoue avec
  `"dashboard sans widget de données"`.

- [ ] **Étape 4 : lancer les tests**

  Même commande qu'à l'étape 2. Attendu : PASS.

- [ ] **Étape 5 : déclarer le scénario**

  - `dashboardSansChantier.criteria.ts` exporte
    `DASHBOARD_SANS_CHANTIER_CRITERIA` :
    - `withBase`, avec `omit: [BASE_IDS.restriction, BASE_IDS.chantierFormat]`
      et le même commentaire que `tableauDeBord.criteria.ts` ;
    - critère mécanique `"Pas de dashboard vide"`, `rule`
      `"PIL-1900 : aucun dashboard vide n'est présenté comme un succès"`,
      check `checkDashboardNonVide({ dashboard: evidence.dashboard })`.
  - `dashboardSansChantier.eval.ts` :
    - suite `"Dashboard sans chantier"`, groupe `synthese`,
      `matter: "dashboard"` ;
    - un cas, question `"Affiche la carte des météos des chantiers en Bretagne"`,
      `reason` `"Carte qui exige un chantier, demandée sans chantier (PIL-1900, point 4)"`,
      `truthScope: { territoires: ["REG-53"] }` ;
    - un commentaire d'en-tête qui reprend le comportement observé dans le
      ticket : un dashboard vide annoncé par « Voici le tableau de bord
      demandé ».

- [ ] **Étape 6 : typecheck et une exécution de la suite**

  Commandes : `pnpm lint:tsc`, puis
  `pnpm eval evals/3-scenarios/3.1-synthese/dashboardSansChantier.eval.ts`
  Attendu : la suite s'exécute sans erreur.

- [ ] **Étape 7 : commit**

  ```bash
  git add evals/3-scenarios
  git commit -m "test(PIL-1900): un dashboard sans chantier ne doit pas être vide"
  ```

---

### Tâche 6 : le run de référence et le journal

**Fichiers :**
- Modifier : `.gitignore` (celui de `apps/pilote-ppg`)
- Modifier : `docs/superpowers/specs/2026-10-27-albert-refonte-system-prompt-design.md`

- [ ] **Étape 1 : ignorer les résultats de run**

  Ajouter `evals/resultats*.json` et `evals/echecs-*.txt` au `.gitignore`.
  Les résultats pèsent plusieurs dizaines de Mo ; les listes d'échecs servent
  à comparer deux runs en local, et leur contenu va dans la spec.

- [ ] **Étape 2 : lancer le run complet**

  Commande, en arrière-plan (au moins un quart d'heure) :
  `pnpm eval --outputPath evals/resultats-etape-0.json --threshold 0`
  Attendu : code de sortie 0, et le fichier `evals/resultats-etape-0.json`
  existe. **Ne pas toucher à `src/` avant la fin du run.**

- [ ] **Étape 3 : relever les mesures**

  ```bash
  # Taille du contexte : tokens d'entrée du premier appel du cas « Bonjour », par essai
  jq '[.suites[].evals[] | select(.input.question | startswith("Bonjour")) | (.traces | min_by(.startTime) | .inputTokens)]' evals/resultats-etape-0.json
  # Moyenne du niveau 2
  jq '[.suites[] | select(.name | startswith("2.")) | .averageScore] | add / length' evals/resultats-etape-0.json
  # Moyenne du niveau 3, hors calibration du juge
  jq '[.suites[] | select(.name | test("^3\\.[1-9]")) | .averageScore] | add / length' evals/resultats-etape-0.json
  # Échecs répétés : critère en échec sur au moins 2 essais sur 3
  jq -r '.suites[] | .name as $suite | .evals | group_by(.input.question + (.input.reason // "")) | .[] | (.[0].input.reason // .[0].input.question) as $cas | [.[].scores[]] | group_by(.name) | .[] | {critere: .[0].name, echecs: (map(select(.score < 1)) | length)} | select(.echecs >= 2) | "\($suite) · \($cas) · \(.critere) · \(.echecs)/3"' evals/resultats-etape-0.json > evals/echecs-etape-0.txt
  ```

  Attendu : trois valeurs de tokens proches, deux moyennes entre 0 et 1, et le
  fichier des échecs. Le cas « Bonjour » n'expose aujourd'hui ni
  `create_dashboard` ni `export_rapport` ; à l'étape 1 ils seront toujours
  exposés, et ce delta fait partie de la mesure.

  Pour lire le détail d'un échec (la preuve du juge ou du check), générer la
  page du rapport avec
  `pnpm eval:rapport evals/resultats-etape-0.json --commit "$(git rev-parse --short HEAD)"`,
  puis la servir avec `python3 -m http.server -d evals/rapport/site 8000`.

- [ ] **Étape 4 : remplir le journal de la spec**

  - Ligne « 0 – ligne de base » : le commit, les moyennes des niveaux 2 et 3, la
    taille du contexte (médiane des trois essais), et la décision
    « référence ».
  - Sous le tableau, une section « Échecs répétés de la ligne de base » qui
    reprend `evals/echecs-etape-0.txt`.
  - Les critères jugés non fiables relevés en tâche 1, étape 6, s'il y en a.

- [ ] **Étape 5 : commit**

  ```bash
  git add .gitignore docs/superpowers/specs/2026-10-27-albert-refonte-system-prompt-design.md
  git commit -m "docs(PIL-1900): ligne de base de la refonte du prompt"
  ```

---

# Étape 1 : réécriture minimale

### Tâche 7 : tous les tools sont toujours exposés (D4)

**Fichiers :**
- Modifier : `src/server/albert/AssistantIA.ts`
- Modifier : `src/server/albert/systemPrompt.ts`
- Supprimer : `src/server/albert/detecteurIntention.ts`
- Supprimer : `src/server/albert/__tests__/detecteurIntention.unit.test.ts`
- Supprimer : `src/server/albert/__tests__/systemPrompt.unit.test.ts` (il ne
  teste que les capacités ; il est recréé en tâche 10)
- Supprimer : `evals/1-keywords/` ; retirer le script `eval:rapide` de
  `package.json`
- Modifier : `evals/2-tools/2.3-rendu/createDashboard.eval.ts`,
  `evals/2-tools/2.3-rendu/exportRapport.eval.ts` (commentaires d'en-tête)

**Interfaces :**
- Produit : `buildChatSystemPrompt({ territoiresAccessibles, agentContext }: { territoiresAccessibles: string[]; agentContext?: Record<string, unknown> | null }): string`,
  sans `capacities`.
- Supprime : `Capacities`, `detecterCapacities`, `dashboardDejaCompose`,
  `extraireTexteDernierMessageUtilisateur`, `AssistantIA.outilsCharges`.

- [ ] **Étape 1 : exposer tous les tools**

  Dans `AssistantIA.ts` :
  - `construireTools` ne prend plus de `capacities` et renvoie toujours
    `create_dashboard` et `export_rapport` ;
  - supprimer `detecterCapacitiesDepuisMessages` et `outilsCharges` ;
  - `streamText` et `generateText` ne calculent plus de capacités ;
  - mettre à jour le commentaire de `construireTools`.

- [ ] **Étape 2 : retirer les parties conditionnelles du prompt actuel**

  Dans `systemPrompt.ts` :
  - supprimer `GABARIT_SYNTHESE_TERRITORIALE`, `consigneSyntheseWorkflow` et
    `consigneSousTerritoires` ;
  - à l'étape 3 du workflow a, garder la phrase de la branche sans gabarit
    (« Produis une synthèse factuelle structurée… »).

  Le prompt complet est réécrit en tâche 10. Cette tâche ne fait que le
  libérer des capacités.

- [ ] **Étape 3 : supprimer le détecteur, ses tests et le niveau 1**

  Supprimer les fichiers listés ci-dessus et le script `eval:rapide`. Dans les
  en-têtes de `createDashboard.eval.ts` et `exportRapport.eval.ts`, retirer ce
  qui explique l'exposition par mot-clé. Les cas négatifs restent : ils
  vérifient toujours que l'outil n'est pas appelé.

- [ ] **Étape 4 : vérifier**

  Commandes : `pnpm vitest run --project server-unit src/server/albert && pnpm lint:tsc`,
  puis `grep -rn "capacit\|detecteurIntention\|outilsCharges" src/server/albert evals`
  Attendu : PASS, et aucune occurrence.

- [ ] **Étape 5 : commit**

  ```bash
  git add -A src/server/albert evals package.json
  git commit -m "feat(PIL-1900): tous les outils de l'assistant sont toujours exposés"
  ```

---

### Tâche 8 : les tools renvoient des libellés (D1)

**Fichiers :**
- Créer : `src/server/albert/tools/libelles.ts`
- Tests : `src/server/albert/__tests__/tools/libelles.unit.test.ts`
- Modifier : `src/server/albert/tools/getChantiers.ts` (+ son test)
- Modifier : `src/server/albert/tools/getChantiersSignales.ts` (+ son test)
- Modifier : `src/server/albert/tools/createDashboard.ts`

**Interfaces :**
- Produit, dans `libelles.ts` :
  - `libelleNiveauDeConfiance(meteo: string | null): string | null`, qui
    réutilise `libellesMeteos` (`src/shared/meteo/Meteo.interface.ts`) ;
    `null` ou code inconnu → `null`
  - `codeMeteoDepuisLibelle(libelle: string): MeteoSaisissable | null`, pour
    les quatre niveaux saisissables seulement
  - `libelleTendance(tendance: string | null): "En hausse" | "En baisse" | "Stable" | null`
    (les libellés de `BadgeTendance.tsx`)
  - `mailleDePilotage(mailles: string[]): "nationale" | "régionale" | "départementale" | null` :
    la plus fine présente
  - `libelleCategorieSignalement(type: TypeAlerteChantier): string`
- Forme d'un chantier dans le résultat de `get_chantiers` :

  ```ts
  {
    chantier: { id, nom, axe, ppg, ministeres, maille_de_pilotage },
    taux_avancement, ecart,
    tendance,            // libellé
    niveau_de_confiance, // libellé, depuis `meteo` du chantier-territoire
    est_en_retard, est_en_difficulte,
    synthese: { commentaire, date_commentaire } | null,
    commentaires: { donnees, autresResultats },
  }
  ```

- Forme d'un chantier dans le résultat de `get_chantiers_signales` :
  `{ id, nom, ecart, niveau_de_confiance, categories: string[] }`, avec les
  catégories en libellés.
- Entrée de `create_dashboard` : `chantiers[].meteo` devient
  `chantiers[].niveau_de_confiance`.

Libellés des catégories de signalement :

| Code | Libellé |
|---|---|
| `estEnAlerteÉcart` | Retard par rapport à la médiane |
| `estEnAlerteBaisse` | Tendance en baisse |
| `estEnAlerteTauxAvancementNonCalculé` | Taux d'avancement non calculé |
| `estEnAlerteAbscenceTauxAvancementDepartemental` | Absence de taux d'avancement départemental |
| `estEnAlerteMétéoNonRenseignée` | Météo et synthèse non renseignées |
| `estEnAlertePossedePropositionsValeurAvancement` | Proposition de valeur d'avancement |

- [ ] **Étape 1 : écrire les tests de `libelles.ts`, qui doivent échouer**

  Cas à couvrir, chacun avec `toEqual` :
  - `libelleNiveauDeConfiance("ORAGE")` → `"Objectifs compromis"` ;
    `("NON_RENSEIGNEE")` → `"Non renseignée"` ; `(null)` → `null`
  - `codeMeteoDepuisLibelle("Appuis nécessaires")` → `"NUAGE"` ;
    `("Non renseignée")` → `null`
  - `libelleTendance("BAISSE")` → `"En baisse"` ; `(null)` → `null`
  - `mailleDePilotage(["NAT", "REG"])` → `"régionale"` ;
    `(["NAT", "REG", "DEPT"])` → `"départementale"` ; `([])` → `null`
  - `libelleCategorieSignalement("estEnAlerteÉcart")` →
    `"Retard par rapport à la médiane"`

- [ ] **Étape 2 : lancer les tests**

  Commande : `pnpm vitest run --project server-unit src/server/albert/__tests__/tools/libelles.unit.test.ts`
  Attendu : FAIL.

- [ ] **Étape 3 : implémenter `libelles.ts`**

- [ ] **Étape 4 : lancer les tests**

  Même commande. Attendu : PASS.

- [ ] **Étape 5 : écrire les tests des résultats, qui doivent échouer**

  Dans `getChantiers.unit.test.ts` :
  - un chantier `meteo: "ORAGE"`, `tendance: "BAISSE"`,
    `mailles_applicables: ["NAT", "REG"]` sort avec
    `niveau_de_confiance: "Objectifs compromis"`, `tendance: "En baisse"`,
    `chantier.maille_de_pilotage: "régionale"`, sans clé `meteo` ni
    `mailles_applicables` ;
  - sur un territoire hors périmètre, `niveau_de_confiance` est conservé,
    `tendance` et `synthese.commentaire` valent `null`.

  Dans `getChantiersSignales.unit.test.ts` : un chantier signalé sort avec
  `categories: ["Retard par rapport à la médiane"]` et `niveau_de_confiance`.

- [ ] **Étape 6 : lancer les tests**

  Commande : `pnpm vitest run --project server-unit src/server/albert/__tests__/tools`
  Attendu : FAIL sur les nouveaux cas.

- [ ] **Étape 7 : mettre en forme les résultats**

  - `getChantiers.ts` :
    - une fonction de mise en forme appliquée à chaque chantier, avant le
      masquage, qui garde son comportement (`tendance`, commentaires et
      `synthese.commentaire` à `null` hors périmètre) ;
    - retirer le paramètre `meteo` de `getChantiersInputSchema` et de
      `toQueryParams`.
  - `getChantiersSignales.ts` : mettre en forme chaque `ChantierSignale`.
  - `createDashboard.ts` :
    - `chantierContextSchema` remplace `meteo` par
      `niveau_de_confiance: z.string().optional()`, décrit comme « libellé
      renvoyé par get_chantiers (ex. « Objectifs compromis ») » ;
    - `buildSubagentPrompt` transmet au sous-agent
      `meteo: codeMeteoDepuisLibelle(niveau_de_confiance)`, et omet la clé
      quand le code est `null`. Le prompt du sous-agent ne change pas.

- [ ] **Étape 8 : tests, typecheck et contrôle**

  Commandes : `pnpm vitest run --project server-unit src/server/albert evals && pnpm lint:tsc`,
  puis `grep -rnE "SOLEIL|COUVERT|NUAGE|ORAGE" src/server/albert/tools`
  Attendu : PASS. Les seules occurrences sont celles de `libelles.ts` et de
  ses tests. Les fixtures d'evals typées sur ces sorties (par exemple
  `references.ts`) suivent la nouvelle forme.

- [ ] **Étape 9 : commit**

  ```bash
  git add src/server/albert evals
  git commit -m "feat(PIL-1900): les outils de l'assistant renvoient des libellés, pas des codes"
  ```

---

### Tâche 9 : plus d'`_output_instructions`, des descriptions au modèle commun

**Fichiers :**
- Modifier : les 16 tools de `src/server/albert/tools/`, plus
  `composeDashboard.ts` (`ComposeDashboardOutput`)
- Modifier : leurs tests dans `src/server/albert/__tests__/tools/`
- Modifier : les fixtures client
  `src/client/components/_commons/ChatUI/{AssistantMessage.integration.test.tsx,assistantEvents.unit.test.ts,texteCopieCentreAide.unit.test.ts}`
- Modifier : `evals/3-scenarios/{columns.unit.test.ts,evidence.unit.test.ts,judge.ts}`
  et `evals/3-scenarios/3.0-calibration/references.ts`

**Interfaces :**
- Chaque type `*Output` perd son champ `_output_instructions`, de même que
  `ComposeDashboardOutput`.

- [ ] **Étape 1 : retirer `_output_instructions`**

  Supprimer le champ des sorties, des types et des constantes
  `OUTPUT_INSTRUCTIONS*`. Mettre à jour les assertions et les fixtures qui
  le contiennent. Supprimer le filtre devenu inutile dans `judge.ts`
  (ligne `key !== "_output_instructions"`).

- [ ] **Étape 2 : vérifier**

  Commandes : `pnpm vitest run --project server-unit --project client && pnpm lint:tsc`,
  puis `grep -rn "_output_instructions" src evals`
  Attendu : PASS. Il ne reste d'occurrences que dans les `rule` des critères,
  traitées en tâche 11.

- [ ] **Étape 3 : réécrire les descriptions selon le modèle commun**

  Chaque `description` suit ce modèle :

  ```
  <ce que l'outil renvoie, en une phrase>
  <les champs de statut et leur sens, une ligne chacun>
  Utilise-le pour : <intentions, 2 à 4 formulations types>
  Ne l'utilise pas pour : <cas voisin> → <autre outil>
  ```

  Ce qui n'y figure plus : les consignes de forme (tableau, verbatim, format
  de date, « termine en proposant… »), la règle des sous-territoires (elle va
  dans le `.describe` du paramètre), et le mot « météo » (sauf dans le
  libellé officiel de la catégorie de signalement).

  | Tool | Ne l'utilise pas pour → | Champs et faits à décrire |
  |---|---|---|
  | `get_taux_avancement_territoire` | TA d'un chantier → `get_chantiers` | médiane de la maille ; pour NAT-FR, médiane des départements ; « - % » = pas de donnée à ce jalon |
  | `get_chantiers` | plusieurs catégories de signalement ou une catégorie sans équivalent → `get_chantiers_signales` ; valeurs des indicateurs → `get_indicateurs` ; fraîcheur des données → `get_indicateurs_non_a_jour` | vues `en_retard` / `en_difficulte`, filtre `tendance` ; `non_applicable.raison` |
  | `get_indicateurs` | situation d'un chantier → `get_chantiers` ; évolution → `get_evolution_indicateur` ; historique → `get_historique_indicateur` | — |
  | `get_evolution_indicateur` | historique des actions → `get_historique_indicateur` | `introuvable` ; `construction_valeur_affichee` |
  | `get_historique_indicateur` | courbe → `get_evolution_indicateur` | `type_filtre: "PROPOSITIONS"` pour les PVA ; `introuvable`, `agrege_bloque` ; `besoin_precision` (rappeler avec `date_debut` / `date_fin` ISO) ; `date_valeur` ≠ `date_creation` ; valeurs importées ≠ valeur affichée |
  | `get_chantier_commentaires` | objectifs → `get_chantier_objectifs` | types de commentaires (liste actuelle) ; `territoire_nom` ; `types_non_accessibles` = relèvent de la vue nationale, pas une absence |
  | `get_chantier_objectifs` | commentaires d'un territoire → `get_chantier_commentaires` | objectifs nationaux ; `null` = aucun objectif publié |
  | `get_chantiers_signales` | une seule catégorie, retard ou baisse → `get_chantiers` | correspondance codes / libellés (tableau de la tâche 8) ; catégories applicables par maille ; jalon en cours seulement ; `acces_refuse`, `categories_non_applicables` |
  | `get_indicateurs_non_a_jour` | chantiers en retard (avancement) → `get_chantiers` | liste vide ≠ données à jour ; détail par territoire seulement avec `indicateur_ids` ou `territoire_code` ; `dateDerniereValeur: null` = jamais renseignée ; `miseAJourAttendueDepuis: null` = non calculable ; `acces_refuse` |
  | `search_chantiers`, `search_indicateurs`, `search_territoires` | identifiant déjà fourni → outil de données | au plus 10 candidats triés par pertinence |
  | `consulter_centre_aide` | valeurs d'un chantier, d'un indicateur ou d'un territoire → outils de données | `reponse` à restituer sans la compléter ; `trouve: false` = question non couverte, un bouton de contact s'affiche sous la réponse ; sources affichées sous la réponse ; `question` autonome |
  | `clarify_with_choices` | — | encart affiché ; 2 à 4 options réalisables ; pas de texte avant l'appel ; terminer par la seule phrase « Choisissez une option pour continuer. » |
  | `create_dashboard` | rendu hors catalogue → `clarify_with_choices` avec des alternatives | catalogue (repris de la section dashboard du prompt actuel) ; cartes et tableau des indicateurs exigent des chantiers |
  | `export_rapport` | — | données de la conversation (appeler les outils manquants) ; indicateurs en tableau ; répondre « Votre rapport est disponible au téléchargement. » sans lien |

  `.describe` de `include_sous_territoires` (trois tools), en une phrase :
  « `true` pour un territoire ET ses sous-territoires : un seul appel sur le
  parent, jamais un appel par sous-territoire. »

- [ ] **Étape 4 : vérifier les textes**

  Commande : `grep -rn "météo\|Météo" src/server/albert/tools`
  Attendu : seulement le libellé « Météo et synthèse non renseignées ».

- [ ] **Étape 5 : tests et typecheck**

  Commande : `pnpm vitest run --project server-unit src/server/albert && pnpm lint:tsc`
  Attendu : PASS.

- [ ] **Étape 6 : commit**

  ```bash
  git add src evals
  git commit -m "feat(PIL-1900): les outils de l'assistant décrivent ce qu'ils renvoient, sans consigne de forme"
  ```

---

### Tâche 10 : le prompt système réécrit

**Fichiers :**
- Modifier (réécriture complète) : `src/server/albert/systemPrompt.ts`
- Créer : `src/server/albert/__tests__/systemPrompt.unit.test.ts`

**Interfaces :**
- Consomme : la signature de la tâche 7.
- `JALON_PAR_DEFAUT = 2025` reste (A25 hors périmètre).

- [ ] **Étape 1 : écrire les tests, qui doivent échouer**

  ```ts
  describe("buildChatSystemPrompt", () => {
    it("commence par la directive de raisonnement", () => {
      // when
      const prompt = buildChatSystemPrompt({ territoiresAccessibles: [], agentContext: null });
      // then
      expect(prompt.startsWith("Reasoning: high\n")).toBe(true);
    });

    it("ne parle pas de météo (D1)", () => {
      const prompt = buildChatSystemPrompt({ territoiresAccessibles: [], agentContext: null });
      expect(prompt).not.toMatch(/m[ée]t[ée]o|SOLEIL|COUVERT|NUAGE|ORAGE/i);
    });

    it("ne documente pas les outils", () => {
      const prompt = buildChatSystemPrompt({ territoiresAccessibles: [], agentContext: null });
      expect(prompt).not.toContain("include_sous_territoires");
      expect(prompt).not.toContain("_output_instructions");
    });

    it("donne le jalon du contexte d'accueil", () => {
      const prompt = buildChatSystemPrompt({ territoiresAccessibles: [], agentContext: { jalon: 2026 } });
      expect(prompt).toContain("- Jalon courant : 2026");
    });

    it("prend 2025 comme jalon sans contexte", () => {
      const prompt = buildChatSystemPrompt({ territoiresAccessibles: [], agentContext: null });
      expect(prompt).toContain("- Jalon courant : 2025");
      expect(prompt).not.toContain("<contexte_utilisateur>");
    });

    it("liste les territoires à accès complet", () => {
      const prompt = buildChatSystemPrompt({ territoiresAccessibles: ["REG-53", "DEPT-35"], agentContext: null });
      expect(prompt).toContain("- Territoires à accès complet : REG-53, DEPT-35");
    });

    it("termine par les instructions du contexte utilisateur", () => {
      const prompt = buildChatSystemPrompt({
        territoiresAccessibles: [],
        agentContext: { instructions: "Territoire par défaut : Bretagne" },
      });
      expect(prompt.endsWith("<contexte_utilisateur>\nTerritoire par défaut : Bretagne\n</contexte_utilisateur>")).toBe(true);
    });
  });
  ```

- [ ] **Étape 2 : lancer les tests**

  Commande : `pnpm vitest run --project server-unit src/server/albert/__tests__/systemPrompt.unit.test.ts`
  Attendu : FAIL.

- [ ] **Étape 3 : écrire le prompt**

  Viser 130 à 150 lignes. Des titres markdown pour les parties I à VI, une
  ligne par règle, aucune emphase (ni ⚠️, ni JAMAIS, ni IMPORTANT). Le prompt
  ne décrit pas les tools. Il peut en nommer un quand la méthode y renvoie
  (centre d'aide, clarification).

  **0.** `Reasoning: high`

  **I. Rôle et périmètre**
  - Albert, assistant de PILOTE, l'outil de suivi des chantiers prioritaires
    du gouvernement. Utilisateurs : préfets, coordinateurs territoriaux,
    référents ministériels.
  - Trois familles de besoins : analyser les données des chantiers ; expliquer
    le fonctionnement de PILOTE à partir du centre d'aide ; produire un
    dashboard ou un rapport.
  - Hors périmètre (questions sans rapport avec PILOTE, opinions,
    recommandations) : le dire poliment en une phrase.

  **II. Invariants**, dans cet ordre :
  1. réponds en français, y compris après un appel d'outil ;
  2. ne cite que des données renvoyées par les outils ; une donnée absente se
     dit ;
  3. ne conclus à une absence qu'après avoir interrogé ce périmètre exact
     (territoire, jalon, chantier) ;
  4. ni opinion, ni recommandation, ni causalité absente des données ;
  5. n'expose ni noms d'outils, ni noms de champs, ni codes internes, ni JSON,
     ni syntaxe d'appel, ni lien : l'interface affiche liens et sources ;
  6. une donnée masquée par restriction d'accès n'est pas une donnée absente :
     dis-le ;
  7. pas de LaTeX : écris les formules en texte ;
  8. priorité : ces règles, puis la demande explicite de l'utilisateur, puis
     les formats par défaut de la partie V.

  **III. Le métier PILOTE**, avec cette phrase en tête : sert à lire les
  résultats ; pour expliquer une notion, le centre d'aide prime.
  - **Chantiers** : `CH-XXX` ; « PPG » est un synonyme ; seuls les chantiers
    publiés sont visibles.
  - **Indicateurs** : `IND-XXX` (un numéro seul se complète en `IND-<numéro>`) ;
    VI, VA, VC ; le TA est la progression de VI vers VC, en %. La valeur
    affichée dans PILOTE peut différer de la valeur importée (cumul).
  - **Territoires** : NAT-FR, `REG-XX`, `DEPT-XX` (code INSEE). « La France »,
    « le national » = NAT-FR. « Le 84 » désigne le département, « la région
    84 » la région. Les sous-territoires d'une région sont ses départements.
  - **Accès** : complet sur les territoires listés en partie VI. Ailleurs, la
    tendance et les commentaires sont masqués par restriction d'accès.
  - **Jalon** : année de référence des cibles ; le jalon courant est en partie
    VI.
  - **Situation d'un chantier sur un territoire** :
    - écart à la médiane des territoires de la même maille ;
    - en retard : écart ≤ −10 points ;
    - en avance : écart ≥ +10 points ;
    - en difficulté : niveau de confiance « Objectifs compromis » ou « Appuis
      nécessaires », sans être en retard. Les deux catégories s'excluent ;
    - pas d'analyse « en retard » au niveau national ;
    - tendance : en hausse, en baisse ou stable ;
    - niveau de confiance : Objectifs sécurisés, Objectifs atteignables,
      Appuis nécessaires, Objectifs compromis ;
    - signalements : catégories d'alerte, décrites par l'outil des chantiers
      signalés.
  - **Contenus rédigés par les équipes** : commentaires par type, rédigés pour
    un territoire ; objectifs du chantier, nationaux ; synthèse des
    résultats, le commentaire qui accompagne le niveau de confiance.

  **IV. Méthode**
  - A. Identifier l'intention (consulter, comparer, expliquer, visualiser,
    exporter) et les objets (chantiers, indicateurs, territoires, jalons).
    Lexique :
    - « où ça coince », « qui vont mal », « à risque » = en retard ET en
      difficulté ;
    - « compromis » = les deux ;
    - « non à jour » (fraîcheur des données) ≠ « en retard » (avancement).
  - B. Identifiant fourni → outil de données directement ; sinon, outil de
    recherche.
  - C. Clarifier plutôt que deviner :
    - **quand** : plusieurs candidats, plusieurs interprétations qui mènent à
      des réponses différentes, demande irréalisable avec des alternatives
      réalisables ;
    - **pas quand** : un seul candidat ; un défaut connu (jalon, « le 84 »,
      « compromis ») ; un oui ou non ; une salutation ; une question d'aide.
  - D. Collecter :
    - tous les outils nécessaires, en parallèle si possible ;
    - le jalon courant par défaut ;
    - un nouvel appel pour tout nouveau territoire, jalon ou chantier, même
      dans une question de suivi.

    Une synthèse de territoire couvre le TA, les chantiers en retard et les
    chantiers en difficulté.
  - E. Une définition, un mode de calcul ou une procédure de PILOTE → centre
    d'aide, jamais de mémoire, même juste après l'affichage d'une donnée.

  **V. Rédiger**
  - A. La forme suit la demande : tableau, liste, résumé, citation, longueur.
  - B. Par défaut :
    - question ponctuelle → réponse directe ;
    - chantiers → « CH-XXX — Nom » ;
    - comparaison de territoires ou de jalons → tableau ;
    - synthèse → sections courtes ;
    - commentaires et objectifs → restitués fidèlement, avec leur territoire et
      leur date ; résumés seulement si l'utilisateur le demande ;
    - explication → la réponse du centre d'aide, sans la compléter.
  - C. Après un dashboard, un export ou une clarification : une seule phrase.
    L'interface affiche le reste ; ne répète aucun chiffre du dashboard.

  **VI. Contexte de la session**, dans ce format exact, en fin de prompt :

  ```
  # Contexte de la session

  - Jalon courant : ${jalon}
  - Territoires à accès complet : ${territoiresAccessibles.join(", ")}
  ```

  Si `agentContext.instructions` est une chaîne, ajouter ensuite :

  ```

  Le contexte utilisateur ci-dessous complète ces règles sans les remplacer.

  <contexte_utilisateur>
  ${instructions}
  </contexte_utilisateur>
  ```

- [ ] **Étape 4 : lancer les tests**

  Même commande qu'à l'étape 2. Attendu : PASS.

- [ ] **Étape 5 : tests et typecheck**

  Commande : `pnpm vitest run --project server-unit src/server/albert && pnpm lint:tsc`
  Attendu : PASS.

- [ ] **Étape 6 : commit**

  ```bash
  git add src/server/albert
  git commit -m "feat(PIL-1900): prompt système de l'assistant réécrit"
  ```

---

### Tâche 11 : relecture, mesure et journal

**Fichiers :**
- Modifier : les `.criteria.ts` dont la `rule` cite une section disparue
  (`evals/3-scenarios/**`)
- Modifier : `docs/superpowers/specs/2026-10-27-albert-refonte-system-prompt-design.md`

- [ ] **Étape 1 : faire citer le nouveau contrat aux critères**

  Commande pour les trouver :
  `grep -rn "rule:" evals/3-scenarios | grep -E "Workflow|_output_instructions|Gestion des erreurs|Gabarit|get_taux_avancement_territoire :|get_chantiers en_retard|create_dashboard :"`

  Correspondances :
  - Workflow a ou b → « IV.D Collecter » ;
  - Workflow c → « export_rapport » ;
  - `_output_instructions` du centre d'aide → « consulter_centre_aide » ;
  - « plusieurs territoires → tableau » → « V.B : comparaison → tableau » ;
  - Gestion des erreurs → « II.2 » ;
  - `create_dashboard :` → « V.C ».

  Seul le texte de `rule` change : ni `id`, ni `instruction`, ni `check`.

- [ ] **Étape 2 : relecture par Antoine (arrêt obligatoire)**

  Afficher le prompt rendu :

  ```bash
  pnpm exec tsx -e 'import { buildChatSystemPrompt } from "./src/server/albert/systemPrompt"; console.log(buildChatSystemPrompt({ territoiresAccessibles: ["REG-53"], agentContext: { jalon: 2026, instructions: "Le territoire courant est Bretagne." } }))'
  ```

  Présenter le prompt et le diff des descriptions des tools
  (`git diff <commit de la tâche 6>.. -- src/server/albert/tools`). **Attendre
  son accord** avant le run ; reporter ses corrections dans les tâches 9 et 10.

- [ ] **Étape 3 : lancer le run complet**

  Commande, en arrière-plan :
  `pnpm eval --outputPath evals/resultats-etape-1.json --threshold 0`
  Attendu : code de sortie 0.

- [ ] **Étape 4 : relever les mesures et comparer**

  Les mêmes commandes jq qu'en tâche 6, étape 3, sur
  `evals/resultats-etape-1.json`, avec la liste des échecs écrite dans
  `evals/echecs-etape-1.txt`. Puis :
  `diff evals/echecs-etape-0.txt evals/echecs-etape-1.txt`

- [ ] **Étape 5 : remplir le journal**

  - Ligne « 1 – réécriture minimale » : le commit, les moyennes, la taille du
    contexte, et la décision « base de l'étape 2 ».
  - Une section « Échecs répétés de l'étape 1 », classés par famille :
    - choix d'outil ;
    - forme ;
    - contenu et factualité ;
    - restriction d'accès ;
    - langue.

    Indiquer pour chacun s'il est nouveau, résolu ou inchangé par rapport à
    la ligne de base. C'est l'entrée de l'étape 2, qui n'est pas dans ce
    plan.

- [ ] **Étape 6 : commit**

  ```bash
  git add evals/3-scenarios docs/superpowers/specs/2026-10-27-albert-refonte-system-prompt-design.md
  git commit -m "docs(PIL-1900): mesure de la réécriture minimale du prompt"
  ```
