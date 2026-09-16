# 9. Validation locale des fichiers d'import, sans dépendance tierce

Date : 2026-09-16

## Statut

Proposé

## Contexte

L'import de données d'indicateur délègue le parsing et la validation des fichiers
(CSV, XLSX) à l'API Validata d'Etalab, `api.validata.etalab.studio`. C'est **le
seul service tiers du flux principal du produit**, et il constitue une
dépendance dure : quand il tombe, plus aucun import n'est possible.

Il tombe régulièrement. Historique :

| Ticket | Date | Sujet |
|---|---|---|
| PIL-450 | 2024-10 | Import de données down (MAJ Validata) |
| PIL-553 | 2025-01 | Passage forcé à Validata v0.12 |
| PIL-1279 | 2026-02 | Comportement non identifié sur un fichier de chargement |
| PLTT-330 | 2024-01 | Import formule Excel « undefined » |

La dépendance est en réalité double : on appelle Validata, et Validata va
chercher le schéma de validation sur `raw.githubusercontent.com`. C'est la raison
d'être du dossier `public/schema/` dupliqué à la racine du repo.

Or les règles de validation sont entièrement connues et déjà hébergées ici :
quatre fichiers Table Schema (frictionlessdata) dans `public/schema/`, partageant
cinq colonnes et un vocabulaire de six contraintes (`required`, `pattern`,
`enum`, `minimum`, `maximum`, clé primaire composite). Rien dans ce périmètre ne
justifie un service tiers.

Deux contraintes encadrent la décision :

- **L'infrastructure ne permet pas d'absorber un incident mémoire.** Sur
  Scalingo, augmenter un conteneur n'est pas une option. Un process tué par
  l'OOM killer n'emporte pas seulement l'import en cours, il emporte toutes les
  requêtes servies par l'instance.
- **Internaliser le parsing, c'est internaliser la surface d'attaque** que
  Validata absorbait jusqu'ici. Un `.xlsx` est un zip : une archive malveillante
  de 1 Mo peut inflater en plusieurs Go.

## Décision

Nous remplaçons Validata par une validation et un parsing **100 % locaux**, sans
aucune dépendance réseau, et **sans aucune dépendance npm ajoutée**.

### Parité 1:1 sur le verdict

Pour tout fichier d'entrée, le moteur local doit produire le même verdict que
Validata : valide/invalide, quelles lignes, quels champs, quel type d'erreur.
C'est ce verdict qui pilote l'import ; tout écart est une régression.

La parité est établie par **mesure, pas par lecture de code** : un corpus de
fixtures est soumis une dernière fois à Validata, et les réponses sont commitées
comme goldens. Ces goldens sont la spécification et le critère d'acceptation. Le
script de capture ne tourne pas en CI, qui reste entièrement hors ligne.

Seule exception, décidée explicitement : quatre messages français sont
aujourd'hui inatteignables (clés de traduction désynchronisées des schémas), et
l'utilisateur reçoit à leur place le message brut de Validata, en anglais. Ces
messages sont réparés.

### Découpage

Le code générique est séparé du domaine métier, selon le critère : **le noyau ne
sait pas ce qu'est un indicateur, l'adapter ne sait pas ce qu'est une regex de
schéma.**

- `server/infrastructure/fichier-tabulaire/` — lecture CSV/XLSX vers
  `string[][]`. Générique, réutilisable : quatre autres endroits de ppg parsent
  déjà du CSV à la main.
- `server/infrastructure/table-schema/` — moteur de contraintes frictionless.
  Générique, candidat à extraction.
- `import-indicateur/infrastructure/adapters/validation-fichier/` — l'adapter qui
  implémente le port existant et produit les messages métier.

Pas de package workspace : le seul consommateur est `pilote-ppg`, et la frontière
avec les packages `kpilote-*` est délibérée. Le noyau est néanmoins écrit comme
s'il allait être extrait, pour que l'extraction reste mécanique.

Pas de module au sens de l'ADR 7 pour le noyau : c'est du code pur, sans état ni
dépendance à injecter.

### Lecture XLSX sur la bibliothèque standard de Node

Un `.xlsx` est un zip de XML, et Node fournit tout le nécessaire :

- `zlib.inflateRawSync(buf, { maxOutputLength })` décompresse en **refusant les
  zip bombs au niveau C++** — vérifié : 9,7 Ko donnant 10 Mo (ratio 1027×) sont
  rejetés par `ERR_BUFFER_TOO_LARGE`.
- Le central directory du zip donne les tailles décompressées **avant**
  inflation, et permet de n'extraire que les quatre entrées utiles.
- Un balayage linéaire du XML produit directement `string[][]`, en lisant les
  attributs de position `r` plutôt qu'en comptant les éléments.

**Aucune clé d'objet n'est construite depuis le contenu du fichier.** Cela ferme
*par conception* la classe de vulnérabilité « prototype pollution » — celle du
CVE de SheetJS — au lieu de la déléguer à la vigilance d'un mainteneur.

### Interdictions explicites

- **`xlsx` / SheetJS est interdit côté serveur.** `xlsx@0.18.5` est présent dans
  `apps/kpilote-webapp` avec deux advisories *high* sans correctif atteignable
  (`patched_versions: <0.0.0` — SheetJS a quitté le registre npm). Le risque n'y
  est toléré que parce que le code s'exécute dans le navigateur, où le rayon
  d'action se limite à la session de l'utilisateur. Côté Node, dans un process
  qui traite les uploads de tous les utilisateurs, ce n'est pas le même risque.
- **On ne devine jamais.** Tout format qu'on ne sait pas lire (XLSX chiffré,
  ZIP64, multi-feuilles) est refusé avec un message explicite et une trace en
  log, jamais lu approximativement.

### Alternative écartée : `exceljs`

Considérée, et écartée sur trois motifs :

1. Elle **ne peut pas se protéger du zip bomb** : `jszip` inflate en mémoire
   avant de rendre la main. Or c'est le vecteur de déni de service le plus
   probable contre l'import — et remplacer un tiers qui tombe par un moyen de
   faire tomber l'import soi-même serait absurde.
2. Elle est **figée depuis 21 mois** (4.4.0, décembre 2024) et épingle `saxes@5`
   (dernière publication amont : 2022) et `archiver@5` (trois majeures de
   retard), pour six dépendances directes au contact de l'octet hostile, dont une
   — `archiver`, écriture de zip — dont nous n'avons aucun usage. Si une advisory
   y tombe, nous serions exactement dans la situation `xlsx` : sans correctif
   atteignable.
3. Son modèle objet (`Row`, `Cell` par cellule) impose une empreinte mémoire sans
   rapport avec le besoin, sur une infrastructure qui ne peut pas grossir.

## Conséquences

**Positives**

- Le flux principal du produit n'a plus aucune dépendance réseau externe. Les
  incidents de la famille PIL-450 ne peuvent plus se produire.
- Aucune dépendance npm ajoutée : la surface de supply chain reste inchangée.
- La latence de validation passe de l'ordre de la seconde à l'ordre de la
  milliseconde, l'aller-retour réseau et le fetch du schéma sur GitHub
  disparaissant.
- Les messages d'erreur sont typés à la détection, au lieu d'être rétro-conçus
  par filtrage de chaînes anglaises non documentées. Quatre messages français
  morts redeviennent atteignables.
- Le dossier `public/schema/` dupliqué à la racine du repo disparaît, ainsi que
  le projet vitest dédié aux mocks réseau et la dépendance `nock`.
- La numérotation des lignes et des colonnes devient exacte, y compris avec des
  lignes vides intercalées — ce que l'implémentation précédente ne garantissait
  pas.

**Négatives**

- **Nous héritons des recoins d'OOXML.** Excel, LibreOffice, Google Sheets et
  Numbers n'écrivent pas le même XML. Un fichier légitime mal lu produit une
  validation fausse : ce n'est pas une faille, mais c'est une régression visible.
  Traité par un corpus de fixtures multi-producteurs, par le refus explicite
  plutôt que la lecture approximative, et par le log du producteur (lu dans
  `docProps/app.xml`) qui rend la distribution réelle mesurable dans
  `application_log`.
- Le coût de maintenance du lecteur nous revient, au lieu de revenir à un
  mainteneur amont.
- Des besoins futurs sortant du périmètre (multi-feuilles, `.ods`, `.xls`)
  coûteront du travail réel plutôt que d'être acquis gratuitement.

**Critères de sortie**

Décidés maintenant plutôt que renégociés plus tard. Si l'un des deux est atteint,
on bascule le lecteur XLSX sur une librairie tierce derrière
`lireFichierTabulaire` :

- le taux de rejet pour format non supporté dépasse **2 % des imports sur un mois
  glissant**, mesuré sur `application_log`, ou
- le coût de maintenance du lecteur dépasse **5 jours-homme par an**.

Ce repli reste bon marché **parce que** le contrat de frontière
(`lireFichierTabulaire(chemin, nom) → { entetes, lignes, numerosDeLigneSource }`)
ne laisse fuiter aucun type de librairie. Le trajet inverse — partir d'une
librairie pour revenir à du code maison — est celui qui devient impossible,
parce qu'à ce moment-là le comportement de la librairie *est devenu* la
spécification, quirks compris. C'est la situation dont `kpilote-webapp` n'arrive
pas à sortir avec `xlsx`.
