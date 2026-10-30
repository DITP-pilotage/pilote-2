# Rationalisation de l'outil `get_indicateurs_non_a_jour`

Suite de PIL-1926 (création de l'outil) et de PIL-1900 (refonte des outils
d'Albert). L'outil est resté sur les conventions d'avant la refonte : les PR
#2622, #2623 et #2624 ont fait évoluer les autres outils sans le toucher.

## Intention

Aligner `get_indicateurs_non_a_jour` sur les conventions des autres outils de
données d'Albert (périmètre de territoires, contrat snake_case en libellés,
signalement des identifiants inconnus) et rendre explicite le choix entre
compteurs et détail par territoire, aujourd'hui décidé par une heuristique
cachée.

Quatre gains attendus :

1. **Un seul appel pour un ensemble de territoires** (« la Bretagne et ses
   départements », « tous les départements »), comme pour `get_chantiers`.
2. **Un détail par territoire que le modèle choisit** d'après les mots de
   l'utilisateur, et non d'après les paramètres qu'il a remplis.
3. **Un contrat lisible par le modèle** : snake_case, mailles en libellés,
   découplé du type de la query.
4. **Un identifiant inconnu qui se dit**, au lieu de se confondre avec « rien
   de non à jour ».

## Objectifs

- Remplacer `territoire_code` par un `perimetre` aux six variantes, par défaut
  `TOUS_TERRITOIRES`.
- Ajouter `detail: "compteurs" | "territoires"`, défaut `compteurs`.
- Sortir un contrat snake_case avec des libellés, via une couche de
  restitution dans l'outil.
- Renvoyer `indicateurs_introuvables` et vérifier l'accès aux indicateurs en
  une seule requête.
- Mettre à jour les tests unitaires, les tests d'intégration de la query et
  l'eval N2 de l'outil, avec mesure avant/après.

## Non-objectifs

- **Pas de tri ni de pagination.** Le volume est borné par un repli, voir
  « Repli sur les gros volumes ».
- **Pas de lecture par territoire** (territoire → nombre d'indicateurs non à
  jour) dans le détail : la matrice indicateur × territoire suffit pour
  l'instant, on verra aux evals.
- **Pas de normalisation des identifiants d'indicateurs** (`IND-19` →
  `IND-019`) : PR ultérieure, pendant de `chantierIdSchema`.
- **Pas d'outil « sans VI ni VC »** : la branche
  `feat/albert-indicateurs-sans-vi-vc` est abandonnée, le sujet repartira de
  zéro après cette PR.
- **Pas d'harmonisation transverse** de la convention d'accès refusé (sortie
  `acces_refuse` contre `throw`) : cet outil garde `acces_refuse`.
- **Pas de changement côté client** : `SourcesConsultees` n'utilise que le
  libellé de l'outil, et `PiloteUIMessage` suit les types.

## Anti-objectifs

- Présenter un indicateur hors périmètre, introuvable ou non publié comme à
  jour.
- Un appel par territoire quand la demande en désigne un ensemble.
- Le territoire courant de la session glissé dans le périmètre quand
  l'utilisateur ne le nomme pas.
- Des codes (`DEPT`, `REG`) ou du camelCase dans ce que lit le modèle.

## Contrat de l'outil

### Entrée

```ts
chantier_ids: chantierIdsSchema.optional().default([])
  // inchangé : absent = tous les chantiers accessibles (« mes chantiers »)
indicateur_ids: z.array(z.string()).optional().default([])
  // inchangé
perimetre: z.discriminatedUnion("type", [SELECTION, REGION_ET_SES_DEPARTEMENTS,
    FRANCE_ET_SES_REGIONS, TOUTES_REGIONS, TOUS_DEPARTEMENTS, TOUS_TERRITOIRES])
    .optional().default({ type: "TOUS_TERRITOIRES" })
  // description : descriptionPerimetre({ types }) suivie de :
  // « Par défaut, TOUS_TERRITOIRES. N'y mets pas le territoire courant de la
  //  session, sauf si la demande le nomme. »
detail: z.enum(["compteurs", "territoires"]).optional().default("compteurs")
  // « compteurs : par chantier, indicateur et maille, le nombre de territoires
  //  en retard. territoires : en plus, chaque
  //  territoire en retard avec ses dates. Choisis territoires seulement quand
  //  la demande nomme les territoires ou le détail (« sur quels territoires »,
  //  « les départements non à jour », « le détail par territoire »). »
```

`territoire_code` disparaît. Le périmètre est **orthogonal au mode** : il
restreint les lignes considérées, dans les deux modes, et ne déclenche jamais
le détail.

### Sortie

```jsonc
{
  "detail": "compteurs",                       // le mode effectivement appliqué
  "resultats": [
    {
      "chantier": { "id": "CH-018", "nom": "…" },
      "indicateurs": [
        {
          "id": "IND-894",
          "nom": "…",
          "periodicite": "Trimestrielle",       // tel qu'en base, déjà un libellé
          "delai_disponibilite_mois": 1,
          "mailles": [
            {
              "maille": "départementale",       // nationale | régionale | départementale
              "nb_territoires_en_retard": 37,
              "territoires_en_retard": [        // mode territoires seulement
                {
                  "code": "DEPT-29",
                  "nom": "Finistère",
                  "date_derniere_valeur": "2025-06-30",
                  "mise_a_jour_attendue_depuis": "2025-11-30"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "acces_refuse": true,                        // optionnel
  "chantiers_non_accessibles": ["CH-999"],     // optionnel, seulement si non vide
  "indicateurs_non_accessibles": ["IND-003"],  // idem
  "indicateurs_introuvables": ["IND-9999"]     // idem
}
```

Sémantique des `null`, à porter dans la description :

- `date_derniere_valeur` null : aucune valeur n'a jamais été renseignée sur ce
  territoire.
- `mise_a_jour_attendue_depuis` null alors que `date_derniere_valeur` est
  renseignée : la date théorique n'a pas pu être calculée (ne pas en supposer
  la cause).

Ordre inchangé : chantiers par identifiant, indicateurs par identifiant,
mailles nationale puis régionale puis départementale, territoires par code.

### Repli sur les gros volumes

Le détail complet d'un périmètre large a produit 572 000 caractères de sortie
(environ 160 000 tokens estimés) et une réponse vide. Au-delà de 800 lignes
territoire, l'outil renvoie donc les compteurs avec
`detail_trop_volumineux: true`. L'assistant rédige toujours sa réponse à partir des compteurs, sans clarifier
avant, puis termine en disant que le détail est trop volumineux, sans chiffrer
ce volume, et qu'on peut l'obtenir en réduisant la recherche. Le seuil est calé sur la base de démo.

Les compteurs ne sont pas bornés : la plupart des utilisateurs n'ont pas accès
à l'ensemble des chantiers.

### Accès

Les règles reprennent celles de `get_chantier_commentaires` pour les
territoires et celles de l'outil actuel pour les chantiers, en sortie souple
(`acces_refuse`), jamais en `throw`.

1. **Territoires désignés** : les codes d'une `SELECTION`, le `region_code`
   d'une `REGION_ET_SES_DEPARTEMENTS`, `NAT-FR` pour `FRANCE_ET_SES_REGIONS`.
   Un territoire désigné non accessible → `acces_refuse`. `TOUTES_REGIONS` et
   `TOUS_DEPARTEMENTS` ne désignent rien.
2. **Territoires résolus** par `territoireResolver.resoudre(perimetre)`, puis
   intersectés avec `territoiresAccessibles`. Sans `perimetre`, le périmètre
   est `territoiresAccessibles`. Intersection vide → `acces_refuse`.
3. **Chantiers** : comme aujourd'hui. Demandés et tous inaccessibles →
   `acces_refuse` ; demandés en partie → `chantiers_non_accessibles` ; aucun
   demandé → `chantiersAccessibles`, vide → `acces_refuse`.
4. **Indicateurs** : un seul appel à `GetIndicateursIdentiteQuery.execute({
   indicateurIds })` (la query est étendue d'un filtre `indicateurIds`,
   voir plus bas), à la place des N appels à `GetIndicateurContexteQuery`,
   dont l'outil ne dépend plus. Pour chaque identifiant demandé :
   - absent du résultat → `indicateurs_introuvables` (inexistant, ou non
     publié : la query ne renvoie que les indicateurs publiés de chantiers
     publiés, comme le faisait la query de contexte) ;
   - présent, chantier hors de `chantiersAccessibles` →
     `indicateurs_non_accessibles`, sans révéler le chantier ;
   - sinon → interrogé.
   Indicateurs demandés mais aucun interrogeable : `acces_refuse` si au moins
   un est non accessible ; sinon (tous introuvables) `resultats: []` avec la
   seule liste `indicateurs_introuvables`, sans appeler la query principale.
5. **Un indicateur nommé prime sur le filtre de chantiers.** Si un indicateur
   interrogé appartient à un chantier accessible absent des `chantier_ids`
   demandés, son chantier est ajouté aux chantiers interrogés. Sans cela,
   l'intersection des deux filtres le ferait disparaître en silence, et le
   modèle lirait « rien de non à jour ». Décision validée à la relecture.

Dans tous les cas d'`acces_refuse`, la sortie est
`{ detail, resultats: [], acces_refuse: true }` enrichie des listes non vides
déjà calculées (par exemple `indicateurs_introuvables`).

### Description de l'outil

À réécrire sur la structure commune (ce que renvoie l'outil, les champs
particuliers, « Utilise-le pour », « Ne l'utilise pas pour »). Points qu'elle
doit porter, en plus de la sémantique des `null` et des champs d'accès :

- La définition de « non à jour » (inchangée) : date théorique dépassée, ou
  aucune valeur jamais renseignée sur un territoire applicable.
- Les deux modes et la règle de choix : compteurs pour une question vague
  (« quels chantiers ont des indicateurs à mettre à jour ? », « quels sont les
  indicateurs non à jour ? ») ; territoires quand la demande nomme les
  territoires ou le détail (« sur quels territoires le CH-018 a des
  indicateurs non à jour ? », « donne les départements non à jour pour
  l'IND-894 », « … et affiche le détail par territoire »).
- **Après des compteurs, propose à l'utilisateur le détail territoire par
  territoire sur un sous-ensemble** (un chantier, un indicateur ou un
  territoire), sans le faire d'office. Même pattern que la proposition de
  suites de `get_evolution_indicateur`.
- Liste vide : rien de non à jour trouvé sur ce périmètre, ce qui ne prouve
  pas que les données sont à jour.
- `indicateurs_introuvables` : l'identifiant n'existe pas ou n'est pas publié ;
  dis-le, et ne le présente ni comme à jour ni comme non à jour.
- Ne l'utilise pas pour : les chantiers en retard au sens de l'avancement →
  `get_chantiers` (vue `en_retard`).

### Prompt système

Une ligne d'exemple s'ajoute dans « Exemples » :
« Sur quels territoires le CH-018 a des indicateurs non à jour ? » →
`get_indicateurs_non_a_jour` sur CH-018 avec `detail` territoires, sans
périmètre. Le vocabulaire (« non à jour », « données périmées ») ne change pas.

## Query `GetIndicateursNonAJourQuery`

Un seul `findMany` renvoie une liste plate : une ligne par couple indicateur ×
territoire en retard, triée par chantier, indicateur et territoire. Sa signature
perd `avecDetailTerritoires`. L'outil se charge du regroupement, des compteurs et
du seuil.

Le nombre de territoires applicables n'est plus renvoyé : il n'est pas utile à
l'assistant et imposait de lire toutes les lignes applicables.

## Query `GetIndicateursIdentiteQuery`

`GetIndicateursIdentiteParams` gagne `indicateurIds?: string[]`, appliqué en
`id: { in }` à côté du filtre `chantierIds` existant. Les filtres se
combinent ; `search_indicateurs` continue de n'utiliser que `chantierIds`.

## Couche de restitution

Dans le fichier de l'outil, une fonction de passage du type de la query au
contrat de sortie (snake_case, maille en libellé), sur le modèle de
`renvoyerChantier` et `renvoyerChantierSignale`. Le libellé de maille vient
d'une fonction `libelleMaille` ajoutée à `libelles.ts`, qui réutilise la table
de `mailleDePilotage`.

## Tests

- **Unitaires de l'outil** : réécrits pour le nouveau contrat. Cas à couvrir :
  défaut sans argument (tous chantiers et territoires accessibles,
  compteurs) ; périmètre désigné inaccessible ; périmètre résolu intersecté
  avec les accès ; `TOUS_DEPARTEMENTS` n'exige aucun territoire désigné ;
  détail explicite sans indicateur (permis) ; indicateurs introuvables seuls
  (query principale non appelée, pas d'`acces_refuse`) ; mélange
  introuvable / non accessible / interrogé ; indicateur nommé dont le
  chantier est absent des `chantier_ids` demandés (son chantier est ajouté) ;
  restitution snake_case et libellés ; une seule requête d'identité quel que
  soit le nombre d'indicateurs. Les deux tests actuels qui vérifient une phrase de la
  description ne sont pas repris : la description est réécrite et ces tests
  n'exercent aucun comportement.
- **Intégration de `GetIndicateursNonAJourQuery`** : inchangée, elle protège le
  refactoring.
- **Intégration de `GetIndicateursIdentiteQuery`** : le filtre `indicateurIds`,
  seul et combiné à `chantierIds` (aucun test n'existe aujourd'hui).
- **Eval N2** `evals/2-tools/2.2-donnees/getIndicateursNonAJour.eval.ts` :
  - « Sur quels territoires les données de l'IND-894 ne sont pas à jour ? »
    attend désormais `detail: "territoires"` ;
  - « L'IND-894 est-il à jour au niveau national ? » attend
    `perimetre: { type: "SELECTION", territoire_codes: ["NAT-FR"] }` ;
  - nouveaux cas : chantier + détail (« sur quels territoires le CH-018 a des
    indicateurs non à jour ? » → `chantier_ids`, `detail` territoires) ;
    « les départements non à jour pour l'IND-894 » → `TOUS_DEPARTEMENTS` et
    détail ; « les données du CH-018 sont-elles à jour en Bretagne et ses
    départements ? » → `REGION_ET_SES_DEPARTEMENTS` (résolution de « la
    Bretagne » relevant du N3, le cas peut citer REG-53) ; « quels sont les
    indicateurs non à jour, avec le détail par territoire » → détail sans
    autre filtre ; « quels chantiers ont des indicateurs à mettre à jour ? »
    → compteurs sans argument.
  - Mesure avant/après sur cette suite, comme pour les PR précédentes
    d'Albert. L'API Albert renvoie souvent 503/429 pendant un run complet :
    rejouer la suite seule si besoin.

## Laissé au constructeur

- La rédaction exacte de la description de l'outil et de la ligne d'exemple
  du prompt, dans le ton des autres outils.
- Le découpage interne du fichier (fonctions de résolution du périmètre, de
  restitution) ; pas de module partagé à créer tant qu'un seul outil l'utilise.
- Les fixtures des tests d'intégration.
- Le nom exact des nouveaux champs de la query (camelCase interne).

## Choix faits par le rédacteur, à vérifier à la relecture

- Les cinq variantes de périmètre sont acceptées, `TOUS_DEPARTEMENTS` compris,
  pour « quels départements n'ont pas mis à jour X ».
- Le mode effectivement appliqué est renvoyé dans `detail`, pour que le modèle
  sache ce qu'il lit dans l'historique.
- Tous introuvables → pas d'`acces_refuse` ; au moins un non accessible et
  aucun interrogeable → `acces_refuse`.
- Les tests qui vérifiaient la description ne sont pas repris.
