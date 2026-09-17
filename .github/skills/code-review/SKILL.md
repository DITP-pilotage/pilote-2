---
name: code-review
description: Revue de code pour le monorepo Pilote — ce qu'il faut chercher en priorité, ce que la CI couvre déjà, et comment calibrer la sévérité.
---

# Revue de code — Pilote

Le contexte du dépôt (carte du monorepo, architecture, conventions) est dans
`.github/copilot-instructions.md`. Cette compétence dit **quoi chercher** et
**quoi laisser passer**.

Rédige la revue en français.

## Règle d'or

Une remarque doit décrire un **comportement erroné** avec son scénario de
déclenchement : quelle entrée, quel état, quel résultat faux. Si tu ne peux pas
écrire ce scénario, la remarque n'a pas sa place dans la revue.

Ne signale que ce qui est **introduit ou modifié par la diff**. Avant de relever
un problème sur une ligne, vérifie qu'elle est nouvelle : une chaîne, une faute
d'orthographe ou une bizarrerie déplacée d'un fichier à un autre lors d'un
refactoring est de l'existant, pas une régression — et la corriger peut être
hors-sujet par rapport à l'intention de la PR.

## À chercher en priorité

### 1. Promesses non attendues dans `pilote-ppg`

`typescript/no-floating-promises` et `no-misused-promises` sont **désactivées dans
`apps/pilote-ppg/.oxlintrc.json`** (dette assumée, ~290 violations existantes).
Le lint ne les attrapera pas. C'est l'angle mort le plus coûteux du dépôt :

- `await` manquant sur un appel repository / Prisma / `fetch` ;
- fonction `async` passée là où un callback synchrone est attendu (handler
  d'événement, `Array.prototype.forEach`, middleware) ;
- promesse créée sans `await` ni `.catch`, dont le rejet devient un
  `unhandledRejection` silencieux.

Dans les apps `kpilote-*`, ces règles sont en `error` : inutile de les chercher.

### 2. Permissions et habilitations

Tout accès aux données doit passer par le filtrage d'autorisation en place :

- `kpilote-api` : `src/<ressource>/permissions.ts` (`withIndicateurReadPermission`
  et équivalents). Une requête Prisma neuve qui construit son `where` à la main,
  sans ce helper, expose des données. Attention aussi à la propagation
  collection → indicateur, qui ne s'applique pas à `WRITE_DATA` / `WRITE_COMMENT`.
- `pilote-ppg` : habilitations utilisateur (`domain/utilisateur/habilitation/`).
  Vérifie qu'un nouveau handler ou usecase filtre bien sur le périmètre
  territorial de l'utilisateur.

### 3. Frontières d'architecture

- `pilote-ppg` : `domain/` qui importe `infrastructure/`, Prisma, Next ou un
  client HTTP. Classe injectée absente de `module.ts` (l'app casse au démarrage,
  pas au build).
- `pilote-ppg` ↔ `kpilote-*` : tout import qui traverse cette frontière.
- `kpilote-api` : `throw` là où le module utilise `Result` / `ResultAsync`
  (neverthrow) ; nouveau sous-dossier `src/` sans entrée `@/<dossier>/*` dans
  `tsconfig.json`.

### 4. Base de données

- Requêtes en boucle (N+1) sur un chemin qui traite une liste.
- SQL brut : interpolation de valeurs non paramétrées ; `INSERT` omettant
  `updated_at`, qui n'a pas de valeur par défaut.
- Écritures multiples qui devraient être dans une transaction.
- Migration qui change une colonne existante sans stratégie pour les lignes déjà
  en base.

### 5. Traitement d'entrées non fiables

Import de fichiers, parsing binaire, upload, contenu rédigé par un utilisateur :

- absence de borne (taille décompressée, nombre d'entrées, profondeur, nombre de
  lignes) sur une donnée venant de l'extérieur ;
- chemin issu d'une archive ou d'une requête utilisé sans normalisation
  (traversée `../`) ;
- HTML injecté sans passage par la sanitisation en place ;
- secret, jeton ou URL interne qui atterrit dans un log ou une réponse d'erreur.

### 6. Régressions de comportement

- Message d'erreur utilisateur modifié ou supprimé sans équivalent.
- Cas d'erreur d'une réponse HTTP non traité côté client (`response.ok`).
- Valeur par défaut, tri ou pagination changés au passage d'un refactoring.

## À ne pas relever

- **Ce que la CI couvre déjà** : formatage Prettier, imports et variables
  inutilisés, `any` explicite, `console.log`, erreurs de typage. Un `pnpm lint`
  rouge bloque déjà la PR.
- **Les règles explicitement désactivées** dans un `.oxlintrc.json` : elles sont
  commentées et datées, c'est une politique assumée, pas un oubli. Seule exception :
  les promesses non attendues de `pilote-ppg` (point 1), justement parce que la
  règle est éteinte.
- **Le nommage franco-anglais** (`getIndicateurById`, `valeurAvancement`) et les
  accents dans les identifiants : c'est la convention du dépôt.
- **Les classes DSFR `fr-*`** dans `pilote-ppg` : existant historique.
- **Les fautes d'orthographe dans des chaînes déjà présentes sur `dev`**, y compris
  quand la diff les déplace. Une faute dans une chaîne **nouvelle** se signale.
- **L'absence de tests** quand la CI passe et que le comportement changé est déjà
  couvert. Demande un test seulement si tu as identifié un cas non couvert que tu
  peux décrire.
- **Les préférences de style** sans effet observable : nommage de variable locale,
  ordre des membres, `interface` vs `type`, découpage de fonction.

## Calibrage du verdict

Fonde la conclusion sur ce que tu as **effectivement trouvé**, pas sur la taille
de la diff ni sur l'impression de risque d'un domaine. Une PR volumineuse dont tu
n'as tiré que deux remarques mineures n'appelle pas un verdict de prudence : dis
que la revue n'a rien trouvé de bloquant et liste les points mineurs.

Si un pan de la diff mérite une attention humaine, nomme **le fichier et la raison
précise** plutôt que d'émettre une réserve générale sur l'ensemble.
