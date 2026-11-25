# Carte des indicateurs non à jour : trois états (PIL-2046)

Date : 2026-11-25. Design court, validé en conversation avec Triko.

## Intention

La carte « indicateurs non à jour » (onglet de la comparaison territoriale, page chantier et détail d'un indicateur) confond aujourd'hui deux cas sous la même couleur : une valeur dépassée et l'absence de toute valeur. Elle affiche en plus les territoires à jour en gris, couleur qui veut dire « non renseigné » sur les autres cartes (météo). On passe à trois états lisibles : vert à jour, rouge non à jour, gris donnée absente.

## Définitions (par indicateur et territoire)

- **Non applicable** : `est_applicable` différent de `true`.
- **Donnée absente** : applicable, et le dernier jalon de `indicateur_territoire_jalon` (jalon le plus élevé de la ligne) n'a pas de `date_valeur_actuelle`, ou la ligne n'a aucun jalon. `date_valeur_actuelle_mandat` est déprécié (Triko) et n'est plus lu. Dans dbt (`get_last_vaca_jalon`), chaque jalon reprend la dernière valeur connue jusqu'à lui : le dernier jalon, l'année en cours, porte donc la date de la valeur la plus récente.
- **Non à jour** : applicable, une valeur existe, `est_a_jour` différent de `true`. Inclut le cas d'une valeur sans périodicité paramétrée (dbt la marque non à jour), qui reste rouge.
- **À jour** : applicable, `est_a_jour = true`.

## Objectifs

- **Carte indicateur** : chaque territoire prend l'état de sa ligne.
- **Carte chantier** (règle de Triko) : rouge dès qu'un indicateur applicable est non à jour ; gris si au moins un est sans donnée et aucun non à jour ; vert si tous sont à jour ; hachures si aucun indicateur ne s'applique. Les indicateurs non applicables d'un territoire applicable sont ignorés.
- **Couleurs** : `#B34000` pour non à jour (l'« orange » du ticket et le « rouge » de Triko sont cette teinte, déjà celle du non à jour et de l'orage en météo), `#27A658` pour à jour (soleil en météo), `#bababa` pour donnée absente (« non renseignée » en météo), hachures inchangées.
- **Tableau chantier** : deux colonnes « Non à jour » et « Sans donnée » au lieu d'une ; « À jour » ou « Non applicable » sur les deux colonnes quand c'est le cas. Tri : rouge, gris, vert, non applicable, puis nombre de non à jour décroissant, puis nombre sans donnée décroissant.
- **Infobulle chantier** : « 2 indicateurs non à jour · 1 sans donnée » (une partie à zéro est omise), « À jour », « Non applicable ».
- **Tableau et infobulle indicateur** : « Aucune valeur » déjà affiché ; pour une donnée absente, la colonne « Mise à jour attendue depuis » n'est plus en orange gras, et l'infobulle dit « Donnée absente ».
- **Légendes** :
  - chantier : « Tous les indicateurs sont à jour », « Un ou plusieurs indicateurs ne sont pas à jour », « Un ou plusieurs indicateurs sans donnée », non applicable inchangé ;
  - indicateur : « L'indicateur est à jour », « Donnée existante, mais non à jour », « Donnée absente », non applicable inchangé.
  - L'entrée non applicable reste masquée quand tous les territoires sont applicables (comportement actuel).

## Non-objectifs

- Pas de renommage « non à jour » → « à mettre à jour » (onglets, titres).
- Albert inchangé : `NON_A_JOUR_WHERE` et `GetIndicateursNonAJourQuery` gardent leur définition (donnée absente comprise dans « non à jour »). `estNonAJour` ne servait qu'à la carte : il est supprimé.
- Les valeurs initiales et cibles n'entrent pas en compte.
- Aucun changement dbt ni de schéma.

## Effet connu

`compute_ta_indic_jalon` n'écrit aucun jalon pour un indicateur sans tendance paramétrée. Un tel indicateur apparaîtra « sans donnée » même s'il a des valeurs. On l'accepte : la tendance est requise pour calculer un taux, et ce cas est déjà incomplet partout ailleurs.

## Approches

- **Côté serveur (retenue)** : la requête `GetTerritoiresNonAJourQuery` renvoie un état explicite par territoire, plus les deux comptes en mode chantier ; la priorité vit dans un helper à côté de `NON_A_JOUR_WHERE` et est couverte par le test d'intégration existant. Le client associe un état à une entrée de légende.
- **Côté client (écartée)** : la requête ne renverrait que les deux comptes et le client déduirait l'état dans `nonAJourDisplay.ts`. Écartée : la règle métier serait sans test (pas de précédent de test client dans ce dossier) et déduite deux fois, différemment selon le mode.

## Conception

### Serveur

- `indicateurNonAJour.ts` : type `EtatMiseAJour = "A_JOUR" | "NON_A_JOUR" | "SANS_DONNEE" | "NON_APPLICABLE"` et helper qui donne l'état d'une ligne `indicateur_territoire` selon les définitions ci-dessus. `NON_A_JOUR_WHERE` ne bouge pas ; `estNonAJour`, qui n'a plus d'appelant, est supprimé.
- Dans les deux modes, la requête lit la date du dernier jalon par une relation `indicateur_territoire_jalon` triée par `jalon` décroissant, limitée à une ligne, réduite à `date_valeur_actuelle` (même forme que `GetIndicateursSansViVcQuery`). Elle ne lit plus `date_valeur_actuelle_mandat`.
- `GetTerritoiresNonAJourQuery.byChantier` : compte `nbIndicateursNonAJour` (désormais hors donnée absente) et `nbIndicateursSansDonnee`, et déduit `etat` par la règle de priorité.
- `GetTerritoiresNonAJourQuery.byIndicateur` : `dateDerniereValeur` vient aussi du dernier jalon.
- Modèles de vue (mon choix : `etat` remplace `estApplicable` et `estAJour`, qu'il rend redondants) :
  - chantier : `{ territoireCode, etat, nbIndicateursNonAJour, nbIndicateursSansDonnee }` ;
  - indicateur : `{ territoireCode, etat, dateDerniereValeur, miseAJourAttendueDepuis }`.
- Test d'intégration `GetTerritoiresNonAJourQuery.integration.test.ts` : les quatre états en mode indicateur ; en mode chantier, non à jour + sans donnée → `NON_A_JOUR`, sans donnée + à jour → `SANS_DONNEE`, tous à jour → `A_JOUR`, aucun applicable → `NON_APPLICABLE`, et les deux comptes.

### Client

- `legendItemsIndicateursNonAJour.ts` : entrées par état (à jour, non à jour, sans donnée, non applicable — ordre du ticket, mon choix), couleurs et libellés ci-dessus.
- `nonAJourDisplay.ts` : remplissage, tri et libellés dérivés de `etat` ; `isChantierMode` s'appuie sur la présence des comptes.
- `TerritoiresNonAJourTable.tsx` : grille à trois colonnes dans les deux modes, en-têtes « Non à jour » / « Sans donnée » en mode chantier.
- `WidgetCartographieIndicateursNonAJour.tsx` : sous-titre du tableau chantier « Nombre d'indicateurs non à jour ou sans donnée » (mon choix).

## Laissé au builder

Formulation exacte des pluriels, découpage des composants, nom du helper.

## Vérification

Test d'intégration de la requête, `pnpm lint` de pilote-ppg, puis contrôle visuel des deux cartes dans l'app locale.
