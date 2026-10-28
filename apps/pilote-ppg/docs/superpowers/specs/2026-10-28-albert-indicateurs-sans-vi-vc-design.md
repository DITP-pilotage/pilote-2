# Albert : indicateurs dont le taux d'avancement ne peut pas être calculé

Date : 2026-10-28

## Intention

Le rapport PVA envoyé par mail liste, par chantier, les « indicateurs pour
lesquels le taux d'avancement ne peut pas être calculé », avec l'explication :
« Les valeurs initiales et/ou les valeurs cibles des indicateurs suivants sont
manquantes, ce qui empêche le calcul du taux d'avancement. »
(`CreerLesRapportsPropositionsUseCase`, via
`PrismaIndicateurRepository.recupererIndicateursAParametrerParChantierId`).

On veut qu'Albert sache répondre à la même question, sur le périmètre de
l'utilisateur et avec le détail que le mail ne donne pas (quels territoires,
quelle valeur manque), sur le modèle de `get_indicateurs_non_a_jour`.

## Conventions

- Nommage (code, noms de fichiers, outils, champs, et dans cette spec) :
  français uniquement pour le vocabulaire métier (indicateur, territoire,
  chantier, sansViVc, nonAJour…), anglais pour le reste (get, execute, input,
  query, count…).
- Libellés renvoyés au modèle plutôt que codes (PR #2619).

## Objectifs

- Un nouvel outil `get_indicateurs_sans_vi_vc` qui renvoie les indicateurs sans
  VI ou sans VC, par chantier, indicateur et maille, avec le détail par
  territoire et la valeur manquante.
- Albert route les demandes comme suit :

| Demande | Appels |
|---|---|
| « taux d'avancement qui ne peut pas être calculé » | nouvel outil, `missing: vi_or_vc` ; la réponse explique toujours pourquoi |
| « indicateurs sans VI ni VC » (= sans VI **ou** sans VC, comme le mail) | nouvel outil, `missing: vi_or_vc` |
| « indicateurs sans VC » | nouvel outil, `missing: vc` |
| « indicateurs sans VI » | nouvel outil, `missing: vi` |
| toute demande sur la mise à jour : « non à jour », « en retard », « retard de mise à jour », « données périmées », « est-il à jour » | `get_indicateurs_non_a_jour` seul, comme aujourd'hui |
| demande qui nomme explicitement les deux besoins (« les indicateurs non à jour et ceux sans VI ou VC ») | les deux outils, en parallèle |

- Evals de niveau 2 pour ces déclencheurs, et comparaison de runs avant/après.

## Non-objectifs

- Pas de clarification sur « non à jour » pour l'instant : la mise à jour reste
  le domaine exclusif de `get_indicateurs_non_a_jour`. Envisagé puis mis de
  côté ; à reprendre plus tard si besoin.
- Pas de scénario d'eval de niveau 3 pour l'instant (l'explication « pourquoi »
  repose sur la description de l'outil, sans mesure du texte).
- Pas de jalon au choix de l'utilisateur ni lu dans la session.
- Pas de modification du mail PVA ni de sa requête.
- Pas d'autres causes de taux non calculable (VA absente, VI = VC…) : seulement
  VI et VC manquantes, comme le mail.

## Anti-objectifs

- Un écart de définition avec le mail : un indicateur signalé par l'un et pas
  par l'autre, sur un même périmètre.
- Une réponse qui liste les indicateurs sans dire pourquoi leur taux ne peut pas
  être calculé.
- Une régression du routage existant de `get_indicateurs_non_a_jour` ou de
  `get_chantiers` (« chantiers en retard »).

## Définition métier

Un couple indicateur × territoire est remonté si, comme dans le mail :

- l'indicateur et son chantier sont publiés (`statut: "PUBLIE"`) ;
- `indicateur_territoire.est_applicable = true` ;
- et
  - **sans VI** : `indicateur_territoire.valeur_initiale` est null ;
  - **sans VC** : une ligne `indicateur_territoire_jalon` existe pour le jalon
    avec `valeur_cible` null. **Absence de ligne pour le jalon : rien n'est
    remonté**, comme dans le mail.

`vi_or_vc` est l'union des deux.

**Jalon : toujours l'année de bascule**, comme le mail :
`getAnneeDateDeBascule(new Date(), configuration().dateBasculeAffichageValeursAnneePrecedente)`.
Le jalon de la session n'est pas utilisé. Précédent dans Albert :
`getChantiersSignales.ts` calcule déjà son jalon en cours de cette façon dans
`execute`.

## L'outil

Fichier `src/server/albert/tools/getIndicateursSansViVc.ts`, calqué sur
`getIndicateursNonAJour.ts` (factory, contrôles d'accès, champs de retour).

### Entrées

- `chantier_ids`, `indicateur_ids`, `territoire_code` : mêmes descriptions et
  même sémantique que `get_indicateurs_non_a_jour`.
- `missing` : `"vi" | "vc" | "vi_or_vc"`, défaut `"vi_or_vc"`. Filtré côté
  requête pour que les compteurs restent justes.

Pas d'entrée `jalon` ; la factory garde la même signature que l'outil modèle
(`territoiresAccessibles`, `chantiersAccessibles`), le jalon est calculé dans
`execute`.

### Contrôles d'accès

Identiques à `get_indicateurs_non_a_jour` : `acces_refuse`,
`chantiers_non_accessibles`, `indicateurs_non_accessibles`, mêmes cas.

### Sortie

Même structure que `GetIndicateursNonAJourOutput` :

```
{
  jalon: number,
  resultats: [{
    chantier: { id, nom },
    indicateurs: [{
      id, nom,
      mailles: [{
        maille,                        // NAT | REG | DEPT
        nbTerritoiresSansVi,           // présent si missing ∈ {vi, vi_or_vc}
        nbTerritoiresSansVc,           // présent si missing ∈ {vc, vi_or_vc}
        nbTerritoiresApplicables,
        territoires?: [{               // seulement avec indicateur_ids ou territoire_code
          code, nom,
          valeursManquantes: ("valeur initiale" | "valeur cible")[]
        }]
      }]
    }]
  }],
  acces_refuse?, chantiers_non_accessibles?, indicateurs_non_accessibles?
}
```

Les compteurs distincts VI / VC permettent de dire « pourquoi » même sans le
détail par territoire. Le détail par territoire suit la même règle que l'outil
modèle (avec `indicateur_ids` ou `territoire_code`).

### Description (modèle commun de la PR #2619)

Ce qu'il renvoie, la définition (VI ou VC du jalon en cours manquante, donc taux
d'avancement non calculable), la lecture des champs, puis :

- Utilise-le pour : « taux d'avancement qui ne peut pas être calculé »,
  « indicateurs sans VI », « sans VC », « sans VI ni VC », « valeurs initiales
  ou cibles manquantes ».
- Ne l'utilise pas pour : la mise à jour des données (« non à jour », « en
  retard », « données périmées ») → `get_indicateurs_non_a_jour`.
- Consigne de restitution : toujours dire pourquoi le taux ne peut pas être
  calculé (valeur initiale et/ou cible manquante, en précisant laquelle).

### Requête

`src/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery.ts`,
sur le modèle de `GetIndicateursNonAJourQuery` (réutilise
`indicateursPubliesWhere`), enregistrée dans `src/server/chantiers/module.ts`.
La requête du mail n'est pas réutilisée (pas de périmètre, pas de territoire,
pas de distinction VI/VC).

### Branchements

Comme `get_indicateurs_non_a_jour` : `albert/module.ts`, `AssistantIA.ts`,
`PiloteUIMessage.ts`, et le libellé de source dans
`src/client/components/_commons/ChatUI/SourcesConsultees.tsx`
(« Indicateurs sans VI ou VC »).

## Prompt et descriptions

- Lexique du prompt système (« Comprendre la demande ») : une ligne pour « taux
  non calculable », « sans VI », « sans VC », « valeurs initiales ou cibles
  manquantes » ; la ligne « non à jour », « données périmées » reste sur la
  fraîcheur.
- Description de `get_indicateurs_non_a_jour` : « Ne l'utilise pas pour » les
  VI/VC manquantes → nouvel outil. Idem, si pertinent, dans les renvois de
  `getChantiers.ts` et `searchIndicateurs.ts`.
- Pas d'exemple « demande → appels » d'emblée (démarche YAGNI de la PR #2619) ;
  ajouté seulement si la mesure le justifie.
- `systemPrompt.unit.test.ts` mis à jour si nécessaire.

## Evals (niveau 2)

Le niveau 2 ne joue qu'un tour de conversation.

- Nouvelle suite `evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts`
  (famille `donnees`) : chaque formulation du tableau des objectifs, avec et
  sans chantier ou indicateur cité, NAT-FR ; la demande explicite des deux
  besoins → les deux outils ; négatifs « non à jour », « en retard », « retard
  de mise à jour », « chantiers en retard ».
- `getIndicateursNonAJour.eval.ts` : cas existants inchangés ; négatifs « sans
  VC », « taux non calculable ».
- Le monde des evals (`evals/seeds.ts`, `world.ts`) n'a besoin de données
  VI/VC manquantes que si un cas en dépend.

### Mesure

- Run de référence (niveau 2 complet, 3 essais par cas) sur le code actuel
  avec les nouveaux cas déjà écrits, puis run après implémentation. N3 avant /
  après aussi, pour vérifier l'absence de régression due au prompt.
- Comparer : taux global N2, taux par suite, échecs répétés résolus / nouveaux,
  tokens du prompt.
- Seuil : aucun nouvel échec répété sur les suites existantes, et chaque
  nouveau cas réussi sur au moins 2 essais sur 3. Sinon, itérer sur le prompt
  ou les descriptions (par exemple un exemple « demande → appels »).
- Consigner dans un journal en fin de ce document, comme la spec de refonte.

## Tests

- Unitaires de l'outil :
  `src/server/albert/__tests__/tools/getIndicateursSansViVc.unit.test.ts`
  (calqués sur `getIndicateursNonAJour.unit.test.ts` : accès, filtres,
  `missing`).
- Intégration de la requête :
  `src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursSansViVcQuery.integration.test.ts`
  (VI null, VC null au jalon, ligne de jalon absente non remontée, autre jalon
  ignoré, non applicable ignoré, non publié ignoré, détail par territoire,
  filtre `missing`).

## Journal des mesures

Evals niveaux 2 et 3, 3 essais par cas. Niveau 3 hors calibration du juge.

| | Avant (`bebe972`) | Après (`ae2ad04` + prompt) |
|---|---|---|
| Niveau 2 | 88,6 % | 92,4 % |
| Niveau 2 hors nouvelle suite | 91,9 % | 92,1 % |
| Suite `get_indicateurs_sans_vi_vc` | 33,3 % | 97,0 % |
| Suite `get_indicateurs_non_a_jour` | 90,9 % | 100 % |
| Niveau 3 | 97,1 % | 96,4 % |
| Échecs répétés | 35 (dont 8 de la nouvelle suite) | 22 |
| Tokens du prompt | 3 312 | 3 371 |

Avant : la nouvelle suite n'a que ses trois négatifs qui passent, et la demande
des deux besoins à 50 % (seul `get_indicateurs_non_a_jour` est appelé) ;
attendu, l'outil n'existe pas. Six suites de niveau 3 perdues sur des 503 et
un 429 de l'API Albert, rejouées seules et fusionnées ; trois essais restent
perdus (« Comparer Bretagne avec ses départements » 2, « Tableau de bord du
territoire » 1), leurs suites sont notées sur les essais restants.

Après : les huit échecs répétés de la nouvelle suite sont résolus (un essai
manqué sur onze cas × trois), les deux négatifs ajoutés à
`get_indicateurs_non_a_jour` passent, et le cas « explication du retard » de
cette suite, en échec répété avant, passe. 75 essais de niveau 2 perdus sur
des 429 de l'API Albert, sept suites rejouées seules et fusionnées ; plus
aucun essai perdu.

17 échecs répétés résolus, 4 nouveaux, tous au niveau 3 sur des critères
jugés : rejouées seules à code égal, trois suites ne les reproduisent pas
(« Pas de recopie » des commentaires, « Pas d'opinion » des difficultés,
« Chiffres exacts » de la comparaison Bretagne). Le quatrième, « Synthèse d'un
territoire · DEPT-35 · Pas d'opinion », se reproduit (2/3) : le texte jugé
(« retard important », « situation précaire ») est rédigé par le sous-agent de
l'encart, dont le prompt n'a pas changé, et le juge accepte et refuse la même
formulation d'un essai à l'autre. Non attribué au changement.

Seuil atteint : aucun nouvel échec répété attribuable, chaque nouveau cas à au
moins 2 essais sur 3. Pas d'itération sur le prompt.

