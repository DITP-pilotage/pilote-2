# Validation locale du fichier d'import d'indicateur (remplacement de Validata)

Date : 2026-08-31

## Contexte

L'import de données d'indicateur (`import-indicateur`) délègue aujourd'hui deux responsabilités à un service tiers, l'API Validata d'Etalab (`api.validata.etalab.studio`) :

1. **Parser** le fichier uploadé (CSV ou XLSX) en lignes brutes.
2. **Valider** ces lignes contre un schéma "Table Schema" (spec frictionlessdata), lui-même hébergé dans ce repo (`public/schema/*.json`) mais dont l'URL est fournie à Validata sous forme d'un lien `raw.githubusercontent.com` (`schemaValidataUrl` en config).

Le 2026-08-31, un incident DNS externe sur le domaine `etalab.studio` a rendu tous les imports indisponibles (`getaddrinfo ENOTFOUND api.validata.etalab.studio`), sans qu'aucun code de `pilote-ppg` ne soit en cause. Cet incident a révélé une dépendance dure à un service tiers non maîtrisé, pour une fonctionnalité dont les règles de validation sont en réalité entièrement connues et déjà hébergées dans ce repo.

## Objectif

Remplacer l'appel réseau à Validata par une validation et un parsing **100% locaux**, sans aucune dépendance réseau externe pour la fonctionnalité d'import. Remplacement direct (pas de feature flag, pas de fallback vers Validata).

## Périmètre actuel à couvrir

Les 4 schémas existants (`public/schema/sans-contraintes.json`, `restrict-0-100.json`, `restrict-dept.json`, `restrict-reg.json`) partagent :

- Les mêmes 5 colonnes : `identifiant_indic`, `zone_id`, `date_valeur`, `type_valeur`, `valeur`.
- Un vocabulaire de contraintes restreint : `required` (bool), `pattern` (regex), `enum` (liste de valeurs), `minimum`/`maximum` (nombre, uniquement sur `valeur` dans `restrict-0-100.json`).
- Une clé primaire composite (`primaryKey`) : `identifiant_indic` + `zone_id` + `date_valeur` + `type_valeur`, pour la détection des lignes dupliquées.

Le moteur de validation doit rester **générique** : il interprète le schéma JSON tel quel (comme le fait Validata), plutôt que de coder en dur les 5 colonnes actuelles. Un nouveau schéma ou une nouvelle contrainte de ce vocabulaire ne demandera qu'un fichier JSON, pas de changement de code.

## Architecture

Le port existant `FichierIndicateurValidationService` (domain, inchangé) est aujourd'hui implémenté par `ValidataFichierIndicateurValidationService`, qui délègue le parsing/HTTP à `FetchHttpClient` (implémentant le port `HttpClient`).

Un nouvel adapter le remplace, composé de 3 unités isolées :

```
src/server/import-indicateur/infrastructure/adapters/validation-fichier/
  LocalFichierIndicateurValidationService.ts   — implémente FichierIndicateurValidationService (nouveau point d'entrée du module)
  FichierParser.ts                             — CSV/XLSX -> string[][] (en-tête + lignes)
  TableSchemaValidator.ts                      — moteur générique de contraintes (schéma + lignes -> violations)
  SchemaRepository.ts                          — lecture/cache des public/schema/*.json depuis le disque
```

Chaque unité a une responsabilité unique, testable indépendamment de la production réelle :

- **`SchemaRepository`** : `charger(nomFichier: string): TableSchema`. Lit `public/schema/<nomFichier>` sur le disque (le process Next.js a déjà accès à ce dossier), le parse en JSON, met en cache en mémoire (les schémas ne changent pas en cours de run). Remplace la construction d'URL `raw.githubusercontent.com` faite aujourd'hui dans `VerifierFichierIndicateurImporteUseCase` (`baseSchemaUrl` + nom de fichier) — cette 2e dépendance réseau (silencieuse aujourd'hui, car c'est Validata qui la déclenche côté serveur) disparaît aussi.
- **`FichierParser`** : `parser(cheminCompletDuFichier: string, nomDuFichier: string): string[][]`. Détecte le format via l'extension de `nomDuFichier` (`.csv` / `.xlsx`, insensible à la casse). CSV via `csv-parse` (déjà une dépendance du projet). XLSX via `exceljs` (nouvelle dépendance, cf. section Dépendances). Retourne les lignes sous forme de `string[][]`, la ligne 0 étant l'en-tête — même format que `resource_data` renvoyé par Validata aujourd'hui, pour préserver le contrat en aval.
- **`TableSchemaValidator`** : `valider(schema: TableSchema, lignes: string[][]): ViolationContrainte[]`. Pour chaque ligne de données et chaque champ du schéma : vérifie `required`, `pattern`, `enum`, `minimum`/`maximum` (coercition en nombre pour `type: "number"`, erreur si non numérique). Vérifie séparément l'unicité de la clé composite `primaryKey` sur l'ensemble des lignes (colonnes vides sur cette clé traitées comme le fait Validata aujourd'hui : ligne "vide" signalée, pas comme un doublon classique).
- **`LocalFichierIndicateurValidationService`** : orchestre les 3 unités ci-dessus, reprend telles quelles les vérifications déjà présentes côté app aujourd'hui dans `ValidataFichierIndicateurValidationService` (en-têtes avec espaces/majuscules, présence de `identifiant_indic`), et construit le `DetailValidationFichier` / `ErreurValidationFichier` final — même contrat de sortie qu'aujourd'hui.

### Nettoyage

- `FetchHttpClient.ts`, `HttpClient.interface.ts` et `ValidataFichierIndicateurValidationService.ts` sont supprimés (aucun autre appelant dans le repo — vérifié).
- `module.ts` : le binding `httpClient` disparaît du cradle ; `fichierIndicateurValidationService` pointe vers `LocalFichierIndicateurValidationService`.
- `config.ts` : `import.urlValidata` et `export.schemaValidataUrl` (ou équivalent) deviennent inutiles et sont retirés, avec leurs variables d'environnement (`URL_VALIDATA`, `NEXT_PUBLIC_SCHEMA_VALIDATA_URL`) — à vérifier qu'elles ne sont pas référencées ailleurs (ex. déploiement, `.env.example`) avant suppression.

## Flux de données

1. `VerifierFichierIndicateurImporteUseCase.execute()` — **inchangé** : résout `schema` (nom de fichier, `sans-contraintes.json` par défaut) et appelle `fichierIndicateurValidationService.validerFichier({ cheminCompletDuFichier, nomDuFichier, schema, utilisateurEmail })`.

   Note : le paramètre `schema` transitant aujourd'hui dans le payload est une URL complète (`baseSchemaUrl + nomFichier`) car c'est Validata qui la fetch. Avec la validation locale, seul le nom de fichier est nécessaire. Ce point est traité dans la section "Changement d'interface" ci-dessous.

2. `LocalFichierIndicateurValidationService.validerFichier()` :
   - `SchemaRepository.charger(nomFichier)` → `TableSchema`.
   - `FichierParser.parser(cheminCompletDuFichier, nomDuFichier)` → `string[][]`.
   - Vérifications d'en-tête (espaces, casse, présence de `identifiant_indic`, doublons de libellés) — logique portée telle quelle depuis l'adapter actuel.
   - `TableSchemaValidator.valider(schema, lignes)` → violations de contraintes.
   - Construction de `listeIndicateursData` (`MesureIndicateurTemporaire`) à partir des lignes, comme aujourd'hui.
   - Construction de `listeErreursValidation` (`ErreurValidationFichier`) à partir des violations, avec les messages FR (cf. section suivante).
   - Retourne `DetailValidationFichier` — **contrat de sortie inchangé**, donc **zéro changement** dans `VerifierFichierIndicateurImporteUseCase` au-delà de la résolution du nom de schéma, ni dans les handlers, ni dans tout ce qui est en aval (persistance, publication).

### Changement d'interface (mineur)

`ValiderFichierPayload.schema` (dans `FichierIndicateurValidationService.interface.ts`) passe d'une URL complète à un simple nom de fichier (`"sans-contraintes.json"`). `VerifierFichierIndicateurImporteUseCase` n'a plus besoin de `baseSchemaUrl` ni de la concaténation `${baseSchemaUrl}${schema}` — il passe directement `schema` (le nom résolu depuis `informationIndicateur.indicSchema` ou `DEFAULT_SCHEMA`). `baseSchemaUrl` disparaît du handler appelant (`ImportDonneeIndicateurAPIHandler.ts:167`) et de la signature `execute()`.

## Gestion des erreurs

Aujourd'hui, `ValidataFichierIndicateurValidationService.ts:44-121` fait du pattern-matching sur des chaînes non documentées renvoyées par Validata (ex. `'constraint "pattern" is "..."'`, `"Provided schema is not valid."`, `'Duplicate labels in header is not supported with "schema_sync"'`) pour produire les messages FR affichés à l'utilisateur.

Avec `TableSchemaValidator`, chaque violation est **typée dès sa détection** (le validateur sait qu'il vient de rejeter un `pattern` sur `zone_id` à la ligne 12) : les messages FR sont générés directement à cet endroit, sans passer par une couche de traduction de strings tierces. Le catalogue de messages actuel (ligne vide, ligne dupliquée, en-tête invalide, `identifiant_indic` au mauvais format, `zone_id` invalide, `type_valeur` invalide) est repris à l'identique côté utilisateur — seule la façon de le déclencher change (détection directe au lieu de reverse-engineering d'un message Validata).

Type de violation retourné par `TableSchemaValidator` (indicatif, à affiner en implémentation) :

```ts
type ViolationContrainte = {
  colonne: string;
  ligneIndex: number;       // index dans les données (hors en-tête)
  cellule: string;
  type: "required" | "pattern" | "enum" | "minimum" | "maximum" | "type" | "primaryKey-duplicate" | "primaryKey-vide";
};
```

## Dépendances techniques

- **`csv-parse`** (`^5.3.6`) : déjà présente dans `package.json`, réutilisée telle quelle pour le CSV.
- **`exceljs`** (nouvelle) : parsing XLSX. Choisie plutôt que `xlsx`/SheetJS pour sa maintenance active et l'absence de CVE connue à ce jour. À valider en implémentation que la lecture en streaming/buffer depuis un chemin de fichier temporaire (comme fourni par `recupererFichier`) est directe avec cette lib.

## Tests

Les tests d'intégration existants mockent aujourd'hui l'appel HTTP Validata via `nock` :
- `VerifierImportIndicateurHandler.integration.test.ts`
- `ImportDonneeIndicateurAPIHandler.integration.test.ts`

Ils sont réécrits pour fournir de vrais fichiers CSV/XLSX (fixtures dans `__tests__/.../fixtures/`) en entrée, sans mock réseau puisqu'il n'y a plus d'appel réseau. Cas à couvrir :

- Fichier CSV valide, fichier XLSX valide (parité de comportement entre les deux formats).
- Violation `required`, `pattern`, `enum`, `minimum`/`maximum`.
- Doublon de clé primaire (`primaryKey`).
- Ligne entièrement vide sur la clé primaire.
- En-tête manquant (`identifiant_indic` absent), en-tête avec espace, en-tête en majuscule, en-têtes dupliqués.
- Schéma restrictif (`restrict-dept.json`, `restrict-reg.json`, `restrict-0-100.json`) vs `sans-contraintes.json`.

Les tests plus haut niveau (use case `VerifierFichierIndicateurImporteUseCase`, logique de normalisation de date/casse) ne nécessitent pas de changement, le contrat `DetailValidationFichier` étant préservé.

Les builders de test actuels liés à Validata (`ReportValidataWithDataBuilder`, `ReportErrorBuilder`) deviennent inutiles et sont supprimés une fois les tests migrés.

## Hors scope

- Pas de feature flag ni de bascule Validata/local en production (remplacement direct).
- Pas de refonte du format des fichiers de schéma JSON eux-mêmes (ils restent au format Table Schema frictionlessdata, seul leur mode de lecture change).
- Pas de support de contraintes Table Schema au-delà de celles déjà utilisées par les 4 schémas existants (`required`, `pattern`, `enum`, `minimum`, `maximum`, `primaryKey`) — un besoin futur au-delà de ce vocabulaire sera traité au moment où il se présente.

## Risques identifiés

- **Parité de comportement XLSX/CSV avec Validata** : Validata a ses propres règles de coercition de type (ex. gestion des cellules XLSX numériques vs texte). À vérifier en implémentation sur des fichiers réels (dont le fichier `template_import_PILOTE (2).xlsx` ayant déclenché l'incident) que le nouveau parseur produit les mêmes `resource_data` que Validata aurait produits.
- **Variables d'environnement à retirer** (`URL_VALIDATA`, `NEXT_PUBLIC_SCHEMA_VALIDATA_URL`) : à vérifier qu'elles ne sont pas positionnées dans un manifeste de déploiement externe à ce repo avant suppression complète du code de config qui les lit.
