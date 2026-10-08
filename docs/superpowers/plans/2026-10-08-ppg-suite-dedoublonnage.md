# Suite du dédoublonnage pilote-ppg (PIL-1822) — plan

> Feuille de route par lots. Chaque lot reçoit son plan d'exécution détaillé au moment où on l'attaque (fichiers exacts, étapes, tests), exécuté inline, en PR empilées. Cases à cocher (`- [ ]`) pour suivre l'avancement.

**Objectif :** terminer ce qui reste du plan de la cartographie des composants dupliqués, après le merge de la pile #2479 → #2529 (2026-10-08), sans repartir de l'ancienne spec ; puis retirer la bibliothèque DSFR en gardant un rendu strictement DSFR (lot F).

**Point de départ :** `dev` à `2c4aa3352` (#2529). Fait : lots 0 à 5 de l'ancienne spec, conteneur `legacy` supprimé, `server/domain`, `server/infrastructure` et `server/usecase` répartis (`server/framework`, `src/shared`, `src/test`, modules par domaine).

**Spec d'origine (historique, ne plus la compléter) :** `docs/superpowers/specs/2026-09-28-cartographie-composants-dupliques-ppg.md` — §§ 5 à 7 et 12 pour le détail des constats repris ici.

**Recette de la pile mergée :** artefact « Recette PIL-1822 » (171 points).

Chemins relatifs à `apps/pilote-ppg/src/`. Effort : **S** < ½ j, **M** ½–2 j, **L** > 2 j. Comptes relevés sur `dev` le 2026-10-08, hors Pilote Eval et PagePilotage.

## Règle DSFR pour tout nouveau code (dès le premier lot)

La bibliothèque DSFR doit disparaître (lot F) : aucun lot ne doit écrire du code qu'un lot suivant supprimerait.

- **Rien de nouveau qui dépende de `@gouvfr/dsfr`** : aucune classe `fr-*` ajoutée (composants **et** utilitaires du cœur : `fr-mb-*`, `fr-text--*`, `fr-grid-row`, `fr-col-*`, `fr-container`, `fr-h*`…), aucun import de feuille, de JS ou de pictogramme du paquet, aucune variable CSS DSFR (`var(--text-title-blue-france)`…).
- **Rendu strictement DSFR** : Tailwind avec les jetons DSFR de F0 (points de rupture, échelle de texte, titres, palette `dsfr-*`, focus) et les composants de `shared/` ; valeurs reprises du CSS du DSFR 1.15.2, jamais approximées.
- **Boy-scout** : quand un lot touche un composant, il migre aussi les classes `fr-*` de ce composant (utilitaires compris) et retire l'import de feuille DSFR devenu inutile. Pas de migration hors du périmètre du lot (c'est le rôle de F3).
- **Relecture** : avant chaque push, `git diff` ne doit ajouter aucune ligne contenant `fr-` (hors suppression) ni `@gouvfr/dsfr`.

## Contraintes communes

- Identifiants techniques en anglais, termes du domaine en français ; aucun accent dans les chemins et identifiants créés ou touchés.
- Exports nommés ; conversion au passage des fichiers déplacés (sauf pages Next et configs).
- Rendus : Tailwind sur primitives radix dans `client/components/shared/`, pas de nouvelles classes `fr-*` ; couleurs depuis la config Tailwind ou la palette DSFR, jamais en dur ; helper `clsxm`.
- Pas de `as never` ni `as unknown` ; pas de commentaires explicatifs superflus.
- Formulaires : composant contrôlé branché via `Controller` de react-hook-form.
- Pilote Eval (décommissionné) et `PagePilotage/` (déprécié) : ne pas migrer, sauf si un composant partagé l'impose.
- PR empilées (chaque branche sur la précédente), mergées en squash une à une.
- Vérifications avant chaque push (depuis `apps/pilote-ppg`) : `pnpm lint:oxlint`, `tsc --noEmit` (`node --stack-size=65500 --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit`), `pnpm format:check`, `pnpm test:unit` ; E2E (`pnpm test:e2e`, après `rm -rf .next`) pour les lots qui touchent des écrans couverts.
- Refacto serveur : contrôle de résolution de toutes les clés DI par script temporaire (`src/__resolve_tmp.ts`, lancé via `pnpm exec dotenv -e .env -- tsx --tsconfig tsconfig.json`, puis supprimé).
- Front : pas de plan de tests ; recette à la main, avec l'URL exacte de chaque page et l'action à faire.

## Points de vigilance (à recetter à chaque lot)

1. Formulaires : une case, un champ ou un sélecteur migré doit toujours soumettre sa valeur (filtres de l'accueil, étapes de l'export, modale infolettre).
2. Impression : rapport détaillé et fiche conducteur gardent leur mise en page imprimée (titres, sauts de page).
3. Alignements : `align-center` → `items-center` et le retrait du préfixe `!` peuvent changer un rendu qui reposait sur l'erreur actuelle.
4. Listes de chantiers : même ordre et mêmes filtres sur l'accueil et le rapport détaillé avant et après fusion, à profil et territoire égaux.
5. Anonymisation : les dépôts partagés ne doivent rien exposer de plus aux profils qui voient aujourd'hui des auteurs anonymisés.

---

## Lot A — petits correctifs (S, 1 PR)

- [x] **A1. `app.scss` → `app.css`** (fait avec F0, pour pouvoir y utiliser `theme()` ; dépendance `sass` retirée) (`client/styles/app.scss`, importé par `pages/_app.tsx` et `PageConnexion/BoutonProConnect.tsx`). Vérifier l'absence de `$`, d'imbrication et de mixin, renommer, mettre à jour les imports. Supprime l'avertissement Sass sur `@import "tailwindcss"`.
- [ ] **A2. Triangles de tri du `DataTable`** (`shared/DataTable/SortButtons`) : décider de garder les SVG en dur ou de créer une icône au bon cadrage. Par défaut : garder, et retirer le point de la liste.
- [ ] **A3. Ancienne spec close** : § 13 de la spec d'origine marqué « clos le 2026-10-08, suite dans ce plan » (fait avec ce plan).

## Lot B — dernières primitives client (S–M, stack de 4 PR)

- [ ] **B1. Cases à cocher → `shared/Checkbox`** (M). `fr-checkbox-group` brut et `fr-input` associés dans :
  - `PageAccueil/Filtres/FiltresSelectionMultiple/FiltresSelectionMultiple.tsx`, `FiltresSelectionMultipleBoolean/FiltresSelectionMultipleBoolean.tsx` ;
  - `PageAccueil/PageChantiers/ExportDesDonnees/EtapeDonneeChantierACollecter.tsx`, `EtapeDonneeHistoriqueIndicateurACollecter.tsx`, `EtapeDonneeIndicateurACollecter.tsx` ;
  - `PageAccueil/PageChantiers/ModaleInscriptionInfoLettre/ModaleInscriptionInfolettre.tsx` ;
  - `_commons/CaseACocher/CaseACocher.tsx` (à supprimer une fois ses 3 importeurs migrés).

  Recette : filtres de `/accueil/chantier/NAT-FR`, modale d'export jusqu'au téléchargement, consentement de l'infolettre.
- [ ] **B2. Indicateur d'étapes sans `fr-stepper`** (S). `_commons/IndicateurDEtapes/IndicateurDEtapes.tsx` réécrit en Tailwind, puis les 4 modales de proposition de valeur qui posent `fr-stepper` à la main passent dessus : `ModalePropositionValeurAvancement`, `ModaleAccepterPropositionValeurAvancement`, `ModaleAccuserReceptionPropositionValeurAvancement`, `ModaleSuppressionValeurAvancement` (dans `_commons/IndicateursChantier/Bloc/`). Recette : les 4 modales sur une page chantier régionale.
- [ ] **B3. Liens `fr-link` → `shared/Button` (variante lien)** (S). 12 fichiers : 6 étapes de `ExportDesDonnees/`, `PageConnexion/PageConnexion.tsx`, `PageImportIndicateur/PageImportIndicateurSectionRessource/…`, `PageRapportsHebdomadaires/BlocChantier.tsx`, `IndicateursChantier/Bloc/Détails/Spécifications/IndicateurSpécifications.tsx`, `_commons/MiseEnPage/MiseEnPage.tsx`, `_commons/ResponsablesLigneChantier/ResponsablesLigneChantier.tsx`. Le `fr-btn` restant de `MiseEnPage.tsx` suit.
- [ ] **B4. Chargement, onglets, barre de territoire** (S) :
  - `shared/Skeleton` et `shared/Spinner`, à la place de `_commons/Loader`, `Squelette`, `PointsAttente` (5 importeurs : tableaux admin indicateurs, annuaire, tableau admin, historique d'une valeur, `MiseEnPage`) ; `ChatUI/DashboardLoader` et `CarteNewsletterSkeleton` s'appuient dessus ;
  - `shared/Tabs` (radix), à la place de `_commons/NavigationTertiaire` (3 importeurs : édition d'un chantier, annuaire, panneau Albert) ;
  - `_commons/Widget/TerritoireProgressBar.tsx` sur `shared/Progress`.

## Lot C — titres (M, 1 PR)

- [ ] **C1.** `_commons/Titre` (65 importeurs, ne fait que rendre `h1`–`h6`) et classes `fr-h*` (123 occurrences, 67 fichiers) → titres natifs avec une échelle Tailwind définie une fois (ou `shared/Heading` si l'échelle a besoin d'un composant). `SectionTitle` et sa copie locale dans `PageAdminChantiers/FicheChantier.tsx` suivent. Mécanique, mais touche presque tous les écrans : recette visuelle des pages principales et de l'impression (rapport détaillé, fiche conducteur, fiche territoriale).

## Lot D — nettoyages Tailwind (M, 2 PR séparées)

- [ ] **D1. `align-center` → `items-center`** (77 occurrences, 37 fichiers). Classe inexistante : l'alignement vertical attendu ne se fait pas aujourd'hui. Remplacer fichier par fichier en contrôlant le rendu ; garder l'étirement là où l'écran en dépend.
- [ ] **D2. Préfixe `!` des classes** (489 occurrences, 176 fichiers). `tailwind.config.js` a `important: true`, le `!` est redondant et empêche `clsxm`/`twMerge` de résoudre les conflits. D'abord là où il surcharge une classe par défaut d'un composant (`Icone`, boutons, liens), puis le reste ; vérifier au cas par cas les `!` qui combattent une règle DSFR non utilitaire.

## Lot E — serveur (stack, du plus mécanique au plus risqué)

- [ ] **E1. Frontière `src/shared` → `@/server`** (S). 7 imports à inverser :
  - `ProfilEnum` (`server/app/enum/profil.enum`) → `shared/utilisateur` ;
  - erreurs utilisées par `Habilitation` (`server/utils/errors`) → `shared` ;
  - `Profil` (`server/gestion-utilisateur/domain/Profil`) importé par `profils-gestion-utilisateur.ts` ;
  - `MinistereAccueilPorteur`, `MinisterePorteurRapportDetailleContrat` (contrats V2 de `chantiers`) et `DetailsIndicateur` (`chantiers/domain`) importés par les interfaces de `shared/chantier` et `shared/indicateur`.

  Cible : `src/shared` n'importe plus rien de `@/server`.
- [ ] **E2. Noms de fichiers serveur sans accents** (S, mécanique). 41 fichiers sous `server/` (ex. `chantiers/usecases/RécupérerCommentairesLesPlusRécents…`, `gestion-utilisateur/usecases/RécupérerUnProfilUseCase.ts`, `fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase.ts`, `fiche-conducteur/…/PrismaSynthèseDesRésultatsRepository.ts`). Fichiers seulement ; les identifiants accentués suivent dans la même PR quand ils sont propres au fichier renommé.
- [ ] **E3. `territoire.list` sur la version `gestionUtilisateur`** (S, décision préalable). La route (`gestion-utilisateur/infrastructure/trpc/territoire.ts`) résout `recupererTerritoiresAvecNombreUtilisateursSQLUseCase`, où `[]` signifie « aucun territoire » ; la version du module traite `[]` comme « tous » (voulu, décision 2026-09-30). Migrer en adaptant l'appelant, puis supprimer la version SQL.
- [ ] **E4. Répartition météo unique** (S–M). Trois implémentations : `chantiers/usecases/RecupererRepartitionMeteoChantiersUseCase.ts` (ex-legacy, SSR accueil et rapport), `chantiers/infrastructure/queries/GetRepartitionMeteoChantiersQuery.ts` (widget), `fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase.ts`. Garder la query ; test de caractérisation sur les sorties actuelles avant de rebrancher.
- [ ] **E5. Dépôts commentaire / objectif / décision / synthèse dupliqués** (M). Copies « table près » dans `gestion-utilisateur/infrastructure/adapters/Prisma{Commentaire,Objectif,DecisionStrategique,SyntheseDesResultats}Repository.ts`, `fiche-conducteur/infrastructure/adapters/Prisma…Repository.ts` (4) et `fiche-territoriale/infrastructure/adapters/PrismaSyntheseDesResultatsRepository.ts`, à côté des dépôts SQL des modules `commentaires`, `objectifs`, `decisions-strategiques`, `syntheses-des-resultats`. Cible : mappers partagés et un dépôt d'anonymisation paramétré ; tests d'intégration existants comme filet, plus un test par cas d'anonymisation.
- [ ] **E6. Fusion des listes de chantiers accueil / rapport détaillé** (M–L). `chantiers/usecases/RecupererChantiersAccessiblesEnLectureUseCaseV2.ts` (287 l.) et `…RapportDetailleV2.ts` (307 l.) : filtres DROM / territorialisé, `appliquerFiltre`, `appliquerTri` (~140 l.) et réduction copiés ; différences : `avancement.annuel` vs `.global` pour le tri, presenter, résolution des responsables. Bloc de filtres d'alertes copié aussi entre `pages/accueil/chantier/[territoireCode]/index.tsx` et `rapport-detaille.tsx`.
  1. Tests de caractérisation (aucun aujourd'hui) : tri et filtres sur un jeu de chantiers, pour les deux use cases.
  2. `appliquerTri` / `appliquerFiltre` et le filtre d'alertes dans `chantiers/domain`.
  3. Un use case paramétré par presenter et clé de tri ; suffixes `V2` retirés.

  À coordonner avec les optimisations de performance en cours sur ces use cases (ordre ou fusion des branches à décider avant de commencer).

## Lot F — sortie de la bibliothèque DSFR, rendu strictement DSFR (L ; F0 en premier, le reste en dernier)

**But :** retirer la dépendance `@gouvfr/dsfr` (JS, CSS du cœur et des composants, police, pictogrammes) **sans changer le rendu** : chaque composant, utilitaire et style de base est reproduit en Tailwind avec les valeurs du DSFR 1.15.2, comme pour les lots précédents. Tout écart visuel avec le DSFR est un bug.

**État au 2026-10-08** (hors Pilote Eval / PagePilotage, 34 occurrences de leur côté) :
- JS : `dsfr.module.min.js` importé après l'hydratation dans `pages/_app.tsx` ;
- CSS : `core.min.css` + 5 feuilles de composants dans `_app.tsx` (link, connect, form, input, checkbox), ~25 feuilles importées localement (header, logo, footer, navigation, button, modal, notice, badge, sidemenu, radio, select, stepper, breadcrumb, download, upload, card, utilitaire colors) ;
- police Marianne fournie par les `@font-face` de `core.min.css` ; pictogrammes importés depuis `@gouvfr/dsfr/dist/artwork` (6 fichiers) ; 30 usages de variables CSS DSFR (`var(--border-default-grey)`…) dans 4 fichiers ;
- 2 454 classes `fr-*` : espacements ≈ 1 000, `fr-text*` 522, grille (`fr-grid-row`, `fr-col-*`, `fr-container`) ≈ 530, `fr-h*` 91, formulaires ≈ 110, mise en page (`fr-footer`, `fr-nav`, `fr-header`, `fr-logo`, `fr-breadcrumb`) ≈ 50, divers (`fr-artwork`, `fr-background`, `fr-hr`, `fr-hidden`, `fr-responsive`, `fr-download`, `fr-upload`, `fr-card`, `fr-connect`) ≈ 130.

**Référence :** valeurs relevées dans `node_modules/@gouvfr/dsfr/dist/core/core.css` (et feuilles de composants) avant toute suppression :
- points de rupture DSFR `36em` / `48em` / `62em` / `78em` (576 / 768 / 992 / 1248 px) — **différents des défauts Tailwind** (640 / 768 / 1024 / 1280), seul `md` coïncide ;
- texte : `fr-text--xs` 0.75rem / 1.25rem, `--sm` 0.875rem / 1.5rem, `--md` 1rem / 1.5rem, `--lg` 1.125rem / 1.75rem — **interlignages différents de `text-xs` / `text-sm` Tailwind** ;
- titres (mobile → ≥ 48em) : h1 2rem/2.5rem → 2.5rem/3rem, h2 1.75rem/2.25rem → 2rem/2.5rem, h3 1.5rem/2rem → 1.75rem/2.25rem, h4 1.375rem/1.75rem, h5 1.25rem/1.75rem, h6 1.125rem/1.5rem ; marge basse des titres et paragraphes 1.5rem (`--title-spacing`, `--text-spacing`) ;
- espacements : `1v` = 0.25rem, `1w` = 0.5rem (échelle Tailwind de base 0.25rem : `fr-mb-2w` = `mb-4`, `fr-py-1v` = `py-1`) ;
- grille : `fr-container` padding horizontal 1rem (et largeur max aux points de rupture), gouttières `fr-grid-row--gutters` -0.5rem ;
- focus : outline 2px solid `#0a76f6`, offset 2px ; liens soulignés par `background-image` (épaisseur variable au survol).

- [x] **F0. Jetons DSFR dans Tailwind** (M, **à faire en premier, avant le lot A** : la règle DSFR ci-dessus s'appuie dessus). Points de rupture DSFR (`screens`), échelle de texte avec interlignages DSFR, titres, palette complète utilisée (compléter les `dsfr-*` de `tailwind.config.js` pour remplacer les 30 variables CSS), anneau de focus, Marianne hébergée dans l'app (`public/fonts` + `@font-face` dans `app.css`, `fontFamily`).
  Impact sur le Tailwind existant (relevé 2026-10-08) : `md:` (179 usages) coïncide déjà avec le DSFR ; `sm:` 25, `lg:` 22, `2xl:` 4, `max-sm:` 3, `max-md:` 1 (≈ 15 fichiers) changent de seuil → recette des écrans concernés. Échelle de texte : `text-sm` (296 usages) et `text-xs` (150) changeraient d'interlignage (1.25rem → 1.5rem, 1rem → 1.25rem). **Décision à prendre au début de F0** : aligner le thème Tailwind sur le DSFR (rendu plus fidèle, recette large) ou ajouter des tailles nommées DSFR à côté des défauts et les utiliser dans le nouveau code (aucun changement immédiat, deux échelles qui coexistent jusqu'à F3).
  **Fait (2026-10-08)** — décisions : thème aligné sur le DSFR (`text-xs` / `text-sm` / `text-base` / `text-lg` aux valeurs `fr-text--*`, `text-lead` pour `fr-text--lead`, `text-xl` inchangé faute d'équivalent DSFR ; titres `text-h1`…`text-h6` mobile et `md:text-h1-md`…`md:text-h6-md`) ; points de rupture DSFR (`sm` 36em, `md` 48em, `lg` 62em, `xl` 78em, `2xl` 96em) ; ombres `shadow-dsfr-raised` / `-overlap` / `-lifted` et couleur `dsfr-shadow` ; Marianne servie depuis `public/fonts/marianne` (exclu du proxy d'authentification). `app.css` : variables DSFR remplacées par `theme(colors.dsfr-*)`, 32 règles qui doublonnaient un utilitaire Tailwind (déjà écrasées, les utilitaires étant `!important`) supprimées ; les classes maison restantes (`texte-*`, `fr-text-title--*`, `fr-background-*`, bordures en gris DSFR…) partent avec F3.
- [ ] **F1. JS DSFR et imports CSS morts** (S). Retirer `import("@gouvfr/dsfr/dist/dsfr.module.min.js")` et `client/dsfr.d.ts` : plus aucun composant ne dépend du JS (les `data-fr-steps` du stepper sont lus par le CSS, le fil d'Ariane gère son état en React, l'en-tête n'en dépend plus depuis #2500). Supprimer les imports de feuilles sans classe restante : `badge.min.css` (4 fichiers, 0 `fr-badge`), `radio.min.css` (export), puis `sidemenu` / `select` une fois leur dernier usage retiré. Recette : en-tête mobile, fil d'Ariane, modales, stepper des propositions de valeur.
- [ ] **F2. Derniers composants reproduits dans `shared/`** (M). Après les lots B et C : pied de page, navigation principale et logo de l'en-tête, fil d'Ariane, carte de la landing, téléchargement (`fr-download`, import), upload (`InputFichier`), bouton ProConnect (rendu officiel imposé, à reproduire à l'identique), `fr-hr`, `fr-artwork` / pictogrammes (SVG copiés dans l'app). Chaque composant retire sa feuille DSFR.
- [ ] **F3. Utilitaires du cœur → Tailwind** (L, scripté). Script de remplacement avec table de correspondance (espacements v/w, `fr-text--*`, `fr-text--bold`, `fr-text-title--blue-france`, `fr-hidden` / `fr-unhidden-*`, `fr-responsive-*`, grille `fr-grid-row` / `fr-col-*` / `fr-container` vers flex ou grid avec les points de rupture de F0). Passage par dossier en PR empilées pour garder des diffs relisibles ; recette visuelle des pages du dossier, impression comprise.
- [ ] **F4. Styles de base du cœur reproduits, puis `core.min.css` débranché** (L, le plus risqué). Reproduire en `@layer base` ce que le cœur applique sans classe : typographie par défaut (corps, titres, paragraphes et leurs marges), liens soulignés, listes, `hr`, focus, couleurs de texte et de fond. Débrancher `core.min.css` et les feuilles de `_app.tsx` seulement quand le rendu est identique sur toutes les pages : captures avant / après des pages principales (accueil, page chantier, rapport détaillé et son impression, fiche conducteur, fiche territoriale, admin utilisateurs / indicateurs / chantiers, connexion, landing) comme aide à la recette.
- [ ] **F5. Retrait du paquet** (S). Supprimer `@gouvfr/dsfr` de `package.json` une fois plus aucun import. Prérequis : Pilote Eval supprimé, ou accord explicite pour que ses pages perdent leur style.

## Hors de ce plan

- PDF serveur du rapport détaillé (#2488) : à retravailler (worker thread, pdfmake bloque la boucle d'événements 2 à 4 s).
- Gestion des comptes : PIL-1852 (performance de `/admin/utilisateurs`, E2E de caractérisation, refacto du formulaire).
- Cartographie : tracés SVG (`CartographieSVGContrat`) et moteur SVG du PDF conservés jusqu'au passage en GeoJSON.
- Pilote Eval / PagePilotage : suppression à part ; ils portent l'essentiel des `fr-btn` / `fr-link` restants.
- Identifiants accentués définis dans les domaines (`vérifierLesHabilitationsEnLecture`, `TerritoireNonAutoriséErreur`, schémas `validation…`) : renommage à part.
- E2E instables à surveiller (§ 12 de la spec d'origine : « Direction accepte avec modification », « Filtre par profil »).

## Ordre proposé

0. F0 (jetons DSFR dans Tailwind) : prérequis de la règle DSFR, avant tout autre lot.
1. Lot A, puis lot B (stack B1 → B4) : petits, visibles, sans dépendance.
2. E1 → E4 : mécaniques ou bien bornés.
3. Lot C, puis lot D (D1, D2) : larges, recette visuelle dédiée.
4. E5, puis E6 une fois l'ordre avec le travail de performance tranché.
5. Reste du lot F en dernier : F1 dès que le lot B est mergé ; F2 → F5 après les lots B, C et D, qui retirent déjà une partie des classes `fr-*`.
