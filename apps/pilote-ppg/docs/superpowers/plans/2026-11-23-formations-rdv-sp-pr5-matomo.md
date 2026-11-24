# Mesure d'usage de la slide-in des formations dans Matomo : plan d'implémentation (PR 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La slide-in des formations envoie à Matomo quatre événements (affichage, clic vers l'inscription, masquage, fermeture), rattachés à la période d'information et, pour le clic, à la formation.

**Architecture:** Le serveur renvoie les dates de la période avec la proposition. Côté client, le vocabulaire du socle analytics (`src/client/analytics/schema.ts`) gagne une catégorie, quatre noms et deux dimensions ; un module de la slide-in construit les événements, envoyés par `useAnalytics` depuis `useSlideInFormations` et `LigneFormation`.

**Tech Stack:** Next.js, tRPC, Prisma, React, Vitest (intégration serveur).

**Spec:** [2026-11-23-formations-matomo-design.md](../specs/2026-11-23-formations-matomo-design.md)

**Écart au design :** pas de hook dédié calqué sur `useAssistantTracking`. Les quatre événements sont construits dans un seul fichier, qui pose lui-même la catégorie `formations` ; `useSlideInFormations` les envoie avec `useAnalytics().trackEvent`. Un hook de plus n'aurait servi qu'à ajouter la catégorie.

## Global Constraints

- Toutes les commandes se lancent depuis `apps/pilote-ppg`.
- Commentaires, messages et textes en français ; identifiants : métier en français, technique en anglais.
- Pas de commit sans demande explicite de Tristan : les étapes « Commit » ne s'exécutent que sur sa demande.
- Prettier uniquement sur les fichiers modifiés : `pnpm exec prettier --write <fichiers>`.
- Tests : `expect(resultat).toEqual({...})` sur l'objet entier ; pas de variable d'un ou deux caractères ; pas de commentaire hors Given / When / Then.
- Pas de nouveau test client ni d'e2e (design).
- Catégorie `formations`. Noms `slide_in.view`, `slide_in.minimize`, `slide_in.close`, `inscription.click`. Actions `view`, `minimize`, `close`, `select`.
- Dimensions `periode_information` (valeur `AAAA-MM-JJ → AAAA-MM-JJ`, début → fin) et `formation` (nom complet du motif, `formation.nom`).
- Jamais d'envoi vers le vrai Matomo pendant la vérification locale.
- Next 16 refuse deux `next dev` dans le même dossier : arrêter tout serveur local de pilote-ppg avant d'en lancer un autre.

## Review Focus

- Assistant ouvert puis fermé pendant que la slide-in est affichée : un seul `slide_in.view` pour ce chargement de l'accueil (vérification manuelle, Task 3).
- Modales d'accueil encore ouvertes : aucun `slide_in.view` tant que la slide-in n'est pas visible (vérification manuelle, Task 3).
- Échap ou croix : un seul `slide_in.minimize` par geste (vérification manuelle, Task 3).
- Clic sur une autre date, après dépliage : `inscription.click` porte le nom de la formation de cette ligne (vérification manuelle, Task 3).
- Plusieurs périodes en cours : les dates envoyées sont celles de la période retenue, pas d'une autre (test d'intégration, Task 1).

---

### Task 1 : période et ses dates dans la proposition

**Files:**

- Modify: `src/server/formations/queries/GetFormationsAProposerQuery.ts`
- Modify: `src/client/components/PageAccueil/SlideInFormations/useSlideInFormations.ts` (`slideIn.periodeId` → `slideIn.periode.id`)
- Test: `src/server/formations/__tests__/queries/GetFormationsAProposerQuery.integration.test.ts`

**Interfaces:**

- Produces :
  - `export interface PeriodeProposee { id: string; dateDebut: string; dateFin: string }` (dates au format `AAAA-MM-JJ`)
  - `PropositionFormations` devient `{ periode: PeriodeProposee; formations: FormationProposee[] }` (plus de `periodeId`)

- [ ] **Step 1 : adapter les quatre assertions du test**

Dans les quatre `toEqual` qui portent `periodeId: X.id`, remplacer par :

```ts
periode: { id: X.id, dateDebut: "2026-11-01", dateFin: "2026-11-30" },
```

Dans « prend la période en cours la plus récemment créée, sans les périodes supprimées », donner à `plusRecente` une fin distincte, `date_fin: new Date("2026-12-15T00:00:00Z")`, et attendre :

```ts
periode: { id: plusRecente.id, dateDebut: "2026-11-01", dateFin: "2026-12-15" },
```

- [ ] **Step 2 : vérifier que le test échoue**

Run : `pnpm exec vitest run --project server-integration src/server/formations/__tests__/queries/GetFormationsAProposerQuery.integration.test.ts`
Expected : FAIL, l'objet reçu porte `periodeId` et pas `periode`.

- [ ] **Step 3 : renvoyer la période dans `GetFormationsAProposerQuery`**

`periodeEnCours(maintenant: Date): Promise<PeriodeProposee | null>` renvoie l'identifiant et les dates de la période retenue (`toISODate(periode.date_debut)`, `toISODate(periode.date_fin)`, déjà calculées pour `statutPeriode`). `run` utilise `periode.id` pour les motifs et la ligne d'état, et renvoie `{ periode, formations }`. Dans `useSlideInFormations`, `slideIn.periodeId` devient `slideIn.periode.id`.

- [ ] **Step 4 : vérifier que les tests passent**

Run : `pnpm exec vitest run --project server-integration src/server/formations`
Expected : PASS sur tout le module.

Run : `pnpm lint:tsc`
Expected : aucune erreur.

- [ ] **Step 5 : Commit (sur demande de Tristan)**

```bash
git add src/server/formations/queries/GetFormationsAProposerQuery.ts src/server/formations/__tests__/queries/GetFormationsAProposerQuery.integration.test.ts src/client/components/PageAccueil/SlideInFormations/useSlideInFormations.ts
git commit -m "feat(PIL-1923): dates de la période dans la proposition de formations"
```

### Task 2 : événements Matomo de la slide-in

**Files:**

- Modify: `src/client/analytics/schema.ts`
- Modify: `.env.example` (ligne `NEXT_PUBLIC_MATOMO_DIMENSIONS`)
- Create: `src/client/components/PageAccueil/SlideInFormations/slideInEvents.ts`
- Modify: `src/client/components/PageAccueil/SlideInFormations/useSlideInFormations.ts`
- Modify: `src/client/components/PageAccueil/SlideInFormations/SlideInFormations.tsx`
- Modify: `src/client/components/PageAccueil/SlideInFormations/LigneFormation.tsx`

**Interfaces:**

- Consumes : `PeriodeProposee`, `FormationProposee`, `PropositionFormations.periode` (Task 1) ; `useAnalytics().trackEvent(event: TrackedEvent)` et `TrackedEvent` de `@/client/analytics/useAnalytics`.
- Produces :
  - `libellePeriode(periode: PeriodeProposee): string`
  - `slideInEvent(action: "view" | "minimize" | "close", periode: PeriodeProposee): TrackedEvent`
  - `inscriptionEvent(periode: PeriodeProposee, formation: FormationProposee): TrackedEvent`
  - `useSlideInFormations` renvoie en plus `trackInscription: (formation: FormationProposee) => void`
  - `LigneFormation` prend en plus `onInscription: () => void`

- [ ] **Step 1 : vocabulaire et dimensions dans `schema.ts`**

- `ANALYTICS_CATEGORIES` : ajouter `"formations"`.
- `ANALYTICS_EVENT_NAMES` : ajouter `"slide_in.view"`, `"slide_in.minimize"`, `"slide_in.close"`, `"inscription.click"`.
- `AnalyticsDimensions` : ajouter `periode_information?: string` et `formation?: string`.
- `ANALYTICS_DIMENSIONS` : ajouter `"periode_information"` et `"formation"`, avant `"environnement"`.

Dans `.env.example`, ajouter `"periode_information":10,"formation":11` au JSON de `NEXT_PUBLIC_MATOMO_DIMENSIONS`.

- [ ] **Step 2 : construire les événements dans `slideInEvents.ts`**

- `libellePeriode` renvoie `` `${periode.dateDebut} → ${periode.dateFin}` ``.
- `slideInEvent(action, periode)` : catégorie `formations`, action `action`, nom `` `slide_in.${action}` ``, dimensions `{ periode_information: libellePeriode(periode) }`.
- `inscriptionEvent(periode, formation)` : catégorie `formations`, action `select`, nom `inscription.click`, dimensions `{ periode_information: libellePeriode(periode), formation: formation.nom }`.

- [ ] **Step 3 : envoyer les événements depuis `useSlideInFormations`**

- `const { trackEvent } = useAnalytics();`
- Effet de présentation : la garde devient `if (!visible || slideIn === null || presentee.current) return;` ; après `enregistrer("PRESENTATION")`, envoyer `slideInEvent("view", slideIn.periode)`. Le ref `presentee` garantit un seul envoi par chargement de l'accueil.
- `masquer` envoie `slideInEvent("minimize", slideIn.periode)` (si `slideIn` n'est pas `null`) avant `setMasquee(true)`.
- `fermer` envoie `slideInEvent("close", slideIn.periode)` (si `slideIn` n'est pas `null`).
- `trackInscription(formation)` envoie `inscriptionEvent(slideIn.periode, formation)` (si `slideIn` n'est pas `null`) ; l'ajouter au type de retour du hook.

- [ ] **Step 4 : brancher le clic dans `SlideInFormations` et `LigneFormation`**

- `SlideInFormations` : `<LigneFormation formation={formation} key={formation.id} onInscription={() => trackInscription(formation)} />`.
- `LigneFormation` : prop `onInscription: () => void`, posée en `onClick` sur le lien « S'inscrire » ; la passer à `AutresSeances`, qui la pose en `onClick` sur chaque `TextLink` des autres dates (`TextLink` transmet les props d'un `<a>`).

- [ ] **Step 5 : vérifier**

Run : `pnpm exec prettier --write src/client/analytics/schema.ts src/client/components/PageAccueil/SlideInFormations/slideInEvents.ts src/client/components/PageAccueil/SlideInFormations/useSlideInFormations.ts src/client/components/PageAccueil/SlideInFormations/SlideInFormations.tsx src/client/components/PageAccueil/SlideInFormations/LigneFormation.tsx`, puis `pnpm lint`
Expected : oxlint, tsc et prettier sans erreur.

Run : `pnpm exec vitest run --project client src/client/analytics src/client/components/PageAccueil/SlideInFormations`
Expected : PASS (socle et formatage des séances inchangés).

- [ ] **Step 6 : Commit (sur demande de Tristan)**

```bash
git add .env.example src/client/analytics/schema.ts src/client/components/PageAccueil/SlideInFormations
git commit -m "feat(PIL-1923): événements Matomo de la slide-in des formations"
```

### Task 3 : vérification dans le navigateur et suivi

**Files:**

- Modify (temporaire, retiré à la fin) : `/Users/tristanconti/Documents/pilote-2/.claude/launch.json`
- Modify: `docs/superpowers/plans/2026-11-18-formations-rdv-sp-suivi-pr.md`

**Interfaces:**

- Consumes : tout ce qui précède.

- [ ] **Step 1 : tests et lint complets**

Run : `pnpm test:unit`, puis `pnpm exec vitest run --project server-integration src/server/formations`, puis `pnpm lint`
Expected : PASS et aucune erreur.

- [ ] **Step 2 : serveur e2e avec un Matomo factice**

Prérequis (après un redémarrage) : proxy portless sur 443 (`pnpm exec portless proxy start`, sudo, à faire par Tristan) et conteneurs Docker `pilote_postgres_e2e` démarrés ; aucun autre `next dev` de pilote-ppg ne tourne. Lancer `pnpm test:e2e:seed`.

Ajouter dans `launch.json` une entrée temporaire `pilote-ppg-e2e-matomo`, copie de `pilote-ppg-e2e` dont `runtimeArgs` commence par `NEXT_PUBLIC_RECORD_ANALYTICS=true`, `NEXT_PUBLIC_MATOMO_URL=https://matomo.invalid`, `NEXT_PUBLIC_MATOMO_SITE_ID=1`, `NEXT_PUBLIC_MATOMO_DIMENSIONS={}`. La lancer avec `preview_start`.
Expected : la console du navigateur affiche `[analytics] actif — https://matomo.invalid (site 1)`. Sinon, le lanceur d'env a écrasé les variables : s'arrêter et en parler à Tristan.

- [ ] **Step 3 : contrôler chaque événement**

Se connecter avec `formations.slide.in@example.com` (compte du seed e2e, profil `CABINET_MTFP`), puis lire les requêtes vers `matomo.invalid/matomo.php` (`read_network_requests`, filtre `matomo.php`). Sans emplacements, les dimensions partent en suffixe de `e_n`, triées par clé.

| Geste                                                                                                   | Attendu (`e_c`, `e_a`, `e_n` décodé)                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Arrivée sur l'accueil                                                                                   | `formations`, `view`, `slide_in.view?periode_information=<début> → <fin>&profil_pilote=CABINET_MTFP`, une seule fois                 |
| Ouvrir puis fermer l'assistant (si la pastille est proposée à ce profil)                                | aucun nouveau `slide_in.view`                                                                                                        |
| Clic sur « S'inscrire »                                                                                 | `formations`, `select`, `inscription.click?formation=CAMPUS PILOTE : Formation e2e&periode_information=…&profil_pilote=CABINET_MTFP` |
| Clic sur une autre date (ajouter une seconde séance au motif `900001` si besoin, et la retirer ensuite) | même `inscription.click`, même formation                                                                                             |
| Croix                                                                                                   | un seul `formations`, `minimize`, `slide_in.minimize?periode_information=…`                                                          |
| Rechargement, focus dans la slide-in, Échap                                                             | un seul `slide_in.minimize`                                                                                                          |
| Rechargement, « Ne plus me les proposer »                                                               | `formations`, `close`, `slide_in.close?periode_information=…`                                                                        |

Après la fermeture, relancer `pnpm test:e2e:seed` pour rendre la base e2e propre.

- [ ] **Step 4 : nettoyer**

Arrêter le serveur (`preview_stop`) et retirer l'entrée `pilote-ppg-e2e-matomo` de `launch.json`.

- [ ] **Step 5 : mettre à jour le suivi**

Dans le suivi, PR 5 : statut « En cours » pendant le travail puis, une fois la PR ouverte à la demande de Tristan, « En relecture » avec son lien.

- [ ] **Step 6 : Commit (sur demande de Tristan)**

```bash
git add docs/superpowers/specs/2026-11-23-formations-matomo-design.md docs/superpowers/plans/2026-11-23-formations-rdv-sp-pr5-matomo.md docs/superpowers/plans/2026-11-18-formations-rdv-sp-suivi-pr.md
git commit -m "docs(PIL-1923): design et plan de la mesure d'usage des formations"
```
