# Carte des indicateurs non à jour en trois états : plan d'implémentation (PIL-2046)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La carte des indicateurs non à jour (modes chantier et indicateur) distingue à jour (vert), non à jour (rouge) et donnée absente (gris).

**Architecture:** `GetTerritoiresNonAJourQuery` renvoie un `etat` par territoire, calculé par deux helpers purs placés à côté de `estNonAJour`. La date de dernière valeur vient du dernier jalon de `indicateur_territoire_jalon`. Le client se contente d'associer chaque `etat` à une entrée de légende, une couleur et un libellé.

**Tech Stack:** Next.js (pilote-ppg), tRPC, Prisma, Vitest (tests d'intégration sur base de test), Tailwind.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-11-25-carte-indicateurs-non-a-jour-trois-etats-design.md`

## Global Constraints

- Branche `feat/PIL-2046-carte-non-a-jour-trois-etats` créée depuis `dev` avant la tâche 1.
- Commits locaux seulement si Triko les autorise au lancement ; jamais de push. Format `feat(ppg): … (PIL-2046)`, en français.
- Textes, commentaires et messages en français ; noms métier en français, noms techniques en anglais ; pas de variable de 1 ou 2 caractères.
- Tests : `expect(result).toEqual([...])` plutôt que longueur + index ; pas de test client (aucun précédent dans `WidgetCartographieIndicateursNonAJour`).
- Albert inchangé : ne pas modifier `estNonAJour`, `NON_A_JOUR_WHERE`, `GetIndicateursNonAJourQuery`.
- `date_valeur_actuelle_mandat` n'est plus lu par `GetTerritoiresNonAJourQuery`.
- Couleurs : à jour `#27A658`, non à jour `#B34000`, donnée absente `#bababa`, non applicable `REMPLISSAGE_HACHURE`.
- Prettier uniquement sur les fichiers modifiés (`pnpm exec prettier --write <fichiers>`).

## Review Focus

1. Indicateur non applicable dans un territoire applicable (mode chantier) : il est ignoré ; avec un autre indicateur à jour, le territoire est `A_JOUR`. Test : tâche 1, territoire DEPT-22 du test chantier.
2. `est_a_jour` NULL alors qu'une valeur existe : `NON_A_JOUR`, pas `SANS_DONNEE`. Test : tâche 1, premier indicateur de DEPT-29 du test chantier.
3. Jalon présent sans `date_valeur_actuelle` : `SANS_DONNEE`. Test : tâche 1, DEPT-56 du test indicateur.
4. Plusieurs jalons et un `date_valeur_actuelle_mandat` différent : la date retenue est celle du jalon le plus élevé. Test : tâche 1, DEPT-29 du test indicateur.
5. Tableau avec plusieurs territoires sélectionnés aux états mélangés : tri rouge, gris, vert, non applicable ; l'entrée hachurée de la légende reste masquée si tout est applicable. Vérifié à l'œil : tâche 2, étape 7.

---

### Task 1: État de mise à jour par territoire côté serveur

**Files:**

- Modify: `apps/pilote-ppg/src/server/chantiers/infrastructure/queries/indicateurNonAJour.ts`
- Modify: `apps/pilote-ppg/src/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery.ts`
- Test: `apps/pilote-ppg/src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts`

**Interfaces:**

- Consumes: `fixtures.indicateurTerritoireJalon` (`src/test/fixtures.ts:394`), qui exige qu'une ligne `indicateur_territoire` de même `(id, territoire_code)` existe déjà (clé étrangère).
- Produces :
  - dans `indicateurNonAJour.ts` :
    - `export type EtatMiseAJour = "A_JOUR" | "NON_A_JOUR" | "SANS_DONNEE" | "NON_APPLICABLE";`
    - `export const etatMiseAJour = (ligne: { estApplicable: boolean | null; estAJour: boolean | null; dateDerniereValeur: Date | null }): EtatMiseAJour`
    - `export const etatTerritoireChantier = (territoire: { estApplicable: boolean; nbIndicateursNonAJour: number; nbIndicateursSansDonnee: number }): EtatMiseAJour`
  - dans `GetTerritoiresNonAJourQuery.ts` :
    - `TerritoireNonAJourChantierViewModel = { territoireCode: string; etat: EtatMiseAJour; nbIndicateursNonAJour: number; nbIndicateursSansDonnee: number }`
    - `TerritoireNonAJourIndicateurViewModel = { territoireCode: string; etat: EtatMiseAJour; dateDerniereValeur: string | null; miseAJourAttendueDepuis: string | null }`

- [ ] **Step 1: Créer la branche**

```bash
git switch -c feat/PIL-2046-carte-non-a-jour-trois-etats dev
```

- [ ] **Step 2: Réécrire les tests d'intégration**

Dans le fichier de test :

- ajouter la constante `MORBIHAN` (`DEPT-56`, insee `56`, zone `D56`, nom `Morbihan`) ;
- ajouter un helper local `seedDerniereValeur(indicateurId: string, territoire: TerritoireTest, dateValeurActuelle: Date | null, jalon = 2026)` qui appelle `fixtures.indicateurTerritoireJalon` avec `territoire_code`, `code_insee`, `maille`, `zone_id` du territoire (pas `territoire_nom`, absent du modèle jalon).

`byChantier`, test « déduit l'état de chaque territoire : non à jour, puis sans donnée, puis à jour » (remplace « compte les indicateurs non à jour par territoire »). Territoires FRANCE, FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR ; deux indicateurs :

| Territoire | indicateur                                                   | secondIndicateur                                 |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------ |
| DEPT-29    | applicable, `est_a_jour: null`, jalon 2026 daté `2026-01-01` | applicable, `est_a_jour: false`, aucun jalon     |
| DEPT-35    | applicable, `est_a_jour: true`, jalon daté `2026-07-01`      | applicable, `est_a_jour: false`, jalon sans date |
| NAT-FR     | applicable, à jour, jalon daté                               | applicable, à jour, jalon daté                   |
| DEPT-22    | applicable, à jour, jalon daté                               | `est_applicable: false`, `est_a_jour: false`     |

```ts
expect(sortByTerritoireCode(result)).toEqual([
  {
    territoireCode: "DEPT-22",
    etat: "A_JOUR",
    nbIndicateursNonAJour: 0,
    nbIndicateursSansDonnee: 0,
  },
  {
    territoireCode: "DEPT-29",
    etat: "NON_A_JOUR",
    nbIndicateursNonAJour: 1,
    nbIndicateursSansDonnee: 1,
  },
  {
    territoireCode: "DEPT-35",
    etat: "SANS_DONNEE",
    nbIndicateursNonAJour: 0,
    nbIndicateursSansDonnee: 1,
  },
  {
    territoireCode: "NAT-FR",
    etat: "A_JOUR",
    nbIndicateursNonAJour: 0,
    nbIndicateursSansDonnee: 0,
  },
]);
```

Tests `byChantier` existants, seeds inchangés sauf mention :

- « marque non applicable… » : `[{ territoireCode: "DEPT-29", etat: "NON_APPLICABLE", nbIndicateursNonAJour: 0, nbIndicateursSansDonnee: 0 }]`.
- « ignore les indicateurs supprimés et les autres chantiers » : ajouter `seedDerniereValeur(indicateur.id, FINISTERE, new Date("2026-07-01"))` pour l'indicateur publié ; attendu `[{ territoireCode: "DEPT-29", etat: "A_JOUR", nbIndicateursNonAJour: 0, nbIndicateursSansDonnee: 0 }]`.
- « ne renvoie rien pour un chantier non publié » : inchangé.

`byIndicateur`, test « renvoie l'état et les dates de chaque territoire ». Territoires FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR, MORBIHAN, FRANCE :

| Territoire | Ligne `indicateur_territoire`                                                                                                                 | Jalons                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| DEPT-29    | applicable, `est_a_jour: false`, `date_valeur_actuelle_mandat: 2024-01-01` (commentaire : déprécié, ignoré), `prochaine_date_maj: 2026-05-31` | 2025 → `2025-06-01`, 2026 → `2026-01-01` |
| DEPT-35    | applicable, `est_a_jour: true`, `prochaine_date_maj: 2026-11-30`                                                                              | 2026 → `2026-07-01`                      |
| DEPT-22    | applicable, `est_a_jour: null`                                                                                                                | aucun                                    |
| DEPT-56    | applicable, `est_a_jour: false`                                                                                                               | 2026 sans date                           |
| NAT-FR     | `est_applicable: null`, `est_a_jour: false`                                                                                                   | aucun                                    |

```ts
expect(sortByTerritoireCode(result)).toEqual([
  {
    territoireCode: "DEPT-22",
    etat: "SANS_DONNEE",
    dateDerniereValeur: null,
    miseAJourAttendueDepuis: null,
  },
  {
    territoireCode: "DEPT-29",
    etat: "NON_A_JOUR",
    dateDerniereValeur: "2026-01-01",
    miseAJourAttendueDepuis: "2026-05-31",
  },
  {
    territoireCode: "DEPT-35",
    etat: "A_JOUR",
    dateDerniereValeur: "2026-07-01",
    miseAJourAttendueDepuis: "2026-11-30",
  },
  {
    territoireCode: "DEPT-56",
    etat: "SANS_DONNEE",
    dateDerniereValeur: null,
    miseAJourAttendueDepuis: null,
  },
  {
    territoireCode: "NAT-FR",
    etat: "NON_APPLICABLE",
    dateDerniereValeur: null,
    miseAJourAttendueDepuis: null,
  },
]);
```

Test de parité avec l'assistant, renommé « les territoires non à jour ou sans donnée sont ceux que l'assistant liste comme non à jour » : ajouter un jalon daté à DEPT-29 (`est_a_jour: false`) et DEPT-35 (`est_a_jour: true`), rien pour DEPT-22 (`est_a_jour: null`). Filtrer la carte sur `["NON_A_JOUR", "SANS_DONNEE"].includes(territoire.etat)` ; assertions inchangées (`["DEPT-22", "DEPT-29"]`, égal aux codes de l'assistant).

- [ ] **Step 3: Vérifier que les tests échouent**

Run: `pnpm -F @pilote/ppg test:server:integration src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts`
Expected: FAIL, `etat` absent des résultats (le test « non publié » passe).

- [ ] **Step 4: Ajouter `EtatMiseAJour`, `etatMiseAJour` et `etatTerritoireChantier` dans `indicateurNonAJour.ts`**

`etatMiseAJour`, dans cet ordre : `estApplicable !== true` → `NON_APPLICABLE` ; `dateDerniereValeur === null` → `SANS_DONNEE` ; `estAJour === true` → `A_JOUR` ; sinon `NON_A_JOUR`.
`etatTerritoireChantier`, dans cet ordre : `!estApplicable` → `NON_APPLICABLE` ; `nbIndicateursNonAJour > 0` → `NON_A_JOUR` ; `nbIndicateursSansDonnee > 0` → `SANS_DONNEE` ; sinon `A_JOUR`.
Ne pas toucher `estNonAJour` ni `NON_A_JOUR_WHERE`.

- [ ] **Step 5: Adapter `GetTerritoiresNonAJourQuery`**

- Dans les deux `select`, retirer `date_valeur_actuelle_mandat` et ajouter `indicateur_territoire_jalon: { orderBy: { jalon: "desc" }, take: 1, select: { date_valeur_actuelle: true } }`. La date de dernière valeur est `ligne.indicateur_territoire_jalon.at(0)?.date_valeur_actuelle ?? null`.
- `byChantier` : accumuler par territoire `estApplicable` (vrai dès qu'une ligne n'est pas `NON_APPLICABLE`), `nbIndicateursNonAJour` (lignes `NON_A_JOUR`), `nbIndicateursSansDonnee` (lignes `SANS_DONNEE`), puis renvoyer `{ territoireCode, etat: etatTerritoireChantier(...), nbIndicateursNonAJour, nbIndicateursSansDonnee }`.
- `byIndicateur` : `etat: etatMiseAJour(...)`, `dateDerniereValeur` en `toISODate` de la date du dernier jalon, `miseAJourAttendueDepuis` inchangé.
- Retirer l'import de `estNonAJour` s'il n'est plus utilisé dans ce fichier.

- [ ] **Step 6: Vérifier que les tests passent**

Run: `pnpm -F @pilote/ppg test:server:integration src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 7: Vérifier les types**

Run: `pnpm -F @pilote/ppg lint:tsc`
Expected: erreurs uniquement dans `nonAJourDisplay.ts`, `useNonAJourMapData.tsx` et `TerritoiresNonAJourTable.tsx` (`estApplicable` / `estAJour` absents) ; elles sont corrigées par la tâche 2.

- [ ] **Step 8: Commit** (si autorisé)

```bash
git add apps/pilote-ppg/src/server/chantiers apps/pilote-ppg/docs/superpowers/specs/2026-11-25-carte-indicateurs-non-a-jour-trois-etats-design.md apps/pilote-ppg/docs/superpowers/plans/2026-11-25-carte-indicateurs-non-a-jour-trois-etats.md
git commit -m "feat(ppg): état de mise à jour par territoire, données absentes distinguées (PIL-2046)"
```

### Task 2: Carte, légende, tableau et infobulle en trois états

**Files:**

- Modify: `apps/pilote-ppg/src/client/constants/légendes/legendItemsIndicateursNonAJour.ts`
- Modify: `apps/pilote-ppg/src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/nonAJourDisplay.ts`
- Modify: `apps/pilote-ppg/src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/useNonAJourMapData.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/TerritoiresNonAJourTable.tsx`
- Modify: `apps/pilote-ppg/src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/WidgetCartographieIndicateursNonAJour.tsx`

**Interfaces:**

- Consumes: `EtatMiseAJour` (import de type depuis `@/server/chantiers/infrastructure/queries/indicateurNonAJour`) et les deux modèles de vue de la tâche 1.
- Produces: rien pour d'autres tâches.

- [ ] **Step 1: Légendes**

Typer les deux constantes `Record<EtatMiseAJour, CartographieÉlémentDeLégende>`, clés dans l'ordre `A_JOUR`, `NON_A_JOUR`, `SANS_DONNEE`, `NON_APPLICABLE` (ordre d'affichage de la légende). Libellés exacts :

| État                       | Chantier                                                | Indicateur                                   |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| `A_JOUR` (`#27A658`)       | Tous les indicateurs sont à jour                        | L'indicateur est à jour                      |
| `NON_A_JOUR` (`#B34000`)   | Un ou plusieurs indicateurs ne sont pas à jour          | Donnée existante, mais non à jour            |
| `SANS_DONNEE` (`#bababa`)  | Un ou plusieurs indicateurs sans donnée                 | Donnée absente                               |
| `NON_APPLICABLE` (hachure) | Territoire où le chantier prioritaire ne s'applique pas | Territoire où l'indicateur ne s'applique pas |

- [ ] **Step 2: `nonAJourDisplay.ts`**

- `getFill(territoire, mode)` : `getLegendItems(mode)[territoire.etat].remplissage`.
- `buildLegend` : masque `NON_APPLICABLE` quand aucun territoire n'a cet état (comportement actuel).
- Remplacer `isTerritoireNonAJour` par `compareTerritoires(left: TerritoireNonAJour, right: TerritoireNonAJour): number` : rang d'état (`NON_A_JOUR` 0, `SANS_DONNEE` 1, `A_JOUR` 2, `NON_APPLICABLE` 3), puis en mode chantier `nbIndicateursNonAJour` décroissant, puis `nbIndicateursSansDonnee` décroissant.
- Remplacer `formatNbIndicateursNonAJour` par `formatEtatChantier(territoire: TerritoireNonAJourChantierViewModel): string` : `NON_APPLICABLE` → « Non applicable », `A_JOUR` → « À jour », sinon parties non nulles jointes par `·` :
  - (2, 1) → « 2 indicateurs non à jour · 1 sans donnée »
  - (1, 0) → « 1 indicateur non à jour »
  - (0, 3) → « 3 indicateurs sans donnée »
  - (0, 1) → « 1 indicateur sans donnée »
- `formatEtatIndicateur` : `A_JOUR` « À jour », `NON_A_JOUR` « Non à jour », `SANS_DONNEE` « Donnée absente », `NON_APPLICABLE` « Non applicable ».
- `isChantierMode`, `formatDateDerniereValeur`, `formatMiseAJourAttendueDepuis` inchangés.

- [ ] **Step 3: Infobulle (`useNonAJourMapData.tsx`)**

Mode chantier : `formatEtatChantier` en gras. Mode indicateur : seul `NON_A_JOUR` affiche les trois lignes actuelles (état, dernière valeur, mise à jour attendue depuis) ; les autres états n'affichent que `formatEtatIndicateur` en gras.

- [ ] **Step 4: Tableau (`TerritoiresNonAJourTable.tsx`)**

- `grid-cols-3` dans les deux modes ; en-têtes chantier « Non à jour » / « Sans donnée », indicateur inchangés.
- Tri par `compareTerritoires`.
- Cellules chantier : `NON_APPLICABLE` → « Non applicable » sur deux colonnes ; `A_JOUR` → « À jour » sur deux colonnes ; sinon les deux nombres bruts.
- Cellules indicateur : `NON_APPLICABLE` → « Non applicable » sur deux colonnes ; sinon `formatDateDerniereValeur`, puis « À jour » (`A_JOUR`), `formatMiseAJourAttendueDepuis` en `text-dsfr-warning-425 font-bold` (`NON_A_JOUR`), ou `formatMiseAJourAttendueDepuis` sans style (`SANS_DONNEE`).

- [ ] **Step 5: Sous-titre (`WidgetCartographieIndicateursNonAJour.tsx`)**

`TitreWidget` du mode chantier : « Nombre d'indicateurs non à jour ou sans donnée ». Le reste est inchangé.

- [ ] **Step 6: Lint complet**

Run: `pnpm exec prettier --write <fichiers modifiés des tâches 1 et 2>` puis `pnpm -F @pilote/ppg lint`
Expected: oxlint, tsc et prettier sans erreur.

- [ ] **Step 7: Contrôle visuel**

Lancer la config `pilote-ppg` de `.claude/launch.json` (port 4978). Sur une page chantier, comparaison territoriale, onglet « Carte des indicateurs non à jour » : trois couleurs sur la carte, légende dans l'ordre à jour, non à jour, sans donnée, tableau à deux colonnes trié rouge, gris, vert, infobulle « N indicateurs non à jour · M sans donnée ». Dans le détail d'un indicateur, onglet « Carte de mise à jour de l'indicateur » : libellés du ticket, infobulle « Donnée absente », colonne « Mise à jour attendue depuis » sans gras orange pour une donnée absente. Capturer une image de chaque carte.

- [ ] **Step 8: Commit** (si autorisé)

```bash
git add apps/pilote-ppg/src/client
git commit -m "feat(ppg): carte des indicateurs non à jour en trois couleurs (PIL-2046)"
```
