# Evals : couverture des identités (PIL-1860)

## Pourquoi

Depuis PIL-1860, Albert ne voit jamais le nom d'une personne : les outils lui
donnent des références `@[personne:<uuid>]`, qu'il recopie là où irait le nom ;
l'interface affiche le nom à la place. Les evals n'en savent rien :

- le monde de test n'a que deux comptes, tous deux « User Test », auteurs de
  tout ; aucun directeur de projet, responsable local, coordinateur ni
  responsable des données, jamais de « modifié par ». La plupart des chemins
  de références ne servent jamais ;
- aucun critère, contrôle ni consigne du juge ne parle de personnes ; le juge
  voit des références brutes sans savoir ce que c'est ;
- des contrôles existants peuvent être faussés par les chiffres d'un UUID :
  « Chiffres exacts » (jugé) et « Encart — chantiers » (l'écart « 15 » se
  trouve dans une référence).

Le but : qu'une régression sur les identités (référence inventée, altérée,
mise entre backticks, nom ou e-mail écrit, « la référence de la personne »
dans la réponse, personne masquée citée) fasse baisser un score, et que les
scores existants ne soient pas faussés par les références.

## Non-buts

- Pas de test de l'affichage des noms (front, testé à la main).
- Pas de nouveau niveau d'eval : on étend les niveaux 2 et 3.
- Pas de changement du prompt d'Albert dans cette passe : on mesure d'abord.
  Un score bas devient un ticket à part.

## Décisions

1. **Personnes semées à identifiants fixes.** Un module `evals/personnes.ts`
   déclare les personnes du monde (UUID fixe, prénom, nom, e-mail) ; les deux
   comptes d'eval (DITP, coordinateur) y passent aussi, avec un nom distinct.
   Identifiants fixes : un cas se rejoue à la main et le rapport peut afficher
   les noms sans base.
2. **Rôles semés dans le monde territorial** (niveau 3), sur des chantiers que
   les scénarios lisent déjà :
   - CH-005 : deux directeurs de projet ; en Bretagne, un responsable local et
     une coordinatrice ; sa synthèse bretonne écrite par une personne et
     modifiée par une autre ; son commentaire breton « autres résultats »
     écrit par une troisième ;
   - IND-005 : deux e-mails de responsables des données, l'un lié à un
     compte (citable), l'autre sans compte (jamais renvoyé, donc jamais
     citable) ;
   - CH-005 en Pays de la Loire : un responsable local, hors du périmètre du
     coordinateur (masqué pour lui) ;
   - CH-006 : aucun directeur de projet (absence à dire).
   Le niveau 2 garde son monde : les questions « qui » y vérifient seulement
   l'outil choisi.
3. **Contrôle mécanique de socle « Références de personnes »**, sur la matière
   de tous les scénarios. Échoue si la matière contient : une référence
   absente de toutes les sorties d'outils de la conversation (inventée,
   altérée, ou masquée) ; une référence entre backticks ou dans un lien ; un
   fragment de référence mal formé ; un UUID nu ; une adresse e-mail. La
   comparaison applique la tolérance de l'interface (casse, tirets
   typographiques), qui affiche ces variantes correctement.
4. **Critère jugé de socle « Personnes citées comme des noms »**, applicable
   quand une sortie d'outil contient une référence : la réponse ne parle ni de
   référence, ni d'identifiant de personne, ni de la façon dont les noms
   s'affichent.
5. **Le juge apprend ce qu'est une référence** : un paragraphe du prompt
   système, et « Chiffres exacts » exclut explicitement les chiffres d'une
   référence.
6. **« Encart — chantiers »** cherche l'écart dans le passage du chantier,
   références de personnes retirées.
7. **Calibration** : les fiches de la calibration portent des personnes
   (directeur de projet, auteur de la synthèse) et les références existantes
   en citent, pour mesurer que « Chiffres exacts » et les autres critères ne
   les prennent pas pour des défauts. Une suite de calibration « Personnes »
   calibre les nouveaux critères jugés, avec un mutant par critère ; le
   nouveau contrôle mécanique a ses mutants (référence inventée, référence
   entre backticks).
8. **Suite de scénarios 3.6 · Personnes**, avec un champ de cas
   `expectedPersons` (références attendues, `[]` : personne à citer) qui
   voyage jusqu'aux preuves comme `tableTerritories`. Critères :
   - mécanique « Personnes attendues » : la matière cite exactement ces
     références, ni plus ni moins ;
   - jugé « Absence dite » (quand `expectedPersons` est vide) : la réponse dit
     qu'aucune personne de ce rôle n'est renseignée, ou que l'information
     n'est pas accessible ;
   - jugé « Nom non affirmé » (quand la question donne un nom) : la réponse ne
     confirme ni n'infirme le nom de l'utilisateur.
   Cas : directeurs de projet ; responsable local et coordinatrice ;
   responsables des données (un seul citable) ; auteur et modificateur de la
   synthèse ; auteur des commentaires ; chantier sans directeur ; personne
   masquée pour le coordinateur ; nom proposé par l'utilisateur.
9. **Niveau 2** : des questions « qui » dans les suites `get_chantiers`,
   `get_indicateurs` et `get_chantier_commentaires`, pour l'outil choisi.
10. **Rapport lisible** : la colonne « Réponse » affiche le nom de la personne
    à côté de sa référence, depuis `evals/personnes.ts`.
11. **Mesure** : un run complet avant (sur la branche, avant le seed) et
    après ; les deltas sont notés dans le commentaire des suites touchées,
    comme les autres références.

## Mesure du 2026-11-09

Run complet avant (b5691140d, 771 evals) et après (831 evals), juge
`mistral-medium-3-5`. Les evals en erreur côté Albert (503 « Model is too
busy », 422 `to=functions`) sont exclues des moyennes ; les trois suites les
plus touchées avant ont été rejouées.

- Les deux critères du socle passent à 100 % sur toutes les suites
  existantes, sauf « Tableau demandé » (Références de personnes 67 %) :
  dans un tableau markdown, Albert échappe le crochet, `@\[personne:…]`, que
  `PERSON_REFERENCE_PATTERN` ne reconnaît pas. Défaut produit, à corriger
  dans la résolution des personnes (#2653), pas dans les evals.
- Aucune régression des critères existants : les écarts de ±0,1 à ±0,3 sont
  dans le bruit de suites de 3 à 9 essais. La baisse de « Synthèse des
  commentaires » au run complet (Actions identifiées 0,89 → 0,22) ne tient
  pas au rejeu : 0,78 et 0,67 avant, 0,89 et 0,56 après.
- Calibration : les nouvelles suites « Personnes citées » et « Nom proposé »
  détectent chaque défaut et laissent passer le reste à 100 %.
- 3.6 : les scores bas (nom proposé confirmé ou infirmé, références entre
  backticks, refus sur l'e-mail) sont des défauts d'Albert.

## Mesure du 2026-11-10

Les défauts relevés le 2026-11-09 sont corrigés dans #2653 : le motif des
références accepte les crochets échappés, et le prompt interdit de confirmer
un nom proposé et fait citer la personne dont on demande l'adresse, avec deux
exemples ; la référence n'y est plus montrée entre backticks. Run complet :

- Personnes attendues 71 % → 100 % (« Personnes citées ») et 67 % → 100 %
  (« Nom proposé ») ; Références de personnes 100 % partout, « Tableau
  demandé » compris.
- Reste fragile : le nom proposé (Nom non affirmé 50 %), Albert écrivant
  encore « cette référence ne correspond pas à… » ; voir le commentaire de
  chaque suite.
- « Évolution entre jalons » sort plus souvent sans l'écart en points :
  41 % sur trois runs contre 67 % sur deux avec le prompt précédent, même
  défaut des deux côtés ; écart dans le bruit de 9 essais, à surveiller.

## Ce qui reste au builder

Les noms des personnes, les formulations exactes des questions et des
consignes du juge, le découpage des fonctions de contrôle.
