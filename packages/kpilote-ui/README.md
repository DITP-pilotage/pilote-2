# @pilote/kpilote-ui

Bibliothèque de composants React partagée par [kpilote-webapp](../../apps/kpilote-webapp) et [kpilote-admin](../../apps/kpilote-admin), avec le thème Tailwind commun (tokens inspirés du DSFR : Bleu République, typographie Marianne).

Le package n'est ni buildé ni publié : les apps consomment directement les sources TypeScript via le workspace pnpm.

## Utilisation

Ajouter la dépendance dans l'app :

```json
"@pilote/kpilote-ui": "workspace:*"
```

Importer le thème **après** Tailwind et déclarer les sources du package pour que Tailwind ne purge pas leurs classes :

```css
@import 'tailwindcss';
@import '@pilote/kpilote-ui/theme.css';

@source '../../../packages/kpilote-ui/src';
```

Chaque composant est exposé par un point d'entrée dédié (pas de barrel global) :

```tsx
import { Button } from '@pilote/kpilote-ui/Button'
import { clsxm } from '@pilote/kpilote-ui/clsxm'
import { RenduContenuCentreAide } from '@pilote/kpilote-ui/centre-aide'
```

## Contenu

| Catégorie     | Composants                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actions       | `Button`, `IconButton`, `CopyButton`, `BackLink`                                                                                                                   |
| Formulaires   | `Field`, `FieldInput`, `FieldSelect`, `FieldTextarea`, `Select`, `SearchField`, `Picker`, `PickerOptionNomId`, `SegmentedControl`, `SegmentedField`, `MultiToggle` |
| Mise en page  | `Page`, `Section`, `Card`, `CardGrid`, `EntityCard`, `StatCard`, `StatGrid`, `DescriptionList`, `Typography`, `Subtitle`                                           |
| Données       | `Table`, `DataTable`, `Pagination`, `ProgressBar`, `Pill`, `EmptyState`                                                                                            |
| Surcouches    | `Dialog`, `Modale`, `ModaleForm`, `DropdownMenu`, `Toast`                                                                                                          |
| Divulgation   | `Accordeon`, `Collapsible`, `Tabs`                                                                                                                                 |
| Divers        | `Callout`, `FadeIn`, `Marianne`, `clsxm`                                                                                                                           |
| Centre d'aide | `centre-aide` : rendu des contenus (`RenduContenuCentreAide`), registres de blocs et d'icônes, images et vidéos                                                    |

`clsxm` combine `clsx` et `tailwind-merge`.

## Conventions

- **Composants génériques uniquement** : pas de logique métier ni d'appel API. La logique pure partagée va dans [`@pilote/kpilote-shared`](../kpilote-shared).
- Un fichier par composant, à plat dans `src/`, avec son entrée dans `exports` du `package.json`.
- Styles en Tailwind avec les tokens de `theme.css` : pas de couleurs en dur ni de classes DSFR (`fr-*`).
- Primitives d'accessibilité fournies par **Radix UI**, variantes par **class-variance-authority**.

## Ajouter un composant

1. Créer `src/MonComposant.tsx`.
2. Déclarer l'entrée dans `package.json` :
   ```json
   "./MonComposant": {
     "types": "./src/MonComposant.tsx",
     "default": "./src/MonComposant.tsx"
   }
   ```
3. Si le composant utilise une nouvelle librairie, l'ajouter en `peerDependencies` (et en `devDependencies` pour les tests), puis dans les apps consommatrices.

## Commandes

```bash
pnpm -F @pilote/kpilote-ui test     # Vitest (jsdom + Testing Library)
pnpm -F @pilote/kpilote-ui lint     # oxlint + tsc + prettier
pnpm -F @pilote/kpilote-ui format
```
