# Bilan de la refonte du prompt système d'Albert (PIL-1900)

Du 27 au 28 octobre 2026. Branche `claude/system-prompt-tools-review-8c0b30`,
PR #2619 (brouillon), 54 commits.

Documents de référence :

- spec, décisions et journal détaillé des mesures :
  [2026-10-27-albert-refonte-system-prompt-design.md](2026-10-27-albert-refonte-system-prompt-design.md) ;
- design de l'encart de synthèse :
  [2026-10-27-albert-encart-synthese-design.md](2026-10-27-albert-encart-synthese-design.md) ;
- plans d'implémentation : `../plans/2026-10-27-albert-refonte-etapes-0-1.md`,
  `../plans/2026-10-27-albert-encart-synthese.md`.

## 1. Ce qu'on voulait faire

### Le point de départ

Le prompt système (`src/server/albert/systemPrompt.ts`) et les descriptions des
outils avaient grandi sans mesure :

- **631 lignes de prompt**, dont environ 150 de gabarit de synthèse ;
- **six canaux d'instructions** qui se recouvraient : prompt, descriptions des
  outils, `.describe` des paramètres, 47 `_output_instructions` dans les
  résultats, prompts des sous-agents, contexte utilisateur ;
- des **règles nées d'un usage qui s'appliquaient à tous** : « pas de
  tableaux », né du gabarit, bloquait l'utilisateur qui demandait un tableau ;
- **neuf contradictions** relevées (restriction d'accès, résolution des
  territoires, clarification, médiane, jalon…) et des règles recopiées jusqu'à
  huit fois ;
- des outils qui **renvoyaient des codes bruts** (météo, tendance, maille), et
  un détecteur de mots-clés qui changeait le prompt et la liste des outils
  selon le dernier message.

### Les objectifs du ticket

1. **Simplifier** le prompt et les descriptions des outils.
2. **Cloisonner les usages** : une règle née d'un usage ne s'applique pas aux
   autres.
3. **Se détacher des gabarits** de synthèse, quitte à créer des outils ou des
   sous-agents dédiés.

Hors périmètre : l'audit des evals du ticket.

### La méthode

**YAGNI, guidée par la mesure.** On part de la réécriture la plus simple, on
la mesure (evals de niveau 2 et 3, trois essais par cas), et chaque complexité
ajoutée doit être justifiée par un échec mesuré à l'étape précédente.

## 2. Les décisions

| Décision | Contenu                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| D1       | La météo disparaît : les outils renvoient les libellés du niveau de confiance (« Objectifs atteignables »…).                               |
| D2       | Commentaires et objectifs restitués fidèlement par défaut, résumés seulement sur demande.                                                  |
| D3       | « Le 84 » désigne le département, « la région 84 » la région.                                                                              |
| D4       | Tous les outils sont toujours exposés (fin du détecteur d'intention).                                                                      |
| D5       | Un outil composite « situation d'un territoire » si la mesure le justifie : réalisé à l'étape 4 sous forme d'encart.                       |
| D6       | La liste des territoires accessibles dans le prompt : jamais en cause dans un échec mesuré, close.                                         |
| 27/10    | La règle des sous-territoires (« un seul appel sur le parent ») revient dans le prompt : le paramètre seul ne suffisait pas.               |
| 27/10    | Tout territoire désigné par un nom passe par `search_territoires` : on ne fait pas confiance au modèle pour déduire les codes.             |
| 27/10    | Des exemples « demande → appels » en prose sont acceptés dans le prompt.                                                                   |
| 27/10    | Courbe et évolution d'un indicateur alignées sur la prod.                                                                                  |
| 27/10    | La synthèse et la comparaison passent par un sous-agent de rédaction qui reprend l'ancien gabarit, dans un encart « note administrative ». |
| 28/10    | L'export de rapport (PDF et markdown) est supprimé : un rapport est l'encart, téléchargé en markdown sans appel au modèle.                 |
| 28/10    | `get_chantiers` ne renvoie plus les commentaires : `get_chantier_commentaires` les porte seul (avec Tristan).                              |
| 28/10    | Les cas d'eval de numéros de territoire (« le 84 ») sont mis de côté jusqu'à la décision sur la résolution.                                |

## 3. Ce qui a été fait

### Le prompt et les outils

| Étape                                      | Changements                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 – ligne de base                          | Evals alignées sur les décisions (plus de gabarit, plus de météo), nouveaux critères au socle (français, pas de météo, pas de HTML).                                                                                                                                                                                                      |
| 1 – réécriture minimale                    | Prompt réécrit de 631 à environ 130 lignes : rôle, règles numérotées, métier, méthode, formats par défaut, contexte de session en fin de prompt. Outils toujours exposés, libellés au lieu des codes, plus aucun `_output_instructions`, descriptions sur un modèle commun (ce qu'il renvoie, quand l'utiliser, quand ne pas l'utiliser). |
| 2 – résolution, sous-territoires, exemples | Règle des sous-territoires remise, recherche imposée pour un territoire nommé, six exemples en prose, lexique.                                                                                                                                                                                                                            |
| 3 – régressions, courbe, restriction       | Courbe et évolution comme en prod, `acces_restreint` signalé sur les territoires hors accès.                                                                                                                                                                                                                                              |
| 4 – encart de synthèse                     | Deux outils, `rediger_synthese_territoire` et `rediger_comparaison_territoires`, qui collectent eux-mêmes leurs données. Un sous-agent rédige l'ancien gabarit, streamé dans un encart plus large que la discussion.                                                                                                                      |
| 4 bis – evals assainies                    | Numéros de territoire mis de côté, questions sans « météo », attendus de l'encart pour « récap » et « les autres départements ».                                                                                                                                                                                                          |
| 5 – données et déclencheurs                | Nom du chantier dans `get_chantier_commentaires`, écart envoyé au sous-agent déjà écrit (« −15 points »), drapeaux masqués retirés, déclencheurs resserrés (un critère nommé reste hors encart).                                                                                                                                          |
| 6 – le rapport devient l'encart            | Export de rapport supprimé, bouton « Télécharger » sur l'encart, commentaires retirés de `get_chantiers`, un seul chemin par demande (l'encart ou les outils de données).                                                                                                                                                                 |

### Après la mesure de l'étape 6

Changements faits sur retour d'usage, non mesurés par un run complet :

- commentaires et objectifs convertis du HTML en texte dans les outils ; les
  `<br>` écrits par le modèle rendus comme des retours à la ligne ;
- le dashboard introduit un chantier par son niveau de confiance, plus par sa
  météo ;
- la synthèse peut inclure les indicateurs de ses chantiers
  (`avec_indicateurs`), en tableau sous chaque chantier ;
- un rapport qui liste son contenu (« incluant le taux… et leurs
  indicateurs ») reste l'encart ;
- interface : plus de scénario « Rapport complet » à l'accueil, plus de
  sélecteur de modèle, dictée à gauche du bouton d'envoi, indicateur
  « réfléchit » plus affiché en double.

### Le résultat côté code

- Prompt système : **631 → 174 lignes**, tokens du premier appel **9 265 →
  3 312**.
- 143 fichiers modifiés : 7 384 lignes ajoutées, 3 694 supprimées, dont
  l'export de rapport (outil, PDF, stockage, route, cron).

## 4. Les mesures

### D'étape en étape

|                                | Base   | 1      | 2      | 3      | 4      | 4 bis  | 5      | 6          | 7          | 8      |
| ------------------------------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ---------- | ---------- | ------ |
| Niveau 2 (choix des outils)    | 90,7 % | 88,1 % | 89,6 % | 90,5 % | 88,3 % | 89,8 % | 91,2 % | 91,7 %     | **94,2 %** | 94,7 % |
| Niveau 3 (réponses complètes)  | 91,3 % | 92,5 % | 93,4 % | 93,6 % | 92,5 % | 93,8 % | 95,9 % | **98,1 %** | 97,1 %     | 96,6 % |
| Échecs répétés                 | 44     | 43     | 43     | 36     | 55     | 41     | 35     | **16**     | 17         | 19     |
| Météo citée sans être demandée | 85     | 1      | 2      | 0      | 0      | 0      | 0      | 0          | 0          | 0      |
| Tokens du premier appel        | 9 265  | 2 290  | 2 853  | 2 928  | 3 055  | –      | 3 274  | 3 312      | –          | –      |
| Contrôles de l'encart          | –      | –      | –      | –      | 90,2 % | 93,8 % | 99,3 % | **100 %**  | 99,3 %     | 97,9 % |

L'étape 7 mesure les changements faits après l'étape 6 (HTML, indicateurs, date, « le 84 ») ; l'étape 8, les corrections des cas de choix d'outil (thème, médiane, synthèse non renseignée, recherche des noms, acronymes). À l'étape 8, 53 essais perdus sur la limite de débit ont été rejoués.

Niveau 2 : moyenne des suites `2.*`. Niveau 3 : moyenne des suites `3.1` à
`3.4`, calibration exclue. Un échec répété est un couple (cas, critère) qui
échoue au moins deux essais sur trois.

### Par rapport à la ligne de base

|                  | Avant  | Après  | Écart        |
| ---------------- | ------ | ------ | ------------ |
| Niveau 2         | 90,7 % | 94,7 % | +4,0 pts     |
| Niveau 3         | 91,3 % | 96,6 % | **+5,3 pts** |
| Échecs répétés   | 44     | 19     | −25          |
| Tokens du prompt | 9 265  | 3 312  | ÷ 2,8        |

### Comment lire ces chiffres

- **La grille a bougé** : alignée sur les décisions à l'étape 0, assainie à
  l'étape 4 bis, réduite à l'étape 6 par la suppression des suites d'export.
  Sur les 165 cas communs aux étapes 5 et 6, le niveau 3 passe de 96,3 % à
  98,0 % et le niveau 2 de 92,5 % à 91,7 %.
- **Le bruit** : à code égal, une dizaine de couples cas-critère basculent d'un
  run à l'autre, soit environ ±5 échecs répétés. Un nouvel échec isolé n'est
  pas forcément une régression.
- **L'étape 4 régresse**, et c'est attendu dans la méthode : elle a montré
  que les déclencheurs de l'encart débordaient et que le sous-agent perdait le
  signe de l'écart. Les étapes 5 et 6 ont corrigé l'un et l'autre.
- **La limite de débit** de l'API Albert (200 requêtes par minute) fait perdre
  quelques essais par run : les suites touchées sont rejouées seules puis
  fusionnées.

## 5. Ce qu'on en retient

- **Les corrections de données battent les règles de prompt.** Les gains les
  plus nets viennent du code : les libellés au lieu des codes (la météo passe
  de 85 citations à 0), l'écart déjà écrit (le signe ne se perd plus), le nom
  du chantier dans les commentaires, les commentaires retirés de
  `get_chantiers` (la synthèse d'un chantier lit enfin ses commentaires), le
  HTML converti en texte.
- **Un canal par information.** Quand une donnée arrive par deux outils, le
  modèle prend la première et s'arrête : les commentaires de `get_chantiers`
  l'empêchaient d'appeler `get_chantier_commentaires`.
- **Un chemin par demande.** L'encart appelé en plus des outils de données
  ratait le tableau attendu : la règle « l'un ou l'autre, jamais les deux » a
  résolu la comparaison Bretagne / Pays de la Loire.
- **Les evals se trompent aussi.** Des attendus datés d'avant l'encart, des
  questions qui parlaient de météo, des cas au comportement jamais décidé :
  les assainir avant de corriger le code évite de mesurer contre de faux
  attendus.
- **Le prompt a une limite.** Une règle explicite, répétée dans le lexique et
  en règle numérotée, ne fait pas chercher un territoire que le modèle connaît
  déjà : il prend le raccourci, et il tombe juste.
- **Le serveur de dev peut garder l'ancien code** après un rechargement à
  chaud : deux fois, un comportement observé ne venait pas du code commité.
  Redémarrer avant de conclure.

## 6. Ce qui reste

| Sujet                                                 | État                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| « Le 84 »                                             | Décidé le 28/10 : un numéro est un département (DEPT-84) sans recherche, « la région 84 » une région, « le 20 » se recherche. « Dans le 84 » donne DEPT-84 deux fois sur trois.                                                                                                                                                               |
| Synthèse d'un chantier                                | Lit ses commentaires une fois sur deux, oublie le nom du chantier.                                                                                                                                                                                                                                                                            |
| Cas de choix d'outil                                  | Réglés le 28/10 : « politique prioritaire sur l'écologie » (3/3), « synthèse non renseignée » (2/3). Partiel : « se situe par rapport à la médiane » (1/3, l'encart l'emporte encore).                                                                                                                                                        |
| Limite acceptée : la recherche des territoires connus | Pour un territoire que le modèle connaît bien (« le Vaucluse », « AURA »), il va directement au bon code (DEPT-84, REG-84) sans passer par search_territoires, malgré la règle n°8 et le lexique. La réponse est juste ; l'écart est accepté le 28/10, l'eval AURA reste en échec pour le suivre. Seul le code pourrait imposer la recherche. |
| Deux evals trop strictes                              | Indicateur du CH-018, commentaires du CH-005 sans filtre.                                                                                                                                                                                                                                                                                     |
| Forme                                                 | Comparaison de taux Bretagne / Pays de la Loire : les bons outils, mais pas toujours de tableau.                                                                                                                                                                                                                                              |
