# Formations RDV-SP, PR 4 : slide-in sur l'accueil, plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** présenter sur l'accueil, pendant une période d'information, les formations Campus PILOTE du profil de l'utilisateur dans une slide-in (variante D), avec « Plus tard » et « Ne plus me les proposer ».

**Architecture :** une fonction pure du domaine décide de la présentation à partir de la ligne d'état. Une requête du module `formations` choisit la période, filtre motifs et séances et applique cette fonction ; un handler écrit la ligne d'état (présentation, report, fermeture). Le routeur tRPC `formation` les expose à tout utilisateur connecté. Côté client, un hook charge la requête et pilote l'affichage, un composant rend la variante D, et `BasePageAccueilLayout` le place après les trois modales.

**Tech Stack :** Next.js (pages), tRPC, Prisma 7, PostgreSQL, zod 4, React 18, Tailwind (jetons DSFR), Vitest, Playwright.

**Spec :** [2026-11-23-formations-slide-in-design.md](../specs/2026-11-23-formations-slide-in-design.md)

**Où travailler :** checkout principal, branche `feat/PIL-1923-formations-slide-in` (partie de `dev`). Toutes les commandes se lancent depuis `apps/pilote-ppg`, et tous les chemins sont relatifs à ce dossier.

## Global Constraints

- Messages d'erreur, textes affichés, commentaires et commits en français. Nommage : métier en français, technique en anglais (`GetSlideInFormationsQuery`, `RecordSlideInActionHandler`, `doitPresenterSlideIn`).
- **Pas de commit sans demande explicite de Tristan.** Chaque étape « Commit » donne le message ; on ne l'exécute que si Tristan a autorisé les commits pour cette exécution. Format : `feat(PIL-1923): description`.
- Prettier seulement sur les fichiers modifiés : `pnpm exec prettier --write <fichiers>`.
- Aucune migration : la table `formation_periode_information_utilisateur` a déjà les colonnes `date_presentation`, `date_report`, `date_fermeture`.
- Base de test : `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate deploy` si `dev` a apporté des migrations, jamais de reset. Un échec est préexistant et sans lien avec cette PR : `MinistèreSQLRepository` « Accède à un ministère ».
- Base `pilote_demo` (`.env`) : ne jamais y lancer `migrate deploy`.
- Tests : `expect(resultat).toEqual(...)` sur l'objet complet ; seuls commentaires autorisés : Given/When/Then et ceux qui expliquent une donnée de test ; pas de variable d'un ou deux caractères. Côté client, seulement des tests unitaires de fonctions pures (précédent : `src/client/utils/date/date.unit.test.ts`), pas de test de composant.
- Délai de report : 7 jours, comptés depuis le dernier report. Mention de places : 5 places restantes ou moins.
- Textes fixés par la spec : « CAMPUS PILOTE », « N formations pour votre profil » (« 1 formation pour votre profil »), « Inscription sur Rendez-vous Service Public. », « S'inscrire », « Plus tard », « Ne plus me les proposer », « Plus que N places ».
- Heures affichées dans le fuseau du navigateur, comme le reste de l'application (`formaterDate`) : un utilisateur des DROM voit l'heure locale de la séance. La spec disait « heure de Paris » ; corrigé dans la Task 7.

## Review Focus

1. **Deux périodes en cours** (enregistrements simultanés, sans verrou) : la plus récemment créée gagne, une période supprimée plus récente est ignorée. Test dans la Task 2.
2. **Report il y a 7 jours tout juste** : la slide-in revient (borne incluse). Test dans la Task 1.
3. **Séance déjà commencée mais pas finie** : elle n'est plus proposée. Test dans la Task 2.
4. **Utilisateur sans profil dans sa session** : rien n'est proposé, sans erreur. Test dans la Task 2.
5. **Action sur une période inconnue** (identifiant forgé ou période purgée) : erreur 400 avec un message, jamais une 500 de clé étrangère. Test dans la Task 3.

---

### Task 1 : décision de présentation et nom affiché

**Files :**

- Create : `src/server/formations/domain/presentationSlideIn.ts`
- Test : `src/server/formations/__tests__/domain/presentationSlideIn.unit.test.ts`

**Interfaces :**

- Produces :
  - `export const DELAI_REPORT_JOURS = 7;`
  - `export type EtatSlideIn = { dateReport: Date | null; dateFermeture: Date | null };`
  - `export function doitPresenterSlideIn(etat: EtatSlideIn | null, maintenant: Date): boolean`
  - `export function nomAffiche(nom: string): string`

- [ ] **Step 1 : écrire les tests qui échouent**

```ts
const maintenant = new Date("2026-11-23T10:00:00Z");

describe("doitPresenterSlideIn", () => {
  it("présente la slide-in jamais présentée", () => {
    expect(doitPresenterSlideIn(null, maintenant)).toBe(true);
  });

  it("présente à nouveau la slide-in présentée sans action", () => {
    expect(
      doitPresenterSlideIn(
        { dateReport: null, dateFermeture: null },
        maintenant,
      ),
    ).toBe(true);
  });

  it("ne présente plus la slide-in fermée, même reportée il y a longtemps", () => {
    expect(
      doitPresenterSlideIn(
        {
          dateReport: new Date("2026-10-01T10:00:00Z"),
          dateFermeture: new Date("2026-11-22T10:00:00Z"),
        },
        maintenant,
      ),
    ).toBe(false);
  });

  it("ne présente pas la slide-in reportée il y a moins de 7 jours", () => {
    expect(
      doitPresenterSlideIn(
        { dateReport: new Date("2026-11-16T10:00:01Z"), dateFermeture: null },
        maintenant,
      ),
    ).toBe(false);
  });

  it("présente la slide-in reportée il y a 7 jours tout juste", () => {
    expect(
      doitPresenterSlideIn(
        { dateReport: new Date("2026-11-16T10:00:00Z"), dateFermeture: null },
        maintenant,
      ),
    ).toBe(true);
  });
});

describe("nomAffiche", () => {
  it.each([
    ["CAMPUS PILOTE : Introduction à l'outil", "Introduction à l'outil"],
    [
      "CAP sur PILOTE : Devenir un coordinateur efficace",
      "Devenir un coordinateur efficace",
    ],
    ["Atelier : budget : niveau 2", "budget : niveau 2"],
    ["Formation sans préfixe", "Formation sans préfixe"],
    ["Préfixe seul :", "Préfixe seul :"],
  ])("affiche « %s » comme « %s »", (nom, attendu) => {
    expect(nomAffiche(nom)).toBe(attendu);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `pnpm exec vitest run --project server-unit src/server/formations/__tests__/domain/presentationSlideIn.unit.test.ts`
Expected : FAIL, module `presentationSlideIn` introuvable.

- [ ] **Step 3 : implémenter `doitPresenterSlideIn` et `nomAffiche` dans `src/server/formations/domain/presentationSlideIn.ts`**

`doitPresenterSlideIn` : `true` sans état ; `false` si `dateFermeture` ; `false` si `dateReport` date de moins de `DELAI_REPORT_JOURS` jours (comparaison en millisecondes) ; `true` sinon. `nomAffiche` : la partie après le premier `:`, sans espaces autour ; le nom entier s'il n'y a pas de `:` ou si cette partie est vide.

- [ ] **Step 4 : vérifier qu'ils passent**

Run : la commande du Step 2.
Expected : PASS (10 tests).

- [ ] **Step 5 : commit**

```bash
git add src/server/formations/domain/presentationSlideIn.ts src/server/formations/__tests__/domain/presentationSlideIn.unit.test.ts
git commit -m "feat(PIL-1923): règle de présentation de la slide-in des formations"
```

---

### Task 2 : requête des formations à proposer

**Files :**

- Create : `src/server/formations/queries/GetSlideInFormationsQuery.ts`
- Modify : `src/server/formations/module.ts` (cradle et `register`, clé `getSlideInFormationsQuery`)
- Test : `src/server/formations/__tests__/queries/GetSlideInFormationsQuery.integration.test.ts`

**Interfaces :**

- Consumes : `doitPresenterSlideIn`, `nomAffiche` (Task 1) ; `statutPeriode` (`domain/periodeInformation.ts`) ; `statutSeance` (`domain/statutSeance.ts`, paramètre `dateAnnulation` = `cancelled_at`) ; `toISODate` (`@/server/app/domain/Dates`).
- Produces :

```ts
export interface SeanceProposee {
  id: number;
  dateDebut: string; // ISO
  dureeMinutes: number;
  placesRestantes: number | null; // nombre_places_max - nombre_inscrits, null sans maximum
  urlInscription: string;
}
export interface FormationProposee {
  id: number;
  nom: string; // nomAffiche(motif.nom)
  seances: SeanceProposee[]; // triées par date, au moins une
}
export interface PropositionFormations {
  periodeId: string;
  formations: FormationProposee[]; // triées par date de leur première séance, au moins une
}

class GetSlideInFormationsQuery {
  run(params: {
    utilisateurId: string;
    profilCode: string | null;
    maintenant: Date;
  }): Promise<PropositionFormations | null>;
}
```

- [ ] **Step 1 : écrire les tests qui échouent**

Données communes : `maintenant = new Date("2026-11-23T10:00:00Z")` ; utilisateur `fixtures.utilisateur({ profilCode: "COORDINATEUR_REGION" })` ; période en cours `fixtures.formationPeriodeInformation({ date_debut: new Date("2026-11-01T00:00:00Z"), date_fin: new Date("2026-11-30T00:00:00Z"), motifIds })` ; association motif ↔ profil par `prisma.formation_motif_profil.create`. Un helper local du fichier de test peut créer « motif associé au profil » pour alléger.

Tests (`describe("GetSlideInFormationsQuery")`, chacun dans `createIntegrationTest`) :

1. `"propose les formations du profil avec leurs séances ouvertes, triées par date"` : motif A « CAMPUS PILOTE : Introduction à l'outil » avec deux séances, `2026-12-03T09:00:00Z` (sans maximum) et `2026-11-26T13:00:00Z` (`nombre_places_max: 20`, `nombre_inscrits: 16`) ; motif B « CAMPUS PILOTE : Maîtriser l'Assistant IA », séance `2026-11-24T13:00:00Z` (45 min). Attendu :

```ts
expect(resultat).toEqual({
  periodeId: periode.id,
  formations: [
    {
      id: Number(motifB.id),
      nom: "Maîtriser l'Assistant IA",
      seances: [
        {
          id: Number(seanceB.id),
          dateDebut: "2026-11-24T13:00:00.000Z",
          dureeMinutes: 45,
          placesRestantes: null,
          urlInscription: seanceB.url_inscription,
        },
      ],
    },
    {
      id: Number(motifA.id),
      nom: "Introduction à l'outil",
      seances: [
        {
          id: Number(seanceA1.id),
          dateDebut: "2026-11-26T13:00:00.000Z",
          dureeMinutes: 45,
          placesRestantes: 4,
          urlInscription: seanceA1.url_inscription,
        },
        {
          id: Number(seanceA2.id),
          dateDebut: "2026-12-03T09:00:00.000Z",
          dureeMinutes: 45,
          placesRestantes: null,
          urlInscription: seanceA2.url_inscription,
        },
      ],
    },
  ],
});
```

2. `"écarte les séances commencées, annulées ou complètes, et les formations sans séance ouverte"` : motif A avec une séance commencée (`2026-11-23T09:30:00Z`), une annulée (`cancelled_at` renseigné), une complète (`nombre_places_max: 10`, `nombre_inscrits: 10`) et une ouverte ; motif B avec une seule séance annulée. Attendu : seul A, avec la seule séance ouverte.
3. `"ne propose pas les formations d'un autre profil ni celles retirées de RDV-SP"` : motif associé à `DITP_ADMIN` seulement, motif associé au profil mais `deleted_at` renseigné, tous deux avec une séance ouverte. Attendu : `null`.
4. `"prend la période en cours la plus récemment créée, sans les périodes supprimées"` : période en cours P1 (`created_at` `2026-11-01T08:00:00Z`, motif M1), période en cours P2 (`created_at` `2026-11-10T08:00:00Z`, motif M2), période en cours supprimée P3 (`created_at` `2026-11-20T08:00:00Z`, `deleted_at` renseigné, motif M3), tous les motifs associés au profil avec une séance ouverte. Attendu : `periodeId` de P2, formations `[M2]`.
5. `"ne propose rien sans période en cours"` : une période passée et une à venir, avec motifs et séances. Attendu : `null`.
6. `"ne propose rien à un utilisateur sans profil"` : données du test 1, `profilCode: null`. Attendu : `null`.
7. `"ne propose rien quand la slide-in est fermée ou reportée il y a moins de 7 jours"` (`it.each` sur deux lignes d'état : `date_fermeture` `2026-11-20T10:00:00Z` ; `date_report` `2026-11-20T10:00:00Z`) : données du test 1 et une ligne `formation_periode_information_utilisateur` pour l'utilisateur et la période. Attendu : `null`.

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `pnpm exec vitest run --project server-integration src/server/formations/__tests__/queries/GetSlideInFormationsQuery.integration.test.ts`
Expected : FAIL, module `GetSlideInFormationsQuery` introuvable.

- [ ] **Step 3 : implémenter `GetSlideInFormationsQuery.run` et l'enregistrer dans `module.ts`**

Dans l'ordre, en sortant `null` dès qu'il n'y a plus rien : profil absent ; périodes non supprimées triées par `created_at` décroissant, première dont `statutPeriode` vaut `EN_COURS` pour `toISODate(maintenant)` ; motifs `deleted_at: null` liés à la période (`periodes: { some }`) et au profil (`profils: { some }`), avec leurs séances `date_debut > maintenant` triées par date puis id, filtrées sur `statutSeance(...) === "OUVERTE"` ; motifs sans séance écartés ; ligne d'état lue par la clé (`utilisateur_id`, `periode_id`) et passée à `doitPresenterSlideIn`. Tri final des formations par `dateDebut` de leur première séance, puis par nom.

- [ ] **Step 4 : vérifier qu'ils passent**

Run : la commande du Step 2, puis `pnpm lint:tsc`.
Expected : PASS (8 tests), aucune erreur de type.

- [ ] **Step 5 : commit**

```bash
git add src/server/formations/queries/GetSlideInFormationsQuery.ts src/server/formations/module.ts src/server/formations/__tests__/queries/GetSlideInFormationsQuery.integration.test.ts
git commit -m "feat(PIL-1923): formations à proposer dans la slide-in"
```

---

### Task 3 : écriture de l'état et routeur tRPC

**Files :**

- Create : `src/server/formations/handlers/RecordSlideInActionHandler.ts`
- Modify : `src/server/formations/module.ts` (clé `recordSlideInActionHandler`)
- Modify : `src/server/formations/infrastructure/trpc/formation.ts`
- Test : `src/server/formations/__tests__/handlers/RecordSlideInActionHandler.integration.test.ts`

**Interfaces :**

- Consumes : `GetSlideInFormationsQuery` (Task 2).
- Produces :

```ts
export const recordSlideInActionCommandSchema = z.object({
  periodeId: z.uuid(),
  action: z.enum(["PRESENTATION", "REPORT", "FERMETURE"]),
});
export type RecordSlideInActionCommand = z.infer<
  typeof recordSlideInActionCommandSchema
>;

class RecordSlideInActionHandler {
  execute(
    params: RecordSlideInActionCommand & {
      utilisateurId: string;
      maintenant: Date;
    },
  ): Promise<void>;
}
```

Routeur `formation` :

- `slideIn` : `protectedProcedure.query`, sans `checkAdminPermission`, renvoie `PropositionFormations | null` ; `utilisateurId: ctx.session.user.id`, `profilCode: ctx.session.profil ?? null`, `maintenant: new Date()`.
- `recordSlideInAction` : `protectedProcedure.input(recordSlideInActionCommandSchema.and(zodValidateurCSRF)).mutation`, `checkCsrf(ctx.csrfDuCookie, input.csrf)`, sans `checkAdminPermission` ; l'utilisateur vient de `ctx.session.user.id`, jamais de l'entrée.

La spec prévoyait trois mutations ; une seule avec `action` suffit, la validation et le contrôle CSRF restent au même endroit.

- [ ] **Step 1 : écrire les tests qui échouent**

Données : utilisateur `fixtures.utilisateur()`, période `fixtures.formationPeriodeInformation()`, instants `t1 = 2026-11-20T10:00:00Z`, `t2 = 2026-11-21T10:00:00Z`, `t3 = 2026-11-22T10:00:00Z`. Lecture : `prisma.formation_periode_information_utilisateur.findMany({ select: { utilisateur_id, periode_id, date_presentation, date_report, date_fermeture } })`.

1. `"enregistre la première présentation sans l'écraser ensuite"` : PRESENTATION à t1 puis t2. Attendu : `[{ ..., date_presentation: t1, date_report: null, date_fermeture: null }]`.
2. `"enregistre un report, puis le remplace au report suivant"` : PRESENTATION t1, REPORT t2, REPORT t3. Attendu : `date_presentation: t1, date_report: t3, date_fermeture: null`.
3. `"enregistre la fermeture"` : PRESENTATION t1, FERMETURE t2. Attendu : `date_presentation: t1, date_report: null, date_fermeture: t2`.
4. `"crée la ligne au report quand la présentation n'a pas été enregistrée"` : REPORT t1 seul. Attendu : `date_presentation: t1, date_report: t1, date_fermeture: null`.
5. `"refuse une période inconnue"` : `periodeId` = `randomUUID()`. Attendu : `rejects.toThrow("Cette période d'information n'existe pas.")` et aucune ligne.

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `pnpm exec vitest run --project server-integration src/server/formations/__tests__/handlers/RecordSlideInActionHandler.integration.test.ts`
Expected : FAIL, module `RecordSlideInActionHandler` introuvable.

- [ ] **Step 3 : implémenter le handler, l'enregistrer dans `module.ts`, ajouter les deux procédures au routeur**

Période cherchée par `findUnique` (même supprimée : un report sur une période qu'un admin vient de supprimer reste inoffensif) ; absente, `BadRequestError("Cette période d'information n'existe pas.")`. Puis un `upsert` sur la clé composée : à la création, `date_presentation: maintenant` plus la colonne de l'action ; à la mise à jour, seulement la colonne de l'action (rien pour PRESENTATION).

- [ ] **Step 4 : vérifier qu'ils passent**

Run : la commande du Step 2, puis `pnpm exec vitest run --project server-integration src/server/formations && pnpm lint:tsc`.
Expected : PASS, aucune régression dans le module, aucune erreur de type.

- [ ] **Step 5 : commit**

```bash
git add src/server/formations/handlers/RecordSlideInActionHandler.ts src/server/formations/module.ts src/server/formations/infrastructure/trpc/formation.ts src/server/formations/__tests__/handlers/RecordSlideInActionHandler.integration.test.ts
git commit -m "feat(PIL-1923): état de la slide-in des formations et routeur tRPC"
```

---

### Task 4 : formatage des séances

**Files :**

- Create : `src/client/components/PageAccueil/SlideInFormations/formaterSeance.ts`
- Test : `src/client/components/PageAccueil/SlideInFormations/formaterSeance.unit.test.ts`

**Interfaces :**

- Produces :
  - `export function formaterDebutSeance(dateDebut: string, timeZone?: string): string` (fuseau du navigateur par défaut)
  - `export function formaterDuree(dureeMinutes: number): string`
  - `export function formaterPlacesRestantes(placesRestantes: number | null): string | null`

- [ ] **Step 1 : écrire les tests qui échouent**

```ts
describe("formaterDebutSeance", () => {
  it.each([
    ["2026-11-24T13:00:00Z", "Europe/Paris", "Mar. 24 nov., 14 h"],
    ["2026-12-01T09:30:00Z", "Europe/Paris", "Mar. 1er déc., 10 h 30"],
    ["2026-11-24T13:00:00Z", "Indian/Reunion", "Mar. 24 nov., 17 h"],
  ])("formate %s dans le fuseau %s", (dateDebut, timeZone, attendu) => {
    expect(formaterDebutSeance(dateDebut, timeZone)).toBe(attendu);
  });
});

describe("formaterDuree", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [90, "1 h 30"],
    [125, "2 h 05"],
  ])("formate %i minutes en « %s »", (dureeMinutes, attendu) => {
    expect(formaterDuree(dureeMinutes)).toBe(attendu);
  });
});

describe("formaterPlacesRestantes", () => {
  it.each([
    [null, null],
    [6, null],
    [5, "Plus que 5 places"],
    [1, "Plus qu'une place"],
  ])("formate %s places restantes", (placesRestantes, attendu) => {
    expect(formaterPlacesRestantes(placesRestantes)).toBe(attendu);
  });
});
```

- [ ] **Step 2 : vérifier qu'ils échouent**

Run : `pnpm exec vitest run --project client src/client/components/PageAccueil/SlideInFormations/formaterSeance.unit.test.ts`
Expected : FAIL, module `formaterSeance` introuvable.

- [ ] **Step 3 : implémenter les trois fonctions**

`formaterDebutSeance` : `Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone })` puis `formatToParts`, assemblé en `${Jour} ${quantième} ${mois}, ${heure} h[ ${minutes}]` : jour avec majuscule initiale, « 1er » pour le premier du mois, minutes omises si `00`. `formaterDuree` : « N min » sous une heure, sinon « H h » suivi des minutes sur deux chiffres si non nulles. `formaterPlacesRestantes` : `null` si `null` ou plus de 5 (constante `SEUIL_PLACES_RESTANTES = 5`).

- [ ] **Step 4 : vérifier qu'ils passent**

Run : la commande du Step 2.
Expected : PASS (11 tests).

- [ ] **Step 5 : commit**

```bash
git add src/client/components/PageAccueil/SlideInFormations/formaterSeance.ts src/client/components/PageAccueil/SlideInFormations/formaterSeance.unit.test.ts
git commit -m "feat(PIL-1923): formatage des séances de la slide-in"
```

---

### Task 5 : slide-in sur l'accueil

**Files :**

- Create : `src/client/components/PageAccueil/SlideInFormations/useSlideInFormations.ts`
- Create : `src/client/components/PageAccueil/SlideInFormations/SlideInFormations.tsx`
- Modify : `src/client/components/PageAccueil/BasePageAccueilLayout.tsx` (après `ModaleInscriptionInfolettre`)

**Interfaces :**

- Consumes : `api.formation.slideIn`, `api.formation.recordSlideInAction` (Task 3) ; types `PropositionFormations`, `FormationProposee` (Task 2) ; `formaterDebutSeance`, `formaterDuree`, `formaterPlacesRestantes` (Task 4) ; `useAlbertConversation` (`@/components/_commons/ChatUI/AlbertConversationProvider`) ; `récupérerUnCookie("csrf")` (`@/client/utils/cookies`).
- Produces :
  - `export function useSlideInFormations({ peutAfficher }: { peutAfficher: boolean }): { slideIn: PropositionFormations | null; visible: boolean; reporter: () => void; fermer: () => void }`
  - `export const SlideInFormations: FunctionComponent<{ peutAfficher: boolean; pastilleAssistantVisible: boolean }>`

- [ ] **Step 1 : écrire `useSlideInFormations`**

- Assistant ouvert : `conversation !== null && display !== "minimized"`.
- `visible = slideIn !== null && peutAfficher && !assistantOuvert && !masquee` (`masquee` : état local, passé à `true` par `reporter` et `fermer`).
- Au premier passage de `visible` à `true` (drapeau dans un `useRef`), mutation `PRESENTATION`, une seule fois par montage.
- `reporter` et `fermer` masquent d'abord, puis envoient `REPORT` ou `FERMETURE` ; au succès, `utils.formation.slideIn.invalidate()`. Pas de toast en cas d'échec : l'erreur est déjà journalisée côté serveur par le routeur tRPC.

- [ ] **Step 2 : écrire `SlideInFormations`**

Contenu et textes : variante D (spec, section Client). Points qui ne se devinent pas :

- `section` avec `aria-labelledby` vers le titre, non modale, sans prise de focus ; `onKeyDown` : Échap appelle `reporter`.
- Croix : `aria-label="Plus tard"`, appelle `reporter`.
- Une ligne par formation : nom ; ligne calendrier `${formaterDebutSeance(premiere.dateDebut)} · ${formaterDuree(premiere.dureeMinutes)}` ; mention de places si `formaterPlacesRestantes` ne renvoie pas `null` (couleur `#b34000`, jeton DSFR « warning ») ; lien « S'inscrire » vers `premiere.urlInscription`.
- Autres séances repliées derrière un bouton `aria-expanded` : « 1 autre date » / « N autres dates », « Masquer les N autres dates » une fois dépliées (« Masquer l'autre date » pour une seule) ; chacune en lien avec sa date, sa durée et sa mention de places.
- Tous les liens vers RDV-SP : `target="_blank"`, `rel="noopener"`, `title` « … (nouvelle fenêtre) » ; aucun appel de mutation au clic.
- Position : `fixed z-[1755]` ; sous `md`, `inset-x-0 bottom-0`, pleine largeur, cibles de 44 px ; à partir de `md`, `right-6`, largeur 400 px, `bottom-[88px]` si `pastilleAssistantVisible` (pastille `bottom-6`, haute de 48 px), `bottom-6` sinon ; hauteur bornée à la fenêtre, la liste défile.

- [ ] **Step 3 : brancher dans `BasePageAccueilLayout`**

```tsx
<SlideInFormations
  pastilleAssistantVisible={accesAlbert.peutUtiliser}
  peutAfficher={
    !isModaleVideoAccueilOpen &&
    !isModaleRenseignerServiceOpen &&
    !isModaleInfolettreOpen
  }
/>
```

- [ ] **Step 4 : vérifier dans l'application**

Run : `pnpm lint:tsc`, puis lancer `pilote-ppg` (`.claude/launch.json`, base `pilote_demo` et son seed de formations) et ouvrir l'accueil avec un profil associé à des motifs de la période en cours.
Expected : la slide-in apparaît après les modales, au-dessus de la pastille ; « S'inscrire » ouvre un onglet sans fermer la slide-in ; ouvrir l'assistant la masque, le refermer la fait revenir ; « Plus tard » la ferme et un rechargement ne la ramène pas ; en largeur mobile, feuille en bas d'écran. Remettre la ligne d'état à zéro après l'essai (suppression de la ligne de `formation_periode_information_utilisateur` de l'utilisateur, avec l'accord de Tristan).

- [ ] **Step 5 : commit**

```bash
git add src/client/components/PageAccueil/SlideInFormations src/client/components/PageAccueil/BasePageAccueilLayout.tsx
git commit -m "feat(PIL-1923): slide-in des formations sur l'accueil"
```

---

### Task 6 : scénario e2e

**Files :**

- Modify : `tests/seed/seed-dedicated-entities.sql`
- Modify : `tests/seed/dedicated-entities.ts`
- Modify : `tests/e2e-test-context.ts` (action suivie `FORMATION_SLIDE_IN_ETAT_CREATED`)
- Create : `tests/formations-slide-in.spec.ts`

**Interfaces :**

- Consumes : la slide-in de la Task 5.
- Produces : `export const UTILISATEUR_FOR_SLIDE_IN_FORMATIONS = "formations.slide.in@example.com";`

Isolation : seul le profil `CABINET_MTFP` reçoit la formation e2e. Aucun spec ne se connecte avec ce profil (seul `cabinet.mtfp@example.com` l'a, et aucun test ne l'utilise), donc la slide-in n'apparaît dans aucun autre test.

- [ ] **Step 1 : données dédiées**

Dans `seed-dedicated-entities.sql`, sur le modèle des comptes existants : utilisateur `formations.slide.in@example.com` (`CABINET_MTFP`, fonction et service renseignés, `date_visualisation_video_accueil` et `date_inscription_infolettre` à `NOW()` pour écarter les modales), habilitation `lecture` comme `cabinet.mtfp@example.com` ; motif `900001` « CAMPUS PILOTE : Formation e2e » associé à `CABINET_MTFP` ; séance `900001` à `NOW() + interval '7 days'`, 45 min, 20 places, 0 inscrit ; période du `CURRENT_DATE - 1` au `CURRENT_DATE + 30` avec ce motif. Ajouter la constante dans `dedicated-entities.ts`.

- [ ] **Step 2 : nettoyage**

Action suivie `FORMATION_SLIDE_IN_ETAT_CREATED: { email: string }` dans `FiltersByAction`, annulée par `prisma.formation_periode_information_utilisateur.deleteMany({ where: { utilisateur: { email } } })`.

- [ ] **Step 3 : écrire le scénario**

`test("propose la formation du profil, puis la reporte avec Plus tard")` : `track("FORMATION_SLIDE_IN_ETAT_CREATED", { email })` avant toute action ; connexion ; région « 1 formation pour votre profil » visible, avec « Formation e2e » et un lien « S'inscrire » vers l'URL de la séance ; clic sur « Plus tard » ; région masquée ; rechargement, attente de la réponse `formation.slideIn` (`page.waitForResponse`), puis région absente.

- [ ] **Step 4 : lancer le scénario**

Run : `pnpm test:e2e:seed`, puis `pnpm exec playwright test tests/formations-slide-in.spec.ts` (serveur e2e lancé par `pnpm test:e2e:server`), puis `pnpm exec playwright test tests/accueil.spec.ts`.
Expected : PASS sur les deux fichiers. Demander à Tristan avant de lancer toute la suite e2e.

- [ ] **Step 5 : commit**

```bash
git add tests/seed/seed-dedicated-entities.sql tests/seed/dedicated-entities.ts tests/e2e-test-context.ts tests/formations-slide-in.spec.ts
git commit -m "test(PIL-1923): scénario e2e de la slide-in des formations"
```

---

### Task 7 : vérifications finales et documents

**Files :**

- Modify : `docs/superpowers/specs/2026-11-23-formations-slide-in-design.md` (heure du navigateur au lieu de l'heure de Paris ; une mutation avec `action` au lieu de trois)
- Modify : `docs/superpowers/plans/2026-11-18-formations-rdv-sp-suivi-pr.md` (PR 4 : plan coché, statut)

- [ ] **Step 1 : vérifications**

Run : `pnpm lint`, puis `pnpm exec vitest run --project server-unit --project server-integration src/server/formations`, puis `pnpm exec vitest run --project client src/client/components/PageAccueil`.
Expected : aucune erreur de lint, tous les tests passent (hors échec préexistant `MinistèreSQLRepository`, hors module).

- [ ] **Step 2 : documents**

Reporter dans la spec les deux écarts listés ci-dessus ; dans le suivi, cocher « Plan détaillé » avec le lien vers ce plan et passer la PR 4 en « En cours » ou « En relecture » selon l'avancement.

- [ ] **Step 3 : commit**

```bash
git add docs/superpowers/specs/2026-11-23-formations-slide-in-design.md docs/superpowers/plans/2026-11-18-formations-rdv-sp-suivi-pr.md
git commit -m "docs(PIL-1923): design et suivi de la slide-in des formations"
```
