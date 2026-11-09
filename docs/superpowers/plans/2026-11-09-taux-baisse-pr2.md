# Taux de progression des indicateurs à la baisse (PR2) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** l'API ne calcule plus de taux de progression pour un indicateur à la baisse, mais garde la valeur et la cible. La webapp affiche le bloc « Progression » avec « — » et l'objectif chaque fois qu'il y a un objectif sans taux.

**Architecture:** la règle `BAISSE` → `tauxProgression: null` vit dans la fonction pure `resolveTauxProgression`. Le sens lui arrive par `computeTauxProgressionPoints`, depuis ses quatre appelants, qui le lisent dans leur `select` existant. La règle tout-ou-rien des collections ne change pas et s'applique d'elle-même. Côté webapp, `IndicateurProgression` accepte un taux `null`, et les conditions d'affichage passent de « il y a un taux » à « il y a un point ».

**Tech Stack:** Prisma 7, Hono + `@hono/zod-openapi`, Zod 4, Vitest (intégration sur vraie base), React + TanStack Query.

**Spec:** `docs/superpowers/specs/2026-11-09-taux-baisse-pr2-design.md`

## Global Constraints

- Branche `feat/PIL-1778-taux-baisse`, ouverte depuis `feat/PIL-1776-sens-souhaite` (PR stackée sur #2655).
- Nommage : vocabulaire métier en français, technique en anglais. Le type du sens est `SensSouhaite` (`@pilote/kpilote-shared/indicateur`), ses valeurs `HAUSSE` / `BAISSE`.
- Aucun champ d'API ajouté ni retiré : seules les descriptions changent.
- Collections : règle tout-ou-rien inchangée (`resolveCollectionTauxProgression` n'est pas modifié).
- Bloc sans taux, variante C1 : titre « Progression », « — » à la place du pourcentage, **pas de barre**, objectif et date en dessous. Aucune raison affichée.
- Textes accessibles : « Progression non disponible » (indicateur), « Progression de la collection non disponible » (collection).
- Légendes du détail d'une collection : « Moyenne pondérée des indicateurs », « Collection sans indicateur », « Aucun indicateur pondéré », « {n}/{m} indicateur(s) sans taux ».
- Tests : uniquement des tests d'intégration côté API, aucun côté client.
- **Ne pas commiter sans demande explicite de Triko.** Les étapes « Commit » donnent le message à utiliser une fois le feu vert reçu. Ne pas ouvrir de PR sans demande.
- Messages de commit : `feat(kpilote): <description en français> (PIL-1778)`, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Indicateur à la hausse inchangé** : taux, plafonnement à 100 et troncature identiques à avant, sur les quatre endpoints. → Suites existantes de la tâche 1, qui doivent rester vertes sans modification d'attendu.
2. **Indicateur à la baisse dans le détail d'une collection, pondéré** : la collection n'a pas de taux, et la légende compte cet indicateur. Avec une pondération à 0, il n'est pas compté et le taux de la collection revient. → Tests d'intégration de la tâche 1, plus la vérification manuelle de la tâche 3 sur COL-005.
3. **Carte d'indicateur à la baisse avec objectif** (tableau de bord, détail d'une collection) : bloc « Progression — » et objectif, sans barre ; sans objectif, aucun bloc. → Vérification manuelle, tâche 2.
4. **Cible à 0 sur un indicateur à la hausse** (cas existant) : même bloc « — » avec « Objectif : 0 ». → Vérification manuelle, tâche 2.
5. **Courbe d'un indicateur à la baisse** : série « Objectif » présente, et pas de ligne « Taux de progression » dans l'infobulle. → Vérification manuelle, tâche 2.

---

### Task 1 : API — neutraliser le taux à la baisse

**Files:**
- Modify: `apps/kpilote-api/src/valeurAvancement/resolveTauxProgression.ts` (`resolveTauxProgression`)
- Modify: `apps/kpilote-api/src/valeurAvancement/queries/computeTauxProgressionPoints.ts`
- Modify: `apps/kpilote-api/src/valeurAvancement/queries/listTauxProgressionForIndicateur.ts` (`select` l. 32, type passé à `build`)
- Modify: `apps/kpilote-api/src/valeurAvancement/queries/listTauxProgressionForIndividu.ts` (`select` de `indicateur.findMany`)
- Modify: `apps/kpilote-api/src/collection/queries/getCollectionTauxProgression.ts` (`select` de `indicateur`, helper `computeDernierTaux` l. 131)
- Modify: `apps/kpilote-api/src/collection/queries/listCollectionTauxProgressionForIndividu.ts` (`select` l. 24)
- Modify: `apps/kpilote-api/src/collection/queries/computeCollectionContributions.ts` (type `CollectionIndicateurRef`, `computeDernierTaux`)
- Modify: `apps/kpilote-api/src/test/fixtures.ts:53-67` (`IndicateurOverrides`)
- Modify (descriptions) : `packages/kpilote-shared/src/tauxProgression.ts`, `packages/kpilote-shared/src/valeurAvancement.ts` (l. ~482-507), `packages/kpilote-shared/src/collectionTauxProgression.ts`, `apps/kpilote-api/src/valeurAvancement/routes.ts` (l. 352-357, 382-386, 410-415), `apps/kpilote-api/src/collection/routes.ts` (l. 148-153)
- Modify (doc) : `apps/kpilote-api/docs/architecture/taux-progression.md`
- Test: `apps/kpilote-api/src/valeurAvancement/queries/listTauxProgressionForIndicateur.test.ts`
- Test: `apps/kpilote-api/src/valeurAvancement/queries/listTauxProgressionForIndividu.test.ts`
- Test: `apps/kpilote-api/src/collection/queries/getCollectionTauxProgression.test.ts`

**Interfaces:**
- Consumes: `type SensSouhaite` (`@pilote/kpilote-shared/indicateur`), colonne `Indicateur.sensSouhaite` (PR1).
- Produces:
  - `resolveTauxProgression({ valeurs, objectifsParIndividu, sensSouhaite }: { …; sensSouhaite: SensSouhaite }): TauxProgressionPoint[]`
  - `computeTauxProgressionPoints({ indicateurId, sensSouhaite, individusCibles, dateTruncValeur, dateTruncObjectif })`
  - `CollectionIndicateurRef = { ponderation: Decimal; indicateur: { id: string; publicId: string; sensSouhaite: SensSouhaite } }`
  - Contrat HTTP inchangé : pour un indicateur à la baisse, `tauxProgression: null` avec `valeur`, `valeurCible` et `dateCible` renseignés.

- [ ] **Step 1 : créer la branche**

```bash
git switch feat/PIL-1776-sens-souhaite && git pull --ff-only && git switch -c feat/PIL-1778-taux-baisse
```

- [ ] **Step 2 : permettre de créer un indicateur à la baisse par fixture**

Dans `IndicateurOverrides` (`test/fixtures.ts`), ajouter `sensSouhaite: SensSouhaite`, avec l'import depuis `@/generated/prisma/enums` ou `@pilote/kpilote-shared/indicateur`, comme pour `Visibilite`. `upsertIndicateur` étale déjà les overrides dans `create` et `update`, donc rien d'autre à changer.

Le sens se passe dans le **premier** appel de fixture qui crée l'indicateur, par exemple `fixtures.indicateurReferentiel({ indicateur: { publicId: indId, sensSouhaite: 'BAISSE' }, … })`. Les appels suivants avec le seul `publicId` réutilisent l'indicateur existant.

- [ ] **Step 3 : écrire les tests qui doivent échouer**

`listTauxProgressionForIndicateur.test.ts` : ajouter, sur le modèle de « calcule le taux de progression pour une valeur avec un objectif » :

```ts
it(
  "renvoie un taux null mais garde valeur et cible pour un indicateur à la baisse",
  integrationTest(async () => {
    // indicateurReferentiel avec { publicId: indId, sensSouhaite: 'BAISSE' }
    // valeur 8 au 2024-06-01, objectif 7 au 2024-12-31
    // …
    expect(result._unsafeUnwrap()).toEqual({
      items: [
        {
          indicateur: indId,
          individu: deptId,
          date: '2024-06-01',
          valeur: 8,
          valeurCible: 7,
          dateCible: '2024-12-01',
          tauxProgression: null,
        },
      ],
    })
  }),
)
```

`listTauxProgressionForIndividu.test.ts` : même jeu de données. `listTauxProgressionForIndividu(deptId, { indicateurs: [indId] })` doit renvoyer `{ items: [{ indicateur: indId, tauxProgression: null, valeurCible: 7, dateCible: '2024-12-01' }] }`.

`getCollectionTauxProgression.test.ts` : deux tests sur le modèle de « calcule la moyenne arithmétique… », avec `testCollectionId()` au lieu d'un identifiant écrit en dur :
- **« retourne null si un indicateur à la baisse est pondéré (tout-ou-rien) »** : indA à la hausse (50 sur une cible de 100) et indB à la baisse (8 sur une cible de 7), tous deux pondérés à 1. On attend `tauxProgression: null`, et les contributions `[{ indicateur: indA, tauxProgression: 50, … , ponderation: 1 }, { indicateur: indB, tauxProgression: null, date: '2024-06-01', ponderation: 1 }]`.
- **« ignore un indicateur à la baisse de pondération 0 »** : même jeu, puis `db().collectionIndicateur.update` qui met la pondération d'indB à 0. On attend `tauxProgression: 50`, et la contribution d'indB à `{ tauxProgression: null, ponderation: 0 }`. La clé unique de `collectionIndicateur` se lit dans `schema.prisma`.

- [ ] **Step 4 : vérifier que les tests échouent**

Run: `pnpm -F @pilote/kpilote-api test src/valeurAvancement/queries/listTauxProgression src/collection/queries/getCollectionTauxProgression`
Attendu : FAIL sur les 4 nouveaux tests. Le taux vaut `114.28`, puis 100 après plafonnement, au lieu de `null`, et le taux de la collection est un nombre au lieu de `null` dans le premier test de collection. Les tests existants passent.

- [ ] **Step 5 : la règle pure**

`resolveTauxProgression` reçoit `sensSouhaite: SensSouhaite`. Pour `BAISSE`, les points sont construits comme aujourd'hui, avec `tauxProgression: null`, sans appeler `computeTaux`. Pour `HAUSSE`, aucun changement. Un commentaire court renvoie à PIL-1777.

- [ ] **Step 6 : faire passer le sens jusqu'à la règle**

- `computeTauxProgressionPoints` : nouveau paramètre `sensSouhaite`, transmis à `resolveTauxProgression`.
- Les quatre appelants ajoutent `sensSouhaite: true` à leur `select` d'indicateur et le transmettent :
  - `listTauxProgressionForIndicateur` : le type `{ id; publicId }` passé à `build` devient `{ id; publicId; sensSouhaite }` ;
  - `listTauxProgressionForIndividu` ;
  - `getCollectionTauxProgression` : son `computeDernierTaux({ indicateurId, sensSouhaite, cible })` ;
  - `listCollectionTauxProgressionForIndividu`, puis `computeCollectionContributions` : `CollectionIndicateurRef.indicateur.sensSouhaite`, et son `computeDernierTaux`.

- [ ] **Step 7 : vérifier que les tests passent**

Run: `pnpm -F @pilote/kpilote-api test src/valeurAvancement src/collection`
Attendu : PASS, et aucun attendu existant modifié (Review Focus 1).

- [ ] **Step 8 : descriptions et documentation**

Ajouter le cas « ou si l'indicateur est à la baisse (sensSouhaite = BAISSE) : le calcul propre à ces indicateurs n'existe pas encore (PIL-1777) » à chaque texte qui liste les cas `null` du taux :
- `tauxProgressionPointApiModelSchema.tauxProgression` (`tauxProgression.ts`) ;
- `tauxProgressionIndividuApiModelSchema.tauxProgression`, en retirant au passage « null si aucun objectif » (sans objectif, l'item est omis), et la description de `tauxProgressionIndividuListApiModelSchema.items` (`valeurAvancement.ts`) ;
- `collectionTauxProgression.ts` : `tauxProgression` des contributions, et taux des cartes et du détail d'une collection, en précisant qu'un indicateur à la baisse pondéré rend la collection non calculable (tout-ou-rien) ;
- descriptions des routes `valeurAvancement/routes.ts` (l. 352-357, 382-386, 410-415) et `collection/routes.ts` (l. 148-153).

`taux-progression.md` : nouvelle section « Indicateurs à la baisse ». Elle dit que le taux vaut `null` en attendant PIL-1777, que les points gardent valeur et cible, et que le tout-ou-rien s'applique aux collections.

- [ ] **Step 9 : suite complète et lint**

Run: `pnpm -F @pilote/kpilote-api test && pnpm -F @pilote/kpilote-shared lint && pnpm -F @pilote/kpilote-api lint`
Attendu : PASS.

- [ ] **Step 10 : commit (sur feu vert)**

```bash
git add apps/kpilote-api/src apps/kpilote-api/docs packages/kpilote-shared/src
git commit -m "feat(kpilote): plus de taux de progression pour un indicateur à la baisse, en attendant son calcul dédié (PIL-1778)"
```

---

### Task 2 : webapp — bloc « Progression — » pour les indicateurs

**Files:**
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurProgression.tsx`
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurSynthesePanel.tsx:108-115`
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurAvancement.tsx:46-55`

**Interfaces:**
- Consumes: contrat HTTP de la tâche 1 (`tauxProgression: number | null`, `valeurCible` et `dateCible` présents dès qu'un point existe).
- Produces: `IndicateurProgression({ taux: number | null; valeurCible: number; dateCible: string; unite: UniteIndicateurApiModel | null })`.

- [ ] **Step 1 : `IndicateurProgression` accepte un taux null**

- `taux: number | null`.
- Avec `taux === null` : le titre « Progression » ; à droite, « — » avec le texte accessible « Progression non disponible » ; **pas de `ProgressBar`** ; l'objectif et sa date comme aujourd'hui.
- Avec un taux, le rendu est identique à aujourd'hui.

- [ ] **Step 2 : afficher le bloc dès qu'il y a un point**

- `IndicateurSynthesePanel` : condition `dernierPoint`, au lieu de `taux !== null && dernierPoint`, et `taux` passé tel quel.
- `IndicateurAvancement` : condition `tauxData != null`, au lieu de `tauxData?.tauxProgression != null`, et `tauxData.tauxProgression` passé tel quel.

- [ ] **Step 3 : lint et types**

Run: `pnpm -F @pilote/kpilote-webapp lint`
Attendu : PASS.

- [ ] **Step 4 : vérification manuelle (Review Focus 3, 4 et 5)**

API et webapp lancées depuis la branche, base locale seedée (IND-001 et IND-004 à la baisse, avec objectifs).
- **Fiche d'IND-001**, onglet Résultats, individu `DEPT-01` (référentiel `REF-DEPT`) : le bloc « Progression — » est affiché, sans barre, avec « Objectif : … » et la date.
- **Infobulle de la courbe** : elle montre « Objectif » mais pas « Taux de progression ».
- **Fiche d'IND-003**, à la hausse, avec objectif : le bloc avec pourcentage et barre est inchangé.
- **Tableau de bord des indicateurs** sur `DEPT-01` : les cartes d'IND-001 et d'IND-004 affichent « Progression — » et l'objectif. Les cartes d'indicateurs sans objectif n'ont pas de bloc.
- **Cible à 0** : si le seed n'en a pas, en poser une à la main sur un indicateur à la hausse (`UPDATE objectif_indicateur_individu SET valeur_cible = 0 …`), vérifier le bloc « — » avec « Objectif : 0 », puis relancer le seed.

- [ ] **Step 5 : commit (sur feu vert)**

```bash
git add apps/kpilote-webapp/src/components/indicateurs
git commit -m "feat(kpilote): sans taux de progression, l'indicateur garde son bloc Progression avec son objectif (PIL-1778)"
```

---

### Task 3 : webapp — collections

**Files:**
- Modify: `apps/kpilote-webapp/src/components/collections/CollectionAvancement.tsx:32-52`
- Modify: `apps/kpilote-webapp/src/components/collections/CollectionTauxProgression.tsx:11-19` (`buildCaption`)

**Interfaces:**
- Consumes: réponses des cartes de collections (`{ collection, tauxProgression: number | null }`) et du détail (`{ tauxProgression, contributions: [{ indicateur, tauxProgression, date, ponderation }] }`), inchangées.

- [ ] **Step 1 : carte de collection sans taux**

`CollectionAvancement` :
- `data == null` : rien, comme aujourd'hui ;
- `data.tauxProgression == null` : le titre « Progression », et « — » avec le texte accessible « Progression de la collection non disponible ». Pas de barre.
- Avec un taux : inchangé.

- [ ] **Step 2 : légende du détail**

`buildCaption(taux, contributions)` avec `contributions: ReadonlyArray<{ tauxProgression: number | null; ponderation: number }>` :
- taux présent : « Moyenne pondérée des indicateurs » ;
- aucune contribution : « Collection sans indicateur » ;
- aucune contribution de pondération supérieure à 0 : « Aucun indicateur pondéré » ;
- sinon : `${n}/${m} indicateur${n > 1 ? 's' : ''} sans taux`, où m compte les contributions pondérées (supérieures à 0) et n celles d'entre elles dont le taux est `null`.

- [ ] **Step 3 : lint et types**

Run: `pnpm -F @pilote/kpilote-webapp lint`
Attendu : PASS.

- [ ] **Step 4 : vérification manuelle (Review Focus 2)**

- **Tableau de bord des collections** sur un individu où COL-005 est visible : la carte de COL-005 affiche « Progression — », sans barre.
- **Détail de COL-005** avec `individu` renseigné : le `StatCard` affiche « — » et « 1/m indicateur sans taux », où m est le nombre d'indicateurs de COL-005. C'est IND-001, à la baisse.
- Dans l'admin locale, passer la pondération d'IND-001 dans COL-005 à 0 : le taux de la collection revient, ou la légende ne compte plus IND-001 si un autre indicateur bloque. Remettre ensuite la pondération à 1, ou relancer le seed.

- [ ] **Step 5 : commit (sur feu vert)**

```bash
git add apps/kpilote-webapp/src/components/collections
git commit -m "feat(kpilote): les collections sans taux gardent leur bloc Progression, et la légende ne compte que les indicateurs pondérés (PIL-1778)"
```

---

### Task 4 : vérification d'ensemble

- [ ] **Step 1 : lint des trois paquets**

Run: `pnpm -F @pilote/kpilote-shared lint && pnpm -F @pilote/kpilote-api lint && pnpm -F @pilote/kpilote-webapp lint`
Attendu : PASS.

- [ ] **Step 2 : suites de tests**

Run: `pnpm -F @pilote/kpilote-api test && pnpm -F @pilote/kpilote-webapp test && pnpm -F @pilote/kpilote-shared test`
Attendu : PASS. Signaler tout échec préexistant sans le corriger dans cette PR.

- [ ] **Step 3 : relecture du diff contre la spec**

`git diff feat/PIL-1776-sens-souhaite...HEAD` : vérifier chaque décision de la spec (1 à 8), la liste « Ce qui ne change pas » et les fichiers de descriptions cités.
