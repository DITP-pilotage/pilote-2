# GeoJSON France stylisé pour la carte kpilote

Date : 2026-07-23

## Contexte et problème

La carte kpilote (`CarteFrance.tsx`, ECharts) rend un GeoJSON géographique réaliste
(`public/maps/france-departements.json`, coordonnées WGS84). Sur ce fond, Paris et la
petite couronne (75, 92, 93, 94) sont géographiquement minuscules : ~5 px chacun à
l'échelle nationale. Ils se superposent en un point et sont invisibles / non cliquables.
Perçu comme « la petite couronne manque », alors que **les données sont présentes** — c'est
un problème de visibilité inhérent à toute carte réaliste de France.

L'application ppg (`apps/pilote-ppg`) résout ce problème avec une carte **schématique** : un
SVG stylisé (`public/img/cartographie-vue-departements.svg`, viewBox `0 0 93.54 93.54`) où
l'Île-de-France est **dessinée agrandie**, rendant la petite couronne bien visible.

**Décision produit retenue** : remplacer entièrement les GeoJSON kpilote par la version
stylisée convertie depuis ppg. Toute la France passe au style schématique (départements
**et** régions, pour la cohérence visuelle et l'`aspectScale`).

## Faits établis (vérifiés)

- **Codes alignés au caractère près.** Retirer le préfixe donne exactement le `code` kpilote :
  - Départements : `DEPT-75` → `75`, `DEPT-2A` → `2A`, `DEPT-976` → `976`. 101 territoires
    des deux côtés (métropole + DOM 971/972/973/974/976).
  - Régions : `REG-84` → `84`, `REG-01` → `01` (Guadeloupe)… 18 régions des deux côtés.
- **Paths simples.** Sur les 120 paths du SVG départements : 111 sont des polygones purs
  (`M…z`), quelques-uns utilisent `L/l/h/v`, **un seul** (DEPT-39) contient une courbe `c`.
  Un parser SVG éprouvé suffit ; inutile de réimplémenter.
- **Filtrage nécessaire.** Le SVG `departements` contient aussi les paths `REG-*` et `NAT-FR`
  (fonds/frontières) ; le SVG `regions` contient aussi 101 `DEPT-*`. Il faut filtrer sur le
  bon préfixe selon la sortie générée.
- **MultiPolygon.** Les territoires à 2+ sous-chemins (`z` multiples) — dépt 13, 26, 84, 971 —
  doivent devenir des `MultiPolygon`.
- **Contrat de sortie (zod, `src/api/geoJson.ts`).** Chaque Feature doit avoir
  `properties: { code: string, nom: string }` (les deux **requis**) et une `geometry`
  (`z.unknown()`, donc Polygon/MultiPolygon accepté). `nom` est joint depuis
  `apps/pilote-ppg/src/client/constants/territoires.json` (champ `nomAffiché`).
- **Chargement.** kpilote fetch `/maps/france-departements.json` et `/maps/france-regions.json`
  via `ky` + validation zod. Remplacer les fichiers suffit ; aucun changement d'API.

## Pas de projection inverse

ECharts `registerMap` ne requiert pas de vraies lat/lon : il rend n'importe quel espace de
coordonnées cohérent. On **conserve l'espace stylisé ppg tel quel** (viewBox 93.54×93.54).
Seule transformation nécessaire : **inverser l'axe Y** (`y' = 93.54 − y`), car l'axe SVG
descend alors que GeoJSON/ECharts monte — sinon la France est à l'envers.

## Design

### 1. Script de génération (committé, reproductible)

`apps/kpilote-webapp/scripts/generer-geojson-france.mjs`

- Dépendance dev ajoutée : `svgpath` (normalise en commandes absolues, aplatit la courbe).
- Entrées :
  - SVG source ppg (`../../pilote-ppg/public/img/cartographie-vue-{departements,regions}.svg`)
  - `../../pilote-ppg/src/client/constants/territoires.json` (pour les `nom`).
- Traitement, par carte :
  1. Lire le SVG, extraire chaque couple `(territoire-code, d)`.
  2. Filtrer sur le préfixe cible (`DEPT-` pour départements, `REG-` pour régions).
  3. Parser `d` avec `svgpath` → séquences de points absolus ; chaque sous-chemin (`z`) = un
     anneau ; 1 anneau → `Polygon`, 2+ → `MultiPolygon`.
  4. Inverser Y (`93.54 − y`) sur chaque point.
  5. `properties.code` = code sans préfixe ; `properties.nom` = `nomAffiché` du territoire.
- Sorties (écrasent l'existant) :
  - `apps/kpilote-webapp/public/maps/france-departements.json`
  - `apps/kpilote-webapp/public/maps/france-regions.json`
- Le viewBox (`93.54`) est lu depuis le SVG, pas codé en dur.

### 2. Ajustement `CarteFrance.tsx`

- `aspectScale: 0.65` était calibré pour du WGS84 (degrés de longitude plus étroits que la
  latitude). La carte stylisée encode déjà les bonnes proportions → **`aspectScale: 1`**.
- Aucun autre changement : `nameProperty: 'code'` reste valide (les codes sont identiques),
  le matching des `points` par `code` est inchangé.

## Vérification

- Le script émet un GeoJSON qui **passe le schéma zod** existant (test rapide : le parser ne
  jette pas).
- Comptages attendus : 101 features départements, 18 features régions.
- Contrôle visuel dans l'app : la petite couronne (75/92/93/94) est visible et survolable ;
  la France est à l'endroit et non compressée.

## Hors périmètre

- Pas de récupération de vraies coordonnées géographiques (le style stylisé est volontaire).
- Pas de refonte de `CarteFrance` / des widgets au-delà de l'`aspectScale`.
- Pas de modification côté ppg (source en lecture seule).
