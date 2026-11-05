# Indicateurs à mettre à jour : un outil, un résumé, un tableau

Repart de `dev`. S'inspire de la branche `feat/albert-indicateurs-a-completer`
(spec du 2026-11-04, commits `0b2226e53..3fd66387d`), qui n'est pas fusionnée et
sert de réserve de code.

## Intention

Sur `dev`, deux outils répondent à la même question métier, « qu'est-ce qu'il faut
mettre à jour ? » : `get_valeurs_avancement_non_a_jour` (PIL-1926, #2629) et
`get_valeurs_initiales_cibles_manquantes` (PIL-1939, #2632). La recette du
2026-11-04 a relevé quatre défauts :

1. **Détail hétérogène** : les deux outils appelés ensemble, l'un en compteurs,
   l'autre en détail par territoire.
2. **Demande de précision irrégulière** : « indicateurs non à jour sur le CH-018 »
   n'obtient pas la demande de précision VA/VI/VC (sous 2/3 après cinq itérations
   du prompt). Le modèle lit « non à jour » comme « VA » et tranche seul.
3. **Maille vide prise pour une donnée absente** : « aucune donnée
   départementale disponible » au lieu de « aucun département à compléter ».
4. **Sommes entre indicateurs** : « 360 territoires » annoncés pour le CH-038, qui
   n'en a que 120.

La branche `feat/albert-indicateurs-a-completer` a fusionné les deux outils, mais
le modèle y reçoit encore beaucoup : les lignes jusqu'à 30, la liste
`par_territoire` de tous les territoires concernés, et un résumé imbriqué
(`par_motif`, `tous_motifs`, `nb_territoires_distincts`…) facile à mal lire. La
demande de précision, déplacée dans l'outil (`motifs: "non_precise"`), n'a pas
progressé : « non à jour sur le CH-018 » reste à 0/3.

Le principe de cette version : **le code calcule, décide et affiche ; le modèle
choisit le périmètre et les motifs, puis rédige à partir d'un résumé court.** Le
code décide quand demander la précision, jusqu'où descend le résumé, et affiche
toujours le détail dans un tableau. Le modèle ne voit jamais la liste des
territoires.

## Décisions de Triko

1. Un seul outil remonte les trois motifs : VA non à jour, VI manquante, VC
   manquante.
2. Le modèle ne reçoit jamais l'entièreté des territoires à mettre à jour : ni
   lignes, ni liste de territoires, ni dates. Il reçoit uniquement un résumé,
   compréhensible sans interprétation.
3. Le résumé donne, motif par motif, le nombre de territoires concernés sur
   chaque maille, par chantier et par indicateur.
4. **Un seul territoire interrogé** (« dans le Nord », « en Bretagne » sans ses
   départements) : la réponse ne donne aucun nombre de territoires. Elle dit sur
   quels chantiers et indicateurs ce territoire a des valeurs à compléter,
   découpés par motif s'il y en a plusieurs.
5. **Plusieurs territoires interrogés** (« la Bretagne et ses départements »,
   tout le périmètre) : la réponse donne les nombres par maille et précise
   qu'ils portent sur le périmètre demandé.
6. Le modèle présente toujours sa réponse, puis introduit d'une phrase le tableau
   du détail (celui de la branche). Le tableau est affiché dès qu'il y a une
   ligne. Si le modèle oublie la phrase, le titre du tableau suffit.
7. La demande de précision VA/VI/VC est conservée : « indicateurs non à jour »
   peut vouloir dire les VA seules ou les VA, VI et VC, et on veut répondre au
   plus près de la demande. **C'est le code qui décide de la demander**, à partir
   d'une liste de mots tolérante aux fautes de frappe.
8. Les définitions des motifs vont dans la description de l'outil, pas dans le
   résultat.
9. Au-delà d'une vingtaine d'indicateurs concernés, le résumé s'arrête au niveau
   du chantier : le détail par indicateur reste dans le tableau.
10. Recul accepté : les questions qui appellent des noms de territoires, des dates
    ou un classement de territoires (« quels départements ont le plus de retard ? »,
    « pourquoi la VA de l'IND-894 n'est pas à jour ? ») sont répondues par les
    nombres et un renvoi au tableau.
11. Le résumé a une seule forme, sur deux niveaux au plus (chantier, puis
    indicateur), avec les mêmes clés quel que soit le périmètre et des valeurs
    rédigées par le code. Pas de variantes à expliquer au modèle, pas
    d'imbrication où il pourrait rattacher un nombre au mauvais niveau.

## Objectifs

- Un outil `get_indicateurs_a_completer` qui remplace les deux outils de `dev`.
- Une demande de précision VA/VI/VC qui apparaît à coup sûr quand la demande ne
  nomme aucun type de valeurs, et jamais quand elle en nomme un, fautes de frappe
  comprises.
- Un résumé envoyé au modèle dont chaque nombre est calculé par le code et se lit
  sans ambiguïté, zéros compris.
- Une réponse rédigée qui cite le périmètre, reste à la longueur de la question et
  renvoie au tableau pour le détail.
- Un tableau du détail, filtrable, regroupable et exportable en CSV, sous chaque
  réponse qui a au moins une ligne.

## Non-objectifs

- Pas de sous-agent ni d'encart rédigé.
- Pas d'agrégats de dates (« depuis quand », « plus de 6 mois ») : décision du
  2026-10-30 maintenue.
- Pas de requête d'applicabilité : un 0 veut dire « aucun territoire à compléter
  parmi ceux interrogés », pas « l'indicateur s'applique ici ».
- Les définitions métier des motifs ne changent pas : celles de
  `GetIndicateursNonAJourQuery` et de `GetIndicateursSansViVcQuery` (jalon de
  bascule, applicables seulement, pas de ligne de jalon → rien).
- Pas de plafond sur le nombre de lignes du tableau (décision du 2026-11-04).
- Le tableau n'entre pas dans l'export markdown/PDF de l'encart (PIL-1900) : il a
  son export CSV.

## Anti-objectifs

- Le modèle n'additionne jamais des territoires entre indicateurs, mailles ou
  motifs : tout total qu'il présente vient du résumé.
- Une maille interrogée sans territoire à compléter ne se présente jamais comme
  une donnée inaccessible.
- La précision n'est jamais redemandée quand la demande ou les échanges ont déjà
  établi le type de valeurs.
- Le modèle ne peut pas contourner la demande de précision en rappelant l'outil
  dans le même tour.
- Le texte ne recopie pas le tableau.

## Contrat de l'outil

### Entrée

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `motifs` | `("va" \| "vi" \| "vc")[]`, 1 à 3, sans doublon | obligatoire | Les types de valeurs nommés par la demande ou établis plus tôt dans la conversation ; à défaut, les trois. |
| `chantier_ids` | `chantierIdsIndicateursSchema` | `[]` | Inchangé. |
| `indicateur_ids` | `indicateurIdsSchema` | `[]` | Inchangé. |
| `perimetre` | `perimetreIndicateursSchema` | `TOUS_TERRITOIRES` | Inchangé (six variantes). |

Il n'y a plus de `detail`, ni de `valeurs`, ni de `"non_precise"`.

### Ordre d'exécution

1. Résoudre les accès (`resoudreAccesIndicateurs`, inchangé). Sans résultat :
   renvoyer les champs d'accès, sans demander de précision.
2. Décider s'il faut demander la précision (section suivante). Si oui : renvoyer
   les trois choix, sans lire de données.
3. Sinon, lire les deux requêtes en parallèle selon les motifs (comme la branche),
   fusionner sur la clé (indicateur, territoire), construire le résumé et les
   lignes du tableau.

### Demande de précision, décidée par le code

L'outil reçoit la conversation : `execute(input, { messages })` (AI SDK 7,
`ToolExecutionOptions.messages`). Le contexte de session va dans le prompt
système (`buildChatSystemPrompt`), pas dans les messages : le dernier message
utilisateur est bien le texte tapé ou le libellé cliqué.

Règle :

1. Le dernier message utilisateur contient-il une expression qui nomme un type de
   valeurs (liste ci-dessous) ? → données, avec les `motifs` du modèle.
2. Sinon, l'outil a-t-il été appelé **avant** ce dernier message utilisateur,
   et cet appel a-t-il renvoyé des données ou une demande de précision ? →
   données, avec les `motifs` du modèle. Un appel qui s'est arrêté sur un accès
   refusé ne compte pas.
3. Sinon → demande de précision.

La règle 2 ne regarde que les tours précédents : un second appel dans le même
tour, après une demande de précision, renvoie encore la demande de précision.
Elle ne cherche pas d'expression de type dans les messages utilisateur plus
anciens : un type établi par un autre outil ne compte pas (voir Reculs
acceptés).

**Liste de départ** (à enrichir au fil des retours) :
- VA : « VA », « valeur d'avancement », « valeur actuelle », « dernière valeur »,
  « données périmées », « périmé », « retard de mise à jour », « saisie en
  retard », « fraîcheur » ;
- VI : « VI », « valeur initiale » ;
- VC : « VC », « cible », « valeur cible ».

**Lecture** :
- accents et majuscules ignorés, singulier et pluriel confondus ;
- pour un mot de 5 lettres ou plus, une erreur tolérée (lettre inversée, en trop,
  en moins ou fausse) : « avnacement », « avencement », « initale », « cilbe » ;
- mots de moins de 5 lettres : exacts ;
- « VA » seulement en majuscules, pour ne pas confondre avec le verbe (« qu'est-ce
  qui va… ») ; « VI » et « VC » sans distinction de casse.

**Sortie** :

```ts
{
  clarification: {
    question: string;   // « Quelles valeurs voulez-vous vérifier sur le CH-018 ? »
    choices: { label: string; value: string }[]; // trois, toujours
  }
  // + champs d'accès s'ils s'appliquent
}
```

Les trois libellés, dans cet ordre, avec le périmètre de l'appel (repris de la
branche) :
1. « Valeurs d'avancement non à jour {périmètre} »
2. « Valeurs initiales et cibles manquantes {périmètre} »
3. « Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes
   {périmètre} »

Chaque libellé contient une expression de la liste : le clic, envoyé comme
message, passe la règle 1.

Version modèle : `{ precision_demandee: true }` et, dans la description, la
consigne de terminer par la seule phrase « Choisissez une option pour
continuer. ».

### Résumé envoyé au modèle

`toModelOutput` ne renvoie que le résumé. La même fonction s'applique à
l'historique via `convertToModelMessages` (`Albert.ts`) : aux tours suivants, le
modèle revoit le résumé, jamais les lignes.

**Une seule forme, sur deux niveaux au plus** (décision de Triko, après
relecture) : les mêmes clés quel que soit le périmètre. Chaque chantier et chaque
indicateur est un objet plat : son libellé, puis une clé par motif concerné, dont
la valeur est une courte phrase écrite par le code, que le modèle reprend telle
quelle. Deux critères calculés par le code ne changent que le contenu :
- **un seul territoire** (le périmètre résolu et accessible compte un seul code) :
  les phrases ne parlent pas de territoires ; sinon, elles donnent les
  territoires distincts par maille interrogée ;
- **liste `indicateurs`** : présente si 20 indicateurs distincts concernés ou
  moins, tous chantiers confondus (`SEUIL_INDICATEURS_RESUME = 20`, à ajuster par
  les evals) ; absente au-delà.

Champs :
- `en_bref` : une phrase écrite par le code, que le modèle reprend. Elle porte le
  périmètre interrogé (chantiers et territoires, en noms), le nombre de chantiers
  et d'indicateurs concernés, les motifs et le jalon si une VC est en jeu. Exemple :
  « Périmètre : Bretagne et ses départements. 3 chantiers et 7 indicateurs ont des
  valeurs à compléter (VA non à jour, VC manquante pour le jalon 2026). » Sans
  ligne : « Périmètre : Nord. Aucune valeur cible manquante pour le jalon 2026. »
- `jalon_vc` : présent dès que `vc` est demandé.
- `ensemble` : les totaux sur tout le périmètre, tous chantiers confondus, par
  motif : nombre de chantiers, d'indicateurs et, sur plusieurs territoires, de
  territoires distincts par maille. C'est là que le modèle lit « combien de
  départements au total », au lieu d'additionner les chantiers.
- `chantiers` : triés par nombre d'indicateurs concernés décroissant, puis par
  identifiant. Libellés « CH-038 · Accès aux soins », « IND-894 · Maisons de
  santé ».
- `sans_valeur_a_completer` : les chantiers et indicateurs demandés
  explicitement (`chantier_ids`, `indicateur_ids`) qui n'ont aucune valeur à
  compléter, pour que le modèle les dise à jour et ne les présente pas comme
  sans donnée. Absent si aucun.
- Champs d'accès inchangés : `acces_refuse`, `chantiers_non_accessibles`,
  `indicateurs_non_accessibles`, `indicateurs_introuvables`.

**Clés de motif** : « VA non à jour », « VI manquante », « VC manquante ». Dans
`ensemble`, tous les motifs demandés, « aucun indicateur » pour un motif sans
ligne (le modèle peut dire qu'aucune VC ne manque) ; dans les chantiers et les
indicateurs, seulement les motifs concernés. « tous motifs confondus », dans
`ensemble` et les chantiers, seulement si deux motifs ou plus sont demandés ; il
compte chaque chantier, indicateur et territoire une fois.

**Phrases** :

| Niveau | Plusieurs territoires | Un seul territoire |
|---|---|---|
| `ensemble` | « 1 chantier, 2 indicateurs · 1 région, 3 départements » | « 1 chantier, 2 indicateurs » |
| chantier | « 2 indicateurs · 1 région, 3 départements » | « 2 indicateurs » |
| indicateur | « 1 région, 3 départements » | « à compléter » |

Sur plusieurs territoires, une phrase cite **toutes** les mailles interrogées, y
compris celles sans territoire concerné, écrites « aucune région », « aucun
département » ; elle compte des territoires distincts. Le code accorde le
nombre (« 1 département », « 3 départements ») ; la formulation du niveau
national est laissée au constructeur.

**Plusieurs territoires** :

```json
{
  "en_bref": "Périmètre : Bretagne et ses départements. 1 chantier et 2 indicateurs ont des valeurs à compléter (VA non à jour, VC manquante pour le jalon 2026).",
  "jalon_vc": 2026,
  "ensemble": {
    "VA non à jour": "1 chantier, 2 indicateurs · 1 région, 3 départements",
    "VC manquante": "1 chantier, 1 indicateur · aucune région, 2 départements",
    "tous motifs confondus": "1 chantier, 2 indicateurs · 1 région, 4 départements"
  },
  "chantiers": [{
    "chantier": "CH-038 · Accès aux soins",
    "VA non à jour": "2 indicateurs · 1 région, 3 départements",
    "VC manquante": "1 indicateur · aucune région, 2 départements",
    "tous motifs confondus": "2 indicateurs · 1 région, 4 départements",
    "indicateurs": [
      { "indicateur": "IND-894 · Maisons de santé", "VA non à jour": "1 région, 3 départements" },
      { "indicateur": "IND-912 · Médecins", "VA non à jour": "aucune région, 1 département", "VC manquante": "aucune région, 2 départements" }
    ]
  }]
}
```

**Un seul territoire** :

```json
{
  "en_bref": "Périmètre : Nord. 1 chantier et 2 indicateurs ont des valeurs à compléter (VA non à jour, VC manquante pour le jalon 2026).",
  "jalon_vc": 2026,
  "ensemble": {
    "VA non à jour": "1 chantier, 2 indicateurs",
    "VC manquante": "1 chantier, 1 indicateur",
    "tous motifs confondus": "1 chantier, 2 indicateurs"
  },
  "chantiers": [{
    "chantier": "CH-038 · Accès aux soins",
    "VA non à jour": "2 indicateurs",
    "VC manquante": "1 indicateur",
    "tous motifs confondus": "2 indicateurs",
    "indicateurs": [
      { "indicateur": "IND-894 · Maisons de santé", "VA non à jour": "à compléter" },
      { "indicateur": "IND-912 · Médecins", "VA non à jour": "à compléter", "VC manquante": "à compléter" }
    ]
  }]
}
```

Au-delà du seuil, même forme sans les listes `indicateurs`.

### Sortie complète (interface)

L'interface reçoit le résumé et, à part, ce qu'il faut au tableau : motifs
demandés, jalon, libellé du périmètre pour le titre, et les lignes (une par
indicateur × territoire, motifs fusionnés, avec le nom du chantier, le nom de
territoire affiché, les dates de la VA et la dernière VC connue, comme sur la
branche). Suggestion : `{ resume, detail }`, `toModelOutput` renvoyant `resume`.

### Description de l'outil

Une seule description. Elle porte :
- le rôle de l'outil et les définitions des trois motifs :
  - VA non à jour : sa date de prochaine mise à jour (date de la dernière valeur
    + périodicité + délai de disponibilité) est dépassée, ou aucune valeur n'a
    jamais été renseignée ;
  - VI manquante : aucune valeur initiale n'est renseignée ; une valeur à 0 est
    renseignée ;
  - VC manquante : aucune valeur cible n'est renseignée pour le jalon `jalon_vc`,
    le jalon en cours, qui prime sur celui de la session ; cite-le dès qu'une VC
    est en jeu ;
- `motifs` : la correspondance lexicale ; les types nommés ou établis par les
  échanges, sinon les trois ; l'outil demande lui-même la précision, n'appelle
  jamais `clarify_with_choices` pour le type de valeurs ;
- `precision_demandee` : termine par la seule phrase « Choisissez une option pour
  continuer. » ;
- la rédaction :
  - commence par reprendre `en_bref`, périmètre compris ;
  - présente ensuite les chantiers, et leurs indicateurs quand ils sont listés,
    motif par motif, en reprenant les phrases du résumé telles quelles ;
  - ne somme jamais deux nombres : les totaux sont dans le résumé (`ensemble`
    pour tout le périmètre, « tous motifs confondus » pour plusieurs motifs) ;
  - n'explique pas d'office chaque motif ; quand tu en définis un (question
    « qu'est-ce que… », « pourquoi… »), reprends la définition ci-dessus ;
  - `sans_valeur_a_completer` : dis que ces chantiers ou indicateurs n'ont
    aucune valeur à compléter sur ce périmètre, jamais qu'ils sont sans donnée ;
  - « aucune région », « aucun département » : aucun territoire à compléter sur
    cette maille, jamais une donnée indisponible ;
  - termine par une phrase qui introduit le tableau du détail affiché sous la
    réponse, quand il y a au moins une ligne ;
  - noms de territoires, dates ou classement de territoires : tu ne les reçois
    pas, renvoie au tableau ;
- liste vide : réponse définitive, ne rappelle pas l'outil avec les mêmes
  arguments, ne demande pas de précision ;
- les consignes d'accès actuelles (`CONSIGNE_ACCES_REFUSE`, non accessibles,
  introuvables), une seule fois ;
- un ensemble de territoires (« la Bretagne et ses départements ») : un seul
  appel avec le `perimetre` adapté ;
- les renvois : retard d'avancement → `get_chantiers` (vue `en_retard`) ; taux non
  calculé → `get_chantiers_signales`.

### Prompt système

Dans `systemPrompt.ts` :
- retirer la ligne « « non à jour », « à mettre à jour » : ambigu… » et la ligne
  qui route vers `get_valeurs_initiales_cibles_manquantes` ;
- retirer le paragraphe « Pour une demande sur la mise à jour des indicateurs… »
  et ses trois puces ;
- retirer la mention `detail_trop_volumineux` de « Ne clarifie pas quand… » ;
- retirer les exemples qui citent les deux anciens outils ou
  `clarify_with_choices` pour une mise à jour ;
- ajouter une ligne de vocabulaire : « non à jour », « à mettre à jour », « à
  compléter », VA, VI, VC → `get_indicateurs_a_completer`, qui demande lui-même
  la précision du type de valeurs ;
- ajouter deux exemples : « Quels sont les indicateurs non à jour sur le
  CH-018 ? » → `get_indicateurs_a_completer` sur CH-018, sans
  `clarify_with_choices` ; « Les trois » ou « VA, VI et VC » → un seul appel avec
  les trois motifs ;
- garder la ligne « données périmées, retard de mise à jour, fraîcheur : la
  fraîcheur des valeurs d'avancement, à ne pas confondre avec en retard ».

Dans la description de `clarify_with_choices` : jamais pour le type de valeurs à
mettre à jour.

## Interface

- **Choix** : `ChoicesInline` affiche aussi les choix de
  `tool-get_indicateurs_a_completer` quand la sortie porte `clarification`, avec
  le même événement `response.choices` (fonction `choixPresentes` de la branche).
  Si le modèle a rappelé l'outil dans le même tour, un seul bloc de choix
  s'affiche : le dernier. On ne touche pas à `stopWhen` ni à `prepareStep`, qui
  servent tous les outils.
- **Tableau** : le composant de la branche, sous le texte de la réponse, une fois
  la réponse rédigée, pour chaque appel de l'outil qui renvoie au moins une ligne
  (plus de seuil à 30). Replié par défaut, comme sur la branche. Titre : « Détail
  par territoire · {périmètre} · {motifs} (jalon {jalon} si VC) · {n} lignes ·
  {n} chantiers ». Filtres, regroupements et export CSV inchangés.
- Enregistrer l'outil dans `PiloteUIMessage.ts`, `AssistantIA.ts`, `module.ts`,
  et dans les libellés de `SourcesConsultees.tsx` (« Indicateurs à compléter »).
- `AssistantMessage.tsx` a changé sur `dev` depuis la base de la branche
  (PIL-1940, PIL-1855) : reporter l'intégration, ne pas recopier le fichier.

## Ce qu'on reprend de la branche

| Élément | Fichiers de la branche | Adaptation |
|---|---|---|
| Fusion des deux requêtes, comptages distincts | `tools/indicateursACompleter.ts` | garder la fusion et `versLigneACompleter` ; remplacer la sortie par le résumé ci-dessus ; supprimer `par_territoire`, `definitions`, `nb_lignes`, `SEUIL_LIGNES_MODELE` |
| Outil | `tools/getIndicateursACompleter.ts` | retirer `"non_precise"` et `detail_affiche_dans_tableau` ; ajouter la décision de précision ; garder `clarification()` |
| Nom affiché des territoires | `GetIndicateursNonAJourQuery`, `GetIndicateursSansViVcQuery` (+ tests d'intégration) | tel quel |
| Tableau et export | `TableauIndicateursACompleter.tsx`, `useTableauIndicateursACompleter.tsx`, `detailIndicateursACompleter.ts`, `csvIndicateursACompleter.ts`, déplacements de `MultiSelectFiltre` et `SelecteurGroupement` (+ tests) | lire la nouvelle sortie complète ; titre avec le périmètre |
| Choix et événements | `assistantEvents.ts` (`choixPresentes`), `AssistantMessage.tsx`, `AssistantMessageText.tsx` (+ tests) | sur la version `dev` |
| Evals | `getIndicateursACompleter.eval.ts`, scénario N3 `3.4-forme/valeursACompleter.*` et `seedValeursACompleter.ts`, `scoreExpectedTools.ts` (+ test), retouches de `getChantiers`, `getChantiersSignales`, `getIndicateurs`, `clarifyWithChoices` | attentes revues (section Evals) |

## Ce qui disparaît sur `dev`

- `getValeursAvancementNonAJour.ts`, `getValeursInitialesCiblesManquantes.ts` et
  leurs tests unitaires.
- Dans `socleValeursIndicateurs.ts` : `resoudreDetail`, `ChampsDetail`,
  `CONSIGNE_DETAIL_TROP_VOLUMINEUX`, `SEUIL_LIGNES_TERRITOIRES`, et
  `renvoyerChantiers` s'il n'a plus d'usage. Le socle d'accès et de périmètre
  reste.
- Les mentions des anciens noms dans `getChantiers.ts`, `searchIndicateurs.ts`,
  `systemPrompt.ts` et les evals d'autres outils.
- Les evals `getValeursAvancementNonAJour.eval.ts` et
  `getValeursInitialesCiblesManquantes.eval.ts`, fusionnées.

## Tests

Pas de tests triviaux ; côté client, seulement là où la branche en a déjà.

- **Décision de précision** (unitaires) : expression nommée → données ; faute
  d'une lettre (« avnacement ») → données ; « Quels indicateurs sont non à jour
  sur le CH-018 ? » → précision ; « qu'est-ce qui va… » → précision ; appel dans un
  tour précédent → données ; appel précédent arrêté sur un accès refusé →
  précision ; second appel dans le même tour → précision ; libellé d'un choix →
  données ; accès refusé → champs d'accès, pas de précision.
- **Résumé** (unitaires, requêtes simulées) : phrases sur un et sur plusieurs
  territoires ; listes `indicateurs` présentes à 20 indicateurs, absentes à 21 ;
  maille interrogée sans ligne écrite « aucune région » ou « aucun
  département » ; un territoire concerné par
  plusieurs indicateurs, ou par plusieurs chantiers, compté une fois au chantier
  et dans `ensemble` ; « tous motifs confondus » seulement à partir de deux
  motifs ; tri des chantiers ; chantier et indicateur demandés sans ligne dans
  `sans_valeur_a_completer` ; `en_bref` avec et sans ligne ; `toModelOutput` ne
  contient ni lignes ni noms de territoires.
- **Interface** : reprendre et adapter les tests de la branche (tableau, CSV,
  événements, message) ; tableau affiché dès une ligne, absent sans ligne et sur
  une demande de précision ; un seul bloc de choix quand l'outil a renvoyé deux
  demandes de précision dans le même message.

## Evals

- **Mesure avant**, sur `dev`, avant tout changement : suites
  `getValeursAvancementNonAJour`, `getValeursInitialesCiblesManquantes`,
  `clarifyWithChoices`, `getIndicateurs`, `getChantiers`, `getChantiersSignales`,
  et le scénario N3. Le N3 est écrit **dans sa version finale** (cas et critères
  ci-dessous) en première tâche, à partir de celui de la branche, puis mesuré
  sur `dev` : les critères propres au tableau (« phrase qui introduit le
  tableau », « pas de liste d'indicateurs au-delà du seuil ») y sont jugés non
  applicables. Les mesures « avant » de la branche datent d'avant PIL-1855 et
  PIL-1940 : les refaire.
- **N2** : `getIndicateursACompleter.eval.ts` de la branche, attentes revues. Une
  demande sans type de valeurs attend un appel de `get_indicateurs_a_completer`
  (motifs libres) et aucun appel de `clarify_with_choices` ; la précision
  elle-même est garantie par les tests unitaires. Les demandes avec type attendent
  les motifs nommés. Les cas « mise à jour » de `clarifyWithChoices.eval.ts`
  attendent `get_indicateurs_a_completer`.
- **N3** : le scénario de la branche, avec les demandes de la recette, plus
  « Qu'est-ce que je dois mettre à jour dans le Nord ? », « Le CH-018 est-il à
  jour en Bretagne ? » et « Quels sont les chantiers à mettre à jour ? »,
  joués en deux tours quand la première appelle la précision. Critères du juge
  (« Pas de somme entre indicateurs » et « Mailles à zéro » repris de la
  branche ; « Motifs expliqués » devient « Motifs justes » ; « Détail cohérent »
  disparaît, le détail étant toujours dans le tableau) :
  - le périmètre interrogé est cité ;
  - aucun total de territoires absent du résumé ;
  - une maille à 0 dite comme telle ;
  - un motif défini l'est comme dans la description ;
  - sur un seul territoire, aucun nombre de territoires ;
  - au-delà du seuil, pas de liste d'indicateurs ;
  - aucun nom de territoire hors de ceux de la demande ;
  - une phrase qui introduit le tableau quand il y a des lignes.
- **Mesure après**, mêmes suites ; rejouer une à une les suites touchées par les
  503/429 de l'API Albert.

## Reculs acceptés

- « Pourquoi la VA de l'IND-894 n'est pas à jour ? » : le texte explique la règle
  et renvoie au tableau pour les dates.
- « Quels départements de Bretagne ont le plus de saisies en retard ? » : pas de
  classement dans le texte ; le tableau se regroupe par territoire.
- Un synonyme absent de la liste, ou une faute de plus d'une lettre : une demande
  de précision en trop.
- L'utilisateur ignore les choix et pose une autre demande sans type : pas de
  nouvelle demande de précision, le modèle choisit les motifs.
- Un type établi par un autre outil (« Quelles sont les valeurs cibles du
  CH-018 ? » via `get_indicateurs`, puis « Lesquelles manquent ? ») : une demande
  de précision en trop.

## Laissé au constructeur

- Les noms exacts des champs du résumé (`en_bref`, `ensemble`…), la formulation
  de `en_bref`, des phrases (niveau national compris) et de la description.
- La source des noms de territoires pour `en_bref`, les libellés des choix et le
  titre du tableau (lignes, ou lecture dédiée quand il n'y a pas de ligne).
- L'algorithme de tolérance (distance d'édition à une transposition près) et le
  découpage des expressions de plusieurs mots.
- La forme exacte de la sortie complète.

## Choix du rédacteur, à vérifier à la relecture

- **Plus de déclencheur « expression de mise à jour »** : proposé en conversation
  (ne demander la précision que si le message contient « à jour », « à
  compléter »…), puis retiré. L'outil n'est appelé que pour une question de
  mise à jour ; un message sans aucun type de valeurs est donc ambigu même sans
  « à jour » (« Qu'est-ce que je dois renseigner dans le Nord ? »). Le
  déclencheur faisait manquer ces cas, pour ne rattraper que des fautes de plus
  d'une lettre.
- La consigne « ne somme jamais » va dans la description, comme les définitions,
  et non dans le résultat.
- Le modèle n'explique plus chaque motif d'office (il le faisait sur la
  branche) : il reprend la définition quand on la lui demande. Critère N3
  « Motifs justes » au lieu de « Motifs expliqués ».
- Bloc `ensemble` (totaux sur tout le périmètre) et liste
  `sans_valeur_a_completer` ajoutés après relecture.
- La règle 2 de la précision ne regarde que les appels de l'outil, pas les mots
  des messages plus anciens : en cas de doute, on demande.
- Un seul bloc de choix par message, sans toucher à `stopWhen`.
- N3 final écrit avant la mesure « avant ».
- `en_bref` écrit par le code et périmètre dans le titre du tableau : proposés en
  conversation, sans objection.
- Tableau replié par défaut, comme sur la branche.
- Accès vérifiés avant la demande de précision.
- « VA » reconnu seulement en majuscules.
- « tous motifs confondus » seulement à partir de deux motifs ; à chaque
  niveau, seuls les motifs concernés.
- Sur un seul territoire, la valeur « à compléter » au niveau de l'indicateur,
  redondante avec la présence de la clé, est gardée pour l'uniformité.
- Nouvelle branche `feat/albert-indicateurs-a-mettre-a-jour`, partie de
  `origin/dev`.
