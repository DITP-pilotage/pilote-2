# Suppression de Validata — validation locale de l'import d'indicateur

Date : 2026-09-16
Branche : `feat/ppg-suppression-validata`

## Contexte

L'import de données d'indicateur de `pilote-ppg` délègue deux responsabilités à un service tiers,
l'API Validata d'Etalab (`api.validata.etalab.studio`) :

1. **Parser** le fichier uploadé (CSV ou XLSX) en lignes brutes.
2. **Valider** ces lignes contre un schéma Table Schema (spec frictionlessdata), hébergé dans ce
   repo mais fourni à Validata sous forme d'une URL `raw.githubusercontent.com`.

C'est **le seul service tiers du flux principal**, et il tombe. L'historique Jira en atteste :

| Ticket | Date | Sujet |
|---|---|---|
| PIL-450 | 2024-10 | Import de données down (MAJ Validata) |
| PIL-553 | 2025-01 | Passage forcé à Validata v0.12 |
| PIL-1279 | 2026-02 | Fichier de chargement provoquant un comportement non identifié |
| PLTT-330 | 2024-01 | Import formule Excel « undefined » |

Les règles de validation sont pourtant entièrement connues et déjà hébergées ici
(`public/schema/*.json`). Rien ne justifie une dépendance réseau non maîtrisée.

**Deux dépendances réseau, pas une** : l'appel à Validata, *et* Validata qui va chercher le schéma
sur GitHub. D'où la duplication du dossier `public/schema/` à la racine du repo, dont le README
indique qu'il n'existe que pour maintenir les URLs brutes GitHub.

## Objectif et principe directeur

Remplacer Validata par une validation et un parsing **100 % locaux**, sans aucune dépendance réseau.
Remplacement direct : pas de feature flag, pas de fallback.

**Principe directeur, non négociable : parité 1:1 sur le verdict.**

Pour tout fichier d'entrée, le nouveau moteur doit produire le même verdict que Validata —
valide/invalide, quelles lignes, quels champs, quel type d'erreur. C'est ce verdict qui pilote
l'import : tout écart est une régression fonctionnelle.

Seule exception, décidée explicitement : les **messages** affichés à l'utilisateur. Voir
« Messages d'erreur » plus bas.

Tout le reste — durcissement, optimisation du flux, amélioration de l'UX — est **subordonné à la
parité** et, quand ce n'est pas une conséquence directe de la suppression de Validata, **reporté à
un second temps**.

## Empreinte actuelle de Validata

### Cœur du flux

| Fichier | Rôle |
|---|---|
| `infrastructure/adapters/FetchHttpClient.ts` | POST multipart vers Validata |
| `domain/ports/HttpClient.interface.ts` | port dédié |
| `infrastructure/adapters/ValidataFichierIndicateurValidationService.ts` | adapter + traduction FR |
| `infrastructure/ReportValidata.interface.ts` | contrat de réponse |
| `app/builder/ReportErrorBuilder.ts` | builder de test |
| `app/builder/ReportValidataWithDataBuilder.ts` | builder de test |
| `module.ts` | binding `httpClient` dans le cradle |

### Périphérie

- `config.ts` : `import.urlValidata` (`URL_VALIDATA`) et `schemaValidataUrl`
  (`NEXT_PUBLIC_SCHEMA_VALIDATA_URL`)
- `proxy.ts` : CSP `connect-src https://api.validata.etalab.studio/` (dev et prod) — déjà inutile,
  l'appel est serveur à serveur
- `gestion-contenu/domain/VariableContenuDisponible.ts` et
  `gestion-contenu/usecases/RecupererVariableContenuUseCase.ts` : exposition de l'URL de schéma
- `vitest.projects/fichiersIntegrationAvecMocksDeModule.ts` : projet vitest dédié, dont le
  commentaire dit « À SUPPRIMER AVEC VALIDATA ». Le projet `server-integration-mocks` et
  l'`exclude` de `server-integration` disparaissent avec lui
- `nock` en devDependency
- `public/schema/` **à la racine du repo** (duplicata de `apps/pilote-ppg/public/schema/`)
- Commentaire obsolète dans `PublierFichierIndicateurImporteUseCase.ts`

## Ce que la lecture du code a établi

Ces points sont **prouvés** et conditionnent la conception.

### 1. Deux délimiteurs CSV coexistent en production

`apps/pilote-ppg/public/model/template_import_PILOTE.csv`, le template officiel distribué aux
utilisateurs, est **séparé par des points-virgules**, en CRLF :

```
identifiant_indic;zone_id;zone_nom;date_valeur;type_valeur;valeur
```

Tandis que `ImportDonneeIndicateurAPIHandler` génère, sur le parcours JSON de l'API publique, un CSV
via `csv-stringify` **sans option `delimiter`**, donc séparé par des **virgules**.

Validata sniffe le dialecte, donc les deux passent aujourd'hui. Le lecteur local doit faire de même.

> Conséquence immédiate : l'implémentation de la branche `feat/ppg-import-validation-locale` est
> **cassée sur le parcours UI principal**. Elle appelle `csv-parse` en délimiteur par défaut (virgule),
> donc lit le template officiel comme une unique colonne géante, et conclut que l'en-tête
> `identifiant_indic` est absente.

### 2. Une colonne surnuméraire `zone_nom`

Les trois templates (`.csv`, `.xlsx`, et le CSV généré par l'API) portent une colonne `zone_nom` qui
n'existe dans **aucun** des 4 schémas. Validata la tolère — le message
`Duplicate labels in header is not supported with "schema_sync"` trahit qu'il tourne en mode
`schema_sync`, qui aligne le schéma sur l'en-tête réel.

Le moteur local doit tolérer les colonnes surnuméraires sans émettre d'erreur.

### 3. La table de traduction FR est morte dans son intégralité

Validata v0.12.5 ne renvoie plus les champs sur lesquels notre code fait ses recherches.

```
clés réellement renvoyées : cell, fieldName, fieldNumber, message, rowNumber, tags, title, type
attendues par ReportErrorTask et ABSENTES : code, description, fieldPosition, note, rowPosition
```

`personnaliserValidataMessage` indexe sur `taskError.note` et `taskError.code`. Les deux valent
`undefined`, toutes les recherches échouent, et la fonction retombe systématiquement sur
`return taskError.message`.

**Ce ne sont donc pas quelques messages morts : c'est la totalité de la table.** Elle ne s'exécute
plus depuis PIL-553 « Passage à la version v0.12 Validata », qui a changé le format des erreurs et
débranché silencieusement la couche de traduction. Le changement est passé inaperçu parce que
Validata v0.12 renvoie des messages en français, qui paraissent corrects.

Ce qu'un utilisateur lit aujourd'hui en production, verbatim :

> IND-XXX ne respecte pas le motif imposé
>
> \*\*Exemple valide\*\* : IND-001
>
> \*\*Détails techniques\*\* : la valeur doit respecter l'expression régulière `^IND-([0-9]{3,4})$`)

Du markdown non rendu, une expression régulière brute et une parenthèse orpheline.

Effets de bord de la même cause : `positionDeLigne` et `positionDuChamp` valent **toujours `-1`** en
base (`taskError.rowPosition` et `taskError.fieldPosition` étant `undefined`), et `nom` contient le
type Validata brut (`constraint-error`, `type-error`, `primary-key`, `blank-row`,
`duplicate-label`).

### 4. Les tests Validata existants ne sont pas un oracle

`ValidataFichierIndicateurValidationService.integration.test.ts` (780 lignes) injecte à la main des
`note` Validata via `ReportErrorBuilder`. Il teste **notre table de traduction**, pas le comportement
de Validata — et il est auto-réalisateur, puisque les `note` du test sont les mêmes chaînes mortes
que celles du code.

Ces tests restent utiles comme **catalogue des messages FR attendus**. Ils ne peuvent pas servir de
référence de parité.

## Comportement réel de Validata, mesuré le 2026-09-16

Capturé sur `api.validata.etalab.studio` **v0.12.5** (réponse en ~350 ms), schéma
`sans-contraintes.json`. Ces mesures sont la référence de parité.

| Cas | Comportement observé |
|---|---|
| CSV séparé par `;` | délimiteur sniffé, colonnes correctement séparées |
| CSV en cp1252 avec accents | lu correctement (`Rhône-Alpes` intact) |
| Colonne du schéma **absente** (`valeur`) | `valid: true`, simple **warning** « Colonne manquante » |
| Colonne **surnuméraire** (`zone_nom`) | `valid: true`, simple **warning** « Colonne surnuméraire » |
| Ligne entièrement vide | **deux** erreurs : `blank-row` *et* `primary-key` |
| Doublon de clé primaire | une erreur `primary-key`, `fieldName` et `cell` à `null` |
| En-têtes dupliqués | `duplicate-label`, fatal, aucune autre erreur remontée |
| En-tête avec espace ou majuscule | **aucune erreur Validata** — ce sont des ajouts applicatifs |
| Template XLSX officiel | accepté |
| `rowNumber` | 1-based, **en-tête comprise** : 1ʳᵉ ligne de données = `2` |

Vocabulaire des types d'erreur observés : `constraint-error`, `type-error`, `primary-key`,
`blank-row`, `duplicate-label`.

Structure de la réponse : `{ schema, url, options, version, date, report: { valid, stats, warnings,
errors }, resource_data }`, avec `stats: { errors, warnings, seconds, fields, rows, rows_processed }`.

**Les `warnings` sont ignorés par notre code et n'affectent pas `valid`.** La parité impose de
continuer à les ignorer.

### Conséquences directes sur la conception

- **`schema_sync` est confirmé.** Une colonne du schéma absente du fichier n'est pas une erreur.
  La vérification `contientTousLesChamps` de la branche `feat/ppg-import-validation-locale` en fait
  une erreur bloquante : **c'est une régression**, elle ne doit pas être reprise.
- Les colonnes surnuméraires sont ignorées sans erreur.
- Une ligne vide doit produire deux erreurs distinctes, pas une.
- La détection d'encodage et de délimiteur est obligatoire, pas optionnelle.

### Reste à mesurer pendant la campagne de capture

- plafond d'erreurs de frictionless (nombre d'erreurs remontées sur un fichier massivement invalide)
- coercition des nombres : `12,23`, `1e5`, `+5`, espaces, séparateur de milliers
- dates XLSX typées, cellules formule (cf. PLTT-330), nombres stockés en texte
- fichiers produits par LibreOffice et Google Sheets
- comportement sur `.ods` et sur un XLSX multi-feuilles

## Architecture

### Découpage

Critère de frontière : **le noyau ne sait pas ce qu'est un indicateur, l'adapter ne sait pas ce
qu'est une regex de schéma.**

```
src/server/infrastructure/fichier-tabulaire/     — générique, réutilisable
    lireFichierTabulaire.ts     dispatch .csv/.xlsx
    lireCsv.ts                  détection encodage + délimiteur, csv-parse
    lireXlsx.ts                 node:zlib + balayage XML
    lireZip.ts                  central directory + inflate borné

src/server/infrastructure/table-schema/          — générique, candidat à extraction
    TableSchema.types.ts
    compilerSchema.ts           JSON → schéma compilé (regex, Set, index)
    validerLignes.ts            schéma compilé + lignes → ViolationContrainte[]

src/server/import-indicateur/infrastructure/adapters/validation-fichier/
    LocalFichierIndicateurValidationService.ts   implémente le port existant
    SchemaRepository.ts                          charge, compile et met en cache
    genererMessageErreur.ts                      catalogue FR métier
```

**Pas de package workspace.** Le seul consommateur est `pilote-ppg`, et la frontière entre ppg et les
packages `kpilote-*` est délibérée. Le noyau est néanmoins écrit *comme s'il allait être extrait* —
pur, sans un seul import du domaine — pour que l'extraction reste mécanique le jour où un autre
import en a besoin. Quatre autres endroits de ppg parsent déjà du CSV à la main
(`UtilisateurCSVParseur`, `import-csv-publication`, `ImportMasseMetadataIndicateurUseCase`,
`import_csv/publication`) : la surface de réutilisation existe.

**Deux unités génériques et pas une**, parce qu'elles ont deux raisons de changer distinctes :
`fichier-tabulaire` bouge si Excel change, `table-schema` bouge si le vocabulaire de contraintes
change.

**Pas de module au sens de l'ADR 0007** pour le noyau : c'est du code pur, sans état ni dépendance à
injecter. Seul `fichierIndicateurValidationService` reste dans le cradle.

### Contrat de frontière

```ts
export type FichierTabulaire = {
  entetes: string[];
  lignes: string[][];
  numerosDeLigneSource: number[];
};

export function lireFichierTabulaire(
  chemin: string,
  nom: string,
): Promise<FichierTabulaire>;
```

Signature délibérément bête : un chemin, un nom, des chaînes en sortie. **Aucun type venant d'une
librairie ne traverse cette frontière** — c'est ce qui garantit qu'on pourra changer de lecteur plus
tard sans toucher au reste.

## Le lecteur de fichiers

### CSV

Détection d'encodage (BOM, puis heuristique UTF-8 / cp1252) et détection du délimiteur (`;` vs `,`),
puis `csv-parse` — déjà une dépendance du projet.

### XLSX — zéro dépendance ajoutée

Un `.xlsx` est un zip de XML. Node fournit tout :

- **`zlib.inflateRawSync(buf, { maxOutputLength })`** pour la décompression. L'option est vérifiée :
  9,7 Ko qui donnent 10 Mo (ratio 1027×) sont refusés net par `ERR_BUFFER_TOO_LARGE`, au niveau C++.
  C'est une garde anti zip bomb qu'aucune librairie n'offre aussi solidement.
- Lecture du **central directory** du zip pour connaître les tailles décompressées **avant**
  d'inflater, et n'extraire que les entrées utiles : `xl/worksheets/sheet1.xml`,
  `xl/sharedStrings.xml`, `xl/styles.xml`, `docProps/app.xml`.
- Balayage **linéaire** du XML de la feuille, sortie directe en `string[][]`.

Points de correction par rapport à l'existant :

- numéro de ligne = attribut `r` de `<row>`, pas un compteur → une ligne vide au milieu ne décale
  plus rien
- position de colonne = attribut `r` de `<c>` (ex. `C5`) → les cellules vides intercalées ne
  décalent plus les colonnes
- `t="s"` → sharedStrings ; `t="inlineStr"` → `<is><t>` ; `t="str"` → valeur de formule en cache
  (cf. PLTT-330) ; sinon `<v>` brut
- dates : sérial Excel + `numFmtId`, rendu tel que l'utilisateur le voit, sans passage par
  `toISOString()` qui décale d'un fuseau
- nombres : représentation textuelle conservée, pas de `Number()` destructif

**Aucune clé d'objet n'est construite à partir du contenu du fichier.** La sortie est un tableau de
tableaux de chaînes. Cela ferme par conception la classe de vulnérabilité « prototype pollution »
— celle du CVE de SheetJS — au lieu de la déléguer à la vigilance d'un mainteneur.

### Formats refusés explicitement

XLSX chiffré, ZIP64, classeurs multi-feuilles, `.ods`, `.xls` ancien format : **refus explicite avec
message clair et trace en log**, jamais une lecture approximative. On ne devine jamais.

Le périmètre exact des refus a été calé sur ce que le service acceptait, pour ne pas refuser un
fichier qui passait jusqu'ici.

## Le moteur Table Schema

Vocabulaire couvert, celui des 4 schémas existants : `required`, `pattern`, `enum`, `minimum`,
`maximum`, plus la clé primaire composite.

- **Compilation une fois** au chargement du schéma : `new RegExp` par champ, `enum` → `Set`, index de
  colonnes résolus. Cache mémoire — 4 schémas, immuables. (L'implémentation actuelle de la branche
  alloue une `RegExp` *par cellule*.)
- **Une seule passe row-major** : pour chaque ligne, boucle sur les champs compilés, clé primaire
  calculée dans le même parcours. Bonus non lié à la performance : les erreurs sortent naturellement
  ordonnées par ligne, comme l'utilisateur les lit.
- **Plafond d'erreurs** : au-delà, le fichier est de toute façon à refaire, on cesse d'analyser
  plutôt que d'inonder l'utilisateur et la base.
- Colonnes surnuméraires ignorées (cf. `zone_nom`).

## Messages d'erreur

Décision prise : **parité stricte sur le verdict, catalogue FR enfin branché.**

La mesure a montré que 100 % des messages affichés aujourd'hui viennent de Validata, et non du
catalogue français écrit dans le code. Ce catalogue existe, il est correct, il n'a simplement jamais
été exécuté depuis la v0.12.

Le moteur local sert ce catalogue. C'est un changement visible pour l'utilisateur, assumé, et dans le
bon sens : plus de markdown non rendu ni d'expressions régulières à l'écran.

La parité porte donc sur **le verdict** — valide/invalide, quelles lignes, quels champs, quel type
d'erreur — et non sur le texte des messages. Le texte est couvert par les tests unitaires du
catalogue, repris de la suite existante.

Chaque violation étant typée dès sa détection, le message est généré directement, sans couche de
rétro-ingénierie de chaînes tierces — et sans possibilité qu'un changement d'API la débranche
silencieusement, comme cela s'est produit avec PIL-553.

Corollaire : `positionDeLigne` et `positionDuChamp`, aujourd'hui toujours à `-1`, redeviennent des
valeurs réelles.

## Sécurité

En internalisant le parsing, on internalise la surface d'attaque que Validata absorbait jusqu'ici.

- **`maxFileSize` explicite sur formidable** — absent aujourd'hui, ni côté serveur ni côté client.
  Seuil calibré à partir des tailles réellement observées en production et de la limite d'upload
  de Validata, pour ne pas refuser un fichier qui passait jusqu'ici.
- **Plafond de taille décompressée et de nombre d'entrées du zip**, vérifié avant inflation.
- **Plafond de lignes.**
- Pas de DTD, pas d'expansion d'entités.
- Aucune clé d'objet issue du fichier.
- **Interdiction explicite d'introduire `xlsx` / SheetJS côté serveur.** `xlsx@0.18.5` est présent
  dans `apps/kpilote-webapp`, porte 2 advisories **high** sans correctif atteignable
  (`patched_versions: <0.0.0`, SheetJS hors registre npm), et n'est toléré que parce qu'il s'exécute
  dans le navigateur. Le même risque côté Node est d'une autre nature.

## Stratégie de test

### Étage 1 — Corpus de fixtures

Fichiers réels couvrant chaque cas, en CSV **et** XLSX quand c'est applicable :

- délimiteurs `;` et `,` ; UTF-8 avec et sans BOM, cp1252 ; LF et CRLF
- `zone_nom` présente et absente ; champ de schéma manquant ; en-têtes dupliqués, avec espaces, en
  majuscules ; `identifiant_indic` absent
- violations `required`, `pattern` par colonne, `enum`, `minimum`, `maximum`
- doublon de clé primaire ; ligne entièrement vide ; ligne vide **au milieu** du fichier
- cellule formule ; cellule date typée ; nombre stocké en texte ; nombres limites
- même fichier exporté depuis **Excel, LibreOffice et Google Sheets** (les producteurs n'écrivent pas
  le même XML)
- les 4 schémas

### Étage 2 — Relevé du comportement de référence

Pendant le développement, le corpus a été soumis au service pour relever son
comportement réel et caler les règles du moteur : plafond d'erreurs, formes de
nombre acceptées, traitement d'une colonne manquante selon qu'elle appartient ou
non à la clé primaire, sensibilité à la casse des en-têtes, cellules finales
absentes.

**Ce relevé n'est pas conservé.** Une fois la bascule faite, c'est notre
comportement qui fait référence : les règles vivent dans le code et dans les
tests unitaires, lisibles et modifiables, plutôt que dans des données figées sur
un service disparu. La suite de tests est entièrement hors ligne.

### Étage 3 — Tests unitaires

Moteur, lecteur, catalogue de messages. Les assertions de messages FR sont reprises des tests
existants.

Les tests d'intégration des handlers (`VerifierImportIndicateurHandler`,
`ImportDonneeIndicateurAPIHandler`) sont réécrits sur de vrais fichiers, sans mock réseau.

## Le flux d'import complet

### Aujourd'hui

**Étape 1 — Vérification**

1. `useFomulaireIndicateur` → `POST /api/chantier/:c/indicateur/:i/verifier` (multipart)
2. `verifier.ts` (`bodyParser: false`) → `VerifierFichierImportIndicateurHandler`
3. `parseForm` → formidable écrit dans `<ROOT>/uploads/` — **sans `maxFileSize`**
4. `RecupererVariableContenuUseCase` → `baseSchemaUrl`
5. `VerifierFichierIndicateurImporteUseCase` :
   - `recupererInformationIndicateurParId` → résolution du schéma
   - `validerFichier` → **réseau vers Validata**, qui fetch lui-même le schéma sur GitHub
   - `rapportRepository.sauvegarder`
   - normalisation ligne à ligne (date, casse `type_valeur`, casse `zone_id`, correspondance `indicId`)
   - si valide : `createMany` dans `mesure_indicateur_temporaire`
   - sinon : `createMany` dans `erreur_validation_fichier`

**Étape 2 — Publication**

6. `EtapePublierFichier` → `POST /api/chantier/:c/indicateur/:i?rapportId=…`
7. `PublierFichierIndicateurImporteUseCase` :
   - relit toutes les mesures temporaires depuis la base
   - `creerValeurIndicateurTerritoireEvenements`
   - transaction : `createMany` mesures + `enregistrerTous` événements + `deleteMany` temporaires

### Ce que la suppression change, et ce qu'elle révèle

**Conséquences directes, dans cette PR :**

- L'aller-retour réseau disparaît, ainsi que le fetch du schéma sur GitHub. La latence passe de
  l'ordre de la seconde à l'ordre de la milliseconde.
- `recupererFichier` (`createReadStream`) n'a plus de raison d'être : il n'existait que pour
  alimenter le POST multipart.
- La suppression du fichier temporaire, aujourd'hui portée par `FetchHttpClient`, doit être
  reprise explicitement par le nouvel adapter, sur **tous** les chemins de sortie.
- `maxFileSize` sur formidable (cf. Sécurité).

**Défauts révélés, à traiter en second temps** (hors périmètre de cette PR, pour ne pas mélanger
avec la parité) :

1. **Détour JSON → CSV → disque sur l'API publique.** `ImportDonneeIndicateurAPIHandler` sérialise le
   JSON reçu en CSV, l'écrit sur disque, pour que Validata puisse le manger. Une fois Validata parti,
   ce détour est absurde — et c'est précisément là que se cache l'incohérence de délimiteur.
   *Conservé tel quel dans cette PR* : le supprimer changerait le chemin de validation, donc
   risquerait la parité. À retirer une fois le 1:1 acquis.
2. **N+1 à la publication.** `creerValeurIndicateurTerritoireEvenements` fait un `await` par groupe
   `(indicId, territoireCode)`, séquentiellement, et **hors transaction** — alors que les écritures
   qui suivent sont, elles, transactionnelles. Un import couvrant 100 territoires fait 100
   allers-retours avant même d'ouvrir la transaction. Un TODO daté de 2025-08 le signale déjà.
3. **Le front ne vérifie pas `response.ok`.** `useFomulaireIndicateur` fait directement
   `.then(response => response.json())`. Sur un 500, Next renvoie du HTML, `json()` lève, et il n'y a
   pas de `catch` — seulement un `finally`. L'utilisateur voit le chargement s'arrêter **sans aucun
   message**. C'est très probablement le symptôme de PIL-211 « Import impossible et sans message
   d'erreur » et de PIL-1279.
4. **Erreurs de validation écrites hors transaction.** `PrismaErreurValidationFichierRepository`
   importe `prisma` directement, là où les autres repositories du module passent par `getPrisma()`,
   qui est sensible à la transaction en cours.
5. **Pas de contrôle de propriété à la publication.** `PublierFichierImportIndicateurHandler` prend
   `rapportId` dans la query string et publie, sans vérifier que le rapport appartient à l'appelant.
   Le `DetailValidationFichier` porte pourtant `utilisateurEmail`.
6. **`request.read()` synchrone** sur le parcours JSON de l'API — peut renvoyer `null` si le buffer
   n'est pas prêt.
7. **Quatre passes sur les mêmes données** entre vérification et publication (écriture temporaire,
   relecture, écriture définitive, suppression). Justifié par la confirmation utilisateur, mais
   optimisable par lots, voire par un `INSERT … SELECT` côté base.

## Observabilité

`application_log` existe déjà (logs persistés, `categorie` / `source` / `contexte`, consultables et
filtrables depuis le panel admin — PIL-1444). Le code d'import logue déjà en `categorie: "import"`.

On s'en sert pour transformer un risque aveugle en risque mesuré :

- **log du producteur du fichier**, lu dans `docProps/app.xml` (`Microsoft Excel`, `LibreOffice/7.x`,
  `Google Sheets`…). Au bout d'un mois, on connaît la distribution réelle des producteurs sur les
  vrais fichiers des vrais utilisateurs.
- **tout refus est tracé** avec le producteur, la raison exacte et le nom du fichier — donc visible
  dans le panel admin le jour même, plutôt que découvert six mois plus tard par un utilisateur qui
  abandonne en silence.

## Nettoyage

- Suppression de `FetchHttpClient.ts`, `HttpClient.interface.ts`,
  `ValidataFichierIndicateurValidationService.ts`, `ReportValidata.interface.ts`,
  `ReportErrorBuilder.ts`, `ReportValidataWithDataBuilder.ts`
- `module.ts` : disparition du binding `httpClient`
- `config.ts` : retrait de `import.urlValidata` et `schemaValidataUrl`, avec leurs variables
  d'environnement — **après vérification qu'elles ne sont pas positionnées dans un manifeste de
  déploiement externe au repo**
- `proxy.ts` : retrait de `api.validata.etalab.studio` de la CSP (dev et prod)
- `VariableContenuDisponible.ts` et `RecupererVariableContenuUseCase.ts` : retrait de
  `NEXT_PUBLIC_SCHEMA_VALIDATA_URL`
- `ValiderFichierPayload.schema` passe d'une URL complète à un simple nom de fichier ;
  `baseSchemaUrl` disparaît de `VerifierFichierIndicateurImporteUseCase.execute()` et des deux
  handlers appelants
- Suppression de `nock`
- Suppression du dossier `public/schema/` **à la racine du repo**
- Suppression du projet vitest `server-integration-mocks`, du module
  `vitest.projects/fichiersIntegrationAvecMocksDeModule.ts` et de l'`exclude` correspondant dans
  `server-integration` : les tests d'intégration construisent de vraies requêtes HTTP, plus aucun
  `vi.mock` ne subsiste, et la suite retrouve un seul projet
- Commentaire obsolète dans `PublierFichierIndicateurImporteUseCase.ts`

## Hors scope

- Pas de feature flag ni de bascule Validata/local.
- Pas de refonte du format des schémas JSON (ils restent en Table Schema frictionlessdata).
- Pas de support de contraintes au-delà du vocabulaire des 4 schémas existants.
- Pas de refonte du catalogue de messages FR au-delà de la réparation des cas morts.
- Les sept défauts de flux listés plus haut, hors ceux qui sont une conséquence directe de la
  suppression.

## Risques

| Risque | Traitement |
|---|---|
| Parité imparfaite sur un cas non anticipé | Le comportement de référence a été relevé cas par cas pendant le développement, puis figé dans les tests unitaires du moteur et de l'adapter |
| Recoins d'OOXML propres à un producteur | Fixtures multi-producteurs + refus explicite plutôt que lecture approximative + log du producteur |
| Nos propres bugs de parsing | Périmètre étroit (une feuille, cinq colonnes, chaînes et nombres), corpus, et porte de sortie documentée |
| Variables d'environnement positionnées hors du repo | Vérification avant retrait du code de config |

## Critères de sortie

Décidés à l'avance plutôt que renégociés dans dix-huit mois. Si l'un des deux est atteint, on bascule
le lecteur XLSX sur une librairie tierce derrière `lireFichierTabulaire` — décision déjà actée :

- le taux de rejet pour format non supporté dépasse **2 % des imports sur un mois glissant**,
  mesuré sur `application_log`, ou
- le coût de maintenance du lecteur dépasse **5 jours-homme par an**.

(Seuils proposés, à valider en revue.)

Le remplacement reste bon marché **parce que** le contrat de frontière ne laisse fuiter aucun type de
librairie. Le trajet inverse — partir d'une librairie et revenir à du code maison — est celui qui
devient impossible, parce qu'à ce moment-là le comportement de la librairie *est devenu* la
spécification. C'est la situation dont `kpilote-webapp` n'arrive pas à sortir avec `xlsx`.
