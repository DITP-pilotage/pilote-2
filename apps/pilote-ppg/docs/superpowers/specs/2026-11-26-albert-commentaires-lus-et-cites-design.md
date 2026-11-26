# Albert lit tous les commentaires et dit lesquels — conception

Date : 2026-11-26
Statut : en relecture
Reprend l'objectif de la PR #2785, sans en reprendre le code : on repart de `dev`.

## Intention

En recette sur `pilote_demo`, la demande « fais-moi la synthèse des commentaires du chantier 70 pour chaque département en difficulté, mets en évidence les sujets récurrents » a produit une réponse fausse :

- l'assistant n'a appelé que `get_chantiers` (vue `en_difficulte`, tous les départements, CH-070) ;
- `get_chantiers` renvoie, pour chaque chantier, le commentaire de la synthèse des résultats ; l'assistant l'a pris pour l'ensemble des commentaires et n'a jamais appelé `get_chantier_commentaires` ;
- la synthèse s'est limitée à ce seul type, et des départements qui avaient des commentaires (Yvelines, Essonne, Hauts-de-Seine) ont été dits « sans commentaire ».

La description de `get_chantiers` dit déjà « les commentaires → get_chantier_commentaires : ils ne sont pas ici », tout en annonçant le commentaire de synthèse : l'interdiction ne suffit pas.

La PR #2785 corrigeait le cas, mais au prix d'une régression mesurée sur le tableau de bord du territoire (« Widgets conformes à la demande » à 0/3, contre 3/3 sur `dev` le 2026-11-02), d'un changement de la fiche de vérité de scénarios existants, et de mesures sur 3 essais qui ne permettaient pas d'attribuer les baisses. On refait le travail en cadrant le besoin, avec un code plus propre, des evals plus fiables, et sans régression.

## Objectifs

1. Quand on demande ce que disent les commentaires d'un chantier sur plusieurs territoires (avec ou sans filtre « en difficulté », « en retard »), l'assistant lit tous les types de commentaires de chaque territoire concerné, pas seulement la synthèse des résultats.
2. Il ne dit jamais qu'un territoire est « sans commentaire » s'il en a.
3. Une réponse rédigée à partir des commentaires dit, dans son texte, quels types de commentaires ont été consultés.
4. Le bug des brouillons est corrigé : `GetChantiersQuery` lit la dernière synthèse **publiée**, pas un brouillon plus récent.

## Non-objectifs

- Les encarts (`rediger_synthese_territoire`, `rediger_synthese_chantier`) ne changent pas : ils gardent le commentaire de synthèse qu'ils résument, et ne portent pas la mention des types consultés.
- Le volume de `get_chantier_commentaires` (historique des versions : 112 Ko sur les 13 départements de CH-070) n'est pas traité ici.
- Un widget « météo et synthèse » qui charge ses propres données : à concevoir quand `create_dashboard` sera retravaillé.
- Les `<br>` que le modèle met dans les cellules de tableau, et le chargement par `GetChantiersQuery` de commentaires qu'il ne renvoie plus : hors périmètre.

## Anti-objectifs

Le travail est un échec, même si le cas de recette passe, si :

- une suite d'evals voisine baisse sans explication essai par essai ;
- la fiche de vérité d'un scénario existant change ;
- un tableau de bord affiche un commentaire inventé ou un paragraphe tronqué ;
- la mention cite un type non accessible à l'utilisateur, ou un type qui n'a pas été interrogé.

## Contraintes

- `pilote-ppg` uniquement ; aucune dépendance à un package `@pilote/kpilote-*`.
- Les evals et la route partagent le même câblage (`AssistantIA`) : rien ne doit diverger entre les deux.
- `trialCount` vaut 3 dans `scenarioEval.ts` et `toolSelectionEval.ts` ; on ne le modifie pas (voir le protocole d'evals).
- Commits, commentaires et textes en français. Pas de commit sans demande explicite de l'utilisateur.

## Approches considérées

### Comment l'assistant arrive aux commentaires

- **A. `get_chantiers` ne renvoie plus aucun commentaire** ; `get_chantier_commentaires` est la seule source de commentaires pour l'agent. **Retenue.** Une seule source supprime la confusion et donne un déclencheur net à la mention (outil appelé ⇒ mention).
- B. `get_chantiers` garde la synthèse, renommée, et signale les autres commentaires du territoire. Écartée : deux sources de commentaires, une réponse tirée de la seule synthèse n'aurait pas la mention, et rien ne prouve que le signal suffise.

### Qui écrit la mention

- **M1. Le modèle l'écrit**, à partir de la liste des types consultés que renvoie l'outil, sur une règle du prompt système. **Retenue par l'utilisateur.**
- M2. Le serveur ajoute la mention à la fin du texte. Écartée par l'utilisateur.

### Le commentaire de synthèse dans les tableaux de bord

Aujourd'hui, le modèle passe à `create_dashboard` un `commentaire` par chantier (pris dans `get_chantiers`), que le sous-agent recopie dans un `widget_paragraph` avec le niveau de confiance. Avec A, ce texte disparaît.

- Un appel à `get_chantier_commentaires` par chantier : écarté (10 à 20 appels sur un vrai territoire, texte toujours recopié par le modèle).
- `create_dashboard` lit lui-même la synthèse : écarté.
- **Supprimer tout lien entre `widget_paragraph` et la météo ou le commentaire. Retenu par l'utilisateur** : `create_dashboard` est peu utilisé et peu convaincant ; la direction (probablement un widget qui charge ses propres données, comme tous les widgets de données aujourd'hui) sera prise quand on le retravaillera.

## Ce qui est décidé

### 1. `get_chantiers` sans commentaire

- La sortie de l'outil ne porte plus `synthese` (commentaire, date, auteur, modificateur).
- Sa description ne l'annonce plus ; l'auteur de la synthèse disparaît de la phrase sur les références de personnes ; la phrase sur `acces_restreint` ne parle plus du commentaire de synthèse ; « Ne l'utilise pas pour » renvoie les commentaires, **synthèse des résultats comprise**, vers `get_chantier_commentaires`.
- La collecte partagée avec les encarts (`collecterChantiers`) garde la synthèse : les encarts ne changent pas. C'est l'outil qui la retire de sa sortie, à sa frontière.
- La fiche de vérité des evals garde les synthèses : elle les lit par la collecte, comme les encarts, et non par la sortie de l'outil.

### 2. `get_chantier_commentaires` renvoie les types consultés

- Nouveau champ de sortie : la liste des **libellés** des types de commentaires interrogés (sur le territoire et, au besoin, au national), **uniquement ceux accessibles à l'utilisateur**, réunis sur tous les territoires de l'appel, sans doublon, dans un ordre stable.
- « Consulté » veut dire « interrogé », même sans contenu trouvé : c'est ce qui permet d'écrire sans se tromper « aucun commentaire sur les données ».
- Les libellés sont ceux de `libelleTypeCommentaire` (`libelles.ts`).
- Correctif : sur un périmètre de plusieurs territoires, seul le premier interroge le national ; les suivants signalent aujourd'hui les types nationaux comme non accessibles alors qu'ils ont été lus. Un type lu au national n'est plus dans `types_non_accessibles`.
- La description de l'outil explique le champ et renvoie à la règle de la mention.

### 3. La mention dans le texte

- Règle du prompt système, dans la partie « Rédiger » : une réponse rédigée à partir de `get_chantier_commentaires` se termine par une ligne « Commentaires consultés : … », qui reprend les libellés des types consultés de tous les appels du tour, sans doublon.
- Pas de mention après un tableau de bord, un encart ou une demande de clarification : la règle « après un dashboard ou un encart, écris une seule phrase » prime.
- Les types non accessibles ne figurent pas dans la mention ; `types_non_accessibles` garde son rôle actuel (ne pas conclure à une absence).

### 4. Les tableaux de bord sans météo ni commentaire

- Entrée de `create_dashboard` : `niveau_de_confiance` et `commentaire` disparaissent du contexte des chantiers, avec la conversion du libellé en code météo (`pourLeSousAgent`, `codeMeteoDepuisLibelle` et son test s'ils n'ont plus d'usage).
- Prompt du sous-agent (`dashboardSystemPrompt.ts`) : plus de règle « Niveau de confiance + commentaire d'un chantier », plus de paragraphe dans les modèles « Focus chantier » et « Indicateurs d'un chantier », exemple 2 et règle 4 du protocole mis à jour. `widget_paragraph` reste disponible pour du texte libre ; aucune consigne ne le lie plus à la météo ni au commentaire.
- Bouton « Tableau de bord du territoire » de l'accueil (`scenariosTerritoire.ts`, profil `DITP_ADMIN` uniquement) : on retire « la météo et le commentaire de synthèse » du message.
- Quand on demande encore la météo ou un commentaire dans un tableau de bord (ancien message du bouton dans une conversation existante, demande libre) : le tableau de bord ne les affiche pas, et la phrase qui l'accompagne le dit. La description de `create_dashboard` l'annonce ; le prompt du sous-agent interdit de reprendre une météo ou un commentaire, y compris dans un paragraphe de texte libre ; la variante `warning` du paragraphe ne s'appuie plus sur la météo.

### 5. Le correctif des brouillons

- `GetChantiersQuery` filtre la synthèse sur le statut `PUBLIE`, comme `PrismaChantierRepository` et `GetChantierCommentairesQuery` le font déjà.
- Test d'intégration : un brouillon plus récent qu'une synthèse publiée ne la remplace pas.
- Il ne touche plus que les encarts (seuls lecteurs restants de la synthèse de la collecte). Le monde des evals ne contient aucun brouillon : le correctif ne change aucun score. Il vient en dernier, après les passages d'evals, à la demande de l'utilisateur.

### 6. Les encarts

Aucun changement de code ni de prompt dans les encarts. Ce qui les concerne :

- **Données** : ils lisent la collecte (`collecterChantiers`), qui garde la synthèse. L'encart de territoire continue de recevoir `commentaire_de_synthese` et `auteur_synthese` pour chaque chantier en retard ou en difficulté ; l'encart de chantier garde sa section « Synthèse des résultats ».
- **Brouillons** : après le correctif 5, ils affichent la dernière synthèse publiée. C'est le seul changement visible pour eux.
- **Mention** : ils ne la portent pas. L'encart de chantier affiche déjà chaque commentaire sous le libellé de son type, et se termine par sa propre ligne « Sources analysées ». Le texte qui accompagne un encart reste une seule phrase.
- **Questions de suivi** : après un encart, une question sur ses commentaires passe par `get_chantier_commentaires`, puisque `get_chantiers` ne porte plus la synthèse ; la réponse porte alors la mention. La suite 3.5 le mesure.
- **Mesure** : les suites des encarts (synthèse d'un chantier, d'un territoire, des départements, des difficultés, chantiers en retard) font partie des suites mesurées avant et après.

## Evals

### Principe

Les changements d'evals passent d'abord, et sont mesurés sur le code de `dev` : c'est la référence. Les changements produit passent ensuite, et sont mesurés avec les mêmes suites et le même nombre d'essais. Toute différence vient donc du produit.

### Avant tout changement produit

1. **Cas périmé** : dans `getChantiers.eval.ts`, « Où en est le CH-005 en Bretagne ? » attend `get_chantiers`, alors que le prompt l'envoie vers l'encart depuis PIL-1966. On remplace la question par une demande qui relève vraiment de `get_chantiers`.
2. **Données du scénario** : le monde partagé ne bouge pas. CH-005 y est « Appuis nécessaires » dans les quatre départements bretons, avec la même synthèse partout. On ne pourrait pas y créer les cas utiles sans changer la fiche d'autres scénarios (synthèse de la Bretagne et de ses départements, comparaisons de départements, questions de suivi). Le nouveau scénario a donc son propre `seedSupplementaire`, semé pour son seul fichier (`seedWorldPerFile`), comme `seedValeursACompleter`. Il retouche CH-005 dans les départements bretons pour obtenir, par ordre de priorité :
   - un département avec des commentaires typés et **aucune synthèse** : c'est le cas exact de la recette (Yvelines, Essonne, Hauts-de-Seine) ;
   - un département sans aucun commentaire, pour vérifier que l'absence est dite à bon escient ;
   - un département dont les commentaires typés disent autre chose que sa synthèse ;
   - un département où CH-005 n'est pas en difficulté, pour vérifier le filtre ;
   - des contenus distincts d'un département à l'autre, avec un sujet commun à deux départements et un sujet propre à un seul.
3. **Fiche de vérité** : une option du `truthScope` permet de lire les commentaires sur tous les territoires du scénario ; sans elle, la lecture reste sur le premier territoire, comme aujourd'hui. Les fiches des scénarios existants ne changent pas. La lecture des synthèses passe par la collecte (changement neutre : même contenu).
4. **Nouveau scénario** « Synthèse des commentaires d'un chantier par département » (3.1) : la demande de recette transposée au monde, plus une reformulation. Outils attendus : `get_chantiers` (vue `en_difficulte`, CH-005), puis `get_chantier_commentaires` (CH-005). Critères jugés : chaque département en difficulté et seulement eux ; tous les types de commentaires de la fiche, pas la seule synthèse ; pas d'absence inventée ; sujets récurrents réellement communs à plusieurs départements ; pas de recopie.
5. **Le nouveau scénario seul, sur ce code** : il doit reproduire le défaut de la recette. Dans la majorité des essais, il échoue sur « Outils attendus » (pas d'appel à `get_chantier_commentaires`), et sur « Tous les types de commentaires » ou « Pas d'absence inventée ». Sinon, on ajuste ses données ou sa reformulation, en restant au plus près de la demande de recette, et on le relance seul : reproduire un défaut réellement observé n'est pas régler l'eval sur le résultat. Après deux ajustements sans succès, on s'arrête et on en rend compte.
6. **Passage de référence** : toutes les suites listées plus bas, une fois le scénario figé.

### Après les changements produit

- Les adaptations qui dépendent du produit passent avec lui :
  - 3.6 « Qui a rédigé la synthèse des résultats du CH-005 en Bretagne ? » attend désormais `get_chantier_commentaires` ;
  - `criteria/commentaires.ts` ne lit plus la synthèse dans la sortie de `get_chantiers` ;
  - `mondeTerritorial.integration.test.ts` ne vérifie plus l'auteur de la synthèse dans `get_chantiers` ;
  - 3.1 « Tableau de bord du territoire » : question alignée sur le nouveau message du bouton, critère sans « un paragraphe pour la météo et le commentaire de synthèse », référence de calibration sans ce paragraphe ;
  - 3.1 « Tableau de bord du territoire » : un second cas avec l'ancien message du bouton, et un critère jugé « aucun paragraphe ne reprend une météo ni un commentaire ; la réponse dit qu'ils ne sont pas affichés ».
- Nouveau critère mécanique « Types de commentaires consultés », dans le socle : applicable seulement si `get_chantier_commentaires` a été appelé et que la matière est un texte (ni tableau de bord, ni encart, ni clarification) ; la dernière ligne « Commentaires consultés : … » contient chaque libellé reçu, et aucun type non accessible.
- Deux passages : l'un après les changements 1, 2 et 4 (sans la règle de la mention), l'autre après le changement 3. La règle de la mention touche toutes les réponses tirées des commentaires : on isole son effet.

### Suites mesurées

Chaque suite tourne deux fois, soit 6 essais par cas, sans toucher à `trialCount` :

- 2.2 `get_chantiers`, 2.2 `get_chantier_commentaires`, 2.3 `create_dashboard` ;
- 3.0 calibration du juge ;
- 3.1 synthèse des commentaires, synthèse d'un chantier, synthèse d'un territoire, synthèse des départements, synthèse des difficultés, chantiers en retard, tableau de bord du territoire, tableau de bord sans chantier, et le nouveau scénario ;
- 3.4 commentaires restitués ;
- 3.5 questions de suivi ;
- 3.6 personnes citées.

Les résultats avant et après sont exportés à côté des précédents (`evals/resultats-*.json`) et comparés critère par critère.

### Seuils et marge de manœuvre

- Nouveau scénario : `get_chantier_commentaires` appelé dans au moins 5 essais sur 6 par question ; « Tous les types de commentaires » et « Pas d'absence inventée » à au moins 5/6.
- Critère de la mention : au moins 5/6 là où il s'applique.
- Suites voisines : aucune baisse de plus d'un essai sur 6 sur un critère sans explication essai par essai ; une baisse expliquée par la variance est notée comme telle dans la PR.
- Si un seuil n'est pas atteint après l'étape 4 : on peut ajuster les descriptions des deux outils et ajouter, dans la partie « Collecter » du prompt système, un exemple de la demande de recette. Ces ajustements font partie de l'étape 4, pour que le second passage isole toujours l'effet de la mention. On relance le nouveau scénario et les suites directement touchées, puis toutes les suites. Au plus deux tours ; au-delà, on s'arrête et on en rend compte.
- Si un seuil n'est pas atteint après l'étape 5 : seule la règle de la mention et la description du champ peuvent bouger, avec la même limite de deux tours.
- Coût : environ 17 suites, deux fois chacune, pour chacun des trois passages (référence, après l'étape 4, après l'étape 5).

### Vérification dans l'app

Sur `pilote_demo`, dans l'app locale : la demande de recette sur CH-070 (13 départements en difficulté), avec un utilisateur qui a accès au national. Attendu : `get_chantiers` puis `get_chantier_commentaires`, des commentaires sur les données pour les Yvelines, l'Essonne et les Hauts-de-Seine, et une dernière ligne « Commentaires consultés : … ».

## Ordre des travaux

Sur une branche tirée de `dev` :

1. Evals sans effet produit : cas périmé, option de la fiche de vérité, lecture des synthèses par la collecte, nouveau scénario et ses données. → le nouveau scénario seul jusqu'à reproduire le défaut, puis passage de référence.
2. `get_chantier_commentaires` : types consultés et correctif des types non accessibles.
3. Tableaux de bord sans météo ni commentaire, bouton de l'accueil, evals du tableau de bord.
4. `get_chantiers` sans commentaire, evals adaptées. → premier passage après.
5. Règle de la mention dans le prompt système, critère mécanique. → second passage après.
6. Correctif des brouillons et son test d'intégration.

Chaque étape passe les tests unitaires et d'intégration concernés, `tsc`, oxlint et prettier sur les fichiers modifiés.

## Laissé à l'implémentation

- La forme des types TypeScript entre la collecte et la sortie de l'outil.
- Le nom du champ des types consultés, l'ordre des libellés, la formulation exacte des descriptions et de la règle du prompt.
- Le contenu exact des commentaires semés, et la question qui remplace le cas périmé.
- L'analyse de la dernière ligne par le critère mécanique.
- Le profil du nouveau scénario (DITP, comme la recette), et la mise à jour des références de calibration pour le nouveau critère du socle.
- La phrase de la description de `get_chantier_commentaires` qui renvoie à la règle de la mention arrive avec elle, à l'étape 5.

## Suites

- Un widget « météo et synthèse » pour les tableaux de bord, qui charge ses propres données, quand `create_dashboard` sera retravaillé.
- Le volume de `get_chantier_commentaires` sur beaucoup de territoires (une option « versions en vigueur »).
