# Composant `Button` (Radix Slot + cva) et thème sémantique Tailwind (mb-webapp)

## Contexte

`mb-webapp` est une SPA React 19 + TanStack Router avec Tailwind 4 (configuration purement CSS via `@import 'tailwindcss'` dans `src/index.css`, sans `tailwind.config.js`). Aujourd'hui, les boutons sont écrits inline avec des classes utilitaires brutes (`bg-slate-900`, `border-slate-300`, etc.). Cela entraîne :

- Duplication des combinaisons de classes pour les mêmes rôles d'action.
- Incohérences (un bouton utilise `gray-*` au lieu de `slate-*` dans `login-error.tsx`, certains `rounded-md` vs `rounded`).
- Aucune sémantique : impossible de savoir au premier coup d'œil ce qu'est un "bouton primaire" vs un "secondaire".

Inventaire des boutons existants au moment du design :

| Fichier | Élément | Classes |
|---|---|---|
| `src/routes/__root.tsx` | bouton "Se déconnecter" | outline (slate-300 border) |
| `src/routes/__root.tsx` | bouton "Se connecter" | primary (slate-900 bg) |
| `src/routes/index.tsx` | `<Link>` "Voir les indicateurs" | primary (slate-900 bg) |
| `src/routes/index.tsx` | bouton "Se connecter" | outline |
| `src/routes/login-error.tsx` | bouton "Se déconnecter" | primary (gray-900, rounded-md) |
| `src/routes/_authenticated/indicateurs/index.tsx` | bouton "Page suivante" | outline |

## Objectif

1. Introduire un thème sémantique Tailwind (tokens `primary`, `secondary`, `tertiary`, `disabled`, etc.) défini dans `src/index.css` via la directive `@theme` de Tailwind 4.
2. Créer un composant `Button` réutilisable basé sur `@radix-ui/react-slot` (pattern `asChild`) avec variants typés via `class-variance-authority`.
3. Migrer les 6 usages existants (5 boutons + 1 lien stylé en bouton) pour consommer le composant et les tokens.

## Hors-scope

- Composants UI autres que `Button` (à proposer ensuite).
- Tests unitaires du composant (suit la convention actuelle de `src/components/`).
- Refactor des couleurs ailleurs que dans les fichiers touchés par la migration.
- États `loading` custom — pas d'usage actuel.
- Variant `destructive` — pas d'usage actuel.

## Architecture

### Thème sémantique (`src/index.css`)

Tailwind 4 expose les variables CSS définies dans `@theme` comme classes utilitaires automatiquement (`--color-primary` → `bg-primary`, `text-primary`, `border-primary`).

```css
@import 'tailwindcss';

@theme {
  /* Surfaces / texte généraux */
  --color-background: var(--color-slate-50);
  --color-surface: #fff;
  --color-border: var(--color-slate-200);
  --color-text: var(--color-slate-900);
  --color-text-muted: var(--color-slate-600);

  /* Action primary — CTA principal */
  --color-primary: var(--color-slate-900);
  --color-primary-hover: var(--color-slate-700);
  --color-primary-foreground: #fff;

  /* Action secondary — bouton outline */
  --color-secondary: #fff;
  --color-secondary-hover: var(--color-slate-100);
  --color-secondary-foreground: var(--color-slate-700);
  --color-secondary-border: var(--color-slate-300);

  /* Action tertiary — ghost */
  --color-tertiary-hover: var(--color-slate-100);
  --color-tertiary-foreground: var(--color-slate-700);

  /* État disabled — commun à tous les variants */
  --color-disabled: var(--color-slate-200);
  --color-disabled-foreground: var(--color-slate-400);
}
```

Règle d'usage : à partir de cette PR, les couleurs du design system se réfèrent aux tokens (`bg-primary`, `text-text-muted`, `border-border`). Les classes brutes (`bg-slate-900`) restent autorisées hors design system (badge ad-hoc, panneau diagnostic, etc.) tant qu'elles ne représentent pas un rôle sémantique.

### Composant `Button` (`src/components/ui/Button.tsx`)

Stack :
- `@radix-ui/react-slot` — pattern `asChild` pour rendre le composant polymorphe (`<Button asChild><Link/></Button>`).
- `class-variance-authority` (cva) — variants typés.
- `clsx` + `tailwind-merge` via un helper `cn()` partagé — fusion propre des classes (override possible via `className`).

API :
```tsx
<Button>Se connecter</Button>
<Button variant="secondary" size="sm">Page suivante</Button>
<Button asChild><Link to="/indicateurs">Voir les indicateurs</Link></Button>
<Button>
  <PlusIcon /> Ajouter
</Button>
```

Variants :
- `primary` (default) — `bg-primary text-primary-foreground hover:bg-primary-hover`
- `secondary` — `bg-secondary text-secondary-foreground border border-secondary-border hover:bg-secondary-hover`
- `tertiary` — `text-tertiary-foreground hover:bg-tertiary-hover` (ghost, pas de bordure)

Tailles :
- `sm` — `px-3 py-1 text-sm`
- `md` (default) — `px-4 py-2 text-sm`

Classes communes (cva `base`) :
- `inline-flex items-center justify-center gap-2 rounded font-medium`
- `transition-colors`
- `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`
- `disabled:bg-disabled disabled:text-disabled-foreground disabled:cursor-not-allowed disabled:hover:bg-disabled disabled:border-disabled`
- Icônes Lucide : `[&_svg]:size-4 [&_svg]:shrink-0`

### Helper `cn` (`src/lib/cn.ts`)

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### Dépendances ajoutées (`apps/mb-webapp/package.json`)

- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`

## Migration

Les 6 usages existants sont migrés vers `<Button>` :

| Fichier | Avant | Après |
|---|---|---|
| `src/routes/__root.tsx` | bouton "Se déconnecter" outline | `<Button variant="secondary" size="sm">` |
| `src/routes/__root.tsx` | bouton "Se connecter" primary | `<Button size="sm">` |
| `src/routes/index.tsx` | `<Link>` "Voir les indicateurs" stylé | `<Button asChild><Link>...</Link></Button>` |
| `src/routes/index.tsx` | bouton "Se connecter" outline | `<Button variant="secondary">` |
| `src/routes/login-error.tsx` | bouton "Se déconnecter" (gray-900, rounded-md) | `<Button>` (harmonisé sur slate via tokens, `rounded`) |
| `src/routes/_authenticated/indicateurs/index.tsx` | bouton "Page suivante" outline | `<Button variant="secondary" size="sm">` |

Dans les fichiers touchés ci-dessus, les couleurs neutres ad-hoc (`bg-slate-50`, `text-slate-600`, `border-slate-200`) sont aussi migrées vers les tokens (`bg-background`, `text-text-muted`, `border-border`) pour rester cohérent. Les zones diagnostic / pre / badges colorés (vert, bleu) ne sont pas touchées (pas de rôle sémantique défini).

## Validation

- `pnpm --filter @pilote/mb-webapp lint` passe.
- Vérification visuelle dans le navigateur : les 4 routes touchées (`/`, `/login-error`, `/indicateurs`, header global) rendent les boutons sans régression visuelle apparente.
- `<Button asChild>` sur le `<Link>` "Voir les indicateurs" préserve la navigation TanStack Router (pas de full reload).
