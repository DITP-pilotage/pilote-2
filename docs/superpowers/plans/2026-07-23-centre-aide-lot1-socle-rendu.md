# Centre d'aide — Lot 1 : socle de rendu partagé (kpilote-ui) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fournir dans `packages/kpilote-ui` les composants de rendu DSFR des blocs du centre d'aide (Callout, Accordéon, Image, Icône, Vidéo), un registre de blocs source-de-vérité, et un renderer HTML→React sanitizé — réutilisables tels quels par l'éditeur (Lot 3) et le lecteur (Lot 4).

**Architecture:** Chaque bloc = un composant React (radix + maquillage DSFR via tokens `theme.css`) décrit une fois dans un **registre** (`type`, `data-type`, composant, lecture des attributs). Le renderer `RenduContenuCentreAide` parse le HTML stocké, le sanitize (DOMPurify) et mappe chaque `data-type` vers le composant du registre. Aucune dépendance tiptap/ProseMirror ici — le paquet reste consommable par la webapp Next.

**Tech Stack:** React 19, radix-ui, class-variance-authority, clsx + tailwind-merge (`clsxm`), lucide-react (registre d'icônes), dompurify, Tailwind v4 (tokens DSFR de `@pilote/kpilote-ui/theme.css`). Tests : vitest 4 + jsdom + @testing-library/react (à installer dans ce paquet).

## Global Constraints

- Style **DSFR** via les tokens de `packages/kpilote-ui/theme.css` (`bg-surface-tinted`, `text-primary`, `border-primary`, `bg-success-tinted`, `text-success`, `bg-warning-tinted`, `text-warning`, `bg-error-tinted`, `text-error`, etc.). **Jamais** de classes `fr-*` ni de couleurs flat en dur.
- Helper de classes : `clsxm` (`twMerge(clsx(...))`), jamais `cn`.
- Nommage : verbes/tech en anglais, entités métier en français (ex. `RenduContenuCentreAide`, `registreBlocs`).
- `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` activés : tout accès indexé/optionnel doit être gardé, les optionnels typés `| undefined`.
- Pas de commentaire superflu ; commentaire seulement pour une contrainte non lisible dans le code.
- Contrat HTML de sérialisation (partagé avec l'éditeur du Lot 3, à ne pas changer sans raison) :
  - Callout : `<div data-type="callout" data-color="info|success|warning|error">…texte…</div>`
  - Accordéon : `<div data-type="accordion-item" data-title="…">…contenu…</div>`
  - Image : `<img data-type="image" src="…" alt="…">`
  - Icône (inline) : `<span data-type="icone" data-icon-type="…"></span>`
  - Vidéo : `<div data-type="video" data-src="…"></div>`

---

### Task 1 : Installer l'infra de test dans `packages/kpilote-ui`

**Files:**
- Modify: `packages/kpilote-ui/package.json`
- Create: `packages/kpilote-ui/vitest.config.ts`
- Create: `packages/kpilote-ui/vitest.setup.ts`
- Create: `packages/kpilote-ui/src/centre-aide/smoke.test.tsx`

**Interfaces:**
- Consumes: rien.
- Produces: script `pnpm -F @pilote/kpilote-ui test` fonctionnel (vitest + jsdom + @testing-library/react), utilisé par toutes les tâches suivantes.

- [ ] **Step 1: Ajouter les devDependencies et le script test**

Dans `packages/kpilote-ui/package.json`, ajouter à `scripts` :
```json
"test": "vitest run",
"test:watch": "vitest"
```
Ajouter à `devDependencies` (versions alignées sur kpilote-webapp) :
```json
"vitest": "^4.1.9",
"jsdom": "^29.1.1",
"@testing-library/react": "^16.3.2",
"@testing-library/jest-dom": "^6.6.3",
"@vitejs/plugin-react": "^4.3.4",
"dompurify": "^3.2.4",
"@types/dompurify": "^3.2.0"
```
Ajouter `dompurify` aussi en `peerDependencies` (le renderer en a besoin chez le consommateur) :
```json
"dompurify": "^3.2.4"
```

- [ ] **Step 2: Écrire la config vitest**

Create `packages/kpilote-ui/vitest.config.ts` :
```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `packages/kpilote-ui/vitest.setup.ts` :
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Écrire un test smoke qui échoue (infra pas encore prouvée)**

Create `packages/kpilote-ui/src/centre-aide/smoke.test.tsx` :
```tsx
import { render, screen } from '@testing-library/react'

it('rend un noeud React sous jsdom', () => {
  render(<p>centre daide</p>)
  expect(screen.getByText('centre daide')).toBeInTheDocument()
})
```

- [ ] **Step 4: Installer et lancer**

Run : `pnpm install && pnpm -F @pilote/kpilote-ui test`
Expected : le test `smoke.test.tsx` PASSE (1 passed). Si `pnpm install` est nécessaire pour résoudre les nouvelles deps, le lancer d'abord.

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/package.json packages/kpilote-ui/vitest.config.ts packages/kpilote-ui/vitest.setup.ts packages/kpilote-ui/src/centre-aide/smoke.test.tsx pnpm-lock.yaml
git commit -m "test(kpilote-ui): ajoute vitest + jsdom + testing-library"
```

---

### Task 2 : Types & registre de blocs (source de vérité)

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/types.ts`
- Test: `packages/kpilote-ui/src/centre-aide/registreBlocs.test.ts` (créé en Task 8, après les composants)

**Interfaces:**
- Consumes: rien.
- Produces:
  - `type BlocCentreAideType = 'callout' | 'accordion-item' | 'image' | 'icone' | 'video'`
  - `type CalloutColor = 'info' | 'success' | 'warning' | 'error'`
  - `interface DescripteurBloc { type: BlocCentreAideType; dataType: string; rendreDepuisElement: (element: Element, rendreEnfants: (el: Element) => ReactNode) => ReactNode }`
  - `type RegistreBlocs = Record<string, DescripteurBloc>` (indexé par `dataType`)

- [ ] **Step 1: Écrire les types**

Create `packages/kpilote-ui/src/centre-aide/types.ts` :
```ts
import type { ReactNode } from 'react'

export type BlocCentreAideType = 'callout' | 'accordion-item' | 'image' | 'icone' | 'video'

export type CalloutColor = 'info' | 'success' | 'warning' | 'error'

export const COULEURS_CALLOUT: readonly CalloutColor[] = ['info', 'success', 'warning', 'error']

export type RendreEnfants = (element: Element) => ReactNode

export interface DescripteurBloc {
  type: BlocCentreAideType
  dataType: string
  rendreDepuisElement: (element: Element, rendreEnfants: RendreEnfants) => ReactNode
}

export type RegistreBlocs = Record<string, DescripteurBloc>
```

- [ ] **Step 2: Vérifier la compilation des types**

Run : `pnpm -F @pilote/kpilote-ui exec tsc --noEmit`
Expected : PASS (aucune erreur de type). Ce fichier n'a pas de test unitaire propre — il est couvert par `registreBlocs.test.ts` (Task 8).

- [ ] **Step 3: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/types.ts
git commit -m "feat(kpilote-ui): types du socle centre d'aide"
```

---

### Task 3 : Composant Callout DSFR

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/Callout.tsx`
- Test: `packages/kpilote-ui/src/centre-aide/Callout.test.tsx`

**Interfaces:**
- Consumes: `CalloutColor` (Task 2), `clsxm`.
- Produces: `Callout({ color?: CalloutColor; children: ReactNode; className?: string })` — encadré DSFR à bord gauche coloré + icône lucide.

- [ ] **Step 1: Écrire le test qui échoue**

Create `packages/kpilote-ui/src/centre-aide/Callout.test.tsx` :
```tsx
import { render, screen } from '@testing-library/react'
import { Callout } from './Callout'

it('affiche le contenu et applique la variante de couleur', () => {
  render(<Callout color="success">Bien joué</Callout>)
  const bloc = screen.getByText('Bien joué').closest('[data-color]')
  expect(bloc).toHaveAttribute('data-color', 'success')
})

it('utilise la couleur info par défaut', () => {
  render(<Callout>Info</Callout>)
  expect(screen.getByText('Info').closest('[data-color]')).toHaveAttribute('data-color', 'info')
})
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run : `pnpm -F @pilote/kpilote-ui test Callout`
Expected : FAIL — `Cannot find module './Callout'`.

- [ ] **Step 3: Implémenter le composant**

Create `packages/kpilote-ui/src/centre-aide/Callout.tsx` :
```tsx
import { Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { clsxm } from '../clsxm'
import type { CalloutColor } from './types'

const variantes: Record<
  CalloutColor,
  { conteneur: string; icone: string; Icone: ComponentType<{ className?: string }> }
> = {
  info: { conteneur: 'bg-surface-tinted border-l-primary', icone: 'text-primary', Icone: Info },
  success: {
    conteneur: 'bg-success-tinted border-l-success',
    icone: 'text-success',
    Icone: CircleCheck,
  },
  warning: {
    conteneur: 'bg-warning-tinted border-l-warning',
    icone: 'text-warning',
    Icone: TriangleAlert,
  },
  error: { conteneur: 'bg-error-tinted border-l-error', icone: 'text-error', Icone: CircleX },
}

export function Callout({
  color = 'info',
  children,
  className,
}: {
  color?: CalloutColor
  children: ReactNode
  className?: string
}) {
  const variante = variantes[color]
  return (
    <div
      data-color={color}
      className={clsxm('flex items-start gap-3 border-l-4 p-4', variante.conteneur, className)}
    >
      <variante.Icone className={clsxm('mt-0.5 size-5 shrink-0', variante.icone)} />
      <div className="flex-1 text-sm leading-relaxed [&_p]:mb-0">{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run : `pnpm -F @pilote/kpilote-ui test Callout`
Expected : PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/Callout.tsx packages/kpilote-ui/src/centre-aide/Callout.test.tsx
git commit -m "feat(kpilote-ui): composant Callout DSFR"
```

---

### Task 4 : Composant Accordéon DSFR

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/Accordeon.tsx`
- Test: `packages/kpilote-ui/src/centre-aide/Accordeon.test.tsx`

**Interfaces:**
- Consumes: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` de `../Collapsible` ; `clsxm`.
- Produces: `Accordeon({ titre: string; children: ReactNode; defaultOpen?: boolean; className?: string })` — titre cliquable + contenu repliable animé, chevron.

- [ ] **Step 1: Écrire le test qui échoue**

Create `packages/kpilote-ui/src/centre-aide/Accordeon.test.tsx` :
```tsx
import { render, screen } from '@testing-library/react'
import { Accordeon } from './Accordeon'

it('affiche le titre et le contenu', () => {
  render(
    <Accordeon titre="En savoir plus" defaultOpen>
      Détails ici
    </Accordeon>,
  )
  expect(screen.getByRole('button', { name: /en savoir plus/i })).toBeInTheDocument()
  expect(screen.getByText('Détails ici')).toBeInTheDocument()
})
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run : `pnpm -F @pilote/kpilote-ui test Accordeon`
Expected : FAIL — module introuvable.

- [ ] **Step 3: Implémenter le composant**

Create `packages/kpilote-ui/src/centre-aide/Accordeon.tsx` :
```tsx
import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../Collapsible'
import { clsxm } from '../clsxm'

export function Accordeon({
  titre,
  children,
  defaultOpen = false,
  className,
}: {
  titre: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  const [ouvert, setOuvert] = useState(defaultOpen)
  return (
    <Collapsible
      open={ouvert}
      onOpenChange={setOuvert}
      className={clsxm('border border-border rounded-md overflow-hidden', className)}
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 bg-surface-tinted p-4 text-left text-base font-medium hover:bg-surface-tinted-strong transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {titre}
        <ChevronDown className="size-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 pt-3 text-sm leading-relaxed [&_p]:mb-0">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run : `pnpm -F @pilote/kpilote-ui test Accordeon`
Expected : PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/Accordeon.tsx packages/kpilote-ui/src/centre-aide/Accordeon.test.tsx
git commit -m "feat(kpilote-ui): composant Accordeon DSFR"
```

---

### Task 5 : Registre d'icônes + composant Icône inline

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/registreIcones.ts`
- Create: `packages/kpilote-ui/src/centre-aide/IconeCentreAide.tsx`
- Test: `packages/kpilote-ui/src/centre-aide/IconeCentreAide.test.tsx`

**Interfaces:**
- Consumes: `lucide-react`, `clsxm`.
- Produces:
  - `registreIcones: Record<string, ComponentType<{ className?: string }>>` (clés stables : `info`, `success`, `warning`, `error`, `idea`, `flag`, `question`).
  - `type IconeType = keyof typeof registreIcones` (string élargi via `TYPES_ICONE`).
  - `IconeCentreAide({ type: string; className?: string })` — rend l'icône si connue, sinon `null`.

- [ ] **Step 1: Écrire le test qui échoue**

Create `packages/kpilote-ui/src/centre-aide/IconeCentreAide.test.tsx` :
```tsx
import { render } from '@testing-library/react'
import { IconeCentreAide } from './IconeCentreAide'

it('rend une icône connue', () => {
  const { container } = render(<IconeCentreAide type="info" />)
  expect(container.querySelector('svg')).not.toBeNull()
})

it('rend null pour un type inconnu', () => {
  const { container } = render(<IconeCentreAide type="zzz-inconnu" />)
  expect(container.querySelector('svg')).toBeNull()
})
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run : `pnpm -F @pilote/kpilote-ui test IconeCentreAide`
Expected : FAIL — module introuvable.

- [ ] **Step 3: Implémenter le registre puis le composant**

Create `packages/kpilote-ui/src/centre-aide/registreIcones.ts` :
```ts
import {
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  Lightbulb,
  Flag,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react'

export const registreIcones: Record<string, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  idea: Lightbulb,
  flag: Flag,
  question: CircleHelp,
}

export const TYPES_ICONE = Object.keys(registreIcones)
```

Create `packages/kpilote-ui/src/centre-aide/IconeCentreAide.tsx` :
```tsx
import { clsxm } from '../clsxm'
import { registreIcones } from './registreIcones'

export function IconeCentreAide({ type, className }: { type: string; className?: string }) {
  const Icone = registreIcones[type]
  if (!Icone) return null
  return <Icone className={clsxm('inline-block size-5 align-middle', className)} />
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run : `pnpm -F @pilote/kpilote-ui test IconeCentreAide`
Expected : PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/registreIcones.ts packages/kpilote-ui/src/centre-aide/IconeCentreAide.tsx packages/kpilote-ui/src/centre-aide/IconeCentreAide.test.tsx
git commit -m "feat(kpilote-ui): registre d'icônes + Icone inline"
```

---

### Task 6 : Composants Image et Vidéo

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/ImageCentreAide.tsx`
- Create: `packages/kpilote-ui/src/centre-aide/VideoCentreAide.tsx`
- Test: `packages/kpilote-ui/src/centre-aide/MediasCentreAide.test.tsx`

**Interfaces:**
- Consumes: `clsxm`.
- Produces:
  - `ImageCentreAide({ src: string; alt?: string; className?: string })`
  - `VideoCentreAide({ src: string; titre?: string; className?: string })` (embed iframe)

- [ ] **Step 1: Écrire le test qui échoue**

Create `packages/kpilote-ui/src/centre-aide/MediasCentreAide.test.tsx` :
```tsx
import { render, screen } from '@testing-library/react'
import { ImageCentreAide } from './ImageCentreAide'
import { VideoCentreAide } from './VideoCentreAide'

it('rend une image avec alt', () => {
  render(<ImageCentreAide src="https://x/y.png" alt="schéma" />)
  expect(screen.getByRole('img', { name: 'schéma' })).toHaveAttribute('src', 'https://x/y.png')
})

it('rend une iframe vidéo', () => {
  const { container } = render(<VideoCentreAide src="https://x/embed" titre="démo" />)
  const iframe = container.querySelector('iframe')
  expect(iframe).toHaveAttribute('src', 'https://x/embed')
})
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run : `pnpm -F @pilote/kpilote-ui test MediasCentreAide`
Expected : FAIL — modules introuvables.

- [ ] **Step 3: Implémenter les composants**

Create `packages/kpilote-ui/src/centre-aide/ImageCentreAide.tsx` :
```tsx
import { clsxm } from '../clsxm'

export function ImageCentreAide({
  src,
  alt = '',
  className,
}: {
  src: string
  alt?: string
  className?: string
}) {
  return <img src={src} alt={alt} className={clsxm('max-w-full rounded-md', className)} />
}
```

Create `packages/kpilote-ui/src/centre-aide/VideoCentreAide.tsx` :
```tsx
import { clsxm } from '../clsxm'

export function VideoCentreAide({
  src,
  titre,
  className,
}: {
  src: string
  titre?: string
  className?: string
}) {
  return (
    <div className={clsxm('aspect-video w-full overflow-hidden rounded-md', className)}>
      <iframe
        src={src}
        title={titre ?? 'Vidéo'}
        className="size-full"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run : `pnpm -F @pilote/kpilote-ui test MediasCentreAide`
Expected : PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/ImageCentreAide.tsx packages/kpilote-ui/src/centre-aide/VideoCentreAide.tsx packages/kpilote-ui/src/centre-aide/MediasCentreAide.test.tsx
git commit -m "feat(kpilote-ui): composants Image et Video centre d'aide"
```

---

### Task 7 : Registre de blocs (branche les composants au contrat HTML)

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/registreBlocs.tsx`
- Test: `packages/kpilote-ui/src/centre-aide/registreBlocs.test.tsx`

**Interfaces:**
- Consumes: `Callout`, `Accordeon`, `ImageCentreAide`, `VideoCentreAide`, `IconeCentreAide`, types Task 2.
- Produces: `registreBlocs: RegistreBlocs` — mappe chaque `data-type` vers `{ type, dataType, rendreDepuisElement }`. C'est LE point d'extension : ajouter un bloc = ajouter une entrée ici + son composant.

- [ ] **Step 1: Écrire le test qui échoue**

Create `packages/kpilote-ui/src/centre-aide/registreBlocs.test.tsx` :
```tsx
import { render } from '@testing-library/react'
import { registreBlocs } from './registreBlocs'

const elementDepuisHtml = (html: string): Element => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.firstElementChild as Element
}

it('déclare les 5 blocs indexés par data-type', () => {
  expect(Object.keys(registreBlocs).sort()).toEqual([
    'accordion-item',
    'callout',
    'icone',
    'image',
    'video',
  ])
})

it('rend un callout depuis son élément', () => {
  const element = elementDepuisHtml('<div data-type="callout" data-color="warning">Attention</div>')
  const { container } = render(<>{registreBlocs['callout']!.rendreDepuisElement(element, () => element.textContent)}</>)
  expect(container.querySelector('[data-color="warning"]')).not.toBeNull()
  expect(container.textContent).toContain('Attention')
})

it('rend un accordéon avec son titre', () => {
  const element = elementDepuisHtml('<div data-type="accordion-item" data-title="Aide">Contenu</div>')
  const { getByRole } = render(<>{registreBlocs['accordion-item']!.rendreDepuisElement(element, () => element.textContent)}</>)
  expect(getByRole('button', { name: /aide/i })).not.toBeNull()
})
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run : `pnpm -F @pilote/kpilote-ui test registreBlocs`
Expected : FAIL — module introuvable.

- [ ] **Step 3: Implémenter le registre**

Create `packages/kpilote-ui/src/centre-aide/registreBlocs.tsx` :
```tsx
import { Accordeon } from './Accordeon'
import { Callout } from './Callout'
import { IconeCentreAide } from './IconeCentreAide'
import { ImageCentreAide } from './ImageCentreAide'
import { VideoCentreAide } from './VideoCentreAide'
import { COULEURS_CALLOUT, type CalloutColor, type RegistreBlocs } from './types'

const lireCouleur = (element: Element): CalloutColor => {
  const brut = element.getAttribute('data-color')
  return COULEURS_CALLOUT.includes(brut as CalloutColor) ? (brut as CalloutColor) : 'info'
}

export const registreBlocs: RegistreBlocs = {
  callout: {
    type: 'callout',
    dataType: 'callout',
    rendreDepuisElement: (element, rendreEnfants) => (
      <Callout color={lireCouleur(element)}>{rendreEnfants(element)}</Callout>
    ),
  },
  'accordion-item': {
    type: 'accordion-item',
    dataType: 'accordion-item',
    rendreDepuisElement: (element, rendreEnfants) => (
      <Accordeon titre={element.getAttribute('data-title') ?? 'Titre'}>
        {rendreEnfants(element)}
      </Accordeon>
    ),
  },
  image: {
    type: 'image',
    dataType: 'image',
    rendreDepuisElement: (element) => (
      <ImageCentreAide
        src={element.getAttribute('src') ?? ''}
        alt={element.getAttribute('alt') ?? ''}
      />
    ),
  },
  icone: {
    type: 'icone',
    dataType: 'icone',
    rendreDepuisElement: (element) => (
      <IconeCentreAide type={element.getAttribute('data-icon-type') ?? 'info'} />
    ),
  },
  video: {
    type: 'video',
    dataType: 'video',
    rendreDepuisElement: (element) => (
      <VideoCentreAide src={element.getAttribute('data-src') ?? ''} />
    ),
  },
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run : `pnpm -F @pilote/kpilote-ui test registreBlocs`
Expected : PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/registreBlocs.tsx packages/kpilote-ui/src/centre-aide/registreBlocs.test.tsx
git commit -m "feat(kpilote-ui): registre de blocs centre d'aide"
```

---

### Task 8 : Renderer `RenduContenuCentreAide` (HTML→React sanitizé)

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/RenduContenuCentreAide.tsx`
- Test: `packages/kpilote-ui/src/centre-aide/RenduContenuCentreAide.test.tsx`

**Interfaces:**
- Consumes: `registreBlocs` (Task 7), `dompurify`.
- Produces: `RenduContenuCentreAide({ html: string; className?: string })` — parse, sanitize (en conservant `data-type`/`data-color`/`data-title`/`data-icon-type`/`data-src`), et mappe via le registre ; `classesRenduBase` (typographie DSFR de base). Retourne `null` si `html` vide.

- [ ] **Step 1: Écrire le test qui échoue**

Create `packages/kpilote-ui/src/centre-aide/RenduContenuCentreAide.test.tsx` :
```tsx
import { render, screen } from '@testing-library/react'
import { RenduContenuCentreAide } from './RenduContenuCentreAide'

it('rend le HTML riche standard', () => {
  render(<RenduContenuCentreAide html="<p>Bonjour</p><ul><li>un</li></ul>" />)
  expect(screen.getByText('Bonjour')).toBeInTheDocument()
  expect(screen.getByText('un')).toBeInTheDocument()
})

it('mappe un callout via le registre', () => {
  const { container } = render(
    <RenduContenuCentreAide html='<div data-type="callout" data-color="success">OK</div>' />,
  )
  expect(container.querySelector('[data-color="success"]')).not.toBeNull()
})

it('neutralise le script injecté mais garde le texte', () => {
  const { container } = render(
    <RenduContenuCentreAide html='<p>sain</p><script>alert(1)</script>' />,
  )
  expect(container.querySelector('script')).toBeNull()
  expect(container.textContent).toContain('sain')
})

it('retourne null pour un html vide', () => {
  const { container } = render(<RenduContenuCentreAide html="" />)
  expect(container.firstChild).toBeNull()
})
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run : `pnpm -F @pilote/kpilote-ui test RenduContenuCentreAide`
Expected : FAIL — module introuvable.

- [ ] **Step 3: Implémenter le renderer**

Create `packages/kpilote-ui/src/centre-aide/RenduContenuCentreAide.tsx` :
```tsx
import DOMPurify from 'dompurify'
import { createElement, Fragment, type ReactNode } from 'react'

import { clsxm } from '../clsxm'
import { registreBlocs } from './registreBlocs'

export const classesRenduBase =
  '[&_p]:mb-3 [&_a]:text-primary [&_a]:underline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:italic [&_hr]:my-4 [&>*+*]:mt-2'

const ATTRS_DATA = ['data-type', 'data-color', 'data-title', 'data-icon-type', 'data-src']

const rendreEnfants = (element: Element): ReactNode =>
  Array.from(element.childNodes).map((enfant, index) => (
    <Fragment key={index}>{rendreNoeud(enfant)}</Fragment>
  ))

const rendreNoeud = (noeud: Node): ReactNode => {
  if (noeud.nodeType === Node.TEXT_NODE) return noeud.textContent
  if (noeud.nodeType !== Node.ELEMENT_NODE) return null

  const element = noeud as Element
  const dataType = element.getAttribute('data-type')
  if (dataType && registreBlocs[dataType]) {
    return registreBlocs[dataType].rendreDepuisElement(element, rendreEnfants)
  }

  const tag = element.tagName.toLowerCase()
  const props: Record<string, unknown> = {}
  for (const attr of Array.from(element.attributes)) {
    if (attr.name === 'class') props.className = attr.value
    else if (attr.name === 'data-type') continue
    else props[attr.name] = attr.value
  }
  if (tag === 'br' || tag === 'img' || tag === 'hr') {
    return createElement(tag, props)
  }
  return createElement(tag, props, ...rendreEnfants(element))
}

export function RenduContenuCentreAide({
  html,
  className,
}: {
  html: string
  className?: string
}) {
  if (!html) return null
  const propre = DOMPurify.sanitize(html, { ADD_ATTR: ATTRS_DATA })
  const doc = new DOMParser().parseFromString(propre, 'text/html')
  return <div className={clsxm(classesRenduBase, className)}>{rendreEnfants(doc.body)}</div>
}
```

- [ ] **Step 4: Lancer le test (succès attendu)**

Run : `pnpm -F @pilote/kpilote-ui test RenduContenuCentreAide`
Expected : PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/RenduContenuCentreAide.tsx packages/kpilote-ui/src/centre-aide/RenduContenuCentreAide.test.tsx
git commit -m "feat(kpilote-ui): renderer HTML→React sanitizé du centre d'aide"
```

---

### Task 9 : Barrel + export public du sous-module

**Files:**
- Create: `packages/kpilote-ui/src/centre-aide/index.ts`
- Modify: `packages/kpilote-ui/package.json` (ajout de l'export `./centre-aide`)
- Delete: `packages/kpilote-ui/src/centre-aide/smoke.test.tsx` (l'infra est prouvée par les vrais tests)

**Interfaces:**
- Consumes: tout le sous-module.
- Produces: import public `@pilote/kpilote-ui/centre-aide` exposant `RenduContenuCentreAide`, `classesRenduBase`, `Callout`, `Accordeon`, `ImageCentreAide`, `VideoCentreAide`, `IconeCentreAide`, `registreBlocs`, `registreIcones`, `TYPES_ICONE`, et les types.

- [ ] **Step 1: Écrire le barrel**

Create `packages/kpilote-ui/src/centre-aide/index.ts` :
```ts
export { RenduContenuCentreAide, classesRenduBase } from './RenduContenuCentreAide'
export { Callout } from './Callout'
export { Accordeon } from './Accordeon'
export { ImageCentreAide } from './ImageCentreAide'
export { VideoCentreAide } from './VideoCentreAide'
export { IconeCentreAide } from './IconeCentreAide'
export { registreBlocs } from './registreBlocs'
export { registreIcones, TYPES_ICONE } from './registreIcones'
export {
  COULEURS_CALLOUT,
  type BlocCentreAideType,
  type CalloutColor,
  type DescripteurBloc,
  type RegistreBlocs,
} from './types'
```

- [ ] **Step 2: Ajouter l'export subpath dans package.json**

Dans `packages/kpilote-ui/package.json`, ajouter à `exports` :
```json
"./centre-aide": {
  "types": "./src/centre-aide/index.ts",
  "default": "./src/centre-aide/index.ts"
}
```

- [ ] **Step 3: Supprimer le smoke test devenu inutile**

Run : `git rm packages/kpilote-ui/src/centre-aide/smoke.test.tsx`

- [ ] **Step 4: Lancer toute la suite + typecheck**

Run : `pnpm -F @pilote/kpilote-ui test && pnpm -F @pilote/kpilote-ui exec tsc --noEmit`
Expected : tous les tests du dossier `centre-aide` PASSENT, typecheck OK.

- [ ] **Step 5: Commit**

```bash
git add packages/kpilote-ui/src/centre-aide/index.ts packages/kpilote-ui/package.json
git commit -m "feat(kpilote-ui): export public @pilote/kpilote-ui/centre-aide"
```

---

## Self-Review

**Spec coverage (Lot 1) :**
- Composants DSFR Callout / Accordéon / Image / Icône / Vidéo → Tasks 3, 4, 5, 6. ✓
- Registre source-de-vérité (ajout d'un bloc = un endroit) → Task 7 (+ registreIcones Task 5). ✓
- Renderer HTML→React sanitizé partagé → Task 8. ✓
- Réutilisable par admin (Lot 3) et webapp (Lot 4), sans dépendance tiptap → export `./centre-aide` Task 9, aucune dép ProseMirror. ✓
- Infra de test pérenne dans kpilote-ui → Task 1. ✓
- `htmlToPlainText` : **hors Lot 1** (dérivation côté API, traité au Lot 2). Noté, pas un manque.

**Placeholder scan :** aucun TODO/TBD ; chaque étape de code porte le code complet.

**Type consistency :** `DescripteurBloc.rendreDepuisElement(element, rendreEnfants)` défini en Task 2, consommé identiquement en Tasks 7 et 8 ; `RegistreBlocs` indexé par `dataType` (string) avec garde `registreBlocs[dataType]` sous `noUncheckedIndexedAccess` ; `CalloutColor` cohérent entre Task 2/3/7.

**Dépendances entre tâches :** Task 1 (infra) → 2 (types) → 3/4/5/6 (composants, parallélisables) → 7 (registre) → 8 (renderer) → 9 (export). Ordre strict pour 1,2,7,8,9 ; 3–6 indépendantes entre elles.

## Suite

Lots suivants (plans dédiés à écrire ensuite) :
- **Lot 2** — kpilote-api : modèle Prisma `article_centre_aide` + migration, module `centreAide` (routes admin gardées `ensurePrincipal(isApiKeyAdmin)` + endpoint public), `htmlToPlainText` durci, schémas `@pilote/kpilote-shared/centreAide`.
- **Lot 3** — kpilote-admin : infra de test (vitest+jsdom), deps tiptap, extensions via fabrique (réutilisant les composants du Lot 1 en NodeView), éditeur « en place » (bulle A1 + menu / A2), arbo, couche data/queries, route + carte hub, extension allowlist BFF.
- **Lot 4** — kpilote-webapp : lien footer + page lecteur basique consommant `@pilote/kpilote-ui/centre-aide`.
