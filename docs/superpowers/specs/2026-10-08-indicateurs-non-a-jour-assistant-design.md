# Indicateurs non à jour dans l'assistant IA — design

Date : 2026-10-08
Périmètre : `apps/pilote-ppg-data-management` (dbt) et `apps/pilote-ppg` (assistant Albert)

## Objectif

Permettre à l'assistant IA de pilote-ppg de répondre à des questions sur la fraîcheur des données d'indicateurs, aujourd'hui uniquement remontée par le mail hebdomadaire des rapports PVA (`CreerLesRapportsPropositionsUseCase`) :

- « Quels sont les indicateurs avec un retard de mise à jour sur mes chantiers ? »
- « Quels sont les indicateurs non mis à jour sur le chantier CH-XXX ? »
- « Sur quels territoires les données de l'indicateur XXX ne sont pas à jour ? »

La troisième question impose de connaître la fraîcheur **par territoire**, ce que la donnée actuelle ne permet pas.

## Constat

`indicateur_territoire.est_a_jour` (et `prochaine_date_maj`, `prochaine_date_maj_jours`, `prochaine_date_valeur_actuelle`) est calculé par le modèle dbt `get_date_pro_maj_indic` à la granularité **(indicateur, maille)** :

- `get_last_vaca_maille` prend le `MAX(date_valeur_actuelle)` sur toutes les zones d'une maille ;
- `prochaine_date_maj` = dernière VA + périodicité + délai de disponibilité, arrondie à la fin du mois ;
- `est_a_jour = COALESCE(prochaine_date_maj > CURRENT_DATE, FALSE)` ;
- `indicateur_territoire.sql` joint ce résultat sur `maille`, donc tous les territoires d'une maille portent la même valeur.

Conséquence : une maille est « à jour » dès qu'un seul de ses territoires a remonté une valeur récente. Cela fausse aussi l'alerte de la page chantier, qui affiche `estAJour` pour le territoire consulté.

## Décisions

1. **`est_a_jour` devient territorial** : la sémantique des colonnes existantes est remplacée, pas doublée. Aucune nouvelle colonne, aucun changement de schéma Prisma.
2. **Un territoire applicable sans aucune valeur actuelle est « non à jour »** (comportement actuel du `COALESCE(..., FALSE)`, désormais appliqué par territoire).
3. **Le calcul reste dans `get_date_pro_maj_indic`**, dont la granularité passe à (indicateur, zone) (approche A). `get_last_vaca_maille` est supprimé (seul consommateur).
4. **L'assistant s'aligne sur la définition du mail** : chantier et indicateur publiés, `est_applicable = true`, `est_a_jour` false ou NULL. Pas de filtre sur la pondération (contrairement à l'alerte UI de la page chantier).
5. **Le code du mail n'est pas modifié.** Seul son contenu évolue mécaniquement (voir « Points d'attention »).

## Partie 1 — Modèle dbt

### `models/df3/4_compute/get_date_pro_maj_indic.sql`

- `src_indicateurs` part des zones (`stg_ppg_metadata__zones`) au lieu du `CROSS JOIN` sur `base_mailles` ; la CTE `base_mailles` disparaît.
- Le filtre d'éligibilité est conservé à l'identique, appliqué à la maille de la zone :
  - DEPT : indicateur territorialisé d'un chantier territorialisé piloté au DEPT ;
  - REG : indicateur territorialisé d'un chantier territorialisé piloté au REG ou DEPT ;
  - NAT : tous les indicateurs.
- `last_va_date` provient de `get_last_vaca` joint sur `(indic_id, zone_id)`.
- Les CTE de calcul (`get_prochaine_date_va`, `get_prochaine_date_maj_debut_mois`, `get_prochaine_date_maj`, `get_est_a_jour_et_date_maj_jours`) sont inchangées.
- Colonnes en sortie : `indic_id`, `chantier_id`, `zone_id`, `maille`, `last_va_date`, `periodicite`, `delai_disponibilite`, `prochaine_date_va`, `prochaine_date_maj`, `est_a_jour`, `prochaine_date_maj_jours`.

### `models/exposition/indicateur/indicateur_territoire.sql`

- Jointure `date_pro_maj` sur `meta_indic.id = date_pro_maj.indic_id AND territoire.zone_id = date_pro_maj.zone_id` (au lieu de la maille).
- Les `CASE` qui annulent les valeurs pour les zones/mailles non applicables restent inchangés.
- Le modèle est `incremental` en `merge` sans filtre `is_incremental()` : toutes les lignes sont réécrites à chaque exécution, pas de `--full-refresh` nécessaire.

### Suppression

- `models/df3/4_compute/get_last_vaca_maille.sql` (seul `ref` : `get_date_pro_maj_indic`).

### Documentation et tests dbt

- `models/df3/schema.yml` : description de `get_date_pro_maj_indic` → « Pour chaque {indic_id, zone_id} … » ; `last_va_date` → « Date de la VA la plus récente pour cette zone ».
- Nouveau `unit_tests` sur `get_date_pro_maj_indic` (format de `models/df3/1_select_last_values/unit_tests.yml`). `CURRENT_DATE` n'étant pas mockable, les cas utilisent des dates très anciennes ou très futures pour rendre `est_a_jour` déterministe :
  - deux zones DEPT d'un même indicateur territorialisé, l'une avec une VA récente (`est_a_jour = true`), l'autre ancienne (`false`) ;
  - une zone DEPT applicable sans VA → `prochaine_date_maj` NULL, `est_a_jour = false` ;
  - indicateur non territorialisé → aucune ligne DEPT/REG, une ligne NAT ;
  - vérification de `prochaine_date_maj` (fin de mois, périodicité + délai) sur un cas.

## Partie 2 — Outil de l'assistant `get_indicateurs_non_a_jour`

### Query

`apps/pilote-ppg/src/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery.ts`, enregistrée dans le module `chantiers`, lecture Prisma sur `indicateur_territoire` :

- paramètres : `chantierIds: string[]`, `territoireCodes: string[]` (territoires accessibles, ou le seul territoire demandé), `indicateurIds?: string[]` ;
- filtres : `indicateur_identite.statut = PUBLIE`, `chantier_identite.statut = PUBLIE`, `est_applicable = true` ;
- retourne, par (chantier, indicateur, maille) : le nombre de territoires applicables, et la liste des territoires non à jour (`est_a_jour` false ou NULL) avec `territoire_code`, `territoire_nom`, `date_valeur_actuelle_mandat`, `prochaine_date_maj` ;
- nom du chantier et de l'indicateur inclus, ainsi que `periodicite` et `delai_disponibilite` de `indicateur_identite` (pour expliquer le retard) ;
- en mode compteurs, les territoires en retard sont comptés en base (`groupBy` par indicateur et maille) sans lire les lignes une à une ; seul le mode détaillé lit les territoires.

La méthode `recupererIndicateursNonAJourParChantierId` du repository reste dédiée au mail et n'est pas modifiée.

### Outil

`apps/pilote-ppg/src/server/albert/tools/getIndicateursNonAJour.ts`, fabrique `createGetIndicateursNonAJourTool({ recupererIndicateursNonAJourQuery, getIndicateurContexteQuery })` retournant `({ chantiersAccessibles, territoiresAccessibles }) => tool(...)`, sur le modèle de `getChantiersSignales.ts`.

Entrées (toutes optionnelles) :

| Champ | Description |
|---|---|
| `chantier_ids` | Ex. `["CH-042"]`. Absent → tous les chantiers accessibles (« mes chantiers »). |
| `indicateur_ids` | Ex. `["IND-894"]`. Un libellé approximatif est d'abord résolu via `search_indicateurs`. |
| `territoire_code` | Ex. `REG-53`. Restreint à un territoire. |

Habilitations :

- `chantier_ids` ∩ `chantiersAccessibles` ; intersection vide → résultat vide + instruction « aucun des chantiers demandés n'est accessible » ;
- `territoire_code` hors `territoiresAccessibles` → `acces_refuse: true` + instruction de refus poli sans détail ;
- sans `territoire_code`, la query est bornée à `territoiresAccessibles`.
- chaque `indicateur_ids` est résolu avec `GetIndicateurContexteQuery`, comme dans `get_evolution_indicateur` et `get_historique_indicateur` : les indicateurs rattachés à un chantier non accessible sont retirés de la requête et signalés au modèle par leur identifiant, sans leur chantier ; si aucun indicateur demandé n'est accessible, l'outil renvoie un résultat vide avec l'instruction « aucun des indicateurs demandés n'est accessible », comme pour les chantiers, sans interroger la fraîcheur ; un indicateur introuvable est transmis tel quel à la query, qui renvoie un résultat vide.

Sortie :

```ts
type GetIndicateursNonAJourOutput = {
  resultats: {
    chantier: { id: string; nom: string };
    indicateurs: {
      id: string;
      nom: string;
      periodicite: string | null; // ex. "Trimestrielle"
      delaiDisponibiliteMois: number | null;
      mailles: {
        maille: "NAT" | "REG" | "DEPT";
        nbTerritoiresEnRetard: number;
        nbTerritoiresApplicables: number;
        // présent uniquement en mode détaillé
        territoiresEnRetard?: {
          code: string;
          nom: string | null;
          dateDerniereValeur: string | null; // null = jamais renseignée
          miseAJourAttendueDepuis: string | null; // prochaine_date_maj
        }[];
      }[];
    }[];
  }[];
  acces_refuse?: boolean;
  _output_instructions: string;
};
```

Seuls les indicateurs ayant au moins un territoire en retard figurent dans `resultats`. L'outil ne vérifie pas en amont l'existence ni l'applicabilité des indicateurs, chantiers et territoires demandés : seuls les garde-fous d'autorisation s'appliquent. Un résultat vide ne permet donc pas de distinguer « à jour » de « non suivi » ou « identifiant inconnu », et n'est jamais présenté comme « à jour ».

Règle de volume : le **mode détaillé** (`territoires_en_retard`) n'est activé que si `indicateur_ids` ou `territoire_code` est fourni. Sinon seuls les compteurs sont renvoyés, et `_output_instructions` invite l'assistant à proposer le détail territorial sur un indicateur précis.

Instructions de restitution (`_output_instructions`) :

- chantiers au format « CH-XXX — Nom », indicateurs au format « IND-XXX — Nom » ;
- par défaut, regrouper par chantier puis indicateur, avec une ligne par maille du type « Départements : 12 / 101 territoires en retard » ;
- si la question porte sur les chantiers (« sur quels chantiers… »), restituer une liste de chantiers avec leur nombre d'indicateurs non à jour, sans détailler les indicateurs, puis proposer le détail d'un chantier ;
- en mode détaillé, lister les territoires avec la date attendue de mise à jour ; un territoire sans `date_derniere_valeur` est présenté comme « aucune valeur renseignée » ;
- résultat vide → dire qu'aucun indicateur non à jour n'a été trouvé sur le périmètre demandé, sans conclure que les données sont à jour, et proposer d'élargir le périmètre ou de vérifier l'identifiant avec `search_indicateurs` ;
- chantiers demandés non accessibles → le signaler, sans jamais les présenter comme à jour.

### Câblage

- `apps/pilote-ppg/src/server/albert/module.ts` : enregistrement de `createGetIndicateursNonAJourTool`.
- `apps/pilote-ppg/src/server/albert/AssistantIA.ts` : `get_indicateurs_non_a_jour` ajouté à `construireTools`, toujours exposé (pas de capacity).

### Prompt système (`apps/pilote-ppg/src/server/albert/systemPrompt.ts`)

Nouvelle section « Indicateurs non à jour » :

- déclencheurs : « retard de mise à jour », « non mis à jour », « données pas à jour », « données périmées », « mise à jour attendue » ;
- distinction explicite avec « Retard par rapport à la médiane » / chantiers en retard (`get_chantiers(view='en_retard')`), qui porte sur l'avancement et non sur la fraîcheur des données ;
- indicateur décrit sans identifiant → `search_indicateurs` puis `get_indicateurs_non_a_jour(indicateur_ids=[...])` ;
- définition à donner si l'utilisateur la demande : une donnée est non à jour lorsque la date théorique de mise à jour (dernière valeur + périodicité + délai de disponibilité déclarés) est dépassée ;
- limites à annoncer explicitement plutôt que d'improviser (voir « Non répondables » N1 à N4 et N6) : pas de classement des territoires sans indicateur ou territoire ciblé, pas d'échéances futures, pas d'historique, pas de responsables de données, pas de contenu du mail.

Ajout d'une ligne dans le tableau de routage et mention de l'outil dans la section `search_indicateurs` (« fraîcheur des données de l'indicateur → `get_indicateurs_non_a_jour` »).

### Tests applicatifs

- **Unitaires** (`src/server/albert/__tests__/tools/getIndicateursNonAJour.unit.test.ts`) : intersection des chantiers accessibles, refus d'accès territoire, bornage aux territoires accessibles, mode compteurs vs mode détaillé, résultat vide.
- **Intégration** (query) sur base seedée : retard partiel au sein d'une maille, territoire sans valeur, territoire non applicable exclu, indicateur/chantier brouillon exclus.
- **Evals niveau 2** (`evals/2-tools/2.2-donnees`) :
  - nouvelle suite `getIndicateursNonAJour.eval.ts` : une question par ligne « Répondable » du bilan ci-dessous qui sollicite l'outil (avec vérification des arguments porteurs d'intention : `chantier_ids`, `indicateur_ids`, `territoire_code`), plus les cas négatifs :
    - « Quels chantiers sont en retard en Bretagne ? » → `forbidden: ["get_indicateurs_non_a_jour"]` (retard d'avancement, pas de fraîcheur) ;
    - « Quelles sont les valeurs des indicateurs du CH-005 en Bretagne ? » → `forbidden: ["get_indicateurs_non_a_jour"]` (valeurs, pas fraîcheur) ;
  - ajout de cas négatifs dans les suites voisines, pour verrouiller le routage dans l'autre sens :
    - `getChantiers.eval.ts` : « Quels indicateurs ont un retard de mise à jour en Bretagne ? » et « Quels chantiers ont des données pas à jour en Corse ? » → `forbidden: ["get_chantiers"]` (« retard » ici = fraîcheur, pas `view: en_retard`) ;
    - `getIndicateurs.eval.ts` : « Les indicateurs du CH-005 sont-ils à jour en Bretagne ? » → `forbidden: ["get_indicateurs"]` ;
    - `getChantiersSignales.eval.ts` : « Quels chantiers ont des indicateurs non mis à jour en Bretagne ? » → `forbidden: ["get_chantiers_signales"]` (pas une catégorie de signalement).

## Bilan des questions

Bilan établi d'après la sortie de l'outil, la règle de volume et les habilitations décrites plus haut. « Répondable » suppose la Partie 1 déployée pour les réponses au niveau territoire.

### Répondables

| # | Question type | Appel attendu | Réponse fournie |
|---|---|---|---|
| R1 | « Quels sont les indicateurs avec un retard de mise à jour sur mes chantiers ? » | sans argument | Indicateurs non à jour par chantier, compteurs par maille (« Départements : 12 / 101 ») |
| R2 | « Combien d'indicateurs ne sont pas à jour sur mes chantiers ? » | sans argument | Total dérivé de R1 |
| R13 | « Sur quels chantiers y a-t-il des indicateurs non à jour ? » | sans argument | Liste des chantiers ayant au moins un indicateur non à jour, avec leur nombre d'indicateurs concernés |
| R3 | « Quels sont les indicateurs non mis à jour sur le chantier CH-042 ? » | `chantier_ids` | Idem R1 sur un chantier |
| R4 | « Sur quels territoires les données de l'indicateur IND-894 ne sont pas à jour ? » | `indicateur_ids` | Liste nominative des territoires, avec date attendue de mise à jour |
| R5 | « Le taux d'équipement en bornes est-il à jour partout ? » | `search_indicateurs` puis `indicateur_ids` | Idem R4 après résolution du libellé |
| R6 | « Quels indicateurs ne sont pas à jour en Bretagne ? » / « … dans mon département ? » | `territoire_code` | Liste des indicateurs non à jour sur ce territoire, tous chantiers accessibles |
| R7 | « Les données du CH-042 sont-elles à jour en Corse ? » | `chantier_ids` + `territoire_code` | Indicateurs du chantier non à jour sur ce territoire, ou confirmation que tout est à jour |
| R8 | « Depuis quand l'IND-894 n'est-il pas à jour dans le Finistère ? » | `indicateur_ids` + `territoire_code` | `mise_a_jour_attendue_depuis` |
| R9 | « Quelle est la date de la dernière valeur remontée pour l'IND-894 en Bretagne ? » (dans un contexte de retard) | `indicateur_ids` + `territoire_code` | `date_derniere_valeur` |
| R10 | « Quels départements n'ont jamais renseigné l'IND-894 ? » | `indicateur_ids` | Territoires avec `date_derniere_valeur` null |
| R11 | « Pourquoi l'IND-894 est-il considéré comme pas à jour ? » | `indicateur_ids` | Définition (prompt) + périodicité, délai et date de dernière valeur de l'indicateur |
| R12 | « L'IND-894 est-il à jour au niveau national ? » | `indicateur_ids` + `territoire_code: NAT-FR` | Statut de la ligne NAT |

### Non répondables (ou partiellement)

| # | Question type | Raison | Comportement attendu de l'assistant |
|---|---|---|---|
| N1 | « Quel département a le plus d'indicateurs non à jour sur mes chantiers ? » | Sans `indicateur_ids` ni `territoire_code`, l'outil ne renvoie que des compteurs par maille (règle de volume) | Le dire, proposer de cibler un indicateur ou un territoire |
| N2 | « Quels indicateurs devront être mis à jour le mois prochain ? » | L'outil ne renvoie que les données déjà en retard ; `prochaine_date_maj` des données à jour n'est pas exposée | Indiquer que seules les données en retard sont consultables |
| N3 | « Ces indicateurs étaient-ils à jour le mois dernier ? » / « Évolution du nombre d'indicateurs en retard » | Calcul relatif à `CURRENT_DATE`, pas d'historique | Indiquer que seul l'état courant est disponible |
| N4 | « Qui doit mettre à jour l'IND-894 ? » | `responsables_donnees_mails` existe mais n'est pas exposé (choix : pas d'adresses e-mail dans les réponses de l'assistant) | Renvoyer vers la fiche indicateur |
| N5 | « Quels indicateurs ont un taux d'avancement non calculable ? » (section « à paramétrer » du mail) | Hors périmètre de l'outil ; seul le signalement chantier `estEnAlerteTauxAvancementNonCalculé` existe via `get_chantiers_signales` | Répondre au niveau chantier via `get_chantiers_signales` |
| N6 | « Quel est le contenu du dernier mail hebdomadaire ? » | Les rapports envoyés ne sont pas exposés | Indiquer que le contenu du mail n'est pas consultable |
| N7 | « L'IND-894 est-il à jour dans le Var ? » pour un indicateur non territorialisé ou non applicable au Var | Pas de ligne applicable à cette maille / zone | Dire qu'aucun indicateur non à jour n'a été trouvé sur ce périmètre, sans conclure « à jour » ; la cause (non suivi, identifiant erroné) n'est pas distinguée |
| N8 | Toute question sur un chantier ou territoire hors habilitations, ou sur un chantier / indicateur en brouillon | Filtres d'habilitation et de statut | Refus poli, ou « aucun résultat » sans divulguer de données |
| N9 | « Quelle est la dernière valeur de l'IND-894 en Bretagne ? » (la valeur, pas sa date) | Hors périmètre de cet outil | Router vers `get_indicateurs` / `get_evolution_indicateur` |

N1, N2 et N4 sont des extensions peu coûteuses si le besoin se confirme (respectivement : agrégat par territoire en mode compteurs, filtre « à échéance sous N jours » sur `prochaine_date_maj_jours`, exposition des responsables). Elles sont volontairement exclues de cette itération.

## Points d'attention

### Impact sur le mail hebdomadaire

Le code du mail ne change pas, mais sa requête (`est_a_jour` false ou NULL, regroupé par maille) fera désormais remonter une maille dès qu'**un** territoire est en retard, au lieu de **tous**. La liste ne peut que s'étendre :

- territoires retardataires au sein d'une maille globalement à jour ;
- territoires applicables n'ayant jamais eu de valeur (non à jour en permanence).

La forme du mail (indicateur → mailles) est inchangée. **À mesurer en recette avant mise en production** en comparant le nombre de couples (indicateur, maille) non à jour avant/après exécution du nouveau modèle.

### Impact sur la page chantier

L'alerte « mise à jour requise depuis … » (`useIndicateurAlerteDateMaj`, `SectionIndicateurs`, `BasePageChantierLayout`, `IndicateurSpécifications`) devient exacte pour le territoire consulté. Sur REG/DEPT, des alertes peuvent apparaître là où il n'y en avait pas. Pas de changement de code.

## Déploiement

1. Merge et déploiement du modèle dbt ; exécution du datajob ; mesure de l'impact sur le mail en recette.
2. Merge et déploiement de l'outil de l'assistant. L'outil fonctionne aussi avec l'ancien calcul (avec des réponses au niveau maille) : l'ordre n'est pas bloquant, mais la valeur métier de la question 3 dépend de l'étape 1.

## Hors périmètre

- Refonte du mail pour lister les territoires en retard.
- Alignement du filtre de pondération entre la page chantier et le mail.
- Consultation de la fraîcheur à une date passée (le calcul est relatif à `CURRENT_DATE`).
- Extensions N1, N2, N4 du bilan des questions.
