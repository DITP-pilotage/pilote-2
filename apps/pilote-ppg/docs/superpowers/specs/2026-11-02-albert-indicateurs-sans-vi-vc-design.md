# Albert : indicateurs sans VI ou sans VC (PIL-1939)

> Renommage décidé après coup : `get_indicateurs_non_a_jour` devient
> `get_valeurs_avancement_non_a_jour`, et `get_indicateurs_sans_vi_vc` devient
> `get_valeurs_initiales_cibles_manquantes`. Les queries gardent leur nom. Le
> reste du document garde les anciens noms.

Date : 2026-11-02

Branche stackée sur `feat/albert-indicateurs-non-a-jour-rationalisation`
(PR #2629). La branche `feat/albert-indicateurs-sans-vi-vc` (PR #2620) reste
abandonnée : le sujet repart de zéro, elle ne sert que de référence.

## Intention

Un utilisateur veut savoir quelles données renseigner sur son périmètre. PIL-1926
couvre les valeurs d'avancement (VA) non à jour ; PIL-1939 y ajoute les valeurs
initiales (VI) et cibles (VC) manquantes, et la possibilité de combiner les
recherches. Une demande vague comme « Quels sont les indicateurs à mettre à
jour ? » est ambiguë entre ces diagnostics : l'assistant fait préciser au lieu de
choisir à la place de l'utilisateur.

## Objectifs

- Un nouvel outil `get_indicateurs_sans_vi_vc`, avec sa propre query
  `GetIndicateursSansViVcQuery`. `get_indicateurs_non_a_jour` garde son contrat.
- Une clarification à trois choix quand le type de valeurs n'est ni précisé ni
  déductible des échanges.
- Une restitution par chantier, indicateur et maille, qui distingue les motifs
  « VA non à jour », « VI manquante » et « VC manquante ».
- Evals de niveau 2 pour le routage et la clarification, avec mesure avant/après.

## Écarts décidés avec le ticket

À signaler à Benjamin Vanderlynden, auteur du ticket.

| Ticket | Décision | Critère touché |
|---|---|---|
| VC absente sur au moins un jalon suivi | Seul le jalon par défaut (année de bascule) est évalué | « cible de 100 en 2024, aucune en 2025 et 2026 → liste 2025 et 2026 » ; « sans cible sur aucun jalon → liste les jalons » |
| Liste de tous les jalons sans cible | Un seul jalon, celui évalué, renvoyé dans `jalon` | Idem |
| Nombre de territoires concernés parmi les applicables accessibles | Décompte limité aux territoires applicables et accessibles, sans remonter le nombre d'applicables | Restitution |
| VC absente | Sans ligne `indicateur_territoire_jalon` pour le jalon, le territoire ne remonte pas, comme le mail PVA | Détection |
| Combinaison libre des trois types | Trois boutons ; les autres combinaisons passent par le texte libre | Clarification |

## Non-objectifs

- Pas de choix du jalon par l'utilisateur, ni de jalon lu dans la session : la
  consigne « jalon courant » du prompt système ne s'applique pas à cet outil.
- Pas de réponse à « taux d'avancement non calculé » : VA absente ou ligne de jalon
  absente en sont d'autres causes, et `get_chantiers_signales` couvre déjà la
  demande au niveau du chantier.
- Pas de modification de `ChoicesInline` ni de sélection multiple.
- Pas de modification du mail PVA ni de sa requête.
- Pas de croisement côté code entre VA et VI/VC : c'est l'assistant qui rédige la
  synthèse à partir des deux outils.
- Pas de scénario d'eval de niveau 3.

## Anti-objectifs

- Une VI ou une VC à 0 signalée comme manquante.
- Un territoire non applicable ou non accessible présent dans le détail ou les
  décomptes.
- Un écart de détection avec le mail PVA sur un même périmètre et un même jalon.
- La dernière VC connue présentée comme la cible du jalon, ou utilisée pour un
  calcul de taux d'avancement.
- Une recherche lancée sur une demande vague, ou une clarification redemandée
  quand le type de valeurs est déjà connu.

## Définition métier

Un couple indicateur × territoire est considéré si l'indicateur et son chantier
sont publiés (`indicateursPubliesWhere`), si `est_applicable = true`, et s'il est
dans les chantiers et territoires accessibles. Il remonte si :

- **VI manquante** : `indicateur_territoire.valeur_initiale` est null ;
- **VC manquante** : une ligne `indicateur_territoire_jalon` existe pour le jalon
  par défaut, avec `valeur_cible` null.

Jalon par défaut : `getAnneeDateDeBascule(new Date(),
configuration().dateBasculeAffichageValeursAnneePrecedente)`, calculé dans
`execute`, comme `getChantiersSignales.ts`.

**Dernière VC connue** : pour un territoire en VC manquante, la `valeur_cible`
non nulle du jalon le plus récent strictement antérieur au jalon par défaut. Les
jalons postérieurs sont ignorés.

## L'outil

`src/server/albert/tools/getIndicateursSansViVc.ts`, sur le modèle de
`getIndicateursNonAJour.ts`.

### Entrée

```ts
chantier_ids, indicateur_ids, perimetre, detail
  // mêmes schémas et mêmes sémantiques que get_indicateurs_non_a_jour
valeurs: z.enum(["vi", "vc", "vi_et_vc"]).optional().default("vi_et_vc")
  // vi_et_vc : remonte dès qu'il manque l'une ou l'autre
```

### Sortie

```ts
{
  jalon: number,
  detail: "compteurs" | "territoires",
  detail_trop_volumineux?: true,
  resultats: [{
    chantier: { id, nom },
    indicateurs: [{
      id, nom,
      mailles: [{
        maille,                     // libellé, via libelleMaille
        nb_territoires_sans_vi?,    // présent si valeurs ∈ {vi, vi_et_vc}
        nb_territoires_sans_vc?,    // présent si valeurs ∈ {vc, vi_et_vc}
        territoires?: [{            // seulement en detail "territoires"
          code, nom,
          valeurs_manquantes: ("valeur initiale" | "valeur cible")[],
          derniere_vc_connue?: { valeur, jalon } | null,
            // présent seulement si la VC manque ; null = aucune valeur cible connue
        }],
      }],
    }],
  }],
  acces_refuse?, chantiers_non_accessibles?,
  indicateurs_non_accessibles?, indicateurs_introuvables?,
}
```

La dernière VC connue n'apparaît que dans le détail, jamais dans les compteurs.

Le repli reprend celui de #2629 : au-delà de 800 lignes territoire en detail
`territoires`, l'outil renvoie les compteurs avec `detail_trop_volumineux: true`
et les mêmes consignes de rédaction.

### Accès

Mêmes règles et mêmes champs que `get_indicateurs_non_a_jour`. `resoudreAcces`,
`listesSignalees` et leurs types sont extraits dans un module partagé de
`src/server/albert/tools/` plutôt que dupliqués, sans changement de comportement
pour `get_indicateurs_non_a_jour`.

### Description

Modèle commun : ce qu'il renvoie, la définition, la lecture des champs, puis :

- Utilise-le pour : « sans cible », « sans VI », « sans VC », « valeurs initiales
  ou cibles manquantes ».
- Ne l'utilise pas pour : la fraîcheur des valeurs d'avancement →
  `get_indicateurs_non_a_jour` ; les chantiers au taux d'avancement non calculé →
  `get_chantiers_signales`.
- Restitution : `derniere_vc_connue` s'écrit « Dernière cible connue : 100, jalon
  2024 », et null s'écrit « Aucune valeur cible connue ». La réponse précise
  toujours que les VC sont absentes sur le jalon en cours, en le citant, y compris
  si la demande vise une autre année.
- Liste vide : l'assistant dit explicitement qu'aucun indicateur ne répond aux
  critères sur ce périmètre.

### Query

`src/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery.ts`,
enregistrée dans `src/server/chantiers/module.ts`. Elle renvoie une liste plate
des seules lignes concernées, comme `GetIndicateursNonAJourQuery`, et l'outil fait
le regroupement. Elle filtre en base selon `valeurs` pour que les compteurs
restent justes, et réutilise `indicateursPubliesWhere`.

### Branchements

`albert/module.ts`, `AssistantIA.ts`, `PiloteUIMessage.ts`, et le libellé
« Indicateurs sans VI ou VC » dans
`src/client/components/_commons/ChatUI/SourcesConsultees.tsx`.

## Routage et clarification

| Demande | Comportement |
|---|---|
| « Quels sont les indicateurs à mettre à jour ? », « non à jour », sans précision dans les échanges | `clarify_with_choices` avant toute recherche, y compris pour un seul indicateur |
| « données périmées », « retard de mise à jour », « fraîcheur » | `get_indicateurs_non_a_jour` directement : seule une valeur d'avancement peut être périmée |
| Mention de la valeur actuelle (« VA », « valeur d'avancement », « dernière valeur ») | `get_indicateurs_non_a_jour` directement |
| « sans cible », « sans VC », « cible à mettre à jour » | Nouvel outil, `valeurs: "vc"` |
| « sans VI », « sans valeur initiale » | Nouvel outil, `valeurs: "vi"` |
| « VI ou VC manquantes », « sans VI ni VC » (au sens de « ou ») | Nouvel outil, `valeurs: "vi_et_vc"` |
| « taux d'avancement non calculé » | Inchangé : pas de routage vers le nouvel outil |
| VC d'une année nommée (« sans cible en 2027 ») | Nouvel outil, qui n'évalue que le jalon en cours ; la réponse le cite |
| « VA et VC », saisi directement ou via « Autre » | Les deux outils en parallèle, `valeurs: "vc"` |
| « les trois » | Les deux outils en parallèle, `valeurs: "vi_et_vc"` |

Trois choix : **VA non à jour**, **VI et VC manquantes**, **les trois**. Chaque
libellé reprend le périmètre et se suffit à lui-même, car le clic envoie le texte
du bouton. Le bouton « Autre » de `ChoicesInline` permet déjà le texte libre.

Le ticket impose le sens de la question ; son libellé peut s'adapter aux trois
choix retenus.

Fichiers touchés : le lexique et l'exemple « Sur quels territoires le CH-018 a des
indicateurs non à jour ? » de `systemPrompt.ts`, la description de
`get_indicateurs_non_a_jour` et ses exemples, et les renvois de `getChantiers.ts`
et `searchIndicateurs.ts`.

Une demande combinée n'a pas de fusion côté code : la consigne de synthèse par
chantier, indicateur et maille, avec les motifs distingués, est portée par les
descriptions d'outils.

## Evals (niveau 2)

- Nouvelle suite `evals/2-tools/2.2-donnees/getIndicateursSansViVc.eval.ts` :
  chaque ligne du tableau de routage, dont les trois exemples du ticket, et les
  négatifs (« chantiers en retard », « valeurs des indicateurs »).
- `getIndicateursNonAJour.eval.ts` : les cas sans mention de la VA attendent
  désormais `clarify_with_choices`. Les autres suites qui renvoient vers
  `get_indicateurs_non_a_jour` (`getChantiers`, `getChantiersSignales`,
  `getIndicateurs`) sont à relire, leurs cas restent des négatifs.
- `clarifyWithChoices.eval.ts` : la demande vague du ticket, et l'absence de
  clarification quand le type est précisé.

Mesure : run de référence avec les nouveaux cas écrits, puis run après
implémentation, en niveau 2 sur 3 essais, et en niveau 3 pour détecter une
régression due au prompt. Seuil : aucun nouvel échec répété attribuable sur les
suites existantes, et chaque nouveau cas réussi sur au moins 2 essais sur 3.
L'API Albert renvoyant souvent 503/429, les suites touchées se rejouent une par
une. Les résultats sont consignés en fin de ce document.

## Tests

- Unitaires de l'outil, sur le modèle de `getIndicateursNonAJour.unit.test.ts` :
  accès, filtre `valeurs`, compteurs, détail, `derniere_vc_connue` absente des
  compteurs, repli à 800 lignes, résultat vide.
- Intégration de la query : VI null, VC null au jalon, VI et VC à 0 non remontées,
  ligne de jalon absente non remontée, autre jalon ignoré, non applicable, non
  publié et hors périmètre ignorés, motifs différents sur deux territoires,
  dernière VC connue (jalon antérieur le plus récent, jalon postérieur ignoré,
  aucune).
- `systemPrompt.unit.test.ts` si nécessaire.

## Choix laissés au constructeur

- Le nom et l'emplacement exact du module d'accès partagé.
- La forme de la requête pour la dernière VC connue, en évitant de la charger si
  elle ne sert pas.
- La rédaction exacte des descriptions, ajustée d'après les evals.

## Journal des mesures

Evals de niveaux 2 et 3, 3 essais par cas. Niveau 3 hors calibration du juge.

| | Avant (`4f5a26d`) | Après (`d85f7ce`) |
|---|---|---|
| Niveau 2 | 90,7 % | 94,1 % |
| Niveau 2 hors nouvelle suite et `clarify_with_choices` | 97,0 % | 95,3 % |
| Suite `get_indicateurs_sans_vi_vc` | 35,0 % | 90,0 % |
| Suite `get_indicateurs_non_a_jour` | 95,2 % | 97,6 % |
| Suite `clarify_with_choices` | 64,4 % | 84,4 % |
| Niveau 3 | 96,0 % | 95,7 % |
| Échecs répétés | 28 | 21 |
| Taille du prompt système (caractères, non mesurée en tokens) | 15920 | 17791 |

**Seuil non atteint.** Trois nouveaux cas restent sous 2 essais sur 3 sur le run
après : « Quels indicateurs sont non à jour sur le CH-018 ? » (0/3), « Quels
indicateurs ont un retard de mise à jour ? » (1/3), « Quelles données sont
périmées sur l'IND-894 ? » (1/3). L'assistant appelle
`get_indicateurs_non_a_jour` sans clarifier, malgré quatre itérations sur le prompt
et les descriptions. Hypothèse non testée : le nom de l'outil reprend les mots de
la demande. « Quels indicateurs n'ont pas de cible en 2027 ? » est aussi à 1/3 sur
ce run (2/3 ou 3/3 sur les runs ciblés). La demande exacte du ticket, « Quels sont
les indicateurs à mettre à jour ? », passe à 3/3.

Cinq nouveaux échecs répétés, rejoués chacun deux fois à code égal :
`get_evolution_indicateur` (IND-012 : 2/3 d'échecs puis aucun ; IND-009 : aucun),
`get_historique_indicateur` (aucun) et `search_territoires` (« le 84 » : aucun) ne
se reproduisent pas de façon stable. « Pas de synthèse des résultats renseignée »
(`get_chantiers_signales`) se reproduit, mais échoue aussi à 0/3 au commit `2e2b96e`,
sans l'outil ni le prompt : non attribué à ce travail. Le recul de 1,7 point du
niveau 2 hors nouvelles suites reste dans cette variabilité, sans preuve plus forte.

Corrections de texte après relecture, rejouées sur trois suites seulement, sans
nouveau run complet : `get_indicateurs_sans_vi_vc` 100 %,
`get_indicateurs_non_a_jour` 95,2 %, `clarify_with_choices` 80,0 %. Les trois cas
sous le seuil le restent, et « Quels sont les indicateurs à mettre à jour ? » est à
2/3 sur ce dernier run.

Découpage et renommage, trois essais par cas, sans run complet des niveaux 2 et 3 :
« périmé » et « retard de mise à jour » visent la VA sans clarifier, puis les outils
sont renommés. `clarify_with_choices` passe à 100 %, dont « Quels indicateurs sont
non à jour sur le CH-018 ? » à 3/3 ; `get_valeurs_avancement_non_a_jour` et
`get_indicateurs` à 100 % ; `get_valeurs_initiales_cibles_manquantes` à 97,4 %.
