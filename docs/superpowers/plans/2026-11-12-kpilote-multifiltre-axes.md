# kpilote — multifiltre : axes et modalités — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Une tâche = une sous-tâche Jira = une PR**, partie de `origin/dev`.

**Goal :** permettre de découper un indicateur selon des axes définis par l'utilisateur (Opérateur, Type de fraude…), en plus du territoire, sans rien changer pour les indicateurs existants.

**Architecture :** les référentiels, individus et la hiérarchie territoriale ne bougent pas. On ajoute un référentiel d'axes (`axe`, `niveau_axe`, `modalite`), la déclaration des axes d'un indicateur (`indicateur_axe`, `indicateur_niveau_axe`) et une combinaison de modalités sur les valeurs uniquement (`combinaison`, `combinaison_modalite`, `valeur_avancement.combinaison_id`). Le calcul de la marginale suit le chemin 1 : axes d'abord, territoire ensuite.

**Spec :** `docs/superpowers/specs/2026-11-12-kpilote-multifiltre-axes-design.md` — **à lire avant toute tâche** (vocabulaire, décisions D1–D13, différences avec le POC, conventions).

**POC de référence :** branche `claude/individu-dimension-poc-f01d87` (PR DITP-pilotage/pilote-2#2636, ne pas merger). Lire un fichier : `git show origin/claude/individu-dimension-poc-f01d87:<chemin>`.

**Jira :** story PIL-1963 (epic PIL-1804). Le commentaire « Point à arbitrer n°1 » de PIL-1963 détaille l'ordre d'agrégation.

## Global Constraints

- Chaque PR part en prod telle quelle, **sans feature flag**. Tant qu'aucun indicateur n'a d'axe, aucun comportement existant ne change.
- Toute migration fonctionne avec le code de la version précédente (`prisma migrate deploy` tourne au build, avant le nouveau code).
- Chaque PR fait tourner le snapshot des lectures (Task 0) : **0 différence réelle**. Seuls des champs peuvent s'ajouter.
- Objectifs, commentaires et niveaux de confiance ne sont **jamais** modifiés par ce plan.
- Vocabulaire : axe, modalité, niveau, combinaison, cellule, marginale. Jamais « dimension » (collision avec les dimensions Matomo de l'admin et le POC), ni « maille », ni « membre ».
- Conventions du projet : spec §10.
- Titre de PR : `… (PIL-XXXX)`.

## Definition of Done commune (s'applique à toutes les tâches)

- [ ] `pnpm lint`, typecheck et tests passent sur les paquets touchés (kpilote-api, kpilote-webapp, kpilote-admin, kpilote-shared).
- [ ] Snapshot des lectures : 0 différence réelle sur le seed (sauf champs ajoutés annoncés dans la tâche).
- [ ] Tests de non-régression des écritures (Task 0) verts.
- [ ] Migrations appliquées par `prisma migrate deploy` ; `prisma generate --sql` passe.
- [ ] Spec OpenAPI et descriptions de routes à jour pour toute route ajoutée ou élargie.
- [ ] Changement visible (admin, webapp) : parcours vérifié dans le navigateur, capture dans la PR.
- [ ] Le ticket Jira est cité dans le titre de la PR.

## Suivi

Le tableau ci-dessous suit l'avancement : statut par tâche, et cases cochées dans chaque tâche une fois sa PR mergée. Les écarts au plan décidés en cours de route sont consignés dans la tâche concernée (« Écarts validés »).

## Séquence

```
T0 ──► T1.1 ──► T1.2 ──► T1.3
         │        └────► T2.1 ──► T2.2 ──► T2.3
         └──► T3.1 ──► T3.2 ──► T3.3
                         └──► T4.1 ──► T5.1 ──► T5.2 ──► T5.3
                                                  │        └──► T7.1 ──► T7.2 ──► T8.1
                                                  └──► T6.1 ──► T6.2 ──► T6.3 ──┘
```

| Tâche | Ticket   | Titre                                                  | Statut          |
| ----- | -------- | ------------------------------------------------------ | --------------- |
| T0    | PIL-1979 | Snapshot des lectures et non-régression des écritures  | ✅ fait (#2674) |
| —     | PIL-1980 | ~~Feature flag~~ : abandonné (D12), ticket à supprimer | abandonné       |
| T1.1  | PIL-1981 | Migration : axes, niveaux et modalités                 | ✅ fait (#2675) |
| T1.2  | PIL-1982 | API : CRUD des axes, niveaux et modalités              | 🔄 en cours     |
| T1.3  | PIL-1983 | Admin : pages Axes                                     | 🔄 en cours     |
| T2.1  | PIL-1984 | Migration : axes d'un indicateur                       | à faire         |
| T2.2  | PIL-1985 | API : déclarer les axes d'un indicateur                | à faire         |
| T2.3  | PIL-1986 | Admin : section Axes d'un indicateur                   | à faire         |
| T3.1  | PIL-1987 | Migration : combinaisons de modalités sur les valeurs  | à faire         |
| T3.2  | PIL-1988 | Upserts de valeurs sur la nouvelle clé unique          | à faire         |
| T3.3  | PIL-1989 | Suppression de l'ancien index unique des valeurs       | à faire         |
| T4.1  | PIL-1993 | Lectures de valeurs : paramètre combinaison optionnel  | à faire         |
| T5.1  | PIL-1990 | Calcul de la marginale sur les axes (fonctions pures)  | à faire         |
| T5.2  | PIL-1991 | Lectures : marginale et sélection de modalités         | à faire         |
| T5.3  | PIL-1992 | Comparaison et carte pour une modalité                 | à faire         |
| T6.1  | PIL-1994 | Saisie de valeurs avec modalités                       | à faire         |
| T6.2  | PIL-1995 | Import Albert : colonnes d'axe                         | à faire         |
| T6.3  | PIL-1996 | Webapp : import avec colonnes d'axe                    | à faire         |
| T7.1  | PIL-1997 | Fiche indicateur : un sélecteur par axe                | à faire         |
| T7.2  | PIL-1998 | Graphique « Décomposer par »                           | à faire         |
| T8.1  | PIL-1999 | Mise en service des axes                               | à faire         |

---

### T0 — Snapshot des lectures et non-régression des écritures (PIL-1979)

**Objectif :** un filet de sécurité avant de toucher au code. Il sert à toutes les PR suivantes.

> ✅ **Fait** (#2674). Point §9.1 tranché : les tests sont des tests de non-régression des écritures, sans référence à pilote-ppg. Usage du snapshot : section « Snapshot des lectures » du README de kpilote-api.

**Fichiers :**

- Create `apps/kpilote-api/scripts/snapshotLecture.ts` (depuis `scripts/poc-dimensions/snapshotLecture.ts` du POC).
- Modify `apps/kpilote-api/src/valeurAvancement/routes.test.ts`, `apps/kpilote-api/src/indicateur/routes.test.ts`.
- Doc d'usage : en-tête du script, et une ligne dans le README de kpilote-api.

**Étapes :**

- [x] Adapter le script du POC à `dev` : monter les routes de lecture réelles in-process (`valeurAvancement`, `indicateur`, `objectifIndicateurIndividu`, `individu`, `referentiel`, `relation`, `collection`), dans une transaction annulée, avec un utilisateur dédié qui a READ partout. Modes `capture <fichier.json>` et `compare <fichier.json>`.
- [x] Garder la classification des écarts du POC : identique / champs ajoutés seulement / listes globales avec entités ajoutées / même contenu dans un autre ordre (requêtes sans `ORDER BY`) / différence réelle.
- [x] Tests de non-régression de `PUT /indicateurs/{id}/valeurs:batch` au format `{ items: [{ individu, date, valeur }] }` : compteurs créées/mises à jour exacts sur deux envois successifs ; individu inconnu → code HTTP et corps d'erreur exacts.
- [x] Tests de non-régression de `PUT /indicateurs/{id}` avec `referentiels: [{ id, fonctionAgregation }]` : remplacement complet des référentiels, valeurs conservées.
- [x] Écrire ces tests **contre le code actuel**, sans le modifier.

**DoD :**

- [x] `tsx scripts/snapshotLecture.ts capture` puis `compare` sur `dev` donne 0 différence.
- [x] Les nouveaux tests passent sur `dev` sans aucune modification du code applicatif.
- [x] Usage documenté.

---

### T1.1 — Migration : axes, niveaux et modalités (PIL-1981)

**Objectif :** créer le référentiel des axes, sans toucher aux tables existantes.

> ✅ **Fait** (#2675). Écarts validés : `created_at`/`updated_at` aussi sur `niveau_axe` et `modalite` ; clés étrangères vers le niveau et le parent en `NO ACTION` (la suppression d'un axe cascade) ; publicId de modalité unique tous axes confondus ; ordre des niveaux à partir de 1. Le snapshot n'existait pas encore à cette PR (seules des tables neuves, non lues).

**Fichiers :** Modify `apps/kpilote-api/prisma/schema.prisma` ; Create migration `<ts>_axes_modalites` ; Modify `apps/kpilote-api/src/test/fixtures.ts` ; Modify `apps/kpilote-api/prisma/seed.ts` (+ `prisma/seedData/axes.ts`).

**Étapes :**

- [x] Modèles `Axe` (`axe` : id uuid, `public_id` unique `AXE-…`, nom, description, timestamps), `NiveauAxe` (`niveau_axe` : axe, nom, ordre ; UNIQUE(axe, ordre)), `Modalite` (`modalite` : id, `public_id` unique, axe, niveau, nom, `parent_id` nullable vers `modalite`).
- [x] Regex des publicIds : vérifier `packages/kpilote-shared/src/publicIds.ts` et y ajouter les préfixes si nécessaire.
- [x] Migration écrite pour `migrate deploy`, sans toucher aux tables existantes.
- [x] Fixtures `fixtures.axe(...)`, `fixtures.niveauAxe(...)`, `fixtures.modalite(...)` (variadiques, upsert, valeurs par défaut codées en dur).
- [x] Seed de démo : AXE-OPERATEUR (plat), AXE-FRAUDE (Famille → Type), cf. exemple spec §4.

**DoD :**

- [x] Commune.
- [x] `git diff` de la migration : seulement des `CREATE TABLE` / index / clés étrangères sur les nouvelles tables.

---

### T1.2 — API : CRUD des axes, niveaux et modalités (PIL-1982)

**Objectif :** gérer les axes par l'API.

> **Écarts validés (2026-11-12) :**
>
> - Lectures ouvertes à tout utilisateur authentifié (la fiche indicateur en aura besoin, T7.1) ; écritures réservées aux clés API ADMIN.
> - Le niveau d'une modalité se déduit de son parent : pas de champ niveau dans l'API, l'erreur « niveau incohérent » n'existe pas.
> - Le parent est fixé à la création : pas de déplacement, on supprime puis on recrée (409 `CHANGEMENT_PARENT_INTERDIT`).
> - Niveaux d'un axe identifiés par leur position dans `PUT /axes/{id}` ; raccourcir la liste supprime les derniers (409 `NIVEAU_PORTE_MODALITES` s'ils portent des modalités).
> - Pas de suppression d'axe en v1.
> - Le refus de supprimer une modalité utilisée par des valeurs passe dans T3.1 (PIL-1987).

**Fichiers :** Create `apps/kpilote-api/src/axe/{routes.ts,utils.ts,commands/*,queries/*}` (+ tests) ; Modify `apps/kpilote-api/tsconfig.json` (`@/axe/*`), `apps/kpilote-api/src/app.ts` ; Create `packages/kpilote-shared/src/axe.ts` (+ entrée `./axe` dans `package.json`).

**Étapes :**

- [ ] Schémas partagés : `AxeApiModel` (avec niveaux), `ModaliteApiModel` (avec `parent`), payloads d'écriture.
- [ ] Routes : `GET /axes`, `GET /axes/{id}`, `PUT /axes/{id}` (axe + niveaux), gestion des modalités (`GET` sous `/axes/{id}/modalites`, `PUT/DELETE` sous `/axes/{id}/modalites/{modaliteId}`). Lectures : tout utilisateur authentifié ; écritures : clés API ADMIN.
- [ ] Contrôles : parent d'une modalité du même axe ; niveau déduit du parent (premier niveau sans parent) ; parent fixé à la création ; suppression d'une modalité qui a des enfants refusée ; suppression d'un niveau qui porte des modalités refusée.
- [ ] Inspiration : `apps/kpilote-api/src/dimension/{routes,commands/upsertDimension,queries/*}.ts` du POC.
- [ ] Descriptions OpenAPI.

**DoD :**

- [ ] Commune.
- [ ] Tests de routes sur chaque erreur métier.
- [ ] `/openapi.json` liste `/axes`.

---

### T1.3 — Admin : pages Axes (PIL-1983)

**Objectif :** gérer les axes depuis la console d'administration.

**Fichiers :** Create `apps/kpilote-admin/src/api/axes.ts`, `apps/kpilote-admin/src/queries/axes.ts`, `apps/kpilote-admin/src/components/AxeForm.tsx`, `apps/kpilote-admin/src/routes/_authed/axes/{index,nouveau,$id}.tsx` ; Modify `apps/kpilote-admin/src/server/api/router.ts` (`axes` dans `SAFE_PATH`, + test), `apps/kpilote-admin/src/routes/_authed/fonctionnalites.tsx` (carte « Gérer les axes »).

**Étapes :**

- [ ] Liste, création, édition d'un axe ; gestion de ses niveaux (ordre).
- [ ] Arbre des modalités : ajout (sous un parent), renommage, suppression. Pas de déplacement ; publicId saisi à la main.
- [ ] Inspiration : `DimensionForm.tsx`, `routes/_authed/dimensions/*` du POC.

**DoD :**

- [ ] Commune.
- [ ] Les pages existantes de l'admin sont inchangées.
- [ ] Parcours vérifié dans le navigateur (création d'un axe imbriqué à 2 niveaux).

---

### T2.1 — Migration : axes d'un indicateur (PIL-1984)

**Objectif :** stocker quels axes découpent un indicateur et comment calculer « Tous ».

**Fichiers :** Modify `apps/kpilote-api/prisma/schema.prisma` ; migration `<ts>_indicateur_axes` ; fixtures.

**Étapes :**

- [ ] `IndicateurAxe` (`indicateur_axe` : indicateur, axe, `ordre` = ordre de déclaration, `fonction_marginale` de type `FonctionAgregation`) ; PK(indicateur, axe), UNIQUE(indicateur, ordre).
- [ ] `IndicateurNiveauAxe` (`indicateur_niveau_axe` : indicateur, niveau d'axe, `fonction_agregation`) ; PK(indicateur, niveau).
- [ ] Fixtures `fixtures.indicateurAxe(...)`.

**DoD :**

- [ ] Commune.
- [ ] Rien ne lit encore ces tables.

---

### T2.2 — API : déclarer les axes d'un indicateur (PIL-1985)

**Objectif :** attacher des axes à un indicateur sans modifier `PUT /indicateurs`.

**Fichiers :** Modify `apps/kpilote-api/src/indicateur/routes.ts`, `queries/getIndicateurByPublicId.ts`, `queries/listIndicateurs.ts` ; Create `apps/kpilote-api/src/indicateur/commands/upsertIndicateurAxes.ts` (+ test) ; Modify `packages/kpilote-shared/src/indicateur.ts`.

**Étapes :**

- [ ] Champ `axes: []` ajouté aux lectures d'indicateur (axe, ordre, fonction de la marginale, fonction par niveau). Vide pour tous les indicateurs existants.
- [ ] `PUT /indicateurs/{id}/axes` : remplace la déclaration complète. Permission : celle qui permet aujourd'hui de modifier la structure d'un indicateur (cf. `resolveIndicateurForWrite.ts`).
- [ ] Ajout ou retrait d'un axe refusé (409) si l'indicateur a des valeurs ; changement de fonction autorisé.
- [ ] `PUT /indicateurs` : aucun changement.

**DoD :**

- [ ] Commune ; snapshot : seul le champ `axes` s'ajoute aux réponses d'indicateur.
- [ ] Tests de la route, dont le refus 409.

---

### T2.3 — Admin : section Axes d'un indicateur (PIL-1986)

**Objectif :** déclarer les axes d'un indicateur depuis l'admin.

**Fichiers :** Create `apps/kpilote-admin/src/components/indicateurs/AdminAxes.tsx` ; Modify `IndicateurForm.tsx`, `indicateurFormSchema.ts`, `apps/kpilote-admin/src/api/indicateurs.ts`, `routes/_authed/indicateurs/$id.tsx`.

**Étapes :**

- [ ] Section « Axes » : choisir les axes, leur ordre de déclaration, la fonction de la marginale (libellé « Calcul de « Tous » »), la fonction de chaque niveau.
- [ ] Enregistrement via `PUT /indicateurs/{id}/axes`, séparé de la sauvegarde de l'indicateur.
- [ ] Message clair sur le refus 409.
- [ ] Inspiration : `AdminDimensions.tsx`, `dimensionsIndicateur.ts` du POC (sans l'ordre réglable « Ordre 0, 1… » ni `porteObjectifs`).

**DoD :**

- [ ] Commune.
- [ ] Un indicateur sans axe s'édite comme avant (référentiels et valeurs conservés).

---

### T3.1 — Migration : combinaisons de modalités sur les valeurs (PIL-1987)

**Objectif :** préparer `valeur_avancement` à porter une combinaison, sans changer les valeurs existantes.

**Fichiers :** Modify `apps/kpilote-api/prisma/schema.prisma` ; migration `<ts>_combinaisons` ; Create `apps/kpilote-api/src/axe/combinaison.ts` (constante de la combinaison vide, calcul de `cle`).

**Étapes :**

- [ ] `Combinaison` (`combinaison` : id uuid, `cle` UNIQUE = uuids des modalités triés joints par `,`).
- [ ] `CombinaisonModalite` (`combinaison_modalite` : combinaison, axe, modalité ; PK(combinaison, axe) ; clés étrangères vers `combinaison`, `axe`, `modalite`).
- [ ] Insérer la ligne « combinaison vide » avec un uuid fixe, `cle = ''`.
- [ ] `valeur_avancement.combinaison_id UUID NOT NULL DEFAULT '<uuid vide>'` + clé étrangère. La valeur par défaut est constante : ajout instantané, l'ancien code continue d'écrire sans la connaître.
- [ ] Nouvel index unique `(indicateur_id, individu_id, combinaison_id, date)` **en plus** de `valeur_avancement_unique`.
- [ ] Ne pas toucher à `objectif_indicateur_individu` ni à `indicateur_individu_commentaire` (D5).
- [ ] `DELETE /axes/{id}/modalites/{modaliteId}` : refuser (409) la suppression d'une modalité utilisée par une combinaison (reporté depuis T1.2).

**DoD :**

- [ ] Commune.
- [ ] La suite de tests passe **sans modifier le code applicatif** (preuve que l'ancien code est compatible).

---

### T3.2 — Upserts de valeurs sur la nouvelle clé unique (PIL-1988)

**Objectif :** écrire les valeurs sur `(indicateur, individu, combinaison, date)`.

**Fichiers :** Modify `apps/kpilote-api/prisma/sql/upsertValeursAvancementBatch.sql`, `apps/kpilote-api/src/valeurAvancement/commands/{upsertValeurAvancement,upsertValeursAvancementBatch,deleteValeurAvancement}.ts`, `apps/kpilote-api/src/test/fixtures.ts`, `prisma/schema.prisma` (nom de la nouvelle contrainte composite).

**Étapes :**

- [ ] `ON CONFLICT (indicateur_id, individu_id, combinaison_id, date)` dans le SQL batch ; colonne `combinaison_id` passée explicitement.
- [ ] Upsert unitaire et suppression sur la nouvelle clé composite.
- [ ] Toutes les écritures actuelles visent la combinaison vide.

**DoD :**

- [ ] Commune ; non-régression des écritures identique (compteurs, erreurs).

---

### T3.3 — Suppression de l'ancien index unique des valeurs (PIL-1989)

**Objectif :** retirer `valeur_avancement_unique (indicateur, individu, date)`, qui empêcherait plusieurs combinaisons pour un même individu.

**Fichiers :** migration `<ts>_drop_valeur_avancement_unique` ; `prisma/schema.prisma`.

**Étapes :**

- [ ] Livrer **une version après** T3.2 (plus aucun code en prod ne s'appuie sur l'ancienne contrainte).
- [ ] Vérifier qu'aucun `ON CONFLICT` ni clé Prisma ne la référence.

**DoD :**

- [ ] Commune.
- [ ] `grep valeur_avancement_unique` ne trouve plus que la nouvelle contrainte (si elle reprend ce nom) ou rien.

---

### T4.1 — Lectures de valeurs : paramètre combinaison optionnel (PIL-1993)

**Objectif :** préparer les fonctions de lecture à recevoir une combinaison, sans changer aucun comportement. Refactor pur.

**Fichiers :** Modify `apps/kpilote-api/prisma/sql/getValeursTronqueesPourIndividus.sql` (filtre `combinaison_id`), `src/valeurAvancement/queries/{loadResolveSerieContext,listValeursForIndicateur,listDernieresValeursForIndividu,listValeursRemarquablesForIndicateur,listSyntheseIndividus,computeTauxProgressionPoints}.ts`, `src/valeurAvancement/resolveSerieIndividu.ts`, et les lectures de valeurs des collections (`src/collection/queries/*`).

**Étapes :**

- [ ] Introduire le type `Cellule = { individuId, combinaisonId }` côté API.
- [ ] Les lectures acceptent une combinaison optionnelle, **vide par défaut**, et filtrent dessus.
- [ ] Les clés de mémoïsation et de batch passent de l'individu à la cellule ; avec la combinaison vide, la clé reste l'id de l'individu.
- [ ] `getDernieresValeursPourIndividus.sql` est du code mort (cf. POC) : le supprimer si c'est toujours le cas.
- [ ] Aucun contrat d'API modifié.

**DoD :**

- [ ] Commune ; snapshot : 0 différence, aucun champ ajouté.

---

### T5.1 — Calcul de la marginale sur les axes, fonctions pures (PIL-1990)

**Objectif :** le calcul de « Tous » et des modalités parentes, testé, non branché.

**Règle (D8, chemin 1) :** axes d'abord au grain territorial le plus fin, puis remontée territoriale existante ; entre axes, ordre de déclaration. Détail : spec §5.

**Fichiers :** Create `apps/kpilote-api/src/axe/calculMarginale.ts` (+ `calculMarginale.test.ts`).

**Étapes :**

- [ ] Entrées : topologie des axes de l'indicateur (niveaux, modalités, fonctions par niveau, fonction de la marginale, ordre), topologie territoriale (enfants, fonction par référentiel, niveaux saisis NONE), combinaisons observées par individu (support).
- [ ] Sortie : pour une cellule cible (individu + combinaison partielle), le graphe de résolution consommable par `resolveSerieIndividu` (même format : `enfantsParParent`, fonction par nœud), comme le fait `buildGrapheCube.ts` du POC.
- [ ] Cube creux : seules les modalités observées au moins une fois pour l'individu sont attendues.
- [ ] Niveau territorial saisi (NONE) : la marginale se calcule à ce niveau.
- [ ] Profondeur d'axe libre.

**DoD :**

- [ ] Commune.
- [ ] Tests unitaires : exemple PACA de la spec §5 (résultat **3**) ; moyenne sur les deux ; axe imbriqué à 3 niveaux ; modalité absente ; deux axes (ordre de déclaration) ; niveau territorial saisi.
- [ ] Aucun branchement sur les routes.

---

### T5.2 — Lectures : marginale et sélection de modalités (PIL-1991)

**Objectif :** brancher T5.1 pour les indicateurs à axes.

**Fichiers :** Modify `src/valeurAvancement/queries/loadResolveSerieContext.ts` (aiguillage : indicateur sans axe → chemin actuel ; avec axes → graphe de T5.1), `src/valeurAvancement/routes.ts`, `src/valeurAvancement/utils.ts`, `packages/kpilote-shared/src/valeurAvancement.ts` ; seed de démo (IND à axes, inspiré de IND-101 / IND-102 du POC).

**Étapes :**

- [ ] Figer le format de `modalites=` (proposition : publicIds séparés par des virgules, au plus un par axe) et le documenter dans l'OpenAPI.
- [ ] Indicateur à axes, sans `modalites` : la lecture d'un individu renvoie la marginale. Le taux de progression (marginale / objectif de l'individu) et les tableaux de bord fonctionnent donc sans modification.
- [ ] Avec `modalites` : cellule complète ou partielle, modalité parente comprise.
- [ ] Contributions et couverture dans les réponses.
- [ ] Erreurs : modalité inconnue, axe non déclaré sur l'indicateur, deux modalités du même axe.

**DoD :**

- [ ] Commune ; snapshot : 0 différence sur les indicateurs existants.
- [ ] Tests : marginale, modalité feuille, modalité parente, taux de progression d'un indicateur à axes.

---

### T5.3 — Comparaison et carte pour une modalité (PIL-1992)

**Objectif :** comparer les territoires pour une modalité donnée (ex. tous les départements, opérateur Orange).

**Fichiers :** Modify `src/valeurAvancement/queries/{listValeursRemarquablesForIndicateur,listSyntheseIndividus}.ts`, `src/valeurAvancement/routes.ts` ; données de carte côté widget si elles passent par l'API (`src/widget/*`).

**Étapes :**

- [ ] `valeurs-remarquables` et `synthese-individus` acceptent `modalites=` : la population est « individus du référentiel × modalité(s) fixée(s) ».
- [ ] Sans `modalites` : réponse identique à aujourd'hui.
- [ ] Inspiration : paramètre `fixe=` du POC.

**DoD :**

- [ ] Commune.
- [ ] Tests sur une tranche où la modalité est absente de certains territoires.

---

### T6.1 — Saisie de valeurs avec modalités (PIL-1994)

**Objectif :** saisir, modifier, supprimer une valeur précisée par des modalités, à l'unité et en lot.

**Fichiers :** Modify `src/valeurAvancement/commands/*`, `src/valeurAvancement/routes.ts`, `src/indicateur/resolveIndicateurAndIndividuForWriteData.ts` ; Create `src/axe/resoudreCombinaison.ts` (trouve ou crée la combinaison par sa `cle`, de façon idempotente) ; Modify `packages/kpilote-shared/src/valeurAvancement.ts`.

**Étapes :**

- [ ] Champ optionnel `modalites` (publicIds) dans `PUT /indicateurs/{id}/valeurs`, `DELETE` et `valeurs:batch`.
- [ ] Indicateur à axes : une modalité feuille par axe déclaré, obligatoire.
- [ ] Erreurs : `MODALITE_MANQUANTE`, `MODALITE_INCONNUE`, `AXE_NON_DECLARE`, modalité non feuille, doublon dans un lot. En lot : erreur par item, comme aujourd'hui.
- [ ] Création concurrente d'une même combinaison : `INSERT … ON CONFLICT (cle) DO NOTHING` puis relecture.
- [ ] Indicateur sans axe : format historique inchangé ; `modalites` fourni → `AXE_NON_DECLARE`.
- [ ] Inspiration : `erreurCellule.ts`, `celluleEcriture.ts` du POC.

**DoD :**

- [ ] Commune ; non-régression des écritures identique.
- [ ] Tests sur chaque erreur, à l'unité et en lot.

---

### T6.2 — Import Albert : colonnes d'axe (PIL-1995)

**Objectif :** normaliser un fichier qui contient, en plus de l'individu, une colonne par axe (ex. `territoire;operateur;date;valeur`).

**Fichiers :** Modify `apps/kpilote-api/src/valeurImport/{appliquerPlan.ts,calls/decouvrirStructure.ts,calls/resoudreIndividus.ts,commands/normaliserValeursImport.ts}` ; Create `src/valeurImport/choisirColonnesAxes.ts`, `src/valeurImport/queries/listAxesForIndicateur.ts` ; Modify `packages/kpilote-shared/src/valeurImport.ts`.

**Étapes :**

- [ ] Le plan porte une colonne par axe, résolue contre les modalités **de cet axe** uniquement (« Orange » commune ≠ « Orange » opérateur).
- [ ] Layouts long et pivot (dates en colonnes).
- [ ] Lignes partielles ou non résolues écartées avec un avertissement.
- [ ] Proposé **uniquement** pour un indicateur à axes : le prompt et le plan des indicateurs sans axe ne changent pas.
- [ ] Items normalisés : `{ individu, modalites, date, valeur }`.
- [ ] Inspiration : `choisirDimensionsColonnes.ts` et les modifications du POC dans `valeurImport/`.

**DoD :**

- [ ] Commune.
- [ ] Tests avec Albert mocké : long et pivot, deux colonnes d'identité.
- [ ] Evals mono rejouées sans régression.

---

### T6.3 — Webapp : import avec colonnes d'axe (PIL-1996)

**Objectif :** importer depuis la webapp un fichier à axes, jusqu'à l'écriture.

**Fichiers :** Modify `apps/kpilote-webapp/src/components/import-valeurs/{ImportFormatValide,ImportPreviewTable,ImportValeursModal,NormalisationReviewView,deriverEtatImport,traduireErreursBatch,useImportValeurs}.tsx?`, `lecture/matriceVersRows.ts`, `apps/kpilote-webapp/src/api/valeursImport.ts`.

**Étapes :**

- [ ] Format standard avec une colonne par axe, pour un indicateur à axes seulement.
- [ ] Prévisualisation et revue avec les colonnes d'axe.
- [ ] Traduction des nouvelles erreurs avec le **nom** de l'axe (pas son publicId).
- [ ] Aide de la modale à jour (mentionne les colonnes d'axe).
- [ ] Inspiration : modifications du POC dans `components/import-valeurs/`.

**DoD :**

- [ ] Commune.
- [ ] Indicateur sans axe : modale identique.
- [ ] Import d'un fichier à axes vérifié dans le navigateur jusqu'à l'écriture.

---

### T7.1 — Fiche indicateur : un sélecteur par axe (PIL-1997)

**Objectif :** filtrer une fiche indicateur par modalité, axe par axe.

**Fichiers :** Modify `apps/kpilote-webapp/src/routes/_authenticated/indicateurs/$id.tsx` (searchSchema : `modalites`), `components/indicateurs/{IndicateurResultatsTab,IndicateurSynthesePanel,IndicateurWidgets}.tsx`, `components/widgets/{CarteFranceWidget.tsx,carteFranceData.ts}`, `queries/indicateurs.ts`, `api/indicateurs.ts` ; Create `apps/kpilote-webapp/src/lib/axes/selection.ts` (+ test), `components/indicateurs/ModaliteSelect.tsx`.

**Étapes :**

- [ ] Un sélecteur par axe déclaré, avec ses niveaux imbriqués et « Tous ». Réutiliser le comportement de `IndividuSelect` si possible.
- [ ] Paramètre d'URL `modalites` ; les liens historiques `?individu=…&referentiel=…` restent valides et valent « Tous » sur chaque axe.
- [ ] Synthèse, comparaison et carte sur la modalité choisie (T5.3).
- [ ] Légendes : « Ensemble » / « tous opérateurs confondus ».
- [ ] Inspiration : `lib/individus/cellule.ts` et la fiche du POC (sans « Territoire = Tous »).

**DoD :**

- [ ] Commune.
- [ ] Indicateur sans axe : fiche identique, mêmes requêtes réseau (capture avant/après).
- [ ] Parcours vérifié dans le navigateur sur un indicateur à axes.

---

### T7.2 — Graphique « Décomposer par » (PIL-1998)

**Objectif :** voir l'évolution décomposée par modalité d'un axe.

**Fichiers :** Create `apps/kpilote-webapp/src/components/indicateurs/IndicateurValeursDecomposeesChart.tsx`, `lib/axes/decomposition.ts` (+ test) ; Modify `IndicateurResultatsTab.tsx`, `MonthlySeries.ts`.

**Étapes :**

- [ ] Choix de l'axe à décomposer ; une série par modalité enfant du niveau courant.
- [ ] Légende limitée aux modalités présentes pour la sélection (défaut constaté dans le POC).
- [ ] Figer avec T5.2 la façon de récupérer plusieurs séries (une requête par modalité ou paramètre dédié).
- [ ] Inspiration : `IndicateurValeursDecomposeesChart.tsx`, `lib/individus/decomposition.ts` du POC.

**DoD :**

- [ ] Commune.
- [ ] Indicateur sans axe : graphique identique.
- [ ] Parcours vérifié dans le navigateur.

---

### T8.1 — Mise en service des axes (PIL-1999)

**Objectif :** rendre le multifiltre utilisable en prod.

**Étapes :**

- [ ] Créer le premier indicateur à axes (carto-sp ? données dans le commit local `2f9ea9d21` du POC, `prisma/seedData/cartoSp/carto-sp-territoire-operateurs.csv.gz`).
- [ ] Axe dans les événements analytics (`packages/kpilote-shared/src/analytics/`).
- [ ] Relecture des libellés (admin, webapp, erreurs).
- [ ] Prévenir l'équipe.

**DoD :**

- [ ] Parcours complet en prod : déclaration des axes, import, fiche, décomposition.
