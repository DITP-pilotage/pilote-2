# Rapport détaillé ppg — inventaire visuel de l'impression

Référence de fidélité pour le PDF serveur (spec : `2026-10-01-rapport-detaille-pdf-serveur-design.md`). Établi par lecture du code le 2026-10-01, sans rendu réel : à confronter à une impression de `dev`. `C/` = `apps/pilote-ppg/src/client/components`.

## Pièges de rendu

1. **Petits textes DSFR à l'impression** : le `@media print` de `core.min.css` passe `.fr-text--sm` et `.fr-text--xs` à 1rem / 1.5rem (16 / 24 px). Les utilitaires Tailwind (`text-xs`, `!text-sm`, `[&_p]:text-sm`) l'emportent (config `important: true`).
2. **Tous les `h2` sont bleus** (`[&_h2]:text-primary` sur le conteneur), y compris « Chantiers signalés ». `h1`, `h3`, `h4` restent #161616.
3. **Classes sans style** : `encart-container`, `bloc-container`, `bloc__contenu`, `titre-rapport-détaillé`, `rubrique__conteneur`, `jauge`.
4. 1 rem = 16 px ; 1 px CSS = 0,75 pt pdfmake.

## 0. Cadre — `C/PageRapportDétaillé/PageRapportDétaillé.tsx:90-216`

- `@page { margin: 12mm 0; size: 280mm 396mm }` + conteneur `print:m-[12mm]` ; `td` forcés en fond blanc ; `fr-container` max 78rem.
- Masqués : titre « Rapport détaillé : N chantiers », boutons, `FiltresSélectionnés`, interrupteur.
- Ordre : page de garde → vue d'ensemble (`break-after-page`) → un bloc par chantier (`break-before-page`) si l'interrupteur est activé.

## 1. Page de garde — `C/PageRapportDétaillé/PremièrePageImpression/PremièrePageImpressionRapportDétaillé.tsx:136-237`

- **En-tête** (flex, `fr-px-12w` = 6rem, `fr-mb-6w` = 3rem) : bloc-marque `fr-logo` (0.7875rem) — drapeau 2.75rem × 1rem (#000091 | #E1000F, Marianne blanche), « GOUVERNEMENT » gras majuscules, devise « Liberté Égalité Fraternité ». À droite (`fr-pt-1w fr-ml-5w`) : « PILOTE » 20 / 32 px gras ; « Piloter l'action publique par les résultats » 16 px.
- **Bandeau** fond #F5F5FE, `pt` 3rem, `pb` 1.5rem : titre centré gras 4rem / 4.5rem #161616 sur 3 lignes « État des lieux de l'avancement » / « des politiques prioritaires » / « du Gouvernement », mb 3rem ; puis (`fr-px-12w`) « Rapport détaillé généré le DD/MM/YYYY à H'h'mm » (`formaterDate(now, "DD/MM/YYYY [à] H[h]mm")`).
- **Filtres** (`fr-px-12w fr-py-4w`, hauteur max 20cm) : `ul` sans puces sur 2 colonnes (écart 2rem). Groupe : titre gras 20.8 / 28 px ; sous-liste `pl-4`, mt 0.25rem, mb 1rem.

| Groupe | Contenu | Condition |
|---|---|---|
| Territoire sélectionné | `nomAffiché` | toujours |
| Ministère(s) ou périmètre(s) ministériel(s) sélectionné(s) | ministère en gras + sous-liste `pl-5` des périmètres | périmètres filtrés |
| Type(s) de chantier sélectionné(s) | « Chantiers du baromètre », « Chantiers territorialisés », « Chantiers validés et en cours de publication », « Chantiers en cours de publication », « Chantiers validés » | libellés de statut seulement si droit aux brouillons |
| Axe(s) | noms | axes filtrés |
| Alerte(s) sélectionnée(s) | « Taux d'avancement non calculé en raison d'indicateurs non renseignés », « Chantier(s) avec un retard de 10 points par rapport à leur médiane {maille} », « Chantier(s) avec tendance en baisse », « Chantier(s) avec météo et synthèse des résultats non renseignés », « Chantier(s) sans taux d'avancement au niveau départemental » | alertes filtrées |

## 2. Vue d'ensemble — `C/PageRapportDétaillé/VueDEnsemble/RapportDétailléVueDEnsemble.tsx:61-181`

- **Encart** (`C/_commons/Encart/Encart.tsx`) : `py-4 px-8`, fond #E3E3FD ; h2 « Vue d'ensemble » 2rem / 2.5rem gras #000091.
- **Grille 2 colonnes** (gap 1.5rem, mt 1.5rem, insécable) :
  - gauche, `Bloc` sans titre : h2 « Taux d'avancement moyen » (18 / 28 px, normal, #000091) + icône `InformationPleineIcon` 24 px #000091 ; `Avancements` (§2.1) ; `hr` 1 px #DDD (my 1.5rem) ; h2 « Répartition des météos renseignées » + icône ; `RepartitionsMeteosRapportDetaille` (§2.2).
  - droite, `Bloc` : h3 « Taux d'avancement des chantiers par territoire » (18 / 28 px, #161616) ; carte d'avancement (§7.1).
- **Chantiers signalés** (si non archivés, pt 1.5rem) : badge attention avec seulement `WarningIcon` (fond #FFE9E6, icône #B34000 16 px, px 4 px, arrondi 4 px) ; h2 « Chantiers signalés » 18 px #000091 + icône info #B34000 ; une colonne égale par alerte (gouttière 1.5rem), `RemontéeAlerte` (§2.3).
  - national : « Taux d'avancement non calculé(s) en raison d'indicateurs non renseignés », « Chantier(s) sans taux d'avancement au niveau départemental », « Chantier(s) avec météo et synthèse des résultats non renseignés », « Chantier(s) avec proposition(s) de valeur d'avancement ».
  - régional / départemental : « Chantier(s) avec un retard de 10 points par rapport à leur médiane {regionale|departementale} », « Chantier(s) avec tendance en baisse », + les deux dernières nationales. Source : `src/client/hooks/useRemontéesAlertesChantiers.ts:28-89`.
- **Liste des chantiers** (mt 1.75rem, insécable) : `Bloc` avec h2 « Liste des chantiers » (18 px, mb 0.5rem) puis tableau (§2.4).

### 2.1 `Avancements` — `C/_commons/Avancements/Avancements.tsx:11-44`
Flex centré, gap 2.5rem. Jauge `lg` bleu #000091 (gris #929292 si archivé), libellé « Taux d'avancement à échéance {jalon} », valeur `moyenneTauxAvancementTerritoire`. Puis 3 jauges `sm` (gap 1.5rem) : « Minimum » #FC5D00, « Médiane » #8585F6, « Maximum » #27A658.

### 2.2 `RepartitionsMeteosRapportDetaille` — `C/PageRapportDétaillé/FiltresSélectionnés/FiltresMétéos/RepartitionsMeteosRapportDetaille.tsx:27-56`
4 colonnes (padding 0.5rem). Carte : colonne centrée, p 8 px, `shadow-lg`, bordure 1 px #E5E5E5 (#000091 si la météo est filtrée), arrondi 4 px ; picto 40 × 40 ; nombre 2.5rem / 3rem gras #000091 ; libellé 16 px #161616. Ordre : ORAGE « Objectifs compromis », NUAGE « Appuis nécessaires », COUVERT « Objectifs atteignables », SOLEIL « Objectifs sécurisés ».

### 2.3 `RemontéeAlerte` — `C/_commons/RemontéeAlerte/RemontéeAlerte.tsx:17-31`
Carte colonne, fond blanc, bordure 1 px #DDD (#B34000 si activée), arrondi 8 px, ombre `0 2px 6px #00001229`, p 1.5rem. Nombre (ou « - ») 2.5rem gras #B34000 ; libellé 16 px #161616.

### 2.4 Tableau des chantiers — `RapportDétailléTableauChantiers.tsx`, `useRapportDétailléTableauChantiers.tsx:22-107`, socle `C/shared/Table.tsx`
- Pleine largeur. Vide : bandeau « Aucun chantier à afficher. » fond #E8EDFF, texte #0063CB gras, icône info 24 px, `py-4 px-6`.
- `thead` fond #E3E3FD, `th` p 16 px (pb 18), 14 / 24 px gras, bordure basse 1 px #3A3A3A.
- Corps : `td` blancs à l'impression ; 1re colonne (`th` de ligne) zébrée blanc / #F6F6F6 ; cellules p 16 px, 14 / 24 px ; nom en normal.

| En-tête | Largeur | Cellule |
|---|---|---|
| Chantiers | auto | icône ministère 24 px #000091 (`src/client/utils/mapperIconeMinistereVersIcone.tsx:20-56`, défaut `EarthPleineIcon`, `GovernmentIcon` si `undefined`) + nom |
| Typologie | 6.5rem | icônes 24 px #000091 : `Dashboard31Icon` (baromètre), `MapPin21Icon` (territorialisé), `Error1Icon` (brouillon) |
| Météo | 8rem | picto 40 × 40, ou « Non renseignée » / « Non nécessaire » 12 px #666 ; dessous « (MM/YYYY) » de `dateDeMàjDonnéesQualitatives` 10 px #666 |
| Tendance | 7.5rem | `BadgeTendance` (§3.3) |
| Avancement | 11rem | « Non renseigné » #666, sinon `BarreDeProgression sm` fond blanc, remplissage #000091 (#666 archivé) ; « (MM/YYYY) » de `dateDeMàjDonnéesQuantitatives` 10 px #666 |
| Écart | 5.5rem | badge `sm` `ecartArrondi.toFixed(1)` ; ≤ -10 erreur, ≥ 10 succès, sinon info ; vide si nul |

## 3. Chantier — `C/PageRapportDétaillé/Chantier/RapportDétailléChantier.tsx:103-303`

- `section` mt 2rem pb 2rem, saut de page avant ; sections pleine largeur l'une sous l'autre, gap 1.5rem.
- Si avancements : lien « Haut de page » (s'imprime comme lien simple — **ne pas reproduire**) ; Encart (#E3E3FD, `py-4 px-8`) avec h1 `{nom}` 2rem / 2.5rem gras #161616 ; h2 « Avancement du chantier » (1.5rem / 2rem gras #000091, mb 1rem) + `AvancementChantier` (§3.1) ; h2 « Responsables » + §4.
- Toujours : h2 « Météo et synthèse des résultats » + §5.
- Conditionnels (my 1rem, insécables, h2 1.5rem gras #000091) :

| Titre | Condition | Contenu |
|---|---|---|
| Répartition géographique | `tauxAvancementDonnéeTerritorialisée[maille]` ou `météoDonnéeTerritorialisée[maille]` ou `estTerritorialisé` | §7 |
| Objectifs | ≥ 1 objectif | §8 |
| Indicateurs | ≥ 1 indicateur | §10, ou `Alerte` info « Aucun indicateur n'est applicable pour le territoire sélectionné » |
| Décisions stratégiques | décision non nulle et territoire national | §9 |
| Commentaires du chantier | commentaires non nuls | §8 |

### 3.1 `AvancementChantier` — `C/PageChantier/AvancementChantier/AvancementChantier.tsx:102-346`

Grille gap 0.7rem, `Bloc` placés automatiquement :

| Maille du territoire | Colonnes | Disposition |
|---|---|---|
| nationale | 2 | France, Répartition / Comparaison |
| régionale | 2 | Région, France / Répartition, Comparaison |
| départementale | 3 | Département, Région, France / Répartition, Comparaison |

Bandeaux #E3E3FD (#E5E5E5 archivé).
1. **Département** (territoire ≠ NAT et maille départementale) : titre `nomAffiché` ; `AvancementsTerritoire` « Taux d'avancement départemental », valeur `departementale.annuel`, jauge bleue.
2. **Région** (territoire ≠ NAT et maille régionale ou départementale) : titre = parent sinon territoire ; « Taux d'avancement régional » ; jauge #000091 en maille régionale, sinon #0078F3.
3. **France** : « Taux d'avancement national » (strong 16 px) + jalon ; jauge `lg` #0078F3 si territoire ≠ NAT sinon #000091, libellé « France », date `nationale.annuel.date`, valeur `nationale.annuel.moyenne`.
4. **« Répartition territoriale du taux d'avancement {jalon} »** (icône info au bandeau) : « Répartition régionale » si maille régionale sinon « Répartition départementale » + jalon ; 3 `JaugeDeProgressionSmall` en colonne : Maximum vert, Médiane violet, Minimum orange (`nationale.global.*`).
5. **« Données de comparaison de l'avancement 2026 »** (année en dur, icône info) :
   - si ≠ NAT : « SITUATION PAR RAPPORT AUX AUTRES DÉPARTEMENTS|RÉGIONS » (strong) + jalon ; badge `EcartTauxAvancementPPG` (§3.4) ; « **écart** du taux d'avancement {jalon} par rapport au taux médian des autres départements|régions ( **{médiane.toFixed(0)}%** ) » (valeur #8585F6, « Non défini » sinon) ; `hr`.
   - toujours : « EVOLUTION TEMPORELLE » ; « 2026 » ; `BadgeTendance` ; « **tendance** du taux d'avancement 2026 par rapport au taux d'avancement précédemment mesuré sur le territoire|le département|la région » ; puis « ( **{précédent.toFixed(0)}%** (#000091), MM/YYYY (#666) ) » ou « (Non défini) » gras #000091.

### 3.2 `AvancementsTerritoire` — `C/_commons/AvancementsTerritoire/AvancementsTerritoire.tsx:24-40`
Ligne centrée : strong {titre} + jalon ; jauge `lg`, libellé = nom du territoire, date.

### 3.3 `BadgeTendance` — `C/PageAccueil/PageChantiers/TableauChantiers/Tendance/BadgeTendance.tsx:36-57`
Badge `sm`, icône 12 px + libellé : HAUSSE succès `ArrowRightUp1Icon` « En hausse » ; BAISSE erreur `ArrowRightDown1Icon` « En baisse » ; STAGNATION info `ArrowLine1Icon` « Stable ». Défaut si archivé ; rien si nul.

### 3.4 `EcartTauxAvancementPPG` — `…/EcartTauxAvancementPPG/EcartTauxAvancementPPG.tsx:23-34`
Badge `sm` « {EN RETARD | EN AVANCE | DANS LA MEDIANE} : {écart.toFixed(1)} » ; rouge ≤ -10, vert ≥ 10, sinon info ; rien si nul.

### 3.5 `Badge` — `C/shared/Badge.tsx:9-55`
inline-flex, gap 4 px, arrondi 4 px, gras, MAJUSCULES. `sm` : h ≥ 20 px, px 6 px, 12 / 20 px, icône 12 px. `md` : h ≥ 24 px, px 8 px, 14 / 24 px, icône 16 px.

| Variante | Fond | Texte |
|---|---|---|
| défaut | #EEEEEE | #3A3A3A |
| succès | #B8FEC9 | #18753C |
| erreur | #FFE9E9 | #CE0500 |
| info | #E8EDFF | #0063CB |
| attention | #FFE9E6 | #B34000 |
| vert-tilleul | #FCEEAC | #695240 |

### 3.6 `BarreDeProgression` — `C/_commons/BarreDeProgression/BarreDeProgression.tsx:82-146`
Arrondi 6 px. Hauteurs : xxs 8, xs 10, sm/md 12, lg 32 px. Fonds : bleu #BFCCFB, blanc, gris-moyen #BABABA (défaut), gris-clair #E5E5E5. Bordure 1 px #BABABA (option #BFCCFB). Remplissages : primaire #000091, primaire-light #000091, secondaire #666, secondaire-light #929292, rose #CE614A, jaune-moutarde #C3992A, bleu-clair #0063CB, bleu-dsfr-info #0078F3, grey-dsfr #3A3A3A ; aucun si 0 ou null. Texte « {toFixed(0)} % » ou « - % », gras ; position « côté » (à droite, pl 8 px, largeur 2.5rem) ou « dessus ».

## 4. Responsables — `C/PageChantier/ResponsablesChantier/ResponsablesChantier.tsx:52-84`
`Bloc` titre « National ». Lignes (`C/_commons/ResponsablesLigneChantier/ResponsablesLigneChantier.tsx:29-66`, pb 1rem) : libellé 16 px gras (colonne 5/12), noms 16 px séparés par « , » ou « Non renseigné ». « Directeur(s) / directrice(s) du projet » ; si maille ≠ nationale, séparées par `hr` : « Responsable local », « Coordinateur PILOTE {national|departemental|regional} ». Bloc « Contacter » masqué.

## 5. Météo et synthèse — `C/PageRapportDétaillé/SynthèseDesRésultats/SynthèseDesRésultats.tsx:20-57`
`Bloc` titre = nom du territoire. Flex, gap 1rem :
- gauche (8rem, centré) : `MétéoBadge` (badge `sm` libellé météo ; ORAGE erreur, NUAGE vert-tilleul, COUVERT info, SOLEIL succès, autres défaut ; « Non renseignée » sans synthèse), mb 1rem, puis picto 40 × 40 si synthèse.
- droite (≥ 18rem) : sans synthèse « Aucune synthèse des résultats. » 16 px #666 ; sinon « Mis à jour le DD/MM/YYYY[ | Par {auteur}] » #666 (16 px à l'impression), puis HTML riche, paragraphes 14 px mb 4 px.

`RenduContenuHtml` (`C/_commons/EditeurRiche/RenduContenuHtml.tsx:200-211`) : balises rendues telles quelles (styles DSFR par défaut) ; cas spéciaux `data-type=callout`, accordéon (ouvert), `icone` 20 px, `img` arrondie, `video`/`iframe` ; `<br>` final doublé.

Pictos météo (`C/_commons/IconeMeteo/`) 40 × 40 : Soleil (36×36, #FFCA00), Couvert (44×36, #FFCA00 + #6A6AF4), Nuage (48×36, #6A6AF4), Orage (40×36, #6A6AF4 + #FFCA00). Rien pour NON_RENSEIGNEE / NON_NECESSAIRE.

## 6. Jauges

- `JaugeDeProgression` (`C/_commons/JaugeDeProgression/JaugeDeProgression.tsx:63-104`) : largeur sm 3.75rem, md 5.5rem, lg 10.5rem. Valeur « {toFixed(0)}% » ou « - % » : sm sous l'anneau 1.25rem gras ; md/lg centrée dans l'anneau (`top: calc(50% - 1.4rem)`), 1.5rem (md) ou 2.5rem (lg) gras ; couleur = jauge. Libellé et « (MM/YYYY) » 16 px centrés. Couleurs : bleu #000091, bleu-clair #0078F3, violet #8585F6, orange #FC5D00, vert #27A658, rose #CE614A, gris #929292.
- SVG (`JaugeDeProgressionSVG.tsx:89-120`) : viewBox 1×1, fond #D9D9D9 découpé par l'anneau, secteur de 316° × pourcentage, départ en bas, rotation 23°.
- `JaugeDeProgressionSmall` (`C/_commons/JaugeDeProgressionSmall/JaugeDeProgressionSmall.tsx:24-43`) : anneau sm (3.75rem, mr 0.5rem) puis colonne : valeur 1.375rem gras couleur jauge, libellé 16 px ; mb 1rem.

## 7. Cartes — `C/PageRapportDétaillé/Cartes/Cartes.tsx:34-102`

2 colonnes, gap 1.5rem, chaque carte dans un `Bloc` insécable : h3 « Taux d'avancement {jalon} » + carte d'avancement ; h3 « Niveau de confiance » + carte météo (h3 18 px avec icône info).

- **Avancement** (`C/_commons/Cartographie/CartographieAvancement/useCartographieAvancement.tsx:23-56`) : `Number(valeurAnnuelle.toFixed(0))` par tranches de 10 : #e6e6f4, #d7d7ee, #cbcbe8, #bbbbe2, #aeaedc, #9a9ad4, #8686cb, #6666bd, #4040ad, #000091. Nul : #bababa « Territoire pour lequel la donnée n'est pas renseignée/disponible ». `estApplicable === false` : hachures « Territoire où le chantier prioritaire ne s'applique pas ». Absent : #bababa.
- **Météo** (`useCartographieMétéo.tsx:8-20`) : légende ORAGE #B34000 « Objectifs compromis », COUVERT #95E257 « Objectifs atteignables », NUAGE #EFCB3A « Appuis nécessaires », SOLEIL #27A658 « Objectifs sécurisés », défaut #bababa « Territoire pour lequel la météo n'est pas renseignée », hachures. Picto 40 × 40 après chaque libellé météo. Défaut et hachures seulement si présents.
- **Moteur** (`C/_commons/Cartographie/SVG/CartographieSVG.tsx:57-167`) : SVG max 25rem centré, viewBox « 1 0 100 100 ». Maille départementale : départements + frontières régionales (trait blanc 0.4, sans remplissage) ; sinon régions. Contour blanc 0.15. Hachures : diagonales `M{x} 100 L{x+100} 0` (x de -100 à 200), trait #666666 0.375, découpées par clipPath. Territoire sélectionné : contour #FCC63A 0.5 (pas pour NAT).
- **Légende** (`Légende/Liste/CartographieLégendeListe.tsx:13`) : flex wrap max 25rem centré, mt 0.5rem ; élément 12 / 16 px #666, pr 0.75rem pb 0.25rem ; pastille 0.6rem bordée 1 px #161616 (plein ou hachures).

## 8. Objectifs et commentaires — `ObjectifsRapportDetaille.tsx:25-60`, `CommentairesRapportDetaille.tsx:32-67`

`Bloc` sans padding de contenu, titre « National » (objectifs) ou nom du territoire (commentaires). Rubriques séparées par `hr`, chacune `py-4 px-6` : titre gras 20 / 28 px, mb 4 px ; si contenu : « Mis à jour le dd/MM/yyyy | Par {auteur} » 12 px #666 (`PiloteDateFormatter.isoDateFranceMetropolitaine`, Europe/Paris) puis HTML riche ; sinon badge `sm` défaut « Non renseigné ».

- Objectifs : « Notre ambition », « Ce qui a déjà été fait », « Ce qui reste à faire ».
- Commentaires national : « Autres résultats obtenus (non corrélés aux indicateurs) », « Risques et freins à lever », « Solutions et actions à venir », « Exemples concrets de réussite ».
- Commentaires régional / départemental : « Commentaires sur les données », « Autres résultats obtenus ».

## 9. Décisions stratégiques — `C/PageRapportDétaillé/Chantier/DecisionsStrategiquesRapportDetaille.tsx:13-39`
`Bloc` « France », une rubrique « Suivi des décisions stratégiques », même gabarit qu'au §8.

## 10. Indicateurs

- `IndicateursRapportDetaille.tsx:19-67` : rubriques (si non vides) « Indicateurs pris en compte dans le taux d'avancement du territoire » (pondération > 0), « Indicateurs non pris en compte dans le taux d'avancement du territoire et/ou de la maille », « Autres indicateurs » ; h3 « {nom} ({n}) » 18 / 28 px normal #161616 ; mb 1.5rem. Tri : pondération décroissante (nulles en dernier) puis nom.
- `IndicateurBloc.tsx:45-162` : `Bloc` sans titre, p 1rem, mb 1rem, insécable.
  - h4 20 / 32 px gras #161616, précédé de `Dashboard31Icon` 24 px #000091 si baromètre : « {nom} (en {unité minuscule}) ».
  - infos (ml 1rem, mb 1.5rem), #666 : « Dernière mise à jour de la valeur d'avancement pour le territoire : **DD/MM/YYYY** » ou « Non renseigné » ; pondération (`IndicateurPonderation.tsx:22-37`, adj national|départemental|régional) : nulle « La pondération n'est pas disponible pour le taux d'avancement {adj}. », 0 « Cet indicateur n'est pas pris en compte dans le taux d'avancement {adj} du chantier. », sinon « Cet indicateur représente **{p}%** du taux d'avancement {adj} du chantier. » (`toFixed(0)` si entier sinon `toFixed(1)`) ; si tendance BAISSE (`IndicateurTendance.tsx:9-19`) : `DecroissanceIcon` 24 px #000091 + « Attention, cet indicateur a un objectif de baisse. La cible représente une valeur inférieure à la valeur initiale. »
  - Tableau (socle §2.4) : « Territoire(s) », « Valeur initiale », « Valeur actuelle », « Cible {jalon} », « Avancement {jalon} » ; en-têtes et cellules `py-2 px-4` ; une ligne : nom du territoire, 3 × `ValeurEtDate` (`valeur.toLocaleString()` + « % » si unité « pourcentage », puis « (MM/YYYY) » 10 / 16 px #666), `BarreDeProgression md` fond #E5E5E5, bordure #BABABA, remplissage #666, texte au-dessus « {avancement.annuel.toFixed(0)} % ».

## 11. Communs

- **`Bloc`** (`C/_commons/Bloc/Bloc.tsx:22-52`) : fond blanc, bordure 1 px **#7B7B7B à l'impression**, arrondi 8 px. Bandeau titre : hauteur 4rem, p 1rem, 16 px gras, bordure basse 2 px #3A3A3A, fond selon la prop, texte tronqué, icône info facultative. Contenu p 1rem par défaut.
- **`Alerte`** (`C/_commons/Alerte/Alerte.tsx:57-84`) : bordure 1 px couleur du type, bande gauche 2.5rem de la couleur avec icône blanche 24 px ; corps `pt-4 pb-3 pl-4 pr-9`, titre 20 / 28 px gras. info #0063CB `InformationPleineIcon` ; succès #18753C ; warning #B34000 `WarningIcon` ; erreur #CE0500.
- **`Icone`** (`C/_commons/Icone.tsx`) : SVG 24 × 24, `fill=currentColor`, #000091 par défaut ; icônes `C/_commons/Icones/*.tsx` en viewBox 0 0 24 24.

## Typographie

Marianne. Corps 16 / 24 px. `fr-h1` 2.5 / 3rem, `fr-h2` 2 / 2.5rem, `fr-h3` 1.75 / 2.25rem, `fr-h4` 1.5 / 2rem, `fr-h5` 1.375 / 1.75rem, `fr-h6` 1.25 / 1.75rem, `fr-display--md` 4 / 4.5rem (tous gras). `fr-text--xs` et `--sm` : 16 / 24 px à l'impression. `fr-text--lg` 18 / 28, `--xl` 20 / 32. Tailwind : `text-xs` 12/16, `text-sm` 14/20, `text-base` 16/24, `text-xl` 20/28. Arrondis : 4 / 6 / 8 px.
