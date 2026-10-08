# Rapport détaillé ppg — PDF serveur et page incrémentale — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplacer `window.print()` du rapport détaillé ppg par un PDF généré côté serveur avec pdfmake, au plus proche du rendu actuel, et rendre la page incrémentale.

**Architecture :** le chargement de `getServerSideProps` est extrait dans `src/server/rapport-detaille/` en deux fonctions (`chargerVueDEnsemble`, `chargerDetailsChantiers`) partagées par la page (SSR), une procédure tRPC (fiches à la demande) et une route API qui envoie le PDF. Le PDF est assemblé par des générateurs purs, un par composant web, sur des briques partagées (police Marianne, couleurs Tailwind, SVG des composants React existants, HTML riche converti).

**Tech Stack :** Next.js 16 Pages Router, tRPC + superjson, Prisma, pdfmake 0.3 (pdfkit, fontkit, svg-to-pdfkit), htmlparser2, react-dom/server, Vitest.

**Spec :** `docs/superpowers/specs/2026-10-01-rapport-detaille-pdf-serveur-design.md`
**Référence de fidélité :** `docs/superpowers/specs/2026-10-01-rapport-detaille-pdf-inventaire-visuel.md` (abrégé « inventaire §N » ci-dessous). Chaque générateur PDF reproduit la section d'inventaire citée : textes exacts, couleurs, tailles, conditions.

## Global Constraints

- Tout le code est dans `apps/pilote-ppg`. Commandes depuis ce dossier. pnpm uniquement.
- Nommage : identifiants techniques en anglais, termes métier en français (`loadVueDEnsemble`, `loadChantierDetails`, `generateRapportDetaillePdf`, `htmlToPdfmake`). Les noms français techniques cités plus bas dans ce plan sont à traduire selon cette règle (voir le ledger).
- Jamais de `as never` ni `as unknown`. Pas de commentaires explicatifs superflus.
- pdfmake : uniquement via l'instance de `src/server/pdf/pdfmake.ts` ; `setUrlAccessPolicy(() => false)` conservé.
- Unités : 1 px CSS = 0,75 pt ; 1 rem = 12 pt. Page 280 × 396 mm = 793,7 × 1122,5 pt ; marges 12 mm = 34 pt.
- Polices Marianne en `.woff2` depuis `@gouvfr/dsfr/dist/fonts`.
- Pas de tests front (composants React, hooks). Tests Vitest côté serveur : fichiers `*.unit.test.ts(x)` sous `src/server/`.
- `pnpm lint` avant chaque commit ; commits via le skill `commit-billable` (client DITP-pilotage, catégorie refactor, tags pdf, performance).

## Review Focus

1. **Équivalence des données** après extraction : le même jeu de filtres doit donner exactement les mêmes props qu'avant (ordre des chantiers, alertes, statistiques par chantier) — Task 2 compare l'ancien et le nouveau calcul des statistiques.
2. **Habilitations sur la route PDF et la procédure tRPC** : un utilisateur sans accès au territoire ou à un chantier demandé ne doit rien recevoir — Tasks 3 et 13 testent 403 et le filtrage des ids.
3. **HTML riche hostile ou mal formé** (balises non fermées, `<script>`, `<img src=http…>`, entités) : rendu texte sans plantage ni ressource distante — Task 6.
4. **Valeurs nulles partout** (avancement, médiane, météo NON_RENSEIGNEE, synthèse absente, unité vide, pondération null) : textes de repli exacts (« - % », « Non renseigné », « Non défini ») — tests des Tasks 8 à 11.
5. **Gros périmètre** (national, tous chantiers, détail activé) : génération sans dépassement mémoire — Task 15 mesure.

---

### Task 1 : socle du module `rapport-detaille` et contexte

**Files :**
- Create : `src/server/rapport-detaille/contexteRapportDetaille.ts`
- Test : `src/server/rapport-detaille/contexteRapportDetaille.unit.test.ts`

**Interfaces :**
- Produces :
  ```ts
  export type ContexteRapportDetaille = {
    session: Session;                      // next-auth, avec habilitations
    territoireCode: string;
    codeInseeSelectionne: string;
    mailleSelectionnee: MailleInterne;      // "departementale" | "regionale"
    mailleChantier: MailleChantierContrat;  // "nationale" | MailleInterne
    jalon: number;
    jalonParDefaut: number;
    filtres: FiltreQueryParams;
    filtresAlertes: FiltresAlertesRapportDetaille;
    sorting: SortingParams;
    afficherDetail: boolean;               // query param `detail=true`
  };
  export type FiltresAlertesRapportDetaille = { estEnAlerteTauxAvancementNonCalculé: boolean; estEnAlerteÉcart: boolean; estEnAlerteBaisse: boolean; estEnAlerteMétéoNonRenseignée: boolean; estEnAlerteAbscenceTauxAvancementDepartemental: boolean; estEnAlertePossedePropositionsValeurAvancement: boolean };
  export function construireContexteRapportDetaille(query: Record<string, string | string[] | undefined>, territoireCode: string, session: Session, maintenant?: Date): ContexteRapportDetaille;
  export function aUnFiltreAlerte(filtres: FiltresAlertesRapportDetaille): boolean;
  ```

- [ ] **Step 1 : test.** Cas : (a) `NAT-FR` + `maille=regionale` → `mailleSelectionnee` "regionale", `mailleChantier` "nationale" ; (b) `DEPT-75` → "departementale" / "departementale" ; (c) `REG-11` → "regionale" / "regionale" ; (d) sans `statut` → `filtres.statut` `["PUBLIE"]`, `BROUILLON_ET_PUBLIE` → `["BROUILLON","PUBLIE"]` ; (e) sans `jalon` → `getAnneeDateDeBascule(maintenant, configuration().dateBasculeAffichageValeursAnneePrecedente)` ; (f) `detail=true` → `afficherDetail` true, absent → false ; (g) sans `sort` → `TRI_CHANTIERS_PAR_DEFAUT`.

```ts
import { construireContexteRapportDetaille } from "@/server/rapport-detaille/contexteRapportDetaille";
import { TRI_CHANTIERS_PAR_DEFAUT } from "@/server/chantiers/app/contrats/TriChantiers";

const session = { habilitations: { lecture: { chantiers: [], territoires: [] } }, profil: "DITP_ADMIN" } as Parameters<typeof construireContexteRapportDetaille>[2];
// si le type Session exige plus de champs, construire l'objet complet via le builder de session de test existant (chercher `SessionBuilder` / `sessionDeTest` dans src/server) plutôt qu'un cast.

describe("construireContexteRapportDetaille", () => {
  it("en national, la maille sélectionnée vient du query param et la maille chantier est nationale", () => {
    const contexte = construireContexteRapportDetaille({ maille: "regionale" }, "NAT-FR", session);
    expect(contexte.mailleSelectionnee).toBe("regionale");
    expect(contexte.mailleChantier).toBe("nationale");
  });
  it("sur un département, les deux mailles sont départementales", () => {
    const contexte = construireContexteRapportDetaille({}, "DEPT-75", session);
    expect([contexte.mailleSelectionnee, contexte.mailleChantier]).toEqual(["departementale", "departementale"]);
  });
  it("statut absent : seulement les publiés", () => {
    expect(construireContexteRapportDetaille({}, "NAT-FR", session).filtres.statut).toEqual(["PUBLIE"]);
  });
  it("BROUILLON_ET_PUBLIE : brouillons et publiés", () => {
    expect(construireContexteRapportDetaille({ statut: "BROUILLON_ET_PUBLIE" }, "NAT-FR", session).filtres.statut).toEqual(["BROUILLON", "PUBLIE"]);
  });
  it("detail=true active le détail des chantiers", () => {
    expect(construireContexteRapportDetaille({ detail: "true" }, "NAT-FR", session).afficherDetail).toBe(true);
    expect(construireContexteRapportDetaille({}, "NAT-FR", session).afficherDetail).toBe(false);
  });
  it("tri par défaut", () => {
    expect(construireContexteRapportDetaille({}, "NAT-FR", session).sorting).toEqual(TRI_CHANTIERS_PAR_DEFAUT);
  });
});
```

- [ ] **Step 2 :** `pnpm vitest run --project server-unit src/server/rapport-detaille/contexteRapportDetaille` → FAIL (module absent).
- [ ] **Step 3 : implémentation.** Reprendre à l'identique `rapport-detaille.tsx:83-136` et `:158` : `loadRapportDetailleSearchParams(query)`, `territoireCodeVersMailleCodeInsee`, `getAnneeDateDeBascule`, construction de `filtres` et `filtresAlertes`, `const [sorting = TRI_CHANTIERS_PAR_DEFAUT] = searchParams.sort`. `afficherDetail = query.detail === "true"`. `aUnFiltreAlerte` = OU des six booléens (repris de `:177-183`).
- [ ] **Step 4 :** relancer → PASS.
- [ ] **Step 5 :** `pnpm lint` puis commit « socle du contexte du rapport détaillé ».

### Task 2 : statistiques d'avancement par lot

**Files :**
- Modify : `src/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery.ts`
- Modify : `src/server/chantiers/usecases/RécupérerStatistiquesAvancementChantiersUseCase.ts`
- Test : `src/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery.unit.test.ts` (créer ; prisma bouchonné)

**Interfaces :**
- Produces : `GetStatistiquesAvancementChantiersQuery.executeParChantier(params: { habilitations; listeChantier: string[]; maille: Maille; jalon: number }): Promise<Record<string, AvancementsStatistiques>>` et `RécupérerStatistiquesAvancementChantiersUseCase.runParChantier(chantiers, maille, habilitations, jalon): Promise<Record<string, AvancementsStatistiques>>` (mêmes contrôles de maille que `run`).

- [ ] **Step 1 : test.** Prisma bouchonné : `chantier_territoire_jalon.groupBy` renvoie des lignes `{ id, territoire_code, _avg: { taux_avancement } }` pour deux chantiers A (10, 30, 20) et B (50). Attendu : A → `{ médiane: 20, minimum: 10, maximum: 30 }`, B → `{ médiane: 50, minimum: 50, maximum: 50 }` ; un chantier demandé sans ligne → `{ médiane: calculerMediane([]), minimum: verifyValeurIsNotNullOrUndefined(undefined), maximum: … }` (même repli que `execute`) ; un chantier non autorisé en lecture n'apparaît pas dans le `where.id.in`.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 : implémentation.** Un seul `groupBy({ by: ["id", "territoire_code"], _avg: { taux_avancement: true }, where: <identique à execute>, orderBy: { _avg: { taux_avancement: "asc" } } })`, regroupement par `id` dans une `Map` en conservant l'ordre croissant, puis le même calcul que `execute` pour chaque chantier demandé et autorisé. `runParChantier` reprend le contrôle `MailleNonAutoriséeErreur` de `run`.
- [ ] **Step 4 :** PASS. Ajouter un test d'équivalence : pour les mêmes lignes, `execute({ listeChantier: ["A"] })` (groupBy bouchonné filtré sur A) et `executeParChantier(...)["A"]` sont égaux.
- [ ] **Step 5 :** lint + commit « statistiques d'avancement par lot de chantiers ».

### Task 3 : `chargerVueDEnsemble` et `chargerDetailsChantiers`

**Files :**
- Create : `src/server/rapport-detaille/chargerVueDEnsemble.ts`
- Create : `src/server/rapport-detaille/chargerDetailsChantiers.ts`
- Create : `src/server/rapport-detaille/rapportDetaille.interface.ts`
- Modify : `src/server/infrastructure/accès_données/chantier/indicateur/IndicateurSQLRepository.ts:258-280` (index `Map` au lieu du `filter` dans la boucle)
- Modify : `src/server/chantiers/usecases/RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2.ts` (paramètre optionnel `restreindreAuxChantierIds?: string[]` en dernier argument : `chantiersLecture` est intersecté avec cette liste)
- Test : `src/server/rapport-detaille/chargerDetailsChantiers.unit.test.ts`, `src/server/chantiers/usecases/RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2.unit.test.ts` (si absent, sinon y ajouter le cas)

**Interfaces :**
- Consumes : `ContexteRapportDetaille` (Task 1), `runParChantier` (Task 2).
- Produces (`rapportDetaille.interface.ts`) :
  ```ts
  export type VueDEnsembleRapportDetaille = {
    chantiers: ChantierRapportDetailleContrat[];   // après filtres d'alertes, AVEC `mailles`
    ministères: Ministère[]; axes: Axe[];
    territoireSélectionné: Territoire;               // territoireRepository.récupérer
    filtresComptesCalculés: Record<TypeAlerteChantier, number>;
    avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
    avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
    repartitionMeteosChantiers: RepartitionMeteoContrat;
    moyenneTauxAvancementTerritoire: number | null;
    estAutoriseAVoirLesBrouillons: boolean;
    chantiersSontArchives: boolean;
  };
  export type DetailChantierRapportDetaille = {
    chantierId: string;
    avancement: AvancementChantierRapportDetaille;
    indicateurs: Indicateur[];
    détailsIndicateurs: DétailsIndicateurs;
    synthèseDesRésultats: SynthèseDesRésultats | null;
    objectifs: Objectif[];
    commentaires: Commentaire[];
    décisionStratégique: DécisionStratégique | null;
    donnéesCartographieAvancement: AvancementsGlobauxTerritoriauxMoyensContrat;
    donnéesCartographieMétéo: CartographieDonnéesMétéo;
    listeIndicateursPrisEnCompteAvancement: string[];
  };
  export function chargerVueDEnsemble(contexte: ContexteRapportDetaille): Promise<VueDEnsembleRapportDetaille>;
  export function chargerDetailsChantiers(chantiers: ChantierRapportDetailleContrat[], contexte: ContexteRapportDetaille, territoireSélectionné: Territoire): Promise<DetailChantierRapportDetaille[]>; // même ordre que `chantiers`
  export function chargerChantiersParIds(chantierIds: string[], contexte: ContexteRapportDetaille): Promise<{ chantiers: ChantierRapportDetailleContrat[]; territoireSélectionné: Territoire }>;
  export function sansMailles(chantier: ChantierRapportDetailleContrat): ChantierRapportDetailleContrat; // copie sans `mailles`, pour la sérialisation
  ```
  Le détail est **par chantier** (un objet par fiche) : c'est l'unité de la page incrémentale et du PDF.

- [ ] **Step 1 : tests de `chargerDetailsChantiers`** avec `getContainer` bouchonné (`vi.mock("@/server/dependances")`) : (a) `runParChantier` appelé **une seule fois** avec tous les ids du lot ; (b) l'ordre de sortie suit l'ordre d'entrée ; (c) `décisionStratégique` vaut null pour tous si l'habilitation n'a pas accès à `NAT-FR`, et le repository n'est pas appelé ; (d) l'avancement régional d'un département lit le territoire parent (`codeParent`) comme `rapport-detaille.tsx:250-271` ; (e) les données de cartographie viennent de `chantier.mailles[mailleSelectionnee]` (valeur globale, annuelle, `estApplicable`).
- [ ] **Step 2 : test du use case V2** : avec `restreindreAuxChantierIds = ["A"]` et des habilitations sur A et B, le repository reçoit `chantiersLectureIds = ["A"]` ; avec un id non habilité `["Z"]`, il reçoit `[]`.
- [ ] **Step 3 :** FAIL.
- [ ] **Step 4 : implémentation.**
  - `chargerVueDEnsemble` : `rapport-detaille.tsx:138-224` puis `:383-416` (statistiques globales, agrégat, moyenne, avancements globaux). Les trois appels du `Promise.all` initial sont conservés ; `recupererRepartitionsMeteoChantiersUseCase`, `récupérerStatistiquesChantiersUseCase.run(...)` (agrégés) et `agregerAvancementsChantiersUseCase` sont lancés ensemble dans un `Promise.all`. `estAutoriseAVoirLesBrouillons` via `PROFILS_AUTORISE_VOIR_BROUILLONS` (déplacé dans ce module). `chantiersSontArchives = contexte.filtres.statut.includes("ARCHIVE")`.
  - `chargerDetailsChantiers` : `runParChantier` une fois ; puis `Promise.all` de : `indicateurRepository.récupérerGroupésParChantier`, (`datajobsExecutionQueries.recupererEtatCourant` → `récupérerDétailsGroupésParChantierEtParIndicateur`), `recupererListeIndicateursPrisEnCompteDansCalculAvancementSurAuMoinsUnTerritoire`, `synthèseDesRésultatsRepository.récupérerLesPlusRécentesGroupéesParChantier`, décisions (si `NAT-FR`), commentaires, objectifs. Agrégation par chantier reprise de `:243-323` (`AgrégateurChantierRapportDetailleParTerritoire`) et cartographies de `:421-446`.
  - `chargerChantiersParIds` : même appel que `chargerVueDEnsemble` au use case V2 avec `restreindreAuxChantierIds`, puis mêmes filtres d'alertes ; ministères, axes et territoire chargés comme dans `chargerVueDEnsemble`.
  - `IndicateurSQLRepository` : construire `Map<chantierId, indicateurs[]>` une fois, puis lire la `Map` dans la boucle.
- [ ] **Step 5 :** PASS ; `pnpm vitest run --project server-unit src/server/infrastructure/accès_données/chantier/indicateur` (non-régression).
- [ ] **Step 6 :** lint + commit « extraction du chargement du rapport détaillé ».

### Task 4 : la page consomme le module (comportement inchangé)

**Files :**
- Modify : `src/pages/accueil/chantier/[territoireCode]/rapport-detaille.tsx`
- Modify : `src/client/components/PageRapportDétaillé/PageRapportDétaillé.tsx`, `Chantier/RapportDétailléChantier.tsx`, `Chantier/RapportDétailléChantier.interface.ts`

**Interfaces :**
- Produces : props de page `{ ...bootstrap, vueDEnsemble: Omit<VueDEnsembleRapportDetaille, "chantiers"> & { chantiers: ChantierRapportDetailleContrat[] /* sansMailles */ }, details: DetailChantierRapportDetaille[] , territoireCode, jalon, mailleSelectionnee }`. `RapportDétailléChantier` prend `{ chantier, detail: DetailChantierRapportDetaille, … }` au lieu des maps.

- [ ] **Step 1 :** `getServerSideProps` = `auth` + asserts + `construireContexteRapportDetaille` + `chargerVueDEnsemble` + `chargerDetailsChantiers(vueDEnsemble.chantiers, …)` (temporairement, pour garder le comportement) + `loadBootstrap`.
- [ ] **Step 2 :** adapter `PageRapportDétaillé` et `RapportDétailléChantier` au nouveau format (suppression des `Map` reconstruites dans le composant de page).
- [ ] **Step 3 :** `pnpm tsc --noEmit -p .` (voir mémoire projet : `--stack-size` si nécessaire) ; `pnpm lint`.
- [ ] **Step 4 :** demander au user de vérifier la page et son impression (inchangées) ; commit « la page du rapport détaillé passe par le module partagé ».

### Task 5 : briques PDF — polices, couleurs, unités

**Files :**
- Modify : `src/server/pdf/pdfmake.ts` (enregistrement Marianne)
- Create : `src/server/pdf/marianne.ts`, `src/server/pdf/tokens.ts`, `src/server/pdf/unites.ts`
- Modify : `next.config.js` (`outputFileTracingIncludes`)
- Test : `src/server/pdf/tokens.unit.test.ts`, `src/server/pdf/marianne.unit.test.ts`

**Interfaces :**
- Produces :
  ```ts
  // marianne.ts
  export const POLICE_MARIANNE = "Marianne";
  export function vfsMarianne(): Record<string, string>; // base64 des 8 woff2 (Light, Regular, Medium, Bold + italiques)
  // tokens.ts
  export function couleur(nom: string): string; // "primary" -> "#000091", "white" -> "#FFFFFF", "#123456" -> "#123456" ; lève une erreur si inconnue
  export const COULEURS_PDF: { texte: "#161616"; mention: "#666666"; primaire: "#000091"; bordureBloc: "#7B7B7B"; bandeauBloc: "#E3E3FD"; hr: "#DDDDDD" };
  // unites.ts
  export const px = (valeur: number) => valeur * 0.75;
  export const rem = (valeur: number) => valeur * 12;
  export const mm = (valeur: number) => (valeur * 72) / 25.4;
  ```
  Les familles pdfmake : `Marianne` → `normal: Marianne-Regular.woff2`, `bold: Marianne-Bold.woff2`, `italics: Marianne-Regular_Italic.woff2`, `bolditalics: Marianne-Bold_Italic.woff2` ; `MarianneMedium` et `MarianneLight` pour les graisses intermédiaires.

- [ ] **Step 1 : tests.** `couleur("primary") === "#000091"`, `couleur("dsfr-blue-france-925") === "#E3E3FD"`, `couleur("white") === "#FFFFFF"`, `couleur("inconnue")` lève. Marianne : `pdfmake.createPdf({ content: [{ text: "Équipe « été » — 42 %", bold: true }], defaultStyle: { font: "Marianne" } }).getBuffer()` commence par `%PDF` et contient `Marianne-Bold`.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 : implémentation.** `tokens.ts` lit `require("../../../tailwind.config.js").theme.extend.colors` (chemin relatif à `src/server/pdf`), y ajoute `white`, `black`. `marianne.ts` résout le dossier via `path.dirname(require.resolve("@gouvfr/dsfr/package.json"))` + `dist/fonts`. `pdfmake.ts` appelle `addVirtualFileSystem(vfsMarianne())` et ajoute les familles à `setFonts` (Roboto conservé). `next.config.js` : `outputFileTracingIncludes: { "/api/rapport-detaille/pdf": ["../../node_modules/@gouvfr/dsfr/dist/fonts/Marianne-*.woff2", "./tailwind.config.js"] }`.
- [ ] **Step 4 :** PASS ; `pnpm vitest run --project server-unit src/server/pdf src/server/albert/pdf src/server/evaluation` (PDF existants intacts).
- [ ] **Step 5 :** lint + commit.

### Task 6 : HTML riche vers pdfmake

**Files :**
- Create : `src/server/pdf/htmlVersPdfmake.ts`
- Test : `src/server/pdf/htmlVersPdfmake.unit.test.ts`

**Interfaces :**
- Produces : `export function htmlVersPdfmake(html: string, options?: { taillePolice?: number; couleur?: string }): Content[]` — par défaut 14 px (`px(14)`), #161616, comme `[&_p]:text-sm` de la synthèse.

- [ ] **Step 1 : tests** (un `it` par cas, sur la structure renvoyée) :
  - `<p>a <strong>b</strong> <em>c</em> <u>d</u> <s>e</s></p>` → un paragraphe avec segments `bold`, `italics`, `decoration: "underline"`, `decoration: "lineThrough"`.
  - `<h1>`…`<h6>` → tailles DSFR (inventaire, Typographie) en gras.
  - `<ul><li>x<ul><li>y</li></ul></li></ul>` → `ul` imbriquée ; `<ol>` → `ol`.
  - `<a href="https://x">lien</a>` → texte souligné, couleur #000091, **sans** `link` ni ressource.
  - `<blockquote>` → marge gauche + italique ; `<hr>` → `canvas` ligne 1 px #DDDDDD ; `<br>` → `\n`.
  - entités `&nbsp; &amp; &lt; &eacute; &#39;` décodées ; ` `/` ` remplacés par espace.
  - `<script>alert(1)</script><p>ok</p>` → seulement « ok » ; `<img src="http://evil">` → ignoré ; `<p>non fermé` → « non fermé ».
  - `<div data-type="callout">x</div>` → bloc fond #F5F5FE avec « x » ; `<iframe>` / `<video>` → ignorés.
  - chaîne vide → `[]`.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 : implémentation** : `parseDocument` de `htmlparser2` (option `decodeEntities: true`), parcours récursif sur le modèle de `src/server/albert/pdf/markdownToPdfContent.ts` (fonctions `convertirEnLigne` / `convertirBlocs`). Balises inconnues : on descend dans leurs enfants. `script`, `style`, `img`, `video`, `iframe` : ignorés.
- [ ] **Step 4 :** PASS. **Step 5 :** lint + commit.

### Task 7 : SVG des composants React

**Files :**
- Create : `src/server/pdf/svgDepuisComposant.tsx`
- Create : `src/server/rapport-detaille/pdf/cartographie/territoiresCartographie.ts`
- Test : `src/server/pdf/svgDepuisComposant.unit.test.tsx`

**Interfaces :**
- Produces :
  ```ts
  export function svgDepuisComposant(element: ReactElement): string; // renderToStaticMarkup + classes Tailwind fill-*/stroke-*/[stroke-width:x] -> attributs, `class` supprimé, `currentColor` -> couleur passée
  export function aplatirClassesSvg(svg: string, options?: { couleurCourante?: string }): string;
  export function jaugeSvg(pourcentage: number | null, couleur: JaugeDeProgressionCouleur, taille: "sm" | "md" | "lg"): string;
  export function jaugeSmallSvg(pourcentage: number | null, couleur: JaugeDeProgressionCouleur): string;
  export function pictoMeteoSvg(meteo: Meteo): string | null;
  export function iconeSvg(icone: ComponentType<{ className?: string }>, couleur: string): string;
  // territoiresCartographie.ts
  export function construireTerritoiresCartographie(mailleSelectionnee: MailleInterne, données: Record<string, { remplissage: string; estApplicable: boolean | null }>): CartographieTerritoires; // même logique que useCartographie.créerTerritoires + Cartographie.tsx:55-69, depuis territoires.json, sans hook
  export function carteSvg(params: { territoireCode: string; mailleSelectionnee: MailleInterne; territoires: CartographieTerritoires }): string; // rend <CartographieSVG estInteractif=false …/>
  ```
- [ ] **Step 1 : tests.**
  - `aplatirClassesSvg('<rect class="fill-pilote-jauge-fond"/>')` → `<rect fill="#D9D9D9"/>` ; `stroke-white` → `stroke="#FFFFFF"` ; `[stroke-width:0.15]` → `stroke-width="0.15"` ; `fill-none` → `fill="none"` ; classes non couleur (`hover:opacity-[0.72]`, `cursor-pointer`) supprimées ; aucun `class=` ne subsiste.
  - `jaugeSvg(50, "bleu", "lg")` contient `fill="#000091"` et `fill="#D9D9D9"`, pas de `class=`.
  - `jaugeSvg(null, …)` ne contient pas de second `path` rempli.
  - `pictoMeteoSvg("SOLEIL")` contient `#FFCA00` ; `pictoMeteoSvg("NON_RENSEIGNEE")` → null.
  - `carteSvg` en maille départementale : 101 `path` de départements au moins, frontières `stroke="#FFFFFF"` `stroke-width="0.4"`, aucun `class=`.
  - chaque SVG rendu passe dans `pdfmake.createPdf({ content: [{ svg }] }).getBuffer()` sans erreur.
- [ ] **Step 2 :** FAIL.
- [ ] **Step 3 : implémentation.** `renderToStaticMarkup` (react-dom/server). La correspondance classe → attribut lit `couleur()` (Task 5). `useId` produit des ids avec `:` → les remplacer par `-` dans `id=` et `url(#…)` (svg-to-pdfkit). `CartographieSVG` est rendu avec `options: { territoireAffiché: { codeInsee: "FR", maille: "nationale" }, territoireSélectionnable: true, multiséléction: false, estInteractif: false }` et `auClicTerritoireCallback: () => {}`. Si `CartographieSVG` ou ses enfants appellent des hooks qui exigent un contexte (router, session), extraire le rendu pur dans un composant `CartographieSVGStatique` (même fichier) utilisé par les deux.
- [ ] **Step 4 :** PASS. **Step 5 :** lint + commit.

### Task 8 : primitives DSFR pour pdfmake

**Files :**
- Create : `src/server/pdf/primitives.ts`
- Test : `src/server/pdf/primitives.unit.test.ts`

**Interfaces :**
- Produces (toutes renvoient `Content`) :
  ```ts
  bloc(params: { titre?: string; fondTitre?: string; iconeInfo?: boolean; contenu: Content; padding?: number }): Content; // inventaire §11 Bloc
  encart(contenu: Content): Content;                       // §2 / §3 Encart, fond #E3E3FD, py 16 px px 32 px
  titreH2(texte: string, options?: { taille?: "h2" | "h4" | "lg" }): Content; // #000091
  titre(texte: string, niveau: "h1" | "h3" | "h4", options?): Content;     // #161616
  badge(texte: string, variante: "defaut" | "succes" | "erreur" | "info" | "attention" | "vert-tilleul", options?: { taille?: "sm" | "md"; iconeSvg?: string }): Content; // §3.5
  barreDeProgression(params: { valeur: number | null; taille: "sm" | "md"; fond: "blanc" | "gris-clair"; remplissage: string; texte: "cote" | "dessus"; largeur: number }): Content; // §3.6
  alerte(params: { type: "info" | "succes" | "warning" | "erreur"; titre?: string; message?: string }): Content; // §11 Alerte
  hr(): Content;
  tableauDsfr(params: { entetes: string[]; largeurs: (number | "*" | "auto")[]; lignes: Content[][]; paddingCellule?: [number, number] }): Content; // §2.4 socle
  rubriquePublication(params: { titre: string; dateEtAuteur: string | null; html: string | null }): Content; // §8
  ```
  Coins arrondis : `canvas` `rect` avec `r` placé en arrière-plan (`absolutePosition` relative impossible en flux : utiliser un `table` d'une cellule dont `layout` dessine le fond et la bordure via `fillColor` + `hLineWidth`/`vLineWidth`, et accepter des angles droits **seulement** si l'arrondi n'est pas faisable ; documenter le choix dans le fichier de test par un cas).
- [ ] **Step 1 : tests** de structure : `badge("EN HAUSSE","succes")` → fond #B8FEC9, texte #18753C, gras, majuscules, taille `px(12)` ; `barreDeProgression({ valeur: null, … })` → texte « - % » et aucun rectangle de remplissage ; `valeur: 42.6` → « 43 % » et largeur de remplissage 42.6 % ; `bloc({ titre: "France", contenu })` → bordure #7B7B7B, bandeau #E3E3FD, trait bas 2 px #3A3A3A ; `rubriquePublication({ html: null })` → badge « NON RENSEIGNÉ » ; `alerte({ type: "info", titre: "Aucun indicateur n'est applicable pour le territoire sélectionné" })` → bordure #0063CB.
- [ ] **Step 2–4 :** FAIL → implémentation → PASS. **Step 5 :** lint + commit.

### Task 9 : page de garde et vue d'ensemble

**Files :**
- Create : `src/server/rapport-detaille/pdf/pdfPageDeGarde.ts`, `pdfVueDEnsemble.ts`, `pdfTableauChantiers.ts`, `jauges.ts`
- Test : `src/server/rapport-detaille/pdf/pdfPageDeGarde.unit.test.ts`, `pdfVueDEnsemble.unit.test.ts`

**Interfaces :**
- Consumes : Tasks 5–8, `VueDEnsembleRapportDetaille`, `ContexteRapportDetaille`.
- Produces :
  ```ts
  pdfPageDeGarde(params: { territoire: Territoire; contexte: ContexteRapportDetaille; ministères: Ministère[]; axes: Axe[]; estAutoriseAVoirLesBrouillons: boolean; maintenant: Date }): Content; // inventaire §1, finit par pageBreak: "after"
  pdfVueDEnsemble(vue: VueDEnsembleRapportDetaille, contexte: ContexteRapportDetaille): Content; // §2, §2.1-2.3
  pdfTableauChantiers(chantiers: ChantierRapportDetailleContrat[], ministères: Ministère[], chantiersSontArchives: boolean): Content; // §2.4
  jauge(params: { pourcentage: number | null; couleur: JaugeDeProgressionCouleur; taille: "sm" | "md" | "lg"; libellé?: string; date?: string | null }): Content; // §6 (valeur superposée à l'anneau : `stack` avec relativePosition)
  jaugeSmall(params: { pourcentage: number | null; couleur: JaugeDeProgressionCouleur; libellé: string }): Content;
  ```
- [ ] **Step 1 : tests** (textes exacts de l'inventaire) : page de garde contient « État des lieux de l'avancement », « Rapport détaillé généré le 01/10/2026 à 9h05 » pour `maintenant = 2026-10-01T09:05+02:00`, le groupe « Axe(s) » seulement si des axes sont filtrés, les libellés de statut seulement si `estAutoriseAVoirLesBrouillons` ; vue d'ensemble : alertes nationales vs territoriales (listes exactes §2), « - % » si `moyenneTauxAvancementTerritoire` null, tableau vide → « Aucun chantier à afficher. » ; cellule écart `-12.3` → badge erreur.
- [ ] **Step 2–4 :** FAIL → implémentation (réutiliser `formaterDate` de `src/client/utils/date/date`, `mapperIconeMinistereVersIcone`, `definirCouleurEcartArrondi`, la logique de `useRemontéesAlertesChantiers` extraite en fonction pure si besoin) → PASS.
- [ ] **Step 5 :** script `scripts/rapport-detaille-pdf-apercu.ts` (jetable, non commité) qui écrit un PDF de démonstration sur des données d'exemple pour comparer avec l'impression ; lint + commit.

### Task 10 : fiche chantier — avancement, responsables, synthèse

**Files :**
- Create : `src/server/rapport-detaille/pdf/pdfChantier.ts`, `pdfAvancement.ts`, `pdfResponsables.ts`, `pdfMeteoSynthese.ts`
- Test : `…/pdfAvancement.unit.test.ts`, `…/pdfMeteoSynthese.unit.test.ts`, `…/pdfChantier.unit.test.ts`

**Interfaces :**
- Produces :
  ```ts
  pdfChantier(params: { chantier: ChantierRapportDetailleContrat; detail: DetailChantierRapportDetaille; contexte: ContexteRapportDetaille; territoire: DétailTerritoire; territoireParent: DétailTerritoire | null }): Content; // §3, pageBreak: "before"
  pdfAvancement(...): Content;     // §3.1-3.4 (disposition 2 ou 3 colonnes selon la maille)
  pdfResponsables(...): Content;   // §4
  pdfMeteoSynthese(...): Content;  // §5
  ```
  `territoire` / `territoireParent` viennent de `territoires.json` (même source que `useTerritoireHabilitation`).
- [ ] **Step 1 : tests** : disposition (nationale : 2 colonnes, France + Répartition puis Comparaison ; départementale : 3 colonnes) ; « SITUATION PAR RAPPORT AUX AUTRES DÉPARTEMENTS » seulement hors NAT ; « (Non défini) » si valeur précédente null ; badge écart « EN RETARD : -12.3 » ; synthèse null → badge « NON RENSEIGNÉE » + « Aucune synthèse des résultats. » ; synthèse avec auteur → « Mis à jour le 15/09/2026 | Par Jeanne Martin » ; responsables locaux affichés seulement hors maille nationale.
- [ ] **Step 2–4 :** FAIL → implémentation → PASS. **Step 5 :** lint + commit.

### Task 11 : fiche chantier — cartes, publications, indicateurs

**Files :**
- Create : `src/server/rapport-detaille/pdf/pdfCartes.ts`, `pdfPublications.ts` (objectifs, commentaires, décisions), `pdfIndicateurs.ts`
- Test : un `*.unit.test.ts` par fichier

**Interfaces :**
- Produces :
  ```ts
  pdfCartes(params: { chantier; detail; contexte }): Content | null;      // §7 ; null si la condition « Répartition géographique » est fausse
  pdfObjectifs(objectifs: Objectif[]): Content | null;                    // §8
  pdfCommentaires(commentaires: Commentaire[], territoire: DétailTerritoire): Content | null; // §8
  pdfDecisions(décision: DécisionStratégique | null, territoire: DétailTerritoire): Content | null; // §9
  pdfIndicateurs(params: { indicateurs; détailsIndicateurs; listeIndicateursPrisEnCompteAvancement; territoireCode; jalon; masquerNonApplicables: boolean }): Content | null; // §10, rubriques + tri
  ```
  Couleurs des cartes : réutiliser les fonctions de `useCartographieAvancement` / `useCartographieMétéo` ; si elles sont dans des hooks, extraire leur partie pure dans le même dossier (`remplissageAvancement(valeur)`, `remplissageMeteo(meteo)`) et les importer des deux côtés. Légende : §7, pastilles 0.6rem.
  `masquerNonApplicables` = `process.env.NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES === "true"`.
- [ ] **Step 1 : tests** : tranche de couleur 89.6 → #000091 (arrondi à 90), 0 → #e6e6f4, null → #bababa ; légende hachures présente seulement si un territoire non applicable ; commentaires nationaux → 4 rubriques aux titres exacts, régionaux → 2 ; décisions absentes hors NAT ; indicateurs triés par pondération décroissante puis nom, h3 « Autres indicateurs (2) » ; titre « Taux de couverture (en pourcentage) » et sans parenthèse si unité vide ; pondération 12.5 → « 12.5% », 12 → « 12% » ; tendance BAISSE → texte d'avertissement exact.
- [ ] **Step 2–4 :** FAIL → implémentation → PASS. **Step 5 :** lint + commit.

### Task 12 : assemblage du document

**Files :**
- Create : `src/server/rapport-detaille/pdf/genererRapportDetaillePDF.ts`
- Test : `…/genererRapportDetaillePDF.unit.test.ts`

**Interfaces :**
- Produces :
  ```ts
  export function construireDocumentRapportDetaille(params: { vue: VueDEnsembleRapportDetaille; details: DetailChantierRapportDetaille[]; contexte: ContexteRapportDetaille; maintenant: Date }): TDocumentDefinitions; // pageSize { width: mm(280), height: mm(396) }, pageMargins mm(12)+marges du conteneur, defaultStyle { font: "Marianne", fontSize: px(16), color: "#161616", lineHeight: 1.5 }
  export function genererRapportDetaillePDF(params): OutputDocument; // pdfmake.createPdf(construireDocumentRapportDetaille(params))
  ```
- [ ] **Step 1 : tests** : sans détail → page de garde + vue d'ensemble (2 pages minimum, aucune fiche) ; avec 3 chantiers → au moins 5 pages ; buffer commence par `%PDF` ; `pdftotext` n'est pas disponible en CI : compter les pages via `/Type /Page` dans le buffer.
- [ ] **Step 2–4 :** FAIL → implémentation → PASS. **Step 5 :** lint + commit.

### Task 13 : route API et procédure tRPC

**Files :**
- Create : `src/pages/api/rapport-detaille/pdf.ts`
- Create : `src/server/rapport-detaille/handlers/TelechargerRapportDetaillePDFHandler.ts`
- Create : `src/server/infrastructure/api/trpc/routes/rapportDetaille.ts` ; Modify : `routes.ts`
- Test : `src/server/rapport-detaille/handlers/TelechargerRapportDetaillePDFHandler.unit.test.ts`, `src/server/infrastructure/api/trpc/routes/rapportDetaille.unit.test.ts`

**Interfaces :**
- Produces :
  - `GET /api/rapport-detaille/pdf?territoireCode=…&detail=true|false&<filtres de la page>` → `application/pdf`, `Content-Disposition: attachment; filename="rapport-detaille-{territoireCode}-{AAAA-MM-JJ}.pdf"`.
  - `rapportDetaille.detailsChantiers` : `input: z.object({ territoireCode: z.string(), query: z.record(z.string(), z.union([z.string(), z.array(z.string())])), chantierIds: z.array(z.string()).min(1).max(5) })`, sortie `{ chantiers: ChantierRapportDetailleContrat[] /* sansMailles */; details: DetailChantierRapportDetaille[] }`.
- [ ] **Step 1 : tests du handler** (auth, conteneur et pdfmake bouchonnés) : sans session → 401 ; territoire non accessible (`new Habilitation(...).peutAccéderAuTerritoire(code) === false`) → 403 et aucun chargement ; `detail=false` → `chargerDetailsChantiers` jamais appelé ; `detail=true` → appelé par lots de 10 dans l'ordre ; en-têtes posés ; erreur avant écriture → 500 ; fermeture client (`ERR_STREAM_PREMATURE_CLOSE`) → pas d'exception.
- [ ] **Step 2 : test tRPC** : ids non habilités filtrés (aucun détail renvoyé pour eux) ; territoire non accessible → `TerritoireNonAutoriséErreur`.
- [ ] **Step 3 :** FAIL.
- [ ] **Step 4 : implémentation.** Handler : `auth(request, response)`, contrôle du territoire, `construireContexteRapportDetaille(request.query, territoireCode, session)`, `chargerVueDEnsemble`, détails par lots de 10 si `afficherDetail`, `genererRapportDetaillePDF(...).getStream()` puis `pipeline(stream, response)` avec la même gestion de fermeture que `ecrireCsvEnStreaming` (factoriser `estFermetureClient` dans `src/server/infrastructure/export_csv/ecrireCsvEnStreaming.ts` en export). Si `getStream` n'existe pas en pdfmake 0.3 serveur, utiliser `getBuffer()` et `response.end(buffer)` et le noter dans la spec. tRPC : `procédureProtégée`, contexte depuis `input.query`, `chargerChantiersParIds`, `chargerDetailsChantiers`.
- [ ] **Step 5 :** PASS ; lint + commit.

### Task 14 : page — bouton PDF et rendu incrémental

**Files :**
- Modify : `src/pages/accueil/chantier/[territoireCode]/rapport-detaille.tsx` (SSR : vue d'ensemble seulement)
- Modify : `src/client/components/PageRapportDétaillé/PageRapportDétaillé.tsx`
- Create : `src/client/components/PageRapportDétaillé/Chantier/RapportDétailléChantierDiffere.tsx`, `src/client/components/PageRapportDétaillé/useDetailsChantiersParLots.ts`, `src/client/components/PageRapportDétaillé/BoutonTelechargerPDF.tsx`
- Delete : `src/client/components/PageRapportDétaillé/PremièrePageImpression/` (et `ListeFiltres`, non utilisé) ; retirer `usePrintPageStyle` et les variantes `print:` du rapport
- Modify : `src/client/components/_commons/EditeurRiche/RenduContenuHtml.tsx` (`useMemo` sur `DOMParser`)

Pas de tests front (règle projet).

- [ ] **Step 1 :** `getServerSideProps` : `chargerVueDEnsemble` seulement ; props `vueDEnsemble` (chantiers `sansMailles`).
- [ ] **Step 2 :** `useDetailsChantiersParLots(query, territoireCode)` : file d'ids demandés (Set), regroupement par 5 sur un `setTimeout(0)`, `api.rapportDetaille.detailsChantiers.useQueries` ou `utils.fetch` + état `Map<id, { statut: "chargement" | "ok" | "erreur"; detail? }>` ; `reessayer(id)`.
- [ ] **Step 3 :** `RapportDétailléChantierDiffere` : `IntersectionObserver` (`rootMargin: "1500px 0px"`) sur un squelette `min-h-[80rem]` (classes Tailwind, couleurs de la config) ; affiche `RapportDétailléChantier` quand le détail est là ; en erreur, message + bouton « Réessayer ».
- [ ] **Step 4 :** `BoutonTelechargerPDF` : `fetch("/api/rapport-detaille/pdf?" + params)` (query courante + `territoireCode` + `detail`), état de chargement (`aria-busy`, libellé « Génération du PDF… »), téléchargement du blob, `toast.error("Erreur lors de la génération du PDF")` (sonner, comme `useImprimerFichesEvaluation`).
- [ ] **Step 5 :** `pnpm tsc --noEmit -p .`, `pnpm lint` ; demander au user de tester la page (défilement, chargement, téléchargement) ; commit.

### Task 15 : mesures, fidélité et finalisation

- [ ] **Step 1 :** script jetable (scratchpad) qui appelle le handler sur le national complet avec détail (base locale seedée) et mesure durée + `process.memoryUsage().rss` avant/après ; consigner les chiffres dans la spec (section « Mesures »).
- [ ] **Step 2 :** générer les PDF de comparaison (NAT-FR, une région, un département) et demander au user la comparaison visuelle avec l'impression de `dev` ; corriger les écarts signalés.
- [ ] **Step 3 :** `pnpm build` puis vérifier la présence de `Marianne-*.woff2` et `tailwind.config.js` dans `.next/standalone` (traçage).
- [ ] **Step 4 :** `pnpm test:server`, `pnpm lint`, commit final.
