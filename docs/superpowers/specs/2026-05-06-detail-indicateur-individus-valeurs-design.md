---
date: 2026-05-06
topic: page détail indicateur — sélection d'individu, valeurs et métadonnées
status: approved
---

# Page détail indicateur — sélection d'individu, valeurs et métadonnées

## Contexte

La route `/_authenticated/indicateurs/$id` affiche aujourd'hui les
métadonnées brutes d'un indicateur (id, nom, dates) plus un bloc de
diagnostic TanStack Router. Les endpoints `mb-api` exposant les individus
liés à un indicateur et leurs valeurs viennent d'être livrés (PR #2116).
On branche maintenant la webapp pour exploiter ces données.

Endpoints disponibles côté `mb-api` :

- `GET /indicateurs/:id` → `IndicateurApiModel`
- `GET /indicateurs/:id/individus?cursor?&referentiel?` → liste paginée
  d'`IndividuAvecValeursApiModel` (individu + dernière valeur + nombre)
- `GET /indicateurs/:id/valeurs?individus=...&dateDebut?&dateFin?` →
  `ValeurAvancementListApiModel` (items: { date, valeur, indicateur,
  individu }[]) — non paginé, borné par la liste d'individus

## Objectifs

1. Permettre à l'utilisateur de choisir un individu lié à l'indicateur
   via un Radix `Select`.
2. Afficher les valeurs de l'indicateur pour cet individu dans un onglet
   dédié (Radix `Tabs`).
3. Conserver les métadonnées de l'indicateur dans un second onglet.
4. Garder le design minimaliste actuel et les tokens sémantiques Tailwind
   du thème (`bg-surface`, `text-text`, `border-border`, …).

## Architecture

### Utilitaire de pagination générique

Nouveau helper dans `apps/mb-webapp/src/queries/utils.ts` à côté de
`DEFAULT_STALE_TIME` :

```ts
type PaginatedPage<T> = {
  items: T[]
  pagination: { hasMore: boolean; cursor: string | null }
}

export const fetchAllPaginatedItems = async <T>(
  fetchPage: (cursor: string | undefined) => Promise<PaginatedPage<T>>,
): Promise<T[]> => {
  const items: T[] = []
  let cursor: string | undefined
  do {
    const page = await fetchPage(cursor)
    items.push(...page.items)
    cursor =
      page.pagination.hasMore && page.pagination.cursor
        ? page.pagination.cursor
        : undefined
  } while (cursor)
  return items
}
```

Fonctions API : un appel HTTP = une page. La boucle d'agrégation est
faite au niveau du `queryFn`, jamais dans `src/api/`.

### Couche API

`apps/mb-webapp/src/api/indicateurs.ts` :

- `fetchIndividusForIndicateur(indicateurId, { cursor? })` →
  `IndividusWithValeursListApiModel` (une page).
- `fetchValeursForIndicateur(indicateurId, { individus })` →
  `ValeurAvancementListApiModel`. `individus` est un `string[]` joint
  via `,` côté client. Pas de gestion des dates pour la v0.

### Couche queries

`apps/mb-webapp/src/queries/indicateurs.ts` :

- `indicateurIndividusQueryOptions(indicateurId)` → `queryFn` boucle via
  `fetchAllPaginatedItems` sur `fetchIndividusForIndicateur`.
- `indicateurValeursQueryOptions(indicateurId, individuId)` → un seul
  appel `fetchValeursForIndicateur(indicateurId, { individus: [individuId] })`.

QueryKeys :

- `['indicateur', id, 'individus']`
- `['indicateur', id, 'valeurs', individuId]`

### Composants UI partagés

Deux nouveaux composants dans `apps/mb-webapp/src/components/ui/`,
mêmes patterns que `Button.tsx` (Radix + classes via `clsxm`) :

- `Select.tsx` — wrapper sur `@radix-ui/react-select`, expose `Select`
  (root), `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`.
  Styles : `border-border`, `bg-surface`, `text-text`,
  `hover:bg-secondary-hover`, focus-visible primary.
- `Tabs.tsx` — wrapper sur `@radix-ui/react-tabs`, expose `Tabs` (root),
  `TabsList`, `TabsTrigger`, `TabsContent`. Onglet actif souligné par
  une bordure inférieure `border-primary`, inactif `text-text-muted`.

Dépendances à ajouter : `@radix-ui/react-select` et
`@radix-ui/react-tabs`.

### Page `/_authenticated/indicateurs/$id`

Search params :

```ts
z.object({
  individu: individuPublicIdSchema.optional(),
})
```

Loader : `Promise.all` sur `indicateurQueryOptions(id)` et
`indicateurIndividusQueryOptions(id)` pour préfetcher les deux. Les
valeurs sont fetchées dans le composant via `useSuspenseQuery` une fois
l'individu sélectionné connu (Suspense gère le loading lors du switch
d'individu).

Logique de sélection initiale :

- Si `search.individu` est dans la liste → c'est lui.
- Sinon premier individu de la liste.
- Si la liste est vide → message "Aucun individu n'a de valeur pour
  cet indicateur" et on ne rend ni le select ni les onglets.

Sur changement de sélection : `navigate({ search: { individu: id } })`
pour partage / refresh / back.

Layout :

```
← Retour à la liste

[ID kicker]
H1 : nom indicateur

Select : Nom de l'individu  ▾

[Valeurs] [Métadonnées]   <- TabsList

— Onglet Valeurs —
Tableau :
  Date       | Valeur
  -----------+------
  01/05/2026 | 42
  ...
Tri date desc.
État vide : "Aucune valeur pour cet individu."

— Onglet Métadonnées —
Liste : ID, Nom, Créé le, Mis à jour le.
```

Le bloc "Diagnostic TanStack Router" actuel est supprimé.

## Choix de design

- **Label du select** : juste le nom de l'individu. Pas d'ID en suffixe
  pour rester minimaliste.
- **Tri du tableau de valeurs** : date desc (plus récent en haut).
- **Format de la date** : FR (`toLocaleDateString('fr-FR')`).
- **Format de la valeur** : `toLocaleString('fr-FR')` (séparateurs FR
  pour les grands nombres).
- **Pagination des individus** : tout charger en boucle dans le
  `queryFn`. Convient pour la v0 (volumes raisonnables). Si un
  indicateur a des milliers d'individus on reverra (search côté API
  + select avec recherche).
- **Pas de filtre de dates côté valeurs** pour la v0 — on récupère
  tout l'historique pour l'individu sélectionné.

## Hors scope

- Sélection multiple d'individus.
- Filtres dateDebut / dateFin.
- Filtre par référentiel sur le select.
- Recherche dans le select.
- Graphique des valeurs.
