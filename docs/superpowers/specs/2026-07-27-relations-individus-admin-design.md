# Gestion des relations entre individus dans le panel admin

## Contexte

La table `relation` (`parentId`, `childId`, unique sur le couple) porte la hiérarchie des
individus. Elle est lue partout — `individuApiModel.parents[]`, `loadSousArbre` pour
l'agrégation des indicateurs — mais aucun endpoint ne permet de l'écrire. Elle n'est
alimentée aujourd'hui que par les seeds et la synchronisation depuis ppg.

L'objectif est d'ouvrir cette écriture : un écran d'administration listant les relations
existantes, permettant de changer le parent d'un individu, d'en créer une nouvelle et d'en
supprimer une.

## Règle métier

**Un individu a au plus un parent.** Le schéma Prisma autorise plusieurs relations pour un
même enfant, mais la règle métier ne le permet pas. Le design fait de cette règle un
invariant structurel : la relation est identifiée par son enfant, et l'écriture est un
remplacement idempotent — il devient impossible de créer un second parent via l'API.

## Contrat API (`kpilote-api`)

### `GET /relations`

Liste paginée des relations.

- Query : `recherche` (filtre insensible à la casse sur le nom de l'enfant), `cursor`, `pageSize`
- Tri : `child.nom` ascendant, puis `id` ascendant

Le second critère n'est pas décoratif : `buildPaginationArgs` positionne le curseur sur
`id`, ce qui exige un ordre total déterministe. Sans départage, deux individus homonymes
rendent la pagination instable.

Réponse (`RelationListApiModel`) :

```json
{
  "items": [
    {
      "enfant": { "id": "DEPT-01", "nom": "Ain", "referentiel": "REF-DEPT" },
      "parent": { "id": "REG-84", "nom": "Auvergne-Rhône-Alpes", "referentiel": "REF-REG" }
    }
  ],
  "pagination": { "cursor": null, "hasMore": false },
  "total": 128
}
```

Le référentiel est présent des deux côtés : il distingue deux individus homonymes
appartenant à des populations différentes.

### `PUT /relations/{id}`

`id` = public ID de l'individu **enfant**. Body : `{ "parent": "REG-84" }`.

Le champ s'appelle `parent` et non `parentId` : les modèles API existants exposent les
public IDs sans suffixe (`individuApiModel.referentiel`, `individuApiModel.parents[]`),
et l'UUID interne n'est jamais exposé.

Opération idempotente : crée la relation si l'enfant n'en a pas, remplace le parent
existant sinon. Rejouer la même requête donne le même état.

Réponse : `200` avec le `RelationApiModel` résultant.

### `DELETE /relations/{id}`

Supprime la relation dont `id` est l'enfant. Réponse `204`.

### `GET /individus`

Liste paginée d'`IndividuApiModel`, calquée sur `listReferentiels`.

- Query : `recherche` (nom), `cursor`, `pageSize`
- Tri : `nom` ascendant, puis `id` ascendant — même contrainte de départage que
  `GET /relations`, et les Pickers reçoivent une liste déjà ordonnée

Cet endpoint n'existe pas aujourd'hui — seuls `GET /individus/{id}` et
`GET /referentiels/{id}/individus` sont exposés. Il est nécessaire côté admin pour
alimenter les deux Pickers (ajout et cellule parent), qui travaillent sur l'ensemble des
individus, tous référentiels confondus.

Le modèle retourné porte déjà `parents[]`, ce qui permet au front de distinguer les
individus déjà rattachés sans requête supplémentaire.

### Erreurs

| Cas | Réponse |
|---|---|
| `parent` == `id` | `400` `AUTO_PARENT` |
| le parent visé est un descendant de l'enfant | `400` `CYCLE_DETECTE` |
| enfant ou parent inexistant | `404` (`NotFoundError`, mécanisme existant) |
| principal ni ADMIN ni OIDC | `403` |
| `DELETE` sur un individu sans parent | `404` |

### Autorisation

`ensurePrincipal(isApiKeyAdmin || isOidcUser)` sur les deux écritures, comme
`upsertReferentiel`. Les lectures se contentent de `requireAuthentication`.

### Détection de cycle

La hiérarchie sert au calcul d'agrégation : `loadSousArbre` descend l'arbre depuis un
individu cible. Une boucle `A → B → A` ne provoque pas de boucle infinie (la garde sur
`allNodes` l'en empêche) mais fausse silencieusement les agrégats.

Avec la règle mono-parent, la détection est une remontée linéaire : on part du parent
visé, on remonte de parent en parent ; si on rencontre l'enfant, la requête est rejetée.
La boucle est bornée par la profondeur de l'arbre.

### Aucune migration

La table `relation` existe et le client Prisma est généré. Aucun changement de schéma.

## Écran `/relations` (`kpilote-admin`)

```
Fonctionnalités › Relations

Relations
128 relations · environnement dev

Ajouter une relation
[ 🔍 Rechercher un individu…                    ▾ ]

[🔍 Filtrer…]

Individu                      Référentiel   Parent
──────────────────────────────────────────────────────────────────────
Ain            DEPT-01        REF-DEPT      [ Auvergne-R.-A.  REG-84 ▾ ]  🗑
Aisne          DEPT-02        REF-DEPT      [ Hauts-de-France REG-32 ▾ ]  🗑
Allier         DEPT-03        REF-DEPT      [ Auvergne-R.-A.  REG-84 ▾ ]  🗑

                          [ Charger plus ]
```

### Ajout

Un `Picker` posé au-dessus du tableau, utilisé comme contrôle d'ajout — le pattern déjà
en place dans `AdminReferentiels` et `AdminResponsables` : sélectionner un item appelle
`onSelect`, le trigger réaffiche son placeholder. `excludedIds` retire les individus qui
ont déjà un parent (`parents.length > 0`), donc ceux déjà présents dans le tableau.

La sélection insère une ligne en attente en tête du tableau, sur fond distinct, avec un
badge « parent à choisir » et son Picker parent ouvert. Rien n'est écrit tant qu'aucun
parent n'est choisi ; quitter la page perd simplement la ligne en attente.

### Cellule parent

`Picker` (cmdk, recherche par nom ou public ID, insensible aux accents), rendu via
`PickerOptionNomId`. Les options couvrent tous les individus, sauf la ligne elle-même.

Les descendants ne sont pas exclus côté UI : la liste des relations est paginée, le front
ne connaît donc pas l'arbre complet. C'est l'API qui tranche, et le toast d'erreur
`CYCLE_DETECTE` affiche « Ce parent est un descendant de l'individu ».

### Sauvegarde

Immédiate, ligne par ligne. Choisir un parent déclenche le `PUT` sans confirmation, avec
toast de succès. En cas d'erreur, la valeur affichée revient à son état précédent et le
message de l'API est repris dans un toast.

Un bouton « Enregistrer » global n'aurait pas de périmètre lisible sur une liste paginée
dont le contenu change avec la recherche.

### Suppression

Icône poubelle en fin de ligne → `DELETE` → invalidation de `['relations']`.

### Protection prod

Les écritures passent par `useProdEditUnlock`, comme `PrincipalPermissions` et la console
API : en environnement `prod`, les contrôles sont verrouillés jusqu'à déverrouillage
explicite, persistant pour la session navigateur.

### Entrée dans le menu

`BarCard` « Gérer les relations » dans `/fonctionnalites`, icône `Network` de lucide.

## Flux de données côté admin

| Source | Sert à | Chargement |
|---|---|---|
| `GET /relations` | le tableau | infinite query + « Charger plus », comme `/referentiels` |
| `GET /individus` | Picker d'ajout et Pickers parent | `fetchAllPages`, chargé une fois, partagé |

Les individus déjà rattachés apparaissent dans les deux jeux de données. Ce doublon est
assumé : il garde `GET /relations` utilisable par un consommateur externe sans l'obliger à
télécharger toute la population, et le tableau paginé.

Le chargement intégral des individus est acceptable aux volumes actuels (départements
≈ 101, régions ≈ 18, national = 1). Il devra être revu si une population de l'ordre des
communes (~35 000) est introduite ; la parade serait une recherche serveur à la frappe
dans les Pickers, sans changement du contrat API.

## Fichiers

### Nouveaux

- `packages/kpilote-shared/src/relation.ts` — `relationApiModelSchema`,
  `relationListApiModelSchema`, `listRelationsQuerySchema`, `upsertRelationBodySchema`
- `apps/kpilote-api/src/relation/routes.ts`
- `apps/kpilote-api/src/relation/utils.ts` — `relationInclude`, `toRelationApiModel`
- `apps/kpilote-api/src/relation/queries/listRelations.ts`
- `apps/kpilote-api/src/relation/commands/upsertRelationParent.ts`
- `apps/kpilote-api/src/relation/commands/supprimerRelation.ts`
- `apps/kpilote-api/src/individu/queries/listIndividus.ts`
- `apps/kpilote-admin/src/api/relations.ts`, `apps/kpilote-admin/src/api/individus.ts`
- `apps/kpilote-admin/src/queries/relations.ts`, `apps/kpilote-admin/src/queries/individus.ts`
- `apps/kpilote-admin/src/components/relations/IndividuPicker.tsx`
- `apps/kpilote-admin/src/routes/_authed/relations/index.tsx`

### Modifiés

- `apps/kpilote-api/src/app.ts` — enregistrement de `relationRoutes`
- `apps/kpilote-api/tsconfig.json` — alias `@/relation/*` (les chemins sont déclarés
  dossier par dossier ; sans cet ajout le module ne résout pas)
- `apps/kpilote-api/src/individu/routes.ts` — `GET /individus`
- `packages/kpilote-shared/src/individu.ts` — `listIndividusQuerySchema`
- `apps/kpilote-admin/src/routes/_authed/fonctionnalites.tsx` — `BarCard` Relations

## Tests

Tests API colocalisés en `.test.ts`, selon la convention du repo :

- `listRelations` : tri par nom d'enfant, pagination stable en présence de noms
  identiques, filtre `recherche`
- `upsertRelationParent` : création, puis remplacement du parent sans créer de doublon ;
  idempotence ; `AUTO_PARENT` ; `CYCLE_DETECTE` sur un cycle à deux niveaux et à trois
  niveaux ; `404` sur enfant ou parent inconnu ; garde d'autorisation
- `supprimerRelation` : suppression, `404` si l'individu n'a pas de parent
- `listIndividus` : pagination, filtre `recherche`
- `relation/routes.test.ts` : codes de statut et forme des réponses

Pas de tests front, conformément à la convention du projet.

## Hors périmètre

- Édition en masse des relations (import CSV, opérations par lot)
- Visualisation arborescente de la hiérarchie
- Adaptation de la synchronisation ppg pour qu'elle passe par ces endpoints
- Support du multi-parents, que le schéma autorise mais que la règle métier exclut
