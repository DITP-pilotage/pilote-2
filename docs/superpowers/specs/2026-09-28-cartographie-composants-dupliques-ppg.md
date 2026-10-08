# Cartographie des composants dupliqués — pilote-ppg

Date : 2026-09-28 — base : `refactor/ppg-PIL-1822-refonte-tableaux` (après la refonte des tableaux)

Objectif : recenser tout ce qui existe en plusieurs versions dans `apps/pilote-ppg` (suffixes `New`, `V2`, `Legacy`, `Custom`, doublons `_commons` / `shared`, copier-coller serveur) pour planifier le refacto. Chemins relatifs à `apps/pilote-ppg/src/`. Compteurs = nombre de fichiers importateurs (hors tests).

Légende effort : **S** < ½ j, **M** ½–2 j, **L** > 2 j. **EVAL** = Pilote Eval (décommissionné : `Evaluation/`, `PageAutoEvaluation/`, `PageAppreciation/`, `PageNoteCollective/`, `PageUtilisateur(s)PiloteEval/`, `pages/evaluation/**`). **PILOT** = `PagePilotage/` (déprécié).

## 0. À savoir avant de commencer

- **Les pages « Legacy » ne servent plus en prod mais restent le chemin par défaut du code.** Les bascules passent par `useEnv()` (`client/hooks/useEnv.ts`, tRPC `gestionContenu.recupererToutesLesVariablesContenu`) : défauts à `false` dans `config.ts` (~l. 348-373), surchargeables en base via le panneau feature flipping (seulement si `FF_FEATURE_FLIP_ADMIN=true`). En prod, `REFONTE_PAGE_CHANTIER` et `REORGANISATION_PAGE_ACCUEIL` sont **actifs** (état au 2026-09-29, § 11).
- **Les E2E ne couvrent que le Legacy.** Playwright démarre le serveur avec `.env.e2e` (`test:e2e:server`), qui ne déclare ni `REFONTE_PAGE_CHANTIER`, ni `REORGANISATION_PAGE_ACCUEIL`, ni `REPARTITION_METEOS_V2`, ni `CHANTIERS_SIGNALES_V2` (donc `false` par défaut), ni `FF_FEATURE_FLIP_ADMIN` (pas de surcharge base). `.env.test` ne sert qu'à Vitest (`vitest.setup*.ts`) et est lui-même très en retard sur la prod (`NOUVELLE_PAGE_ACCUEIL`, `TA_ANNUEL`, `FICHE_CONDUCTEUR`… à `false`). → **Aligner `.env.e2e` sur la prod avant tout refacto des pages** (lot 0).
- Les flags sont évalués **côté client** : le SSR calcule les données des deux variantes.
- `NEXT_PUBLIC_FF_PPG_ARCHIVE` est lu côté SSR via `new RecupererVariableContenuUseCase()` (env seul) et **ignore la surcharge base** (`pages/chantier/[id]/[territoireCode].tsx:148`, `pages/swagger.tsx`, `pages/chantier/[id]/fiche-conducteur.tsx`) — incohérence à corriger au passage.
- Le JS DSFR est chargé globalement (`pages/_app.tsx:37`) : remplacer du balisage `fr-accordion`/`fr-collapse`/`fr-sidemenu` change le comportement, pas seulement le style.
- Du code vivant dépend de Pilote Eval : `_commons/Input.tsx`, `_commons/Textarea.tsx`, `_commons/InputNote.tsx` importent `PageAutoEvaluation/MessageErreur` → à déplacer avant toute suppression d'EVAL.
- Aucun test unitaire sur les use cases de liste de chantiers (`appliquerTri`), ni sur les presenters de contrats : écrire des tests de caractérisation avant de fusionner.

---

## 1. Pages à double version (flag)

Les deux flags sont actifs en prod : le Legacy n'est plus servi qu'en local et en E2E.

| Sujet | Nouveau | Legacy | Flag | Ce qui meurt avec le Legacy | Effort |
|---|---|---|---|---|---|
| Page chantier | `client/components/PageChantier/PageChantier.tsx` + `sections/SectionAvancementChantier.tsx`, `SectionRepartitionGeographique.tsx` | `PageChantierLegacy.tsx` + `sections/*Legacy.tsx` | `NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER` (`pages/chantier/[id]/[territoireCode].tsx:293`) — plan : `docs/REFONTE_PAGE_CHANTIER.md` | les 2 sections `*Legacy`, `_commons/Cartographie/CartographieAvecSelecteur/*`, props SSR `avancements` / `cartographieGaucheChantier` / `cartographieDroiteChantier`, `carteChG`/`carteChD` (`client/searchParams/chantierDetailSearchParams.ts`), `calculerChantierAvancementsNew` + ancien `agrégateur/` | M |
| Page accueil | `PageAccueil/PageAccueil.tsx` (`BasePageAccueilLayout`, `sections/*`) | `PageAccueilLegacy.tsx` (quasi copie du layout) → `PageChantiers/PageChantiers.tsx` | `NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL` (`pages/accueil/chantier/[territoireCode]/index.tsx:283`) | `PageChantiers.tsx`, `FiltresMeteos/RepartitionsMeteosChantiers.tsx`, `_commons/RemontéeAlerteChantier/`, carto accueil ancienne ; flags imbriqués `FF_REPARTITION_METEOS_V2`, `FF_CHANTIERS_SIGNALES_V2` ; use case météo legacy (§ 7.4) | M |

Différences clés : la nouvelle page chantier passe par `IndicateurDetailsModeProvider mode="widget"` (widgets `ComparaisonTerritoires*`, avancement via tRPC `chantier.recupererAvancementChantier`) ; la nouvelle accueil utilise toujours les widgets V2. Après bascule, élaguer les props SSR devenues inutiles (le SSR fait aujourd'hui un travail en double).

---

## 2. Cartographie

| | Ancienne | Nouvelle |
|---|---|---|
| Fichiers | `client/components/_commons/Cartographie/**` (27 fichiers, d3-zoom, légendes et hooks par type) | `_commons/CartographieV2/*` (8 fichiers, pilotée par props, hachures, `SecureTooltip`) |
| Utilisateurs | accueil legacy, page chantier legacy, **`PageChantier/ChoixTerritoire`** (profil DROM, les deux variantes), `IndicateurDétails` hors mode widget, **`PageFicheConducteur`**, **`PageRapportDétaillé/Cartes` + `VueDEnsemble`** (impression) ; types dans `fiche-conducteur/app/contrats/FicheConducteurContrat.tsx` (serveur) et `constants/légendes/*` | les `_commons/Widget/WidgetCartographie*` (accueil, comparaison territoires, IndicateurDétails widget, ChatUI dashboards) |

- CartographieV2 dépend encore de l'ancienne : `getTraceSvg` (`Cartographie/SVG/CartographieSVGContrat.tsx`, 1 359 lignes de tracés) et `Remplissage` (`Cartographie/Légende/CartographieLégende.interface.ts`).
- Piège : deux hooks différents nommés `useCartographieAvancement.tsx`.
- Code mort : `PageChantier/Cartes/Cartes.tsx` (seul son type `CartographieType` est importé) — déplacer le type, supprimer (S). Ne pas confondre avec `PageRapportDétaillé/Cartes/Cartes.tsx`, vivant.
- **Cible** : CartographieV2. Étapes : déplacer tracés SVG + interfaces de légende hors de `Cartographie/`, puis migrer rapport détaillé, fiche conducteur (impression), ChoixTerritoire, IndicateurDétails. **L**.

---

## 3. Indicateurs

| Sujet | Fichiers | Constat | Cible | Effort |
|---|---|---|---|---|
| Propositions de valeur d'avancement « V2 » | `_commons/IndicateursChantier/Bloc/LignesPropositionValeurAvancementV2.tsx`, `BaseLignesPropositionValeurAvancement.tsx`, `ModalePropositionValeurAvancementV2/`, `ModaleSuppressionValeurAvancementV2/` ; tRPC `propositionValeurAvancement.creerV2` / `supprimerV2` ; `validation/proposition-valeur-avancement.ts` (`validationSuppressionValeurAvancementV2`) | Plus de V1 : le suffixe est vestigial. Base + V2 = découpage de composition. ~20 lignes d'habilitation répétées dans 5 procédures tRPC. Flag interne `NEXT_PUBLIC_FF_PVA_VALEUR_DIFFERENTE` | Renommer sans V2 (composants, hooks, procédures, schéma), helper d'habilitation, éventuellement fusionner Base dans Lignes | S |
| Évolution d'un indicateur | `Bloc/Détails/Évolution/useIndicateurEvolution.ts` (chart.js, 74 l.) et `useIndicateurEvolutionNew.ts` (echarts, 458 l.) | Les deux appelés dans `IndicateurEvolution.tsx` ; l'ancien ne sert plus qu'à un `hasData` dans `BaseIndicateurEvolution.tsx`. Ce sont les 3 seuls fichiers chart.js | Garder New renommé, calculer `hasData` depuis `historiquesValeurs`, supprimer l'ancien hook, `ChartJS.register` et la dépendance `chart.js` | S |
| IndicateurBloc × 2 | `_commons/IndicateursChantier/Bloc/{IndicateurBloc, IndicateurBloc.interface, indicateurBlocIndicateurTuile, ValeurEtDate}` vs `PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/{…mêmes noms}` | Tuiles et `ValeurEtDate` quasi identiques (classes d'impression, 2 classes d'écart), interfaces qui ne diffèrent que par le nom et `territoireCode` | Tuile + `ValeurEtDate` pilotées par props avec un mode impression, supprimer les copies rapport ; garder deux blocs ou amincir celui du rapport | S–M |

---

## 4. Stores, hooks, utilitaires

| Sujet | Constat | Cible | Effort |
|---|---|---|---|
| `client/stores/useFiltresStore/` vs `useFiltresStoreNew/` | Ancien : **0 importeur** (vérifié). New : 19 | Supprimer l'ancien, renommer New → `useFiltresStore` | S |
| `client/utils/chantier/agrégateur/` + `avancement/calculerChantierAvancementsNew.ts` | Alimentent seulement la prop `avancements` de la page chantier legacy | Supprimer avec le legacy (§ 1) | S |
| `client/utils/chantier/agrégateurRapportDetailleNew/` | Seule version pour le rapport détaillé (SSR) | Renommer sans `New` | S |
| `client/utils/chantier/agrégateurListeChantiers/` | Importé **uniquement côté serveur** (4 fichiers) | Déplacer sous `server/` | S |
| `client/utils/chantier/avancement/avancement.ts` | **0 importeur** (vérifié) | Supprimer | S |
| `useRemontéesAlertesChantiers.ts` (`PageAccueil/PageChantiers/` et `PageRapportDétaillé/`) | **Identiques à l'octet** | Un seul hook partagé | S |
| `useVueDEnsemble.ts` (mêmes dossiers) | Ne diffèrent que par le type de contrat | Hook générique | S |

---

## 5. Contrôles de formulaire

### 5.1 Sélecteurs simples (7 implémentations)

| Composant | Techno | Importeurs | Statut |
|---|---|---|---|
| `_commons/SelecteurCustom/` | bouton + liste DSFR maison | **0** (vérifié) | mort → supprimer (S) |
| `_commons/SélecteurAvecRecherche/` | DSFR maison + recherche | 1 (`MetadataChamp`) | migrer vers `shared/Picker` (S) |
| `_commons/Sélecteur/Sélecteur.tsx` | `<select class="fr-select">` + RHF `register` | **15** (pages d'édition admin, import indicateur, fiche indicateur, `SaisieDesInformationsUtilisateur`, `CartographieAvecSelecteur*`, 1 EVAL) | migrer (adaptateur `Controller`) — M-L |
| `_commons/SelecteurNew/SelecteurNew.tsx` | enveloppe `shared/Picker` + `shared/Select` | 4 | cible API haut niveau, renommer `Selecteur` |
| `shared/Select.tsx` / `shared/Picker.tsx` | Radix | 6 / 3 | primitives cibles |
| `_commons/SelecteurJalon/` | natif `fr-select` | 5 | métier, à passer sur `shared/Select` |
| `<select>` bruts | — | `SelectMetadata`, `GraphesLogs`, `TableauLogs`, `ModaleInsertionUrl`, `InputGroupe`, `DataTable/Pagination` (taille de page), EVAL | à migrer |

Doublon associé : `PageMonProfilUtilisateur/SelectService.tsx` vs `PageUtilisateurFormulaire/.../SelectServiceAdmin.tsx` (~95 % identiques, seul le hook de formulaire change) → un composant qui reçoit `control` (S).

### 5.2 Multi-sélecteurs

| | `_commons/MultiSelect/` | `_commons/MultiSelectNew/` |
|---|---|---|
| Importeurs | 4-5 (`AdminIndicateurBarreLatérale`, `SaisieDesInformationsUtilisateur`, types dans `InputGroupeItem`, `SélecteursMaillesEtTerritoires`) | 4-5 (`AdminUtilisateursBarreLatérale`, `MultiSelectPorteursDAC`, `MultiSelectPorteursSecondaires`, `SaisieDesInformationsUtilisateur`) |
| Différences | `MultiSelectTerritoire` charge ses territoires lui-même ; `MultiSelectPérimètreMinistériel` a `desactive` ; exports par défaut | territoires reçus en props ; `MultiSelectProfil` en plus ; exports nommés |

`SaisieDesInformationsUtilisateur.tsx` mélange les deux. **Cible** : MultiSelectNew renommé `MultiSelect`, avec option d'auto-chargement des territoires et `desactive` (M). À terme : converger avec `_commons/MultiSelectFiltre` (déjà sur `shared/Dropdown` + `shared/Checkbox`) et retirer la dépendance `react-accessible-dropdown-menu-hook` (utilisée par `InputGroupe`, `MultiSelect`, `MultiSelectNew`, `SélecteurAvecRecherche`, `SelecteurCustom`).

### 5.3 Champs texte

| Famille | Implémentations | Cible |
|---|---|---|
| Input | `_commons/Input.tsx` (Tailwind + RHF `Controller`, 10) ; `_commons/Input/Input.tsx` (DSFR `register`, 5) ; `_commons/InputAvecLabel/` (2) ; `fr-input` brut (≈18 fichiers) | Paire Tailwind/`Controller` déplacée dans `shared/` (ex. `shared/Field`) avec `MessageErreur` partagé — M-L |
| Textarea | `_commons/Textarea.tsx` (10 dont 2 EVAL) ; `_commons/TextArea/TextArea.tsx` (2) ; `_commons/TextAreaAvecLabel/` (4, modales de proposition) | idem |
| Recherche | `_commons/BarreDeRecherche` (`fr-search-bar`, 5 dont `DataTable/Filters`) + 6 champs de recherche maison | `shared/SearchInput` |
| Divers | `PageIndicateur/ChampObligatoire.tsx` n'est qu'une réexportation de `_commons/ChampObligatoire/` (4 importeurs) | repointer, supprimer (S) |

### 5.4 Cases à cocher / radios

`shared/Checkbox` (5 dont 2 EVAL), `_commons/GroupeCasesACocher` (sur shared), `_commons/CaseACocher` (DSFR + `register`, 1), `fr-checkbox-group` brut (9), `<input type="checkbox">` brut (16 dont 2 PILOT), radios brutes (3 : étapes d'export, `ModaleAccepterPropositionValeurAvancement`). **Pas de `shared/RadioGroup`** → à créer. Cible : `shared/Checkbox` + champ libellé compatible RHF + `shared/RadioGroup` (M).

---

## 6. Primitives UI : `_commons` vs `shared`

Déjà convergés (enveloppes minces sur `shared`) : `Interrupteur` → `Switch`, `BarreDeProgression` → `Progress`, `GroupeCasesACocher` / `MultiSelectFiltre` → `Checkbox`, `NomUtilisateurAvecTooltip` → `Tooltip`, `SelecteurNew` → `Select`/`Picker`. Pagination : uniquement `shared/DataTable/Pagination`. Emotion : plus aucun import.

| Rôle | Implémentations (importeurs) | Cible | Effort |
|---|---|---|---|
| Accordéon | `shared/Accordion` (7) ; `shared/Disclosure` (2, **tous EVAL**) ; `fr-accordion` brut (6 : `Nouveautés`, `FiltresActifs`, `IndicateursChantier`, `IndicateurDétails`, `ModaleHistoriqueIndicateurTerritoireValeurEvenement`, `FicheIndicateur`) ; `fr-collapse` brut (13) ; `aria-expanded` maison (3) ; `<details>` (2) | `shared/Accordion` (+ variante mono-élément si besoin) ; `Disclosure` part avec EVAL. Les `fr-collapse` des barres latérales se migrent avec elles | M |
| Infobulle | `_commons/Infobulle` (**35**, positionnement maison, bleu clair) ; `shared/Tooltip` (6, dont 4 EVAL/PILOT, gris foncé) ; `_commons/SecureTooltip` (cartes) ; tooltips CSS `group-hover` (2) | Refaire l'intérieur d'`Infobulle` sur `shared/Tooltip` en gardant son API ; variante « info » bleu clair dans `Tooltip.Content` ; `SecureTooltip` réservé aux cartes | S (M si alignement des styles) |
| Modale | `shared/Modale` (24) ; `Dialog` brut (`ChatUI/AlbertOverlay`, voulu) ; `fr-modal` brut (menu mobile `BaseNavigation`) ; restes `data-fr-opened` (`PageAdminIndicateurs`, `EnTete`, `BoutonSousLigné`) | `shared/Modale`, réexporter `Modale.Close`, nettoyer `data-fr-opened` | S |
| Interrupteur | `_commons/Interrupteur` (8) sur `shared/Switch` | Garder ; retirer l'import mort `toggle.min.css` et l'`id="toggle-698-hint-text"` codé en dur (bug si deux instances) ; idéalement `Switch.Field` | S |
| Alertes / encarts | `_commons/Alerte` (**30**, `fr-alert`) ; `shared/Callout` (6) ; `fr-alert` brut (7) ; `fr-callout` brut (5, modales de proposition) ; `_commons/BandeauInformation` (5, `fr-notice`) ; `fr-notice` brut (2) ; `_commons/MiseEnAvant` (1) ; `_commons/Encart` (4) | `shared/Callout` + titre optionnel + correspondance des types d'Alerte + variante bandeau | M-L |
| Menus déroulants | `shared/Dropdown` (5) ; menus maison via `react-accessible-dropdown-menu-hook` (5) | `shared/Dropdown` | S (menus) |
| Toggles / tags | `shared/SegmentedControl` (3) ; `shared/PillToggleGroup` (1) ; `_commons/Tag` (4, `fr-tag`) ; `_commons/ButtonTag` (2, **EVAL**) ; `fr-tag` brut en toggle (`SélecteurMaille`, `FiltresSelectionUnique`, `LineChartLegende`) ; boutons `aria-pressed` maison (4) | Choix unique → `SegmentedControl`/`PillToggleGroup` ; puces supprimables → `shared/Tag` Tailwind (à créer) | M |
| Barres de progression | `_commons/BarreDeProgression` (11) sur `shared/Progress` ; `BarreProgressionEvaluation` (3, **EVAL**) ; `Widget/TerritoireProgressBar` (div maison) | `BarreDeProgression` ; `TerritoireProgressBar` sur `Progress` | S |
| Boutons / liens | `_commons/Bouton` (43, classes `fr-btn`) ; `SubmitBouton` (7) ; `BoutonSousLigné` (10) ; `Lien` (11) ; `fr-btn` brut (55) ; `fr-link` brut (28 dont 8 PILOT) ; ~97 `<button>` Tailwind ad hoc | **Pas de `shared/Button`** → à créer (variantes primary/secondary/tertiary/link, tailles, `asChild`), puis rebrancher Bouton/SubmitBouton/Lien/BoutonSousLigné | L (S en passant par `Bouton`) |
| Badges | `_commons/Badge` (10, `fr-badge` + Tailwind) et dérivés (`BadgeStatutReferentiel`, `MétéoBadge`, `BadgeTendance`) ; `_commons/BadgeIcône` (4) ; `_commons/BadgeFicheEtape` (**0, mort**) ; `fr-badge` brut (8) ; badges locaux (Albert, centre d'aide) | `shared/Badge` 100 % Tailwind avec emplacement d'icône | S-M |
| Titres | `_commons/Titre` (**70**, ne fait que rendre `h1`–`h6`) ; `_commons/SectionTitle` (6) + **copie locale** dans `PageAdminChantiers/FicheChantier.tsx:43` ; `fr-h*` (64 fichiers) | Titres natifs + échelle Tailwind, ou `shared/Heading` ; `FicheChantier` importe `SectionTitle` | M |
| Icônes | `_commons/Icone` (127) + `_commons/Icones/*` (378 SVG, dont ~249 servant seulement au sélecteur d'icônes de l'éditeur riche) ; SVG en ligne (15, chevrons de `shared/Accordion`, `Disclosure`, `DataTable/SortButtons`, `MenuLateralPanelAdministrateur`…) | Garder ; remplacer les chevrons en ligne par `Icones/ArrowSLine*` | S |
| Chargement | `_commons/Loader` (4), `DashboardLoader`, `Squelette`, `PointsAttente`, `CarteNewsletterSkeleton` | `shared/Skeleton` + `shared/Spinner` | S |
| Barres latérales | `_commons/BarreLatérale` (7) ; `fr-sidemenu` brut + JS DSFR (4 `PageAccueil/Filtres/*`, 2 barres admin) ; `MenuLateralPanelAdministrateur` (Tailwind) | `BarreLatérale` + sections `shared/Accordion` (fin de la dépendance au JS DSFR) | M |
| Onglets | `_commons/NavigationTertiaire` (Radix Tabs, 2) ; `SegmentedControl` utilisé en onglets (logs) ; onglets maison (EVAL) | `shared/Tabs` | S |
| Étapes | `_commons/IndicateurDEtapes` (3) ; `fr-stepper` brut (4 modales de proposition + 1 EVAL) | `IndicateurDEtapes` | S |

---

## 7. Serveur et API

### 7.1 « V2 » sans V1 (renommages)

| Élément | Appelants | Effort |
|---|---|---|
| `server/chantiers/usecases/RecupererChantierUseCaseV2.ts` | `pages/chantier/[id]/[territoireCode].tsx` (+ à vérifier : `pages/chantier/[id]/indicateurs.tsx`) | S |
| `ListerDetailsIndicateurTerritoireUseCaseV2.ts` | 1 page + 7 queries `server/chantiers/infrastructure/queries/*` (tests d'intégration qui l'instancient à renommer aussi) | S |
| `RecupererDetailsIndicateursV2UseCase.ts` | 1 page | S |
| Méthodes `récupérerTousNew`, `récupérerLesEntréesDeTousLesChantiersHabilitésNew` (`PrismaTerritoireRepository`, `PrismaChantierRepository`) | — | S |
| `pages/api/export/chantiers-v2.ts`, `indicateurs-v2.ts` | 1 appel client (`PageAccueil/PageChantiers/ExportDesDonnees/EtapeRecapitulatif.tsx`) ; E2E `tests/export-csv-*.spec.ts` | S (prévoir une redirection pour d'éventuels liens externes) |

### 7.2 Listes de chantiers : accueil vs rapport détaillé

- `RecupererChantiersAccessiblesEnLectureUseCaseV2.ts` (287 l.) et `…RapportDetailleV2.ts` (307 l.) : filtres DROM/territorialisé, `appliquerFiltre`, **`appliquerTri` (~140 l.)** et boucle de réduction copiés à l'identique. Seules différences : `avancement.annuel` vs `.global` pour le tri, presenter, résolution des responsables côté rapport.
- Bloc de filtres d'alertes copié aussi entre `pages/accueil/chantier/[territoireCode]/index.tsx:149-186` et `rapport-detaille.tsx:175-212` (`jalonParDefaut` vs `global`).
- Contrats : `ChantierRapportDetailleContratV2` (461 l.) est un sur-ensemble de `ChantierAccueilContratV2` (355 l.) ; `ChantierContrat` (233 l.) est un 3ᵉ mapping des mêmes lignes Prisma. `server/domain/chantier/Chantier.interface.ts` (legacy) importe les types de ces nouveaux contrats.
- Le contrat des critères de tri est déjà unifié (`server/chantiers/app/contrats/TriChantiers.ts`, PIL-1822).
- **Cible** : un use case paramétré par presenter + clé de tri, `appliquerTri`/`appliquerFiltre` dans `chantiers/domain`, filtre d'alertes dans le domaine, un mapping par territoire + enrichissement optionnel. **M**, après tests de caractérisation (aucun test unitaire aujourd'hui ; couverture indirecte : `PrismaChantierRepository.integration.test.ts`, E2E accueil).

### 7.3 Conteneur DI `legacy` (`server/legacy/module.ts`)

45 clés : dépôts SQL de `server/infrastructure/accès_données/**`, adaptateurs d'autres modules réenregistrés sous alias, use cases de 3 dossiers sans module (`gestion-contenu`, `authentification`, `fiche-territoriale`), use cases de `server/usecase/**`. **~75 appels `getContainer("legacy")` dans ~45 fichiers** (21 pour `recupererFeatureFlipsUseCase`, 6 routes open-api pour le JWT, nextauth, 12 dans le SSR du rapport détaillé…). 13 fichiers importent des types `Inject` depuis `@/server/legacy/module`.

Services legacy ayant déjà un équivalent :

| Clé legacy | Équivalent |
|---|---|
| `récupérerTerritoiresAvecNombreUtilisateursUseCase` | `gestion-utilisateur/usecases/RecupererTerritoiresAvecNombreUtilisateursUseCase.ts` (attention : sémantique de `[]` différente — legacy « aucun », nouveau « tous ») |
| dépôts commentaire / objectif / décision / synthèse | mêmes classes réenregistrées dans leurs modules ; lectures « plus récents groupés » à remplacer |
| `utilisateurRepository`, `profilRepository`, `territoireRepository`, `ministèreRepository` | copies dans `gestion-utilisateur` / `chantiers` (mappers copiés 2-3 fois) ; `profil.récupérer` passe par legacy alors que `profil.récupérerTous` passe par gestionUtilisateur |
| `tokenAPIInformationRepository` | copie dans `gestion-utilisateur` (`delete` vs `deleteMany`) |
| `recupererRepartitionsMeteoChantiersUseCase` | `GetRepartitionMeteoChantiersQuery` (tRPC, flag `FF_REPARTITION_METEOS_V2`) ; le legacy **mute `filtres.axes`** en place |
| `agregerAvancementsChantiersUseCase` | logique recopiée dans l'outil Albert `server/albert/tools/getTauxAvancementTerritoire.ts:85-105` → appeler `RecupererTauxAvancementTerritoireQuery` (S) |

**Cible**, par étapes : (1) créer les modules `gestionContenu`, `ficheTerritoriale` et compléter `authentification` — mécanique, ~60 % des appels (M) ; (2) supprimer les alias vers d'autres modules (S) ; (3) migrer les lectures SSR du rapport détaillé (L) ; (4) supprimer `server/domain` + `accès_données` devenus inutilisés.

### 7.4 Autres doublons serveur

- **Répartition météo, 3 implémentations** : legacy (SSR accueil + rapport), `GetRepartitionMeteoChantiersQuery` (widget), `fiche-territoriale/usecases/RécupérerRépartitionMétéoUseCase.ts`. Garder la query (S-M, dépend du flag accueil).
- **Dépôts dupliqués par module** : 5 dépôts chantier, 6 dépôts indicateur ; dans `gestion-utilisateur`, 4 dépôts Commentaire/Objectif/Décision/Synthèse identiques à la table près (anonymisation), 4 de plus dans `fiche-conducteur`. Cible : mappers partagés `server/domain/*/mapper`, un dépôt d'anonymisation paramétré (M).
- **Routes open-api** (`pages/api/open-api/chantier/[chantierId]/*`, 6) : même code JWT + logs recopié → wrapper `endpointOpenApi` (S).

### 7.5 Code mort serveur (0 importeur dans `src/` et `tests/`)

- `server/infrastructure/accès_données/utilisateur/UtilisateurIAMKeycloakRepository.ts`, `accès_données/ppg/PpgSQLRepository.ts`
- `server/domain/{axe/Axe, ppg/Ppg, territoire/TerritoireDonnées, chantier/commentaire/Commentaire, chantier/objectif/Objectif, chantier/synthèseDesRésultats/SynthèseDesRésultats}.builder.ts`
- `server/chantiers/app/contrats/{CommentaireChantier, ObjectifChantier, SynthèseDesRésultats, DecisionStrategiqueChantier}Contrat.ts`
- `server/chantiers/app/builder/PropositionValeurAvancementBuilder.ts`, `server/app/error-boundary/internal-server-error.ts`
- Méthodes : `ChantierSQLRepository.récupérerLesEntréesDUnChantier` (+ son test), `MinistèreSQLRepository.getListe` / `récupérerToutesLesIcones…` / `récupérerLesNoms…`
- ⚠️ `validationSuppressionPropositionValeurAvancement` est **encore utilisé** (résolveur du formulaire de suppression).

---

## 8. Publication

- `PageChantier/PublicationV2/*` (10 fichiers) : plus de V1, suffixe vestigial ; utilisé par Commentaires, Objectifs, Décisions stratégiques → renommer `Publication` (S).
- `PageChantier/SynthèseDesRésultatsChantier/**` (13 fichiers, ~950 l.) réimplémente la même mécanique (affichage, historique, brouillon, modale, formulaire) avec la météo en plus, sans passer par `PublicationSection` → la porter dessus (M).

---

## 9. Ce qui disparaît avec la suppression de Pilote Eval / PagePilotage

Composants entiers : `shared/Disclosure`, `_commons/ButtonTag`, `_commons/BarreProgressionEvaluation`, `_commons/InputNote`, `_commons/InputNoteControlled`, `Evaluation/BadgeEtape`, `Evaluation/BadgeType`, `TooltipNonTraite`, onglets maison de `TableauUtilisateurs`. Usages retirés : 4/6 `shared/Tooltip`, 10/43 `Bouton`, 28 `Icone`, 8 fichiers `fr-link` (PILOT)… Prérequis : sortir `PageAutoEvaluation/MessageErreur`. Flag : `NEXT_PUBLIC_FF_PILOTE_EVAL`.

---

## 10. Plan proposé

**Lot 0 — filet E2E aligné sur la prod (S, 1 PR, prérequis)**
- Aligner `.env.e2e` sur l'état prod (§ 11) : ajouter `REFONTE_PAGE_CHANTIER`, `REORGANISATION_PAGE_ACCUEIL`, `REPARTITION_METEOS_V2`, `CHANTIERS_SIGNALES_V2` à `true`, repasser les inactifs prod à `false` (`POSER_UNE_QUESTION_INDICATEUR`, `CREATION_COMPTE_ARS`), réparer les E2E qui cassent. Aligner `.env.test` au passage.

**Lot 1 — nettoyage sans risque (S, 1 PR)**
- Supprimer le code mort client : `SelecteurCustom/`, `stores/useFiltresStore/`, `utils/chantier/avancement/avancement.ts`, `BadgeFicheEtape`, composant `PageChantier/Cartes/Cartes.tsx` (après déplacement du type), réexport `PageIndicateur/ChampObligatoire`.
- Supprimer le code mort serveur (§ 7.5).
- Renommer les suffixes vestigiaux : PVA `V2` (composants, hooks, procédures tRPC, schéma), `PublicationV2`, `useFiltresStoreNew`, `useIndicateurEvolutionNew` (+ retrait de chart.js), `agrégateurRapportDetailleNew`, use cases/méthodes `V2`/`New` (§ 7.1).
- Déplacer `agrégateurListeChantiers` sous `server/`, `MessageErreur` hors de `PageAutoEvaluation`.

**Lot 2 — dédoublonnages ciblés (S, 1-2 PR)**
- `useRemontéesAlertesChantiers`, `useVueDEnsemble`, `SelectService`/`SelectServiceAdmin`, tuile + `ValeurEtDate` du rapport détaillé.
- `territoire.récupérerListe` sur le use case gestionUtilisateur, outil Albert sur la query de taux d'avancement, wrapper open-api.
- Primitives rapides : `Infobulle` sur `shared/Tooltip`, nettoyage `Interrupteur`, `TerritoireProgressBar` sur `Progress`, `shared/Tabs`, chevrons SVG → `Icones`, `Modale.Close`.

**Lot 3 — retrait des pages Legacy (M, débloqué : flags actifs en prod, après le lot 0)**
- Supprimer le Legacy (§ 1) et ce qui en dépend : flags `REFONTE_PAGE_CHANTIER`, `REORGANISATION_PAGE_ACCUEIL`, `REPARTITION_METEOS_V2`, `CHANTIERS_SIGNALES_V2`, météo legacy, carto avec sélecteur, props SSR, doublons de lecture de flags dans `PageAccueilLegacy`.

**Lot 3 bis — retrait des flags acquis (S par flag, mécanique, découpable)**
- Voir § 11. Commencer par les 4 flags sans usage, puis les flags actifs à 1-3 usages.

**Lot 4 — convergences moyennes (M)**
- MultiSelect → MultiSelectNew ; SynthèseDesRésultats → Publication ; Alerte/`fr-alert`/`fr-callout` → `shared/Callout` ; Badge → `shared/Badge` ; `fr-accordion` → `shared/Accordion` ; `shared/RadioGroup` ; tags/toggles.
- Serveur : tests de caractérisation puis fusion des deux use cases de liste de chantiers et des contrats (§ 7.2) ; modules `gestionContenu` / `ficheTerritoriale` / `authentification` pour vider le conteneur legacy (§ 7.3 étape 1).

**Lot 5 — gros chantiers (L)**
- `shared/Button` ; champs de formulaire unifiés ; sélecteurs sur `shared/Select`/`Picker` et fin de `react-accessible-dropdown-menu-hook` ; barres latérales sans JS DSFR.
- CartographieV2 partout (rapport détaillé, fiche conducteur, ChoixTerritoire, IndicateurDétails).
- Fin du conteneur legacy (lectures SSR du rapport détaillé, suppression de `accès_données`).

---

## 11. Feature flags : état prod et retrait des flags acquis

État relevé dans le panneau feature flipping de prod le **2026-09-29**. Usages = lectures dans `src/` et `tests/` (hors `config.ts`, `VariableContenuDisponible.ts` et tests du use case de feature flips).

Retirer un flag touche : `config.ts` (`featureFlip`), `server/gestion-contenu/domain/VariableContenuDisponible.ts` (type + libellé du panneau), `.env.e2e`, `.env.test`, `RecupererFeatureFlipsUseCase.unit.test.ts`, les usages ci-dessous, et les éventuelles surcharges en base (`gestion_contenu`).

### 11.1 Actifs en prod, sans aucun usage → retrait immédiat (S, 1 PR)

`NOUVELLE_PAGE_ACCUEIL`, `RAPPORT_DETAILLE`, `DATE_METEO`, `TA_ANNUEL` : déclarés et affichés dans le panneau, lus nulle part.

### 11.2 Actifs en prod → figer à `true` et supprimer la branche morte

| Flag | Usages | Remarque |
|---|---|---|
| `INFOBULLE_PONDERATION` | `PageChantier/sections/SectionAvancementChantier.tsx:13`, `…Legacy.tsx:24` | disparaît en partie avec le lot 3 |
| `ALERTES` | `PageRapportDétaillé/PremièrePageImpression/PremièrePageImpressionRapportDétaillé.tsx:31` | |
| `ALERTES_BAISSE` | `PageAccueil/PageChantiers/PageChantiers.tsx:75` (Legacy), `PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.tsx:54` | |
| `FICHE_CONDUCTEUR` | `pages/chantier/[id]/fiche-conducteur.tsx:28` (SSR), `PageChantier/usePageChantier.ts:24` | |
| `FICHE_TERRITORIALE` | `pages/fiche-territoriale.tsx:26`, `PageAccueil/BasePageAccueilLayout.tsx:90`, `PageAccueilLegacy.tsx:86` | |
| `GESTION_TOKEN_API` | `pages/panel-administrateur/gestion-token-api.tsx:24` (**`process.env` direct, ignore la base**), `PageUtilisateur/usePageUtilisateur.ts:25`, `MenuLateralPanelAdministrateur.tsx:24` | + E2E `tests/pages/admin/page-gestion-token-api.ts` |
| `SUIVI_COMPLETUDE` | `_commons/MiseEnPage/Navigation/BaseNavigation.tsx:29` | |
| `ALERTE_MAJ_INDICATEUR` | `PageChantier/BasePageChantierLayout.tsx:41`, `PageChantier/sections/SectionIndicateurs.tsx:23` | |
| `PROPOSITION_VOIR_HISTORIQUE` | `_commons/IndicateursChantier/Bloc/BoutonVoirHistorique.tsx:9` | |
| `DOCS_API` | `pages/swagger.tsx:15` (SSR, env seul), `_commons/MiseEnPage/PiedDePage/PiedDePage.tsx:7` | |
| `PPG_ARCHIVE` | `pages/chantier/[id]/[territoireCode].tsx:149` (SSR, env seul), `PageAccueil/Filtres/FiltresSelectionUnique.tsx:33`, `PageChantier/BandeauEntetePageChantier.tsx:12` | règle au passage l'incohérence SSR du § 0 |
| `VIDEO_ACCUEIL` | `BasePageAccueilLayout.tsx:89`, `PageAccueilLegacy.tsx:85` | |
| `PANEL_ADMIN` | `pages/panel-administrateur/habilitations-coordinateur.tsx:20`, `parametrage-metadata-indicateur.tsx:20`, `_commons/MiseEnPage/EnTete/Utilisateur/Utilisateur.tsx:24` | |
| `MON_PROFIL` | `BasePageAccueilLayout.tsx:93`, `PageAccueilLegacy.tsx:88`, `Utilisateur.tsx:25` | |
| `ACCES_PILOTE` | `_commons/MiseEnPage/EnTete/EnTete.tsx:18` | |
| `COMPARAISON_TERRITOIRES` | `PageChantiers.tsx:77` (Legacy), `IndicateurDétails.tsx:53`, `SectionRepartitionGeographiqueLegacy.tsx:28`, `PageChantier/Cartes/Cartes.tsx:23` (mort) | ne reste qu'`IndicateurDétails` après lots 1 et 3 |
| `LIEN_CONTACT_BREVO` | 4 use cases `gestion-utilisateur` (`Desactiver…`, `CréerOuMettreÀJour…`, `Reactiver…`, `ImporterDesUtilisateurs…`) | **`process.env` direct, ignore la base** |
| `HISTORIQUE_ALBERT` | `_commons/ChatUI/AlbertOverlay.tsx:23` | |
| `PAGE_ACTUALITES` | `pages/actualites/index.tsx:25`, `pages/actualites/[id].tsx:14`, `Navigation/NavigationPilote.tsx:52` | |
| `RAPPORT_COORDINATEURS`, `RAPPORT_PVA`, `RAPPORT_RESPONSABLES_DONNEES` | crons `pages/api/admin/cron/rapports-*.ts` (+ `NavigationPilote.tsx:51` pour coordinateurs) | à garder si on veut pouvoir couper un envoi de mails sans déploiement |
| `REFONTE_PAGE_CHANTIER`, `REORGANISATION_PAGE_ACCUEIL`, `REPARTITION_METEOS_V2`, `CHANTIERS_SIGNALES_V2` | pages accueil/chantier, `PageChantiers.tsx:80-83` | retirés par le lot 3 |

### 11.3 À garder

| Flag | Prod | Raison |
|---|---|---|
| `APPLICATION_INDISPONIBLE` | inactif | interrupteur d'exploitation (`BaseNavigation.tsx:26`) |
| `ASK_AI` + `ASK_AI_*` par profil | `EQUIPE_DIR_PROJET` inactif, autres actifs | ouverture progressive par profil (`server/albert/accesAskAI.ts`, `PageAccueil/useAskAIAccess.ts`) — à regrouper une fois tous les profils ouverts |
| `PROCONNECT` | inactif | migration Keycloak → ProConnect en cours (`PageConnexion.tsx:31`, `BoutonProConnect.tsx:23`) |
| `CREATION_COMPTE_ARS` | inactif | `UtilisateurFormulaire.tsx:34` |
| `EXPORT_CSV_WIDGETS` | inactif | `_commons/Widget/ExportableWidget.tsx:18` |
| `POSER_UNE_QUESTION_INDICATEUR` | inactif | `IndicateurSpécifications.tsx:28` — à trancher : fonctionnalité abandonnée ? |
| `MASQUER_INDICATEURS_NON_APPLICABLES` | inactif | `SectionIndicateurs.tsx:25`, `RapportDétailléChantier.tsx:50` — à trancher |
| `PVA_VALEUR_DIFFERENTE` | inactif | `ModalePropositionValeurAvancementV2.tsx:48` — **à garder** (décision 2026-09-29) : sélecteur de mois pour proposer une valeur sur une échéance pas encore mesurée (PIL-866), fonctionnalité voulue mais pas encore ouverte |
| `PILOTE_EVAL` | inactif | disparaît avec la suppression de Pilote Eval (§ 9) |

---

## 12. Corrections repérées pendant le refacto

Relevées au fil des lots 1 à 4 (2026-09-29 / 30), hors périmètre des PR qui les ont fait apparaître.

| Sujet | Constat | Cible | Effort |
|---|---|---|---|
| Préfixe `!` des classes Tailwind | `tailwind.config.js` a `important: true` : toutes les utilitaires sont déjà `!important`. Le préfixe `!` est redondant (**1 086 classes, dont 324 `!text-…` dans 140 fichiers**) et fausse `clsxm` / `twMerge`, qui ne considère pas `!text-white` et `text-dsfr-…` comme concurrentes : les deux restent, et c'est l'ordre dans la feuille qui décide. Exemple vécu : l'icône blanche de `Alerte` restait bleue avec `!text-white` sur `Icone` (couleur par défaut `text-dsfr-blue-france-sun-113`). | Retirer le préfixe `!` là où il sert à surcharger une classe par défaut d'un composant (`Icone`, boutons, liens…), puis partout ; vérifier au cas par cas les `!` qui combattent une règle DSFR non utilitaire | M (mécanique, rendu à contrôler) |
| `align-center` | Classe inexistante en Tailwind (il faut `items-center`), **87 occurrences** : l'alignement vertical attendu ne se fait pas. Corrigé pour `TitreInfobulleConteneur` et `Infobulle` (#2464). | Remplacer par `items-center` en vérifiant chaque rendu (certains écrans s'appuient peut-être sur l'étirement actuel) | S–M |
| `<button>` dans `<button>` | Page chantier : une infobulle placée dans un bouton (déclencheur ou en-tête) — erreur d'hydratation signalée dans les logs E2E. | Sortir l'infobulle du bouton | S |
| `app.scss` | `@import "tailwindcss"` passe par Sass, qui avertit de la dépréciation de `@import` (retrait en Dart Sass 3). Le fichier ne semble utiliser aucune fonctionnalité Sass. | Renommer en `app.css` après vérification (pas de `$`, d'imbrication ni de mixin) | S |
| Triangles de tri du `DataTable` | SVG 12 × 6 écrits en dur ; les `ArrowSFill*` dessinent le triangle dans une boîte 24 × 24. | Laisser, ou icône dédiée au bon cadrage | S |
| `territoire.récupérerListe` | Passe encore par le use case legacy, où `[]` signifie « aucun territoire » ; la version `gestionUtilisateur` traite `[]` comme « tous » — comportement **voulu** (décision 2026-09-30). | Migrer la route tRPC sur la version `gestionUtilisateur` en tenant compte de cette sémantique | S |
| Modale d'export : course sur l'URL | `BoutonExportDesDonnees` ouvre la modale via le paramètre `isModaleExportCsvOuverte` (nuqs) ; chaque étape écrivait `etapeCourante` seule, ce qui pouvait réécrire l'URL avant que l'ouverture y soit inscrite et refermer la modale (`export-csv-chantier.spec.ts` échouait lancé seul). **Corrigé** : les étapes passent par `useExportStep`, qui écrit l'étape et l'ouverture ensemble. | — | fait |
| E2E « Direction accepte avec modification » | Échec observé une seule fois en suite complète (2026-09-30) : le bouton « Prendre une décision » de IND-023 n'apparaît pas avant l'ouverture de la modale. Non reproduit ensuite (5 lancements isolés, 3 suites complètes). | Si l'échec revient, vérifier que la proposition du territoire est bien enregistrée avant le changement d'utilisateur (données partagées entre tests) | S |
| E2E « Filtres et recherche › Filtre par profil » (admin utilisateurs) | Échec observé une fois en suite complète (2026-10-01, haut de la stack #2479 → #2482) : la recherche « coordinateur » de l'étape précédente revient après `effacerRecherche`, le filtre par profil donne alors 0 compte. Course URL ↔ état (nuqs) déjà signalée dans le page object. Passe seul (3/3) et en suite complète au passage suivant (59/59). | Synchroniser la recherche du `DataTable` avec l'URL sans réécriture différée, ou attendre l'URL sans `q` dans `effacerRecherche` | S |

---

## 13. État d'avancement (2026-10-01)

Chantier mis en pause le 2026-09-30 pour merger la stack du lot 4, faire la recette et la mise en production ; repris le 2026-10-01 avec une nouvelle stack (#2479 → #2483), qui termine le lot 4.

### 13.1 Fait

| Lot | PR | État |
|---|---|---|
| 0 — E2E alignés sur les flags de prod, seed sans `migrate reset` (garde-fous `E2E_SEED_AUTORISE` + base locale) | #2457 | mergée |
| 1 — code mort, suffixes `V2`/`New`, déplacements, retrait de chart.js | #2460 | mergée |
| 2 — hooks de vue d'ensemble, sélecteur de service, outil Albert sur la query, routes open-api, `Interrupteur`, `Modale.Close`, tuile d'indicateur partagée | #2462 | mergée |
| 3 bis — 19 feature flags acquis retirés (`ACCES_PILOTE` conservé pour Pilote Eval) | #2463 | mergée |
| Infobulle sur `Popover` (radix) dans `shared/`, chevrons sur les icônes locales, centrage et zone de survol | #2464 | mergée |
| 3a — pages Legacy chantier et accueil supprimées, flags de bascule retirés | #2465 | mergée |
| 3b — props SSR du Legacy élaguées (une requête SQL de moins par chargement de l'accueil et de la page chantier) | #2469 | mergée |
| 4 — alertes reproduisant l'alerte DSFR en Tailwind | #2471 | mergée |
| 4 — spec § 12 + `shared/Badge` reproduisant le badge DSFR | #2472 | mergée |
| 4 — accordéons DSFR sur `shared/Accordion` (radix), `shared/Collapsible` | #2473 | mergée |
| 4 — `shared/RadioGroup` (radix) + modale d'export qui ne se referme plus | #2476 | mergée |
| 4 — un seul `MultiSelect` (ex `MultiSelectNew`), exports nommés | #2479 | **stack ouverte** |
| 4 — `shared/Tag` et `TagToggleGroup` (radix) à la place des tags DSFR | #2480 | **stack ouverte** (sur #2479) |
| 4 — synthèse des résultats sur `PublicationSection` (Publication générique) | #2481 | **stack ouverte** (sur #2480) |
| 4 — mise en avant DSFR sur `shared/Callout` (`highlight`, `Callout.Title`) | #2482 | **stack ouverte** (sur #2481) |
| 4 — bandeaux DSFR sur `shared/Notice`, `Encart` → `shared/TitleBand` | #2483 | **stack ouverte** (sur #2482) |

La stack #2471 → #2476 se fusionnait avec `dev` sans conflit (vérifié après #2466) ; lint, tests et E2E (59/59) verts en haut de pile.

### 13.2 Recette avant MEP

Les lots 1 à 3 changent peu le rendu ; le lot 4 change l'apparence de composants présents sur presque tous les écrans. Points à vérifier :

- **Pages refondues seules en prod** (lot 3) : accueil (sections, cartographie, météos, chantiers signalés, tableau), page chantier (bloc avancement, répartition géographique, comparaison de territoires), anciennes URL avec `carteChG` / `carteChD` sans erreur.
- **Flags retirés** (lot 3 bis) : menu utilisateur (mon profil, panel admin), lien « Docs API » du pied de page, entrée « Token API » du panel admin, page actualités, fiche territoriale, fiche conducteur, historique Albert, alerte de mise à jour des indicateurs. Les surcharges restées en base pour ces clés sont ignorées ; les lignes disparaissent du panneau feature flipping.
- **Alertes** (#2471) : gestion des comptes (création, modification, désactivation), modales de proposition de valeur (encarts info et succès), publications de la page chantier, infolettre, import d'indicateur, message d'information du panel admin.
- **Badges** (#2472) : météo, tendance et écart du tableau des chantiers, écart du bloc avancement (page chantier), statut des chantiers (admin), fiche territoriale, « Désactivé depuis… » (fiche utilisateur), « Bientôt disponible » (ProConnect).
- **Accordéons** (#2473) : rubriques et détails d'indicateurs (page chantier), objectifs (ouverture, fermeture, survol, impression dépliée), historique d'une valeur, fiche indicateur (admin), nouveautés, bandeau des filtres actifs (accueil).
- **Radios** (#2476) : export des données (étapes 1 et 2, enchaînement jusqu'au téléchargement), décision sur une proposition de valeur (accepter, accepter avec modification, refuser).
- **Infobulles** (#2464) : ouverture au survol, au focus et au clic, position près des bords.
- **Déploiement** : les échecs `deploy/sclng` du 2026-09-30 venaient d'un incident Scalingo sur `osc-secnum-fr1` (déploiements lents, `crashed-error` / `aborted`), pas du code ; relancer les déploiements des applications restées en échec une fois l'incident levé.

### 13.3 Reste à faire

- **Recette de la stack #2479 → #2483** : formulaire utilisateur (territoires, périmètres, chantiers) et filtres des admins utilisateurs / indicateurs ; tags (filtres actifs de l'accueil, statut, maille, zoom du graphique, type de compte) ; synthèse des résultats et commentaires (publier, brouillon, éditer le brouillon, publier le brouillon, modifier, historique) ; encarts des modales de proposition de valeur et étape 1 de l'export ; liens de la barre latérale de l'accueil ; bandeaux (message d'information du site, brouillon d'une publication, mise à jour des indicateurs requise, chantier archivé, données régionales reportées, fiche utilisateur) et bandeaux de titre (fiche territoriale, fiche conducteur, rapport détaillé).
- **Lot 5** : fait dans la stack #2484 → #2497 (`shared/Button` et migration des `fr-btn`, `shared/SelectField` et fin des `select` natifs, `shared/TextField` / `TextareaField`, `shared/SearchInput`, `MultiSelect` sur `Popover` radix, fin de `react-accessible-dropdown-menu-hook`). Barres latérales et en-tête sans JS DSFR : #2499, #2500. Restent : `CartographieV2` partout (ci-dessous), fin du conteneur `legacy`.
- **Cartographie** (étape 1 faite, #2502 : choix du territoire DROM et carte des indicateurs avec sélecteur sur la V2, sans zoom ; `CartographieV2` gagne `territoiresSelectionnables`). Étape 2, **après le merge du PDF serveur du rapport détaillé** (`feat/ppg-rapport-detaille-pdf-serveur`, qui rend `CartographieSVG` de l'ancienne carto via `svgFromComponent`) : rapport détaillé et fiche conducteur sur la V2, puis suppression de `_commons/Cartographie` et déplacement des tracés. D'ici là, ne déplacer ni renommer `SVG/CartographieSVG`, `SVG/CartographieSVGContrat`, `useCartographie.interface`, `CartographieAvancement/*`, `CartographieMétéo/*`, `Légende/CartographieLégende.interface`. Garde-fous pour passer le PDF sur la V2 (demandés par la session du PDF) : SVG statique sans `var(--…)` ni classe non aplatissable par `flattenSvgClasses` ; vérifier que pdfmake rend les hachures (`<pattern>`), sinon couleur unie de repli ; garder le contour moutarde du territoire sélectionné ; mêmes couleurs que `getAvancementFill` / `getMeteoFill` (web = PDF) ; DROM libres tant que le cadrage tient en largeur de page ; test unitaire (`cartographie.unit.test.tsx`) vérifiant l'absence de `class=` et de `var(`.
- **Gestion des comptes** (demandé le 2026-10-02) :
  - **Tableau des comptes** (`/admin/utilisateurs`) : 4 à 5 s de chargement. Mesurer d'abord (requêtes SQL, volume renvoyé, calculs côté client du `DataTable`), puis corriger.
  - **Formulaire de création / modification d'un compte** (`PageUtilisateurFormulaire`, `useSaisieDesInformationsUtilisateur`) : beaucoup de règles (profil → habilitations lecture / saisie / commentaires, territoires et périmètres gérables, limites de comptes par territoire, service, chantiers), code difficile à suivre. **Couvrir d'abord par des E2E de caractérisation** (une règle par scénario, par profil créateur et profil créé), puis refactorer à couverture égale.
- **Flags restants** : `PPG_ARCHIVE`, `COMPARAISON_TERRITOIRES` (acquis en prod, retrait à faire).
- **Serveur** : fusion des use cases de liste de chantiers accueil / rapport (§ 7.2) — à coordonner avec les optimisations de performance en cours sur ces use cases.
- **Corrections repérées** : voir § 12 (préfixe `!`, `align-center`, bouton imbriqué, `app.scss`, triangles de tri, `territoire.récupérerListe`, instabilité E2E à surveiller).
- `shared/Accordion` : si d'autres écrans ont besoin du rendu DSFR, transformer les classes `CLASSES_*_ACCORDEON_DSFR` en variante sur `Accordion.Root`.
