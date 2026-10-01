# Rapport détaillé ppg — PDF généré côté serveur et page incrémentale

Date : 2026-10-01
Ticket : aucun (PoC)
Branche : `feat/ppg-rapport-detaille-pdf-serveur`

## Contexte

La page `src/pages/accueil/chantier/[territoireCode]/rapport-detaille.tsx` charge tout dans `getServerSideProps` (l.80-487) pour tous les chantiers filtrés : chantiers, statistiques d'avancement, indicateurs et détails, publications (synthèses, objectifs, commentaires, décisions stratégiques), données des deux cartes de chaque chantier. Le tout est sérialisé dans `__NEXT_DATA__`. Quand l'interrupteur « Afficher le détail des chantiers » est activé, `PageRapportDétaillé` rend tous les `RapportDétailléChantier` d'un coup. L'impression passe par `window.print()` (`PageRapportDétaillé.tsx:126-133`), une page de garde visible uniquement à l'impression et des variantes Tailwind `print:`.

Le rendu complet n'existe que pour l'impression. Il rend la page lente (payload SSR, DOM de N fiches avec 2 cartes SVG chacune, parsing HTML répété).

Lenteurs serveur relevées :

- boucle séquentielle d'une requête de statistiques par chantier (`rapport-detaille.tsx:235-324`) ;
- une dizaine d'appels de repository indépendants enchaînés en séquence (l.326-405) ;
- `chantier_territoire` chargé pour tous les territoires habilités au lieu du territoire demandé (`PrismaChantierRepository.ts:1386-1396`) ;
- `indicateurs.filter` dans une boucle `chantierIds.map` (`IndicateurSQLRepository.ts:258-262`).

Le rapport n'utilise aucune librairie de graphiques : jauges (`JaugeDeProgressionSVG`), pictos météo (`_commons/IconeMeteo`), cartes (`_commons/Cartographie/SVG/CartographieSVG`) sont des SVG maison ; les barres de progression sont en HTML.

ppg génère déjà des PDF avec pdfmake 0.3 : instance configurée dans `src/server/pdf/pdfmake.ts` (polices Roboto/Courier, `setUrlAccessPolicy(() => false)` contre la SSRF), fiches d'évaluation (`GenererPDFEvaluationHandler`, `AutoEvaluationPDFAdapter`, `pdfFactories`) et rapport Albert (`genererRapportPDF`, `markdownToPdfContent`).

## Objectifs

1. **Critère principal : le PDF reproduit au plus près le rendu actuel de l'impression** (mêmes informations, même police, mêmes couleurs, mêmes jauges, pictos et cartes, même découpage en pages).
2. Le PDF est généré côté serveur avec pdfmake, sans navigateur.
3. La page web n'est plus contrainte par l'impression : rendu SSR léger puis chargement des fiches chantier à la demande.
4. Contenu du PDF identique à l'impression actuelle : page de garde, vue d'ensemble, et le détail des chantiers seulement si l'utilisateur a activé l'interrupteur.

Hors périmètre : Chromium headless, choix des sections par l'utilisateur, génération asynchrone (file de jobs), tests front.

## Architecture

### Use case de données partagé

`ConstruireRapportDetailleUseCase` (dans `src/server/rapport-detaille/`) reprend la logique de `getServerSideProps` découpée en deux fonctions :

- `chargerVueDEnsemble(filtres, session)` : chantiers filtrés et triés (avec alertes et filtres d'alertes), ministères, axes, territoire, compteurs d'alertes, avancements agrégés, avancements globaux territoriaux moyens, répartition des météos, moyenne du taux d'avancement, jalon, maille sélectionnée, droit de voir les brouillons.
- `chargerDetailsChantiers(chantierIds, contexte)` : pour un lot de chantiers, les statistiques d'avancement (`AvancementChantierRapportDetaille`), indicateurs groupés, détails des indicateurs, liste des indicateurs pris en compte dans l'avancement, publications groupées, données de cartographie avancement et météo. `contexte` porte ce que la vue d'ensemble a déjà calculé (territoire, maille, jalon, habilitations, statuts) pour ne pas le recalculer.

Corrections de performance incluses :

- un seul `groupBy` de statistiques pour le lot au lieu de la boucle par chantier ;
- `Promise.all` sur les appels indépendants ;
- `chantier_territoire` restreint au territoire demandé (et NAT-FR) quand c'est suffisant pour le rapport ;
- index `Map` à la place du `filter` imbriqué dans `IndicateurSQLRepository.récupérerDétailsGroupésParChantierEtParIndicateur`.

Filet de sécurité du découpage : pour un même jeu de filtres, l'union de `chargerVueDEnsemble` et de `chargerDetailsChantiers(tous les ids)` produit les mêmes données que l'ancien `getServerSideProps`.

### Trois consommateurs

1. **Page (SSR)** : `getServerSideProps` n'appelle plus que `chargerVueDEnsemble`.
2. **Page (client)** : procédure tRPC `rapportDetaille.detailsChantiers({ filtres, territoireCode, chantierIds })`, protégée comme la page, qui appelle `chargerDetailsChantiers`. Le nombre d'ids par appel est borné (5).
3. **PDF** : route API Pages `GET /api/rapport-detaille/pdf` avec les mêmes query params que la page, plus `territoireCode` et `detail=true|false`. Elle refait l'authentification et les contrôles d'habilitation de la page, appelle `chargerVueDEnsemble`, puis `chargerDetailsChantiers` par lots si `detail=true`, construit le document et l'envoie en streaming (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="rapport-detaille-<territoire>-<date>.pdf"`).

### Côté client

- Le bouton « Imprimer » devient « Télécharger le PDF » : `fetch` vers la route avec les query params courants et l'état de l'interrupteur, état de chargement sur le bouton, blob téléchargé, toast d'erreur sinon.
- Suppression de `window.print`, de `PremièrePageImpressionRapportDétaillé`, de `usePrintPageStyle` sur cette page et des variantes `print:` propres au rapport.

## Génération du PDF

### Organisation

`src/server/rapport-detaille/pdf/`, une fonction pure par composant web, qui prend les données et renvoie du `Content` pdfmake :

| Composant web | Générateur |
|---|---|
| `PremièrePageImpressionRapportDétaillé` | `pdfPageDeGarde.ts` |
| `RapportDétailléVueDEnsemble` (jauges, répartition météo, carte, alertes, tableau des chantiers) | `pdfVueDEnsemble.ts` |
| `RapportDétailléChantier` | `pdfChantier.ts`, qui assemble `pdfAvancement`, `pdfResponsables`, `pdfMeteoSynthese`, `pdfCartes`, `pdfObjectifs`, `pdfIndicateurs`, `pdfDecisions`, `pdfCommentaires` |

`genererRapportDetaillePDF.ts` assemble les sections et renvoie le document pdfmake.

### Briques partagées (`src/server/pdf/`)

1. **Police Marianne** : les fichiers `.woff` de `@gouvfr/dsfr/dist/fonts` (Regular, Medium, Bold et leurs italiques) sont enregistrés sur l'instance `pdfmake` sous la famille `Marianne`. Roboto et Courier restent pour les PDF existants.
2. **`tokens.ts`** : couleurs résolues depuis `tailwind.config.js` (`resolveConfig`), exposées par leur nom de classe (`primary`, `dsfr-grey-625`, `pilote-vert`…). Aucune valeur recopiée à la main.
3. **`svgDepuisComposant.ts`** : rend en HTML statique (`renderToStaticMarkup`) les composants SVG existants (`JaugeDeProgressionSVG`, icônes météo, `CartographieSVG` en `estInteractif: false`), puis remplace les classes Tailwind `fill-*` et `stroke-*` par des attributs `fill`/`stroke` hexadécimaux issus de `tokens.ts`, et retire les classes restantes. Le résultat est passé au nœud `svg` de pdfmake. Aucun tracé n'est dupliqué. Si le moteur SVG de pdfmake ne rend pas les hachures (`<pattern>`), elles sont remplacées par des lignes dessinées.
4. **`htmlVersPdfmake.ts`** : convertisseur HTML vers pdfmake basé sur `htmlparser2`, sur le modèle de `markdownToPdfContent` : paragraphes, `h1`-`h6`, `ul`/`ol`/`li` imbriquées, `strong`/`b`, `em`/`i`, `u`, `s`, liens (texte souligné, sans ressource distante), `blockquote`, `hr`, `br`, entités. Tailles et marges reprises de `RenduContenuHtml`.
5. **`primitives.ts`** : équivalents des éléments DSFR utilisés par le rapport : encart (fond, bordure, coins arrondis via `canvas` en arrière-plan), badges (météo, tendance, baromètre), barre de progression (`canvas rect`), titre de section, tableau.

`pdfFactories` (évaluation, Albert) n'est pas réutilisé comme base de style : son rendu est éloigné du DSFR.

### Mise en page

- Format 280 × 396 mm, marges 12 mm (`usePrintPageStyle("margin: 12mm 0; size: 280mm 396mm")` et `print:m-[12mm]`).
- Sauts de page repris de l'impression : avant chaque chantier, avant le bloc avancement ; `unbreakable` pour les blocs marqués `break-inside-avoid`.
- Grilles `print:grid-cols-2` reproduites en `columns`.

### Contrôle de fidélité

Comparaison visuelle manuelle de l'impression actuelle (depuis `dev`) et du PDF, sur un petit périmètre puis sur le national complet.

## Page incrémentale

- SSR : vue d'ensemble et liste des chantiers (ordre, en-tête minimal) seulement.
- Interrupteur activé : une liste de `RapportDétailléChantierDiffere`. Chacun observe son entrée dans le viewport (`IntersectionObserver`, `rootMargin` ~1 500 px). Un gestionnaire de lots regroupe les ids devenus visibles et appelle `rapportDetaille.detailsChantiers` par lots de 5 ; le cache react-query évite les rechargements.
- Squelette de hauteur fixe tant que la fiche n'est pas chargée, pour éviter les sauts de défilement.
- `RapportDétailléChantier` et ses sous-composants restent inchangés : seule l'origine des props change.
- `RenduContenuHtml` mémorise le résultat de `DOMParser` (`useMemo`).

## Gestion des erreurs

- Route PDF : 401 sans session, 403 si l'utilisateur n'a pas accès au territoire, 400 si les filtres sont invalides (même loader nuqs). Erreur avant le premier octet : 500. Erreur pendant l'envoi : connexion coupée et journalisée. Fermeture par le client ignorée, comme `ecrireCsvEnStreaming`.
- Bouton : toast d'erreur, bouton réactivé.
- tRPC : une fiche dont le lot échoue affiche un message et un bouton « Réessayer ».

## Tests

Pas de tests front.

Vitest unitaires :

- `htmlVersPdfmake` : chaque balise prise en charge, imbrications, entités, HTML mal formé ;
- `svgDepuisComposant` : classes remplacées par les bonnes couleurs, aucune classe Tailwind résiduelle ;
- chaque générateur de section sur des données d'exemple (structure pdfmake attendue) ;
- `genererRapportDetaillePDF` : le buffer commence par `%PDF`, nombre de pages cohérent avec le nombre de chantiers.

Use case : tests avec repositories bouchonnés (ou intégration sur la base de test si un équivalent existe pour `RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2`) vérifiant l'équivalence avec l'ancien `getServerSideProps`.

Mesure : script jetable qui chronomètre la génération et relève `process.memoryUsage()` sur le national complet ; résultats ajoutés à cette spec.

## Points de vigilance

1. **Bundle** : pdfmake, les polices et `svgDepuisComposant` ne sont importés que côté serveur.
2. **Mémoire** : pdfmake construit tout le document avant l'envoi ; le streaming réduit le pic sans le supprimer. Si le national dépasse ce que le conteneur Scalingo supporte, repli : génération par chantier et fusion avec `pdf-lib`.
3. **Moteur SVG de pdfmake** : ignore les feuilles de style et une partie de `clipPath`/`pattern` ; d'où la mise à plat dans `svgDepuisComposant`.
4. **Sécurité** : `setUrlAccessPolicy(() => false)` conservé ; aucun contenu distant, les liens du HTML riche ne sont que du texte.
