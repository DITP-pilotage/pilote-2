# `get_chantiers` ne donne plus la synthèse au modèle : conception

Date : 2026-11-27
Statut : en relecture
Troisième des PR qui reprennent #2799 en morceaux, depuis `dev` et sans en reprendre le code. Elle est empilée sur #2801 (widget de synthèse des résultats), elle-même empilée sur #2800 (synthèse publiée, pas un brouillon).

## Intention

En recette sur `pilote_demo`, la demande « fais-moi la synthèse des commentaires du chantier 70 pour chaque département en difficulté, mets en évidence les sujets récurrents » a produit une réponse fausse :

- l'assistant n'a appelé que `get_chantiers` (vue `en_difficulte`, tous les départements, CH-070) ;
- `get_chantiers` renvoie, pour chaque chantier, le commentaire de la synthèse des résultats ; l'assistant l'a pris pour l'ensemble des commentaires et n'a jamais appelé `get_chantier_commentaires` ;
- des départements qui avaient des commentaires (Yvelines, Essonne, Hauts-de-Seine) ont été dits « sans commentaire ».

La description de `get_chantiers` dit déjà « les commentaires → get_chantier_commentaires : ils ne sont pas ici », tout en annonçant le commentaire de synthèse : l'interdiction ne suffit pas. Tant qu'un outil de données porte un commentaire, l'agent peut s'en contenter.

Le but : pour le modèle, `get_chantier_commentaires` devient la seule source de commentaires, synthèse des résultats comprise.

## Objectifs

1. Quand on demande ce que disent les commentaires d'un chantier sur plusieurs territoires (avec ou sans filtre « en difficulté », « en retard »), l'assistant lit tous les types de commentaires de chaque territoire concerné, pas seulement la synthèse des résultats.
2. Il ne dit jamais qu'un territoire est « sans commentaire » parce qu'il n'a pas de synthèse. C'est assuré par construction : sans `get_chantier_commentaires`, l'agent n'a plus aucun commentaire. On le mesure donc par les appels d'outils (objectif 1), pas par le texte. La rédaction est déjà couverte par le scénario 3.1 « Synthèse des commentaires ».
3. Les encarts, les tableaux de bord et les routes tRPC qui lisent `GetChantiersQuery` ne changent pas.

## Non-objectifs

- `GetChantiersQuery` et la collecte partagée `collecterChantiers` ne changent pas. Elles gardent la synthèse, ainsi que les `commentaires` (données, autres résultats) que la requête charge sans les renvoyer.
- Les encarts ne changent pas : ni données, ni prompts, ni contexte transmis au modèle après un encart (qui garde `commentaire_de_synthese`).
- La mention « Commentaires consultés », `types_consultes` et le correctif de `types_non_accessibles` sur plusieurs territoires : PR suivante.
- Un `get_chantier_commentaires` qui accepte plusieurs chantiers.
- Le volume de `get_chantier_commentaires` (historique des versions : 112 Ko sur les 13 départements de CH-070).

## Anti-objectifs

Le travail est un échec, même si les cas de la demande de recette passent, si :

- une suite d'evals mesurée baisse sans explication essai par essai ;
- la fiche de vérité d'un scénario existant change de contenu ;
- un encart change de données ou de rendu ;
- l'agent répond sur les commentaires d'un chantier sans avoir appelé `get_chantier_commentaires`.

## Contraintes

- `pilote-ppg` uniquement ; aucune dépendance à un package `@pilote/kpilote-*`.
- Les evals et la route partagent le même câblage (`AssistantIA`) : rien ne doit diverger entre les deux.
- `trialCount` vaut 3 dans `scenarioEval.ts` et `toolSelectionEval.ts` ; on ne le modifie pas : 6 essais par cas = deux lancements.
- Les tests d'intégration et les evals partagent la base de test : jamais en même temps.
- Commits, commentaires et textes en français. Pas de commit sans demande explicite de l'utilisateur.
- Branche `feat/albert-get-chantiers-sans-synthese`, empilée sur `feat/albert-widget-synthese-des-resultats`.

## Approches considérées

### Où la synthèse disparaît

- Retirer la synthèse de `GetChantiersQuery` elle-même, et faire lire aux encarts la synthèse par une nouvelle requête groupée par couple (chantier, territoire). Écartée par l'utilisateur.
- Même retrait, et lecture couple par couple avec `RecupererDerniereSyntheseDesResultatsQuery` ou `GetChantierCommentairesQuery`. Écartée par l'utilisateur.
- **Retirer la synthèse seulement de ce que `get_chantiers` donne au modèle, à la frontière de l'outil. Retenue par l'utilisateur.** La collecte reste partagée entre `get_chantiers` et les encarts, comme sur l'ancienne branche.

### Une question sur plusieurs chantiers à la fois

« Quels chantiers sont en difficulté en Bretagne, et pourquoi ? » se réglait en un appel à `get_chantiers`, à partir de la seule synthèse.

- **A. Un appel à `get_chantier_commentaires` par chantier. Retenue par l'utilisateur, « pour l'instant ».**
- B. `get_chantier_commentaires` accepte plusieurs chantiers : moins d'appels, plus de volume, outil changé. Laissée en suite.
- C. Ces questions passent par l'encart de territoire, qui garde la synthèse : le « pourquoi » reste limité à la synthèse, c'est le défaut qu'on corrige. Écartée.

## Ce qui est décidé

### 1. La sortie de `get_chantiers`

- La sortie de l'outil ne porte plus `synthese` (commentaire, date, auteur, modificateur), sur aucun territoire, accès restreint compris.
- Le retrait se fait à la frontière de l'outil, entre la collecte et le classement : `retirerSynthese` s'applique à la sortie de `collecterChantiers`, puis `classerChantiers` trie et limite. Les deux gardent leur comportement ; `classerChantiers` devient générique sur le type de chantier classé.
- Les types distinguent ce que renvoie la collecte (avec synthèse) de ce que renvoie l'outil (sans synthèse).

### 2. La description de `get_chantiers`

- La première phrase ne l'annonce plus (« … maille de pilotage, et le commentaire de la synthèse des résultats » perd sa fin).
- `acces_restreint` : « la tendance et les personnes du territoire y sont masquées ».
- Les références de personnes ne citent plus « l'`auteur` de la synthèse ».
- « Ne l'utilise pas pour » : « les commentaires d'un chantier, synthèse des résultats comprise (freins, actions, décisions, résultats…) → get_chantier_commentaires ».
- Aucune autre règle n'est ajoutée d'emblée, ni à cette description, ni à celle de `get_chantier_commentaires`, ni au prompt système. Voir « Marge de manœuvre ».

### 3. Ce qui ne bouge pas

- Encarts : ils lisent `collecterChantiers`, qui garde la synthèse. Ni leurs données, ni leurs prompts, ni le contexte qu'ils laissent au modèle ne changent.
- Tableaux de bord : depuis #2801, ils ne lisent plus la synthèse de `GetChantiersQuery`.
- Routes tRPC `recupererChantiersEnRetard` et `recupererChantiersEnDifficulte` : elles renvoient le résultat de la requête, inchangé.

## Evals

> **Révision du 2026-11-27, en cours d'implémentation.** Les passages ne sont pas lancés pendant le développement : un seul lancement de la suite `get_chantier_commentaires` prenait plus de 25 minutes. L'utilisateur fait une passe globale d'evals avant de merger. Les changements de code des evals ci-dessous sont faits quand même ; les seuils et les suites listées disent ce que cette passe doit surveiller.
>
> Reproduction observée avant l'arrêt, sur le code de référence (run 340, premier lancement incomplet), essais qui enchaînent `get_chantiers` et `get_chantier_commentaires` :
>
> - « Fais-moi la synthèse des commentaires du CH-006… » : 0 sur 3 ;
> - « Que disent les commentaires du CH-006… » : 1 sur 2 ;
> - « Quels chantiers sont en difficulté en Bretagne, et pourquoi ? » : 0 sur 2.
>
> Les cas reproduisent donc le défaut.

### Principe

Les changements d'evals sans effet produit passent d'abord, et sont mesurés sur le code de la branche avant tout changement produit : c'est la référence. Les changements produit passent ensuite, et sont mesurés avec les mêmes suites et le même nombre d'essais.

### Avant tout changement produit

1. **Cas périmé** de `getChantiers.eval.ts` : « Où en est le CH-005 en Bretagne ? » attend `get_chantiers`, alors que le prompt l'envoie vers l'encart depuis PIL-1966. On le remplace par « Quel est le niveau de confiance du CH-005 en Bretagne ? », même `expected`.
2. **Fiche de vérité** : `groundTruth.ts` lit les vues par `collecterChantiers`, plus par l'outil `get_chantiers`. Son type devient celui de la collecte. Changement neutre : même contenu, les fiches de calibration ne changent pas.
3. **Synthèse semée dans le monde commun** : `seedChantierEnDifficulte` sème, avec la météo ORAGE, une synthèse publiée de CH-006 en Bretagne, datée de `DATE_SAISIE` (`world.ts`). `toolSelectionEval` l'appelle pour toutes les suites d'outils du niveau 2, comme le chantier en retard : un cas négatif d'une suite est souvent le cas positif d'une autre. Toutes ces suites voient donc cette synthèse, dans `get_chantier_commentaires`, dans les encarts et, sur le code de référence, dans `get_chantiers`. Un `seedSupplementaire` propre à la suite, d'abord prévu, a été abandonné à la relecture.
4. **Cas de la demande de recette** : deux cas dans `getChantierCommentaires.eval.ts`, la demande transposée au monde des evals et une reformulation :
   - « Fais-moi la synthèse des commentaires du CH-006 pour chaque région où il est en difficulté. Mets en évidence les sujets récurrents. »
   - « Que disent les commentaires du CH-006 dans les régions où il est en difficulté ? Quels sujets reviennent ? »
   - Outils attendus : `get_chantiers` (`view: "en_difficulte"`, `chantier_ids: ["CH-006"]`), puis `get_chantier_commentaires` (`chantier_id: "CH-006"`).
   - Ils s'appuient sur la synthèse semée au point 3. Sans elle, l'agent n'a rien dont se contenter et le défaut ne se reproduit pas.
   - Un troisième cas couvre l'approche A, une question sur les chantiers d'un territoire : « Quels chantiers sont en difficulté en Bretagne, et pourquoi ? ». Outils attendus : `get_chantiers` (`view: "en_difficulte"`), puis `get_chantier_commentaires` (`chantier_id: "CH-006"`, en difficulté en Bretagne dans ce monde). Il tombe dans une suite déjà mesurée : aucun lancement de plus.
   - Le score reste celui de toutes les suites d'outils (`scoreExpectedTools`, inchangé) : les appels en trop sont tolérés, y compris un encart, et l'ordre n'est pas vérifié. Aucun outil n'est interdit.
5. **Reproduction** : ces trois cas doivent échouer dans au moins 2 essais sur 6 chacun sur le code de référence, sans quoi ils ne protègent rien. Sinon : ajuster la synthèse semée ou la formulation, au plus deux fois, puis rendre compte.
6. **Passage de référence** sur les suites listées plus bas.

### Après le changement produit

Les adaptations qui dépendent du produit passent avec lui :

- 3.6 « Qui a rédigé la synthèse des résultats du CH-005 en Bretagne, et qui l'a modifiée ? » attend désormais `get_chantier_commentaires`, seul à renvoyer la synthèse et ses auteurs ;
- `criteria/commentaires.ts` ne lit plus la synthèse dans la sortie de `get_chantiers` ;
- `mondeTerritorial.integration.test.ts` ne vérifie plus l'auteur de la synthèse dans `get_chantiers`, mais dans `get_chantier_commentaires`.

### Suites mesurées

La liste est fermée. On a choisi les suites où l'agent lit le plus probablement la synthèse de `get_chantiers`, ou choisit entre lui et un outil de commentaires. Les autres suites qui appellent `get_chantiers` ne sont exposées qu'à deux lignes de sa description.

- 2.2 `get_chantiers`, 2.2 `get_chantier_commentaires` (avec les cas de recette) ;
- 2.3 `rediger_synthese_chantier` (routage entre l'encart, `get_chantiers` et `get_chantier_commentaires`) ;
- 3.1 chantiers en retard, 3.1 synthèse des commentaires ;
- 3.1 tableau de bord du territoire : son message demande, après `get_chantiers`, « la météo et le commentaire de synthèse » de chaque chantier. L'agent pourrait se mettre à chercher les commentaires avant de composer, et cette suite garde la régression de #2785 ;
- 3.4 commentaires restitués ;
- 3.4 suites proposées : son cas « Quels sont les chantiers en retard en Bretagne ? » attend `get_chantiers` et interdit `get_chantier_commentaires`, la dérive que ce changement peut provoquer ;
- 3.5 questions de suivi ;
- 3.6 personnes citées.

Dix suites, deux lancements chacune, avant et après (ajout de la 3.4 « suites proposées » après la relecture de l'implémentation).

Ne sont pas relancées :

- **Les suites d'encarts** (3.1 synthèse d'un chantier, d'un territoire, des départements, des difficultés) : leurs données et leurs prompts ne changent pas.
- **La calibration 3.0** : elle ne lance que les critères jugés, et le seul critère qui change dans `criteria/commentaires.ts` est mécanique (`PAS_DE_RECOPIE`). Ses références restent telles quelles, typées comme la collecte (voir Suites).

### Seuils

- Cas de la demande de recette et de l'approche A : `get_chantiers` puis `get_chantier_commentaires` dans au moins 5 essais sur 6 par question.
- Suites mesurées : aucun cas ne perd plus d'un essai sur 6 sur un critère sans explication essai par essai. Le seuil se lit par cas et par critère, pas sur le total de la suite.
- Une baisse expliquée essai par essai par la variance (même échec présent dans la référence, ou sans lien avec la sortie de `get_chantiers`) est notée dans la PR et ne déclenche pas d'ajustement. Une baisse liée au changement en déclenche un.

### Marge de manœuvre

Si un seuil n'est pas atteint : on peut ajuster les descriptions des deux outils, puis ajouter un exemple de la demande de recette dans la partie « Collecter » du prompt système. On relance les cas de recette et les suites directement touchées, puis toutes les suites mesurées. Au plus deux tours ; au-delà, on s'arrête et on rend compte.

## Vérification

- Tests unitaires de `get_chantiers` : la sortie de l'outil n'a de synthèse sur aucun territoire, accès restreint compris ; la collecte garde la synthèse.
- `pnpm -F @pilote/ppg test:server` et `pnpm -F @pilote/ppg lint`.
- Pas de vérification dans l'app, comme pour #2800 et #2801, sauf demande de l'utilisateur.

## Ordre des travaux

1. Evals sans effet produit : cas périmé, fiche de vérité par la collecte, synthèse semée dans le monde commun, cas de recette → reproduction, puis passage de référence.
2. Sortie et description de `get_chantiers`, tests unitaires.
3. Adaptations des evals qui dépendent du produit → passage après.
4. Si besoin, ajustements (au plus deux tours).

Chaque étape passe les tests unitaires et d'intégration concernés, `tsc`, oxlint et prettier sur les fichiers modifiés.

## Laissé à l'implémentation

- Le nom et la forme des types entre la collecte et la sortie de l'outil.
- La formulation exacte de la description de `get_chantiers`, dans le sens décrit plus haut.
- Le texte de la synthèse semée pour les cas de recette.

## Suites

- La mention « Commentaires consultés » et `types_consultes` (PR suivante).
- Un `get_chantier_commentaires` multi-chantiers, si l'approche A coûte trop d'appels.
- Une option « versions en vigueur » pour le volume de `get_chantier_commentaires`.
- Les `commentaires` chargés pour rien par `GetChantiersQuery`.
- Les faux résultats `get_chantiers` des références de calibration portent encore la synthèse. Les aligner sur la sortie réelle demanderait de revoir les réponses de référence qui la citent.
