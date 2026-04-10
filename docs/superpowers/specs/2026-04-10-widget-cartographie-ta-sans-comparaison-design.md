# Widget cartographie taux d'avancement sans comparaison

Date : 2026-04-10
Ticket : PIL-1370

## Contexte

La section actuelle `SectionComparaisonTerritoires` affiche un widget
`WidgetCartographieTA` complet avec carte, panel de comparaison des territoires
sélectionnés (`SuiviTauxAvancement`) et footer permettant d'ajouter des
territoires à comparer.

Le besoin est de proposer une version simplifiée de ce widget sur la page
d'accueil, sans aucune notion de comparaison :

- plus de panel droit avec la liste des territoires comparés,
- plus de bouton « + ajouter un territoire »,
- clic sur un territoire de la carte → navigation Next.js vers
  `/accueil/chantier/[territoireCode]` (mise à jour de l'URL, pas
  simplement du store).

Le titre de la section passe de « Comparaison territoriale et évolution »
à « Taux d'avancement des chantiers par territoire ».

L'ancien widget reste utilisé par d'autres pages (notamment le mode
`indicateur`), il ne doit pas être cassé.

## Décision d'approche

Créer un nouveau composant `WidgetCartographieTA` totalement dédié au cas
« chantiers sans comparaison », et **renommer** l'existant en
`WidgetCartographieTAAvecComparaison` pour garder un nom explicite sur le cas
complexe. Les sous-parties réutilisables (hooks `useDonneesCartographieTA`,
`useLegendeTA`) sont partagées via import direct depuis le dossier renommé.

Cette approche :

- garde zéro risque de régression sur l'ancien widget (mode indicateur, etc.),
- évite la duplication de la logique de données (hooks partagés),
- donne un nouveau composant beaucoup plus simple à lire (pas de Context
  Provider, pas de `useSelectionTerritoires`, pas de `SelecteurVueWidget`).

## Portée

### Renommages

- Dossier `src/client/components/_commons/Widget/WidgetCartographieTA/`
  → `WidgetCartographieTAAvecComparaison/`
- Fichier principal `WidgetCartographieTA.tsx`
  → `WidgetCartographieTAAvecComparaison.tsx`
- Symbole exporté `WidgetCartographieTA`
  → `WidgetCartographieTAAvecComparaison`
- Les fichiers internes du dossier restent en place
  (`useDonneesCartographieTA`, `useLegendeTA`, `SuiviTauxAvancement`,
  `TableauEvolutionTA`, `EvolutionCourbesTauxAvancement`).
- Mise à jour de tous les imports consommateurs (page indicateur en
  particulier).

### Nouveau composant `WidgetCartographieTA`

Emplacement : `src/client/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx`.

Props :

```ts
type WidgetCartographieTAProps = {
  chantierIds: string[];
  maille: MailleInterne;
  jalon: number;
};
```

Comportement :

- Récupère les données via `api.useSuspenseQuery` sur
  `chantier.recupererTauxAvancementTerritoires` et
  `chantier.recupererStatistiquesAvancement`, **sans Context Provider**
  (un seul consommateur).
- Réutilise `useDonneesCartographieTA` et `useLegendeTA` importés depuis
  `WidgetCartographieTAAvecComparaison/`.
- Utilise `BaseCartographieWidgetLayout` avec uniquement les slots
  `titre`, `cartographie` et `complementsCartographie` (valeurs
  remarquables + légende). Pas de `children` (panel droit) ni `footer`.
- Clic sur un territoire (`onTerritoireSelect` de `CartographieV2`) →
  navigation Next.js vers `/accueil/chantier/${territoireCode}?${queryParamString}`,
  en reprenant le pattern existant de `NavigationPilote.tsx:82` /
  `EnTête.tsx:51` afin de conserver les query params courants du store filtres.

### Adaptation `BaseCartographieWidgetLayout`

Rendre les slots `children` (panel droit) et `footer` optionnels : ne
pas rendre leur markup quand ils sont absents. C'est un petit changement
ciblé qui évite d'avoir à dupliquer un layout ad-hoc dans le nouveau widget.

### Section de page

- Supprimer `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx`.
- Créer `src/client/components/PageAccueil/sections/SectionCartographieTA.tsx` :

```tsx
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionCartographieTA = () => {
  const { chantierIds, jalon, mailleQuery } = usePageAccueilContext();

  return (
    <section id="taux-avancement-territoires" className="pt-4">
      <TuileWidget titre="Taux d'avancement des chantiers par territoire">
        <WidgetCartographieTA
          chantierIds={chantierIds}
          jalon={jalon}
          maille={mailleQuery}
        />
      </TuileWidget>
    </section>
  );
};
```

Notes :

- Pas de feature flag local : la bascule entre page d'accueil legacy et
  nouvelle page d'accueil est déjà gérée plus haut dans l'arborescence.
- Mettre à jour le composant parent qui importait
  `SectionComparaisonTerritoires` (probablement `PageAccueil.tsx` ou
  `BasePageAccueilLayout.tsx`).
- Mettre à jour d'éventuels liens d'ancre vers `#comparaison-territoires`
  → `#taux-avancement-territoires`.

## Ce qui n'est pas dans la portée

- Pas de tests d'intégration ajoutés pour le nouveau widget.
- Pas de refactoring non lié de l'ancien widget renommé.
- Pas de renommage du feature flag (inexistant côté section).
- Pas de modification du mode `indicateur` de l'ancien widget.

## Étapes d'implémentation

1. Renommer `WidgetCartographieTA` → `WidgetCartographieTAAvecComparaison`
   (dossier, fichier, symbole, imports consommateurs).
2. Rendre les slots `children` et `footer` optionnels dans
   `BaseCartographieWidgetLayout` (si la vérification confirme que c'est
   nécessaire).
3. Créer le nouveau `WidgetCartographieTA` avec layout simplifié et
   navigation au clic sur un territoire.
4. Remplacer `SectionComparaisonTerritoires.tsx` par
   `SectionCartographieTA.tsx` et mettre à jour le parent + ancres.
5. `npm run lint` final.

## Fichiers impactés

- `src/client/components/_commons/Widget/WidgetCartographieTAAvecComparaison/**` (renommé depuis `WidgetCartographieTA/`)
- `src/client/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx` (nouveau)
- `src/client/components/_commons/Widget/BaseCartographieWidgetLayout.tsx` (slots optionnels, sous réserve vérif)
- `src/client/components/PageAccueil/sections/SectionCartographieTA.tsx` (nouveau)
- `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx` (supprimé)
- Consommateurs de l'ancien symbole (page indicateur, `PageAccueil.tsx`, etc.)
