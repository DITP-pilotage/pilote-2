# Goldens Validata

Ces fichiers sont la **référence de parité** de la validation locale des fichiers d'import.

Ils ont été capturés une dernière fois sur `api.validata.etalab.studio` (**v0.12.5**, le 2026-09-16)
avant la suppression du service, en lui soumettant chaque fixture de
`src/server/infrastructure/fichier-tabulaire/__fixtures__/` contre les 4 schémas de `public/schema/`.

**Ces scripts ne tournent pas en CI** et n'ont pas vocation à être relancés : le service n'est plus
appelé par l'application. Les goldens sont commités, et la suite de tests est entièrement hors ligne.

## Ce qui fait foi dans un golden

- `valid` — le verdict
- `errors[].type`, `rowNumber`, `fieldName`, `cell` — la localisation et la nature des violations
- `resource_data` — le résultat du parsing

## Ce qui ne fait pas foi

Les **messages**. La table de traduction française de l'application était débranchée depuis PIL-553
(Validata v0.12 a cessé de renvoyer les champs `code`, `note` et `description` sur lesquels elle
indexait), et 100 % des messages affichés venaient de Validata. La validation locale sert désormais
le catalogue français de l'application. Voir l'ADR 0009.

## Règles de comportement établies par cette capture

| Observation | Conséquence |
|---|---|
| Plafond de **1000 erreurs**, `rows_processed` s'arrête alors (200 lignes sur 2000) | `PLAFOND_VIOLATIONS_DEFAUT = 1000`, et on cesse de lire au-delà |
| `1e5`, `+5`, ` 5 `, `-3` sont des nombres valides ; `12,5` et `abc` sont des `type-error` | La regex de nombre doit accepter signe, décimale au point **et notation scientifique** |
| `minimum` / `maximum` sortent en `constraint-error`, pas en type distinct | Nos types `minimum` / `maximum` sont plus fins ; la parité porte sur `(rowNumber, fieldName)` |
| Colonne du schéma absente **hors clé primaire** (`valeur`) → `valid: true` + warning | `schema_sync` : le champ est ignoré |
| Colonne du schéma absente **dans la clé primaire** (`identifiant_indic`) → erreur `missing-label` | Une colonne de clé primaire manquante est **bloquante** |
| En-tête avec espace (` zone_id`) → `valid: true`, 2 warnings | Validata ne reconnaît pas la colonne et l'ignore ; c'est l'application qui signale l'espace |
| En-tête en majuscules (`IDENTIFIANT_INDIC`) → `missing-label` | Validata est **sensible à la casse** des en-têtes |
| En-têtes dupliqués → `duplicate-label`, seule erreur remontée | Erreur fatale, l'analyse s'arrête |
| Ligne entièrement vide → `blank-row` **et** `primary-key`, même `rowNumber` | Deux violations pour une ligne |
| Doublon de clé primaire → une seule `primary-key`, sur la **seconde** occurrence | |
| `rowNumber` = index dans `resource_data` + 1 | En-tête = ligne 1, 1ʳᵉ ligne de données = ligne 2 |
| XLSX à cellules vides intercalées → `None` intercalé, **cellules finales tronquées**, erreur `missing-cell` | Une ligne plus courte que le schéma produit `missing-cell` |
