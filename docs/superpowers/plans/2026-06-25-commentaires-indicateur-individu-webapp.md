# Commentaires sur indicateur individu (webapp) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un onglet « Commentaires » sur la page indicateur de `mb-webapp`, permettant de lister / créer / éditer / publier des commentaires (texte riche tiptap) pour un individu, avec un sous-volet « Météo & synthèse » (indice de confiance) et un sous-volet « Autres commentaires ».

**Architecture:** SPA TanStack Router + React Query + ky. On introduit la première couche d'écriture (mutations + invalidation), un éditeur riche tiptap, un wrapper Toast et un wrapper DropdownMenu (radix). Les cartes réutilisent au maximum `components/ui/`. Un petit changement backend (`mb-api`) rend la météo des brouillons lisible.

**Tech Stack:** React 19, TanStack Router/Query v5, ky, radix-ui, tiptap 3.22.3, Tailwind v4 (tokens DSFR), lucide-react, zod, `@pilote/mb-shared`.

**Conventions projet :** pnpm uniquement. Pas de tests front automatisés (vérification via `pnpm -F @pilote/mb-webapp lint`). Verbes/tech en anglais, entités en français. `clsxm` pour composer les classes. Pas de couleurs flat (tokens du thème). Lancer le lint avant chaque commit.

**Référence design :** `docs/superpowers/specs/2026-06-24-commentaires-indicateur-individu-webapp-design.md` + maquette `.superpowers/brainstorm/45111-1782313525/content/option-a-v7.html`.

**Mapping météo ↔ indice (présentation front) :**
`OBJECTIF_COMPROMIS`→Orage(`CloudLightning`), `APPUIS_NECESSAIRE`→Couvert(`Cloud`), `OBJECTIF_ATTEIGNABLE`→Nuage(`CloudSun`), `OBJECTIF_SECURISE`→Soleil(`Sun`).

---

## Task 1: Dépendances tiptap + tokens de statut

**Files:**
- Modify: `apps/mb-webapp/package.json` (deps, via pnpm)
- Modify: `apps/mb-webapp/src/index.css` (tokens `@theme`)

- [ ] **Step 1: Ajouter les dépendances tiptap (versions alignées sur pilote-ppg)**

Run :
```bash
pnpm -F @pilote/mb-webapp add @tiptap/core@3.22.3 @tiptap/react@3.22.3 @tiptap/pm@3.22.3 @tiptap/starter-kit@3.22.3 @tiptap/extension-link@3.22.3 @tiptap/extension-underline@3.22.3 @tiptap/extension-placeholder@3.22.3
```

- [ ] **Step 2: Ajouter les tokens de statut DSFR dans `index.css`**

Dans `apps/mb-webapp/src/index.css`, à l'intérieur du bloc `@theme { … }`, juste après les lignes `--color-accent-*` (autour de la ligne 47), ajouter :

```css
  /* Statuts (sémantique DSFR) */
  --color-success: #18753c;
  --color-success-tinted: #e3fbe9;
  --color-warning: #b34000;
  --color-warning-tinted: #fff4e6;
```

- [ ] **Step 3: Vérifier le build des tokens + l'install**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS (tsc/eslint/prettier OK ; les nouvelles deps résolues).

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/package.json pnpm-lock.yaml apps/mb-webapp/src/index.css
git commit -m "chore(mb-webapp): ajout tiptap et tokens de statut DSFR"
```

---

## Task 2: Wrapper Toast (radix) + montage

**Files:**
- Create: `apps/mb-webapp/src/components/ui/Toast.tsx`
- Modify: `apps/mb-webapp/src/main.tsx`

- [ ] **Step 1: Créer le composant Toast + provider + hook**

Create `apps/mb-webapp/src/components/ui/Toast.tsx` :

```tsx
import { Toast as ToastPrimitive } from 'radix-ui'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type ToastVariant = 'success' | 'error'
type ToastInput = { title: ReactNode; description?: ReactNode; variant?: ToastVariant }
type ToastItem = ToastInput & { id: number; variant: ToastVariant }

const ToastContext = createContext<(input: ToastInput) => void>(() => undefined)

export const useToast = () => useContext(ToastContext)

let nextToastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    nextToastId += 1
    setToasts((prev) => [...prev, { variant: 'success', ...input, id: nextToastId }])
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            onOpenChange={(open) => {
              if (!open) remove(item.id)
            }}
            className={clsxm(
              'flex items-start gap-3 rounded-lg border bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
              item.variant === 'success' ? 'border-success/30' : 'border-accent-rouge/30',
            )}
          >
            <span
              className={clsxm(
                'mt-0.5 shrink-0',
                item.variant === 'success' ? 'text-success' : 'text-accent-rouge',
              )}
              aria-hidden
            >
              {item.variant === 'success' ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <XCircle className="size-5" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-text">
                {item.title}
              </ToastPrimitive.Title>
              {item.description && (
                <ToastPrimitive.Description className="text-sm text-text-muted">
                  {item.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className="shrink-0 text-text-subtle transition-colors hover:text-text"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-96 max-w-[100vw] flex-col gap-3 p-6 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
```

- [ ] **Step 2: Monter le provider dans `main.tsx`**

Dans `apps/mb-webapp/src/main.tsx`, ajouter l'import et envelopper `RouterProvider` :

```tsx
import { ToastProvider } from '@/components/ui/Toast'
```

Remplacer le bloc `root.render(...)` par :

```tsx
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
```

- [ ] **Step 3: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/src/components/ui/Toast.tsx apps/mb-webapp/src/main.tsx
git commit -m "feat(mb-webapp): wrapper Toast (radix) + montage global"
```

---

## Task 3: Wrapper DropdownMenu (radix)

**Files:**
- Create: `apps/mb-webapp/src/components/ui/DropdownMenu.tsx`

- [ ] **Step 1: Créer le wrapper**

Create `apps/mb-webapp/src/components/ui/DropdownMenu.tsx` :

```tsx
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = 'end',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={clsxm(
          'z-50 min-w-44 overflow-hidden rounded-lg border border-border bg-surface p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={clsxm(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text outline-none',
        'data-[highlighted]:bg-surface-tinted data-[highlighted]:text-primary',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-webapp/src/components/ui/DropdownMenu.tsx
git commit -m "feat(mb-webapp): wrapper DropdownMenu (radix)"
```

---

## Task 4: Éditeur de texte riche (tiptap)

**Files:**
- Create: `apps/mb-webapp/src/components/editeur-riche/MenuBar.tsx`
- Create: `apps/mb-webapp/src/components/editeur-riche/EditeurRiche.tsx`
- Create: `apps/mb-webapp/src/components/editeur-riche/RenduContenuHtml.tsx`

> Inspiré de `apps/pilote-ppg/src/client/components/_commons/EditeurRiche/EditeurSimple.tsx` (même version tiptap 3.22.3) pour éviter les soucis de duplication d'extensions : on reprend exactement sa configuration `StarterKit` + `Link` + `Underline`.

- [ ] **Step 1: MenuBar**

Create `apps/mb-webapp/src/components/editeur-riche/MenuBar.tsx` :

```tsx
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { clsxm } from '@/lib/clsxm'

function BoutonOutil({
  actif = false,
  onClick,
  label,
  Icon,
}: {
  actif?: boolean
  onClick: () => void
  label: string
  Icon: ComponentType<{ className?: string }>
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={actif}
      title={label}
      onClick={onClick}
      className={clsxm(
        'flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-tinted hover:text-text',
        actif && 'bg-primary-tinted text-primary',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

export function MenuBar({ editor }: { editor: Editor }) {
  const definirLien = () => {
    const precedent = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien', precedent ?? '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface-tinted px-2 py-1.5">
      <BoutonOutil
        label="Gras"
        Icon={Bold}
        actif={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <BoutonOutil
        label="Italique"
        Icon={Italic}
        actif={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <BoutonOutil
        label="Souligné"
        Icon={UnderlineIcon}
        actif={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <BoutonOutil
        label="Barré"
        Icon={Strikethrough}
        actif={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <BoutonOutil
        label="Liste à puces"
        Icon={List}
        actif={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <BoutonOutil
        label="Liste numérotée"
        Icon={ListOrdered}
        actif={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <BoutonOutil label="Lien" Icon={Link2} actif={editor.isActive('link')} onClick={definirLien} />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <BoutonOutil
        label="Annuler"
        Icon={Undo2}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <BoutonOutil
        label="Rétablir"
        Icon={Redo2}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}
```

- [ ] **Step 2: EditeurRiche**

Create `apps/mb-webapp/src/components/editeur-riche/EditeurRiche.tsx` :

```tsx
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { MenuBar } from '@/components/editeur-riche/MenuBar'

type EditeurRicheProps = {
  contenu: string
  onChange: (contenu: string) => void
  placeholder?: string
}

export function EditeurRiche({ contenu, onChange, placeholder }: EditeurRicheProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? 'Saisissez votre commentaire…' }),
    ],
    content: contenu,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.isEmpty ? '' : instance.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-md border border-primary ring-2 ring-primary-tinted">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="px-4 py-3 text-sm leading-relaxed text-text [&_.ProseMirror]:min-h-28 [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_p-is-editor-empty:first-child]:before:text-text-subtle [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_.is-editor-empty:first-child]:before:text-text-subtle [&_.ProseMirror_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
      />
    </div>
  )
}
```

- [ ] **Step 3: RenduContenuHtml (lecture seule)**

Create `apps/mb-webapp/src/components/editeur-riche/RenduContenuHtml.tsx` :

```tsx
import type { Ref } from 'react'

import { Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'

const classesRendu =
  '[&_p]:my-0 [&_p+p]:mt-2 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5'

export function RenduContenuHtml({
  html,
  className,
  ref,
}: {
  html: string
  className?: string
  ref?: Ref<HTMLDivElement>
}) {
  if (!html) {
    return (
      <Text tone="muted" className={className}>
        Aucun contenu.
      </Text>
    )
  }
  return (
    <div
      ref={ref}
      className={clsxm(classesRendu, className)}
      // Contenu produit par tiptap (marks/nodes restreints), saisi par des
      // rédacteurs authentifiés du périmètre.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

- [ ] **Step 4: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-webapp/src/components/editeur-riche
git commit -m "feat(mb-webapp): éditeur de texte riche tiptap (simple) + rendu lecture"
```

---

## Task 5: Backend — exposer la météo des brouillons

**Files:**
- Modify: `apps/mb-api/src/niveauConfiance/queries/listerHistoriqueNiveauConfiance.ts`
- Test: `apps/mb-api/src/niveauConfiance/queries/listerHistoriqueNiveauConfiance.test.ts`

> On retire le filtre `statut: 'PUBLIE'` pour que l'historique des niveaux couvre **tous** les commentaires du périmètre (brouillons inclus), afin que la webapp puisse afficher la météo d'un brouillon. `getNiveauConfianceCourant` reste inchangé.

- [ ] **Step 1: Mettre à jour le test (comportement attendu)**

Dans `apps/mb-api/src/niveauConfiance/queries/listerHistoriqueNiveauConfiance.test.ts`, généraliser le helper pour accepter un statut, et ajouter un cas couvrant l'inclusion d'un niveau sur brouillon. Remplacer le helper `creerNcSur` et ajouter le test :

```ts
const creerNcSur = async (
  apiKeyId: string,
  params: { indicateurId: string; individuId: string },
  indice: IndiceConfiance,
  statut: 'BROUILLON' | 'PUBLIE' = 'PUBLIE',
) => {
  const commentaire = await runAsPrincipal(apiKeyId, () =>
    creerIndicateurIndividuCommentaire({
      params,
      body: { type: 'CONFIANCE', contenu: '', statut },
    }),
  )
  return runAsPrincipal(apiKeyId, () =>
    creerNiveauConfiance({
      commentaireId: commentaire._unsafeUnwrap().id,
      indice,
    }),
  )
}
```

Puis ajouter, dans le `describe`, ce nouveau test :

```ts
  it(
    'inclut les niveaux des brouillons (filtre publié retiré)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indivId = testIndividuId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({ publicId: indivId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.WRITE }],
      })
      const params = { indicateurId: indId, individuId: indivId }
      await creerNcSur(apiKey.id, params, 'OBJECTIF_SECURISE', 'PUBLIE')
      await creerNcSur(apiKey.id, params, 'OBJECTIF_COMPROMIS', 'BROUILLON')

      const result = await runAsPrincipal(apiKey.id, () =>
        listerHistoriqueNiveauConfiance(indicateurIndividuConfig, { params, query: {} }),
      )

      expect(result._unsafeUnwrap().total).toBe(2)
    }),
  )
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run : `pnpm -F @pilote/mb-api test listerHistoriqueNiveauConfiance`
Expected : le nouveau test ÉCHOUE (total attendu 2, obtenu 1 car le brouillon est filtré).

- [ ] **Step 3: Retirer le filtre `PUBLIE`**

Dans `apps/mb-api/src/niveauConfiance/queries/listerHistoriqueNiveauConfiance.ts`, remplacer la construction du `where` :

```ts
  const where: Prisma.NiveauConfianceWhereInput = {
    commentaire: config.whereLecture(params, principalId),
  }
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run : `pnpm -F @pilote/mb-api test listerHistoriqueNiveauConfiance`
Expected : PASS (les deux tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/niveauConfiance/queries/listerHistoriqueNiveauConfiance.ts apps/mb-api/src/niveauConfiance/queries/listerHistoriqueNiveauConfiance.test.ts
git commit -m "feat(niveau-confiance): historique inclut les brouillons (retrait filtre publié)"
```

---

## Task 6: Couche API (ky) commentaires + niveau de confiance

**Files:**
- Create: `apps/mb-webapp/src/api/commentaires.ts`
- Create: `apps/mb-webapp/src/api/niveauConfiance.ts`

- [ ] **Step 1: API commentaires**

Create `apps/mb-webapp/src/api/commentaires.ts` :

```ts
import {
  type CommentaireApiModel,
  commentaireApiModelSchema,
  type CommentaireListApiModel,
  commentaireListApiModelSchema,
  type CreerCommentaireBody,
  indicateurIndividuCommentaireTypeSchema,
  type ListerCommentairesQuery,
  type ModifierCommentaireBody,
} from '@pilote/mb-shared/commentaire'
import { z } from 'zod'

import { apiClient } from '@/api/client'

export type IndicateurIndividuCommentaireType = z.infer<
  typeof indicateurIndividuCommentaireTypeSchema
>

export const fetchCommentaires = async (
  indicateurId: string,
  individuId: string,
  query: ListerCommentairesQuery,
): Promise<CommentaireListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus/${individuId}/commentaires`, {
      searchParams: query,
    })
    .json()
  return commentaireListApiModelSchema.parse(json)
}

export const createCommentaire = async (
  indicateurId: string,
  individuId: string,
  body: CreerCommentaireBody<IndicateurIndividuCommentaireType>,
): Promise<CommentaireApiModel> => {
  const json = await apiClient
    .post(`indicateurs/${indicateurId}/individus/${individuId}/commentaires`, { json: body })
    .json()
  return commentaireApiModelSchema.parse(json)
}

export const updateCommentaire = async (
  commentaireId: string,
  body: ModifierCommentaireBody,
): Promise<CommentaireApiModel> => {
  const json = await apiClient.put(`commentaires/${commentaireId}`, { json: body }).json()
  return commentaireApiModelSchema.parse(json)
}
```

- [ ] **Step 2: API niveau de confiance**

Create `apps/mb-webapp/src/api/niveauConfiance.ts` :

```ts
import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
  niveauConfianceApiModelSchema,
  type NiveauConfianceListApiModel,
  niveauConfianceListApiModelSchema,
} from '@pilote/mb-shared/niveauConfiance'
import { type PaginateQuery } from '@pilote/mb-shared/pagination'

import { apiClient } from '@/api/client'

export const fetchHistoriqueNiveauConfiance = async (
  indicateurId: string,
  individuId: string,
  query: PaginateQuery,
): Promise<NiveauConfianceListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus/${individuId}/niveau-confiance/historique`, {
      searchParams: query,
    })
    .json()
  return niveauConfianceListApiModelSchema.parse(json)
}

export const createNiveauConfiance = async (
  body: CreerNiveauConfianceBody,
): Promise<NiveauConfianceApiModel> => {
  const json = await apiClient.post('niveau-confiance', { json: body }).json()
  return niveauConfianceApiModelSchema.parse(json)
}

export const updateNiveauConfiance = async (
  niveauConfianceId: string,
  body: ModifierNiveauConfianceBody,
): Promise<NiveauConfianceApiModel> => {
  const json = await apiClient.put(`niveau-confiance/${niveauConfianceId}`, { json: body }).json()
  return niveauConfianceApiModelSchema.parse(json)
}
```

- [ ] **Step 3: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/src/api/commentaires.ts apps/mb-webapp/src/api/niveauConfiance.ts
git commit -m "feat(mb-webapp): couche API commentaires et niveau de confiance"
```

---

## Task 7: Queries React Query (+ clés partagées)

**Files:**
- Create: `apps/mb-webapp/src/queries/commentaires.ts`
- Create: `apps/mb-webapp/src/queries/niveauConfiance.ts`

- [ ] **Step 1: Queries commentaires**

Create `apps/mb-webapp/src/queries/commentaires.ts` :

```ts
import { queryOptions } from '@tanstack/react-query'

import {
  fetchCommentaires,
  type IndicateurIndividuCommentaireType,
} from '@/api/commentaires'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const commentairesKeys = {
  liste: (indicateurId: string, individuId: string, type: IndicateurIndividuCommentaireType) =>
    ['indicateur', indicateurId, 'individu', individuId, 'commentaires', type] as const,
}

export const commentairesQueryOptions = (
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) =>
  queryOptions({
    queryKey: commentairesKeys.liste(indicateurId, individuId, type),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchCommentaires(indicateurId, individuId, { type, ...(cursor ? { cursor } : {}) }),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })
```

- [ ] **Step 2: Queries niveau de confiance**

Create `apps/mb-webapp/src/queries/niveauConfiance.ts` :

```ts
import { queryOptions } from '@tanstack/react-query'

import { fetchHistoriqueNiveauConfiance } from '@/api/niveauConfiance'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const niveauConfianceKeys = {
  historique: (indicateurId: string, individuId: string) =>
    ['indicateur', indicateurId, 'individu', individuId, 'niveau-confiance', 'historique'] as const,
}

export const niveauConfianceHistoriqueQueryOptions = (indicateurId: string, individuId: string) =>
  queryOptions({
    queryKey: niveauConfianceKeys.historique(indicateurId, individuId),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchHistoriqueNiveauConfiance(indicateurId, individuId, cursor ? { cursor } : {}),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })
```

- [ ] **Step 3: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/src/queries/commentaires.ts apps/mb-webapp/src/queries/niveauConfiance.ts
git commit -m "feat(mb-webapp): queries commentaires et historique niveau de confiance"
```

---

## Task 8: Mutations (commentaires + niveau de confiance)

**Files:**
- Create: `apps/mb-webapp/src/mutations/commentaires.ts`
- Create: `apps/mb-webapp/src/mutations/niveauConfiance.ts`

> Premier dossier `mutations/` de l'app. Chaque hook gère l'invalidation des clés concernées et un toast de succès/erreur. Le 403 (gating non implémenté, cf. spec §7) est capté par le toast d'erreur.

- [ ] **Step 1: Mutations commentaires**

Create `apps/mb-webapp/src/mutations/commentaires.ts` :

```ts
import { type CreerCommentaireBody, type ModifierCommentaireBody } from '@pilote/mb-shared/commentaire'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createCommentaire,
  type IndicateurIndividuCommentaireType,
  updateCommentaire,
} from '@/api/commentaires'
import { useToast } from '@/components/ui/Toast'
import { commentairesKeys } from '@/queries/commentaires'
import { niveauConfianceKeys } from '@/queries/niveauConfiance'

const messageErreur = {
  title: 'Action impossible.',
  description: "Une erreur est survenue (vous n'êtes peut-être pas l'auteur de ce commentaire).",
  variant: 'error',
} as const

export function useCreerCommentaire(
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (body: CreerCommentaireBody<IndicateurIndividuCommentaireType>) =>
      createCommentaire(indicateurId, individuId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentairesKeys.liste(indicateurId, individuId, type),
      })
      toast({ title: 'Commentaire créé.' })
    },
    onError: () => toast(messageErreur),
  })
}

export function useModifierCommentaire(
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      commentaireId,
      body,
    }: {
      commentaireId: string
      body: ModifierCommentaireBody
    }) => updateCommentaire(commentaireId, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: commentairesKeys.liste(indicateurId, individuId, type),
      })
      void queryClient.invalidateQueries({
        queryKey: niveauConfianceKeys.historique(indicateurId, individuId),
      })
      toast({
        title: variables.body.statut === 'PUBLIE' ? 'Commentaire publié.' : 'Commentaire enregistré.',
      })
    },
    onError: () => toast(messageErreur),
  })
}
```

- [ ] **Step 2: Mutations niveau de confiance**

Create `apps/mb-webapp/src/mutations/niveauConfiance.ts` :

```ts
import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
} from '@pilote/mb-shared/niveauConfiance'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createNiveauConfiance, updateNiveauConfiance } from '@/api/niveauConfiance'
import { useToast } from '@/components/ui/Toast'
import { niveauConfianceKeys } from '@/queries/niveauConfiance'

export function useEnregistrerMeteo(indicateurId: string, individuId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalider = () =>
    queryClient.invalidateQueries({
      queryKey: niveauConfianceKeys.historique(indicateurId, individuId),
    })

  const creer = useMutation({
    mutationFn: (body: CreerNiveauConfianceBody) => createNiveauConfiance(body),
    onSuccess: () => {
      void invalider()
      toast({ title: 'Météo enregistrée.' })
    },
    onError: () => toast({ title: 'Météo non enregistrée.', variant: 'error' }),
  })

  const modifier = useMutation({
    mutationFn: ({
      niveauConfianceId,
      body,
    }: {
      niveauConfianceId: string
      body: ModifierNiveauConfianceBody
    }) => updateNiveauConfiance(niveauConfianceId, body),
    onSuccess: () => {
      void invalider()
      toast({ title: 'Météo mise à jour.' })
    },
    onError: () => toast({ title: 'Météo non mise à jour.', variant: 'error' }),
  })

  return { creer, modifier }
}
```

- [ ] **Step 3: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/src/mutations
git commit -m "feat(mb-webapp): mutations commentaires et météo (niveau de confiance)"
```

---

## Task 9: Briques de présentation (météo, statut, contenu repliable)

**Files:**
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/meteo.ts`
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/SelecteurMeteo.tsx`
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/MeteoTag.tsx`
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/BadgeStatut.tsx`
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/ContenuRepliable.tsx`

- [ ] **Step 1: Mapping météo**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/meteo.ts` :

```ts
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { Cloud, CloudLightning, CloudSun, Sun, type LucideIcon } from 'lucide-react'

export type Meteo = { indice: IndiceConfiance; label: string; Icon: LucideIcon }

export const METEOS: readonly Meteo[] = [
  { indice: 'OBJECTIF_COMPROMIS', label: 'Orage', Icon: CloudLightning },
  { indice: 'APPUIS_NECESSAIRE', label: 'Couvert', Icon: Cloud },
  { indice: 'OBJECTIF_ATTEIGNABLE', label: 'Nuage', Icon: CloudSun },
  { indice: 'OBJECTIF_SECURISE', label: 'Soleil', Icon: Sun },
]

export const meteoFromIndice = (indice: IndiceConfiance): Meteo =>
  METEOS.find((meteo) => meteo.indice === indice) ?? METEOS[0]
```

- [ ] **Step 2: SelecteurMeteo**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/SelecteurMeteo.tsx` :

```tsx
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import { METEOS } from '@/components/indicateurs/commentaires/meteo'
import { clsxm } from '@/lib/clsxm'

export function SelecteurMeteo({
  value,
  onChange,
  disabled = false,
}: {
  value?: IndiceConfiance
  onChange: (indice: IndiceConfiance) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {METEOS.map(({ indice, label, Icon }) => {
        const actif = value === indice
        return (
          <button
            key={indice}
            type="button"
            disabled={disabled}
            aria-pressed={actif}
            onClick={() => onChange(indice)}
            className={clsxm(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-60',
              actif
                ? 'border-primary-tinted bg-primary-tinted text-primary'
                : 'border-border bg-surface text-text-muted hover:border-border-strong',
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: MeteoTag (lecture)**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/MeteoTag.tsx` :

```tsx
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import { meteoFromIndice } from '@/components/indicateurs/commentaires/meteo'

export function MeteoTag({ indice }: { indice: IndiceConfiance }) {
  const { label, Icon } = meteoFromIndice(indice)
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-primary-tinted px-4 py-2 text-sm font-semibold text-primary">
      <Icon className="size-5" />
      {label}
    </span>
  )
}
```

- [ ] **Step 4: BadgeStatut**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/BadgeStatut.tsx` :

```tsx
import { type CommentaireStatut } from '@pilote/mb-shared/commentaire'

import { clsxm } from '@/lib/clsxm'

export function BadgeStatut({ statut }: { statut: CommentaireStatut }) {
  const brouillon = statut === 'BROUILLON'
  return (
    <span
      className={clsxm(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
        brouillon
          ? 'bg-warning-tinted text-warning'
          : 'bg-success-tinted text-success',
      )}
    >
      <span
        className={clsxm('size-1.5 rounded-full', brouillon ? 'bg-warning' : 'bg-success')}
        aria-hidden
      />
      {brouillon ? 'Brouillon' : 'Publié'}
    </span>
  )
}
```

- [ ] **Step 5: ContenuRepliable (Voir plus)**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/ContenuRepliable.tsx` :

```tsx
import { ChevronDown } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'

import { RenduContenuHtml } from '@/components/editeur-riche/RenduContenuHtml'
import { clsxm } from '@/lib/clsxm'

export function ContenuRepliable({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [deplie, setDeplie] = useState(false)
  const [depasse, setDepasse] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setDepasse(el.scrollHeight > el.clientHeight + 1)
  }, [html])

  return (
    <div>
      <RenduContenuHtml
        ref={ref}
        html={html}
        className={clsxm('text-sm leading-relaxed text-text', !deplie && 'line-clamp-3')}
      />
      {(depasse || deplie) && (
        <button
          type="button"
          onClick={() => setDeplie((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ChevronDown className={clsxm('size-4 transition-transform', deplie && 'rotate-180')} />
          {deplie ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mb-webapp/src/components/indicateurs/commentaires
git commit -m "feat(mb-webapp): briques météo, badge statut et contenu repliable"
```

---

## Task 10: Carte commentaire (lecture)

**Files:**
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/libelleAuteur.ts`
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/CarteCommentaire.tsx`

- [ ] **Step 1: Helper libellé auteur**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/libelleAuteur.ts` :

```ts
import { type AuteurApiModel } from '@pilote/mb-shared/auteur'

export const libelleAuteur = (auteur: AuteurApiModel): string =>
  auteur.type === 'utilisateur' ? auteur.email : auteur.label
```

- [ ] **Step 2: CarteCommentaire**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/CarteCommentaire.tsx` :

```tsx
import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { MoreVertical, Pencil } from 'lucide-react'

import { BadgeStatut } from '@/components/indicateurs/commentaires/BadgeStatut'
import { ContenuRepliable } from '@/components/indicateurs/commentaires/ContenuRepliable'
import { libelleAuteur } from '@/components/indicateurs/commentaires/libelleAuteur'
import { MeteoTag } from '@/components/indicateurs/commentaires/MeteoTag'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'
import { formatDateTimeFr } from '@/lib/format'

export function CarteCommentaire({
  commentaire,
  indice,
  onEdit,
}: {
  commentaire: CommentaireApiModel
  indice?: IndiceConfiance
  onEdit: () => void
}) {
  const brouillon = commentaire.statut === 'BROUILLON'
  return (
    <article
      className={clsxm(
        'rounded-r-sm border border-l-4 border-border bg-surface p-5 sm:p-6',
        brouillon ? 'border-l-warning' : 'border-l-primary',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <BadgeStatut statut={commentaire.statut} />
        {/* TODO gating : conditionner l'affichage des actions (Éditer, …) aux
            autorisations réelles de l'utilisateur. Aujourd'hui on les montre à
            tous et l'API renvoie 403 si non-auteur (capté par un toast). */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Actions"
            className="ml-auto flex size-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface-tinted hover:text-primary"
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil />
              Éditer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {indice && (
        <div className="mb-3">
          <MeteoTag indice={indice} />
        </div>
      )}

      <ContenuRepliable html={commentaire.contenu} />

      <div className="mt-4 border-t border-border pt-3">
        <Text variant="caption" tone="muted">
          Modifié le {formatDateTimeFr(commentaire.updatedAt)} par{' '}
          {libelleAuteur(commentaire.auteurModification)}
        </Text>
      </div>
    </article>
  )
}
```

- [ ] **Step 3: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/src/components/indicateurs/commentaires/libelleAuteur.ts apps/mb-webapp/src/components/indicateurs/commentaires/CarteCommentaire.tsx
git commit -m "feat(mb-webapp): carte commentaire en lecture (statut, météo, voir plus, menu)"
```

---

## Task 11: Éditeur de commentaire (carte édition)

**Files:**
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/EditeurCommentaire.tsx`

> Carte en mode édition. Brouillon → boutons « Enregistrer » + « Publier ». Commentaire publié édité → « Enregistrer » + « Annuler ». La météo (CONFIANCE) est un appel séparé, déclenché à la sélection.

- [ ] **Step 1: EditeurCommentaire**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/EditeurCommentaire.tsx` :

```tsx
import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { Send } from 'lucide-react'
import { useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { BadgeStatut } from '@/components/indicateurs/commentaires/BadgeStatut'
import { libelleAuteur } from '@/components/indicateurs/commentaires/libelleAuteur'
import { SelecteurMeteo } from '@/components/indicateurs/commentaires/SelecteurMeteo'
import { EditeurRiche } from '@/components/editeur-riche/EditeurRiche'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'
import { formatDateTimeFr } from '@/lib/format'
import { useModifierCommentaire } from '@/mutations/commentaires'
import { useEnregistrerMeteo } from '@/mutations/niveauConfiance'

export type MeteoCourante = { niveauId: string; indice: IndiceConfiance }

export function EditeurCommentaire({
  indicateurId,
  individuId,
  type,
  commentaire,
  avecMeteo,
  meteo,
  onClose,
}: {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  commentaire: CommentaireApiModel
  avecMeteo: boolean
  meteo?: MeteoCourante
  onClose?: () => void
}) {
  const [contenu, setContenu] = useState(commentaire.contenu)
  const modifier = useModifierCommentaire(indicateurId, individuId, type)
  const { creer: creerMeteo, modifier: modifierMeteo } = useEnregistrerMeteo(
    indicateurId,
    individuId,
  )

  const brouillon = commentaire.statut === 'BROUILLON'

  const onMeteoChange = (indice: IndiceConfiance) => {
    if (meteo) {
      modifierMeteo.mutate({ niveauConfianceId: meteo.niveauId, body: { indice } })
    } else {
      creerMeteo.mutate({ commentaireId: commentaire.id, indice })
    }
  }

  const enregistrer = () =>
    modifier.mutate(
      { commentaireId: commentaire.id, body: { contenu } },
      { onSuccess: () => onClose?.() },
    )

  const publier = () =>
    modifier.mutate(
      { commentaireId: commentaire.id, body: { contenu, statut: 'PUBLIE' } },
      { onSuccess: () => onClose?.() },
    )

  return (
    <article
      className={clsxm(
        'rounded-r-sm border border-l-4 border-border bg-surface p-5 sm:p-6',
        brouillon ? 'border-l-warning' : 'border-l-primary',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <BadgeStatut statut={commentaire.statut} />
      </div>

      {avecMeteo && (
        <div className="mb-5">
          <Text variant="caption" weight="semibold" tone="muted" className="mb-2 block">
            Météo
          </Text>
          <SelecteurMeteo
            value={meteo?.indice}
            onChange={onMeteoChange}
            disabled={creerMeteo.isPending || modifierMeteo.isPending}
          />
        </div>
      )}

      <Text variant="caption" weight="semibold" tone="muted" className="mb-2 block">
        Commentaire
      </Text>
      <EditeurRiche contenu={commentaire.contenu} onChange={setContenu} />

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Text variant="caption" tone="muted">
          Modifié le {formatDateTimeFr(commentaire.updatedAt)} par{' '}
          {libelleAuteur(commentaire.auteurModification)}
        </Text>
        <div className="ml-auto flex gap-3">
          {brouillon ? (
            <>
              <Button variant="secondary" size="sm" type="button" onClick={enregistrer} disabled={modifier.isPending}>
                Enregistrer
              </Button>
              <Button size="sm" type="button" onClick={publier} disabled={modifier.isPending}>
                <Send />
                Publier
              </Button>
            </>
          ) : (
            <>
              <Button variant="tertiary" size="sm" type="button" onClick={() => onClose?.()}>
                Annuler
              </Button>
              <Button size="sm" type="button" onClick={enregistrer} disabled={modifier.isPending}>
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-webapp/src/components/indicateurs/commentaires/EditeurCommentaire.tsx
git commit -m "feat(mb-webapp): éditeur de commentaire (enregistrer / publier / météo)"
```

---

## Task 12: Liste (Brouillon / État en cours / Historique) + sections par type

**Files:**
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/ListeCommentaires.tsx`
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/SectionMeteoSynthese.tsx`
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/SectionAutresCommentaires.tsx`

- [ ] **Step 1: ListeCommentaires (présentationnel)**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/ListeCommentaires.tsx` :

```tsx
import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { CheckCircle2, History, Pencil, Plus } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { CarteCommentaire } from '@/components/indicateurs/commentaires/CarteCommentaire'
import {
  EditeurCommentaire,
  type MeteoCourante,
} from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Typography'
import { useCreerCommentaire } from '@/mutations/commentaires'

function Intitule({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-text-muted">
      <span className="[&_svg]:size-4">{icon}</span>
      <Text as="span" variant="kicker" tone="muted">
        {children}
      </Text>
    </div>
  )
}

export function ListeCommentaires({
  indicateurId,
  individuId,
  type,
  avecMeteo,
  commentaires,
  meteoParCommentaire,
}: {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  avecMeteo: boolean
  commentaires: CommentaireApiModel[]
  meteoParCommentaire: Map<string, MeteoCourante>
}) {
  const [editionId, setEditionId] = useState<string | null>(null)
  const creer = useCreerCommentaire(indicateurId, individuId, type)

  const brouillon = commentaires.find((commentaire) => commentaire.statut === 'BROUILLON')
  const reste = commentaires.filter((commentaire) => commentaire.id !== brouillon?.id)
  const etatEnCours = reste.find((commentaire) => commentaire.statut === 'PUBLIE')
  const historique = reste.filter((commentaire) => commentaire.id !== etatEnCours?.id)

  if (commentaires.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState title="Aucun commentaire pour le moment." />
        <div>
          <Button
            variant="secondary"
            type="button"
            onClick={() => creer.mutate({ type, contenu: '', statut: 'BROUILLON' })}
            disabled={creer.isPending}
          >
            <Plus />
            Ajouter un commentaire
          </Button>
        </div>
      </div>
    )
  }

  const carteOuEditeur = (commentaire: CommentaireApiModel) =>
    editionId === commentaire.id ? (
      <EditeurCommentaire
        indicateurId={indicateurId}
        individuId={individuId}
        type={type}
        commentaire={commentaire}
        avecMeteo={avecMeteo}
        meteo={meteoParCommentaire.get(commentaire.id)}
        onClose={() => setEditionId(null)}
      />
    ) : (
      <CarteCommentaire
        commentaire={commentaire}
        indice={meteoParCommentaire.get(commentaire.id)?.indice}
        onEdit={() => setEditionId(commentaire.id)}
      />
    )

  return (
    <div className="flex flex-col gap-8">
      {brouillon && (
        <section>
          <Intitule icon={<Pencil />}>Brouillon, à venir</Intitule>
          <EditeurCommentaire
            indicateurId={indicateurId}
            individuId={individuId}
            type={type}
            commentaire={brouillon}
            avecMeteo={avecMeteo}
            meteo={meteoParCommentaire.get(brouillon.id)}
          />
        </section>
      )}

      {etatEnCours && (
        <section>
          <Intitule icon={<CheckCircle2 />}>État en cours</Intitule>
          {carteOuEditeur(etatEnCours)}
        </section>
      )}

      {historique.length > 0 && (
        <section>
          <Intitule icon={<History />}>Historique</Intitule>
          <div className="flex flex-col gap-4">
            {historique.map((commentaire) => (
              <div key={commentaire.id}>{carteOuEditeur(commentaire)}</div>
            ))}
          </div>
        </section>
      )}

      {!brouillon && (
        <div>
          <Button
            variant="secondary"
            type="button"
            onClick={() => creer.mutate({ type, contenu: '', statut: 'BROUILLON' })}
            disabled={creer.isPending}
          >
            <Plus />
            Ajouter un commentaire
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: SectionMeteoSynthese (CONFIANCE)**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/SectionMeteoSynthese.tsx` :

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

import {
  ListeCommentaires,
} from '@/components/indicateurs/commentaires/ListeCommentaires'
import { type MeteoCourante } from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { commentairesQueryOptions } from '@/queries/commentaires'
import { niveauConfianceHistoriqueQueryOptions } from '@/queries/niveauConfiance'

export function SectionMeteoSynthese({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: commentaires } = useSuspenseQuery(
    commentairesQueryOptions(indicateurId, individuId, 'CONFIANCE'),
  )
  const { data: niveaux } = useSuspenseQuery(
    niveauConfianceHistoriqueQueryOptions(indicateurId, individuId),
  )

  // niveaux triés antichronologiquement → on garde le plus récent par commentaire.
  const meteoParCommentaire = new Map<string, MeteoCourante>()
  for (const niveau of niveaux) {
    if (!meteoParCommentaire.has(niveau.commentaire.id)) {
      meteoParCommentaire.set(niveau.commentaire.id, { niveauId: niveau.id, indice: niveau.indice })
    }
  }

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="CONFIANCE"
      avecMeteo
      commentaires={commentaires}
      meteoParCommentaire={meteoParCommentaire}
    />
  )
}
```

- [ ] **Step 3: SectionAutresCommentaires (DEFAUT)**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/SectionAutresCommentaires.tsx` :

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

import { type MeteoCourante } from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { commentairesQueryOptions } from '@/queries/commentaires'

const SANS_METEO = new Map<string, MeteoCourante>()

export function SectionAutresCommentaires({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: commentaires } = useSuspenseQuery(
    commentairesQueryOptions(indicateurId, individuId, 'DEFAUT'),
  )

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="DEFAUT"
      avecMeteo={false}
      commentaires={commentaires}
      meteoParCommentaire={SANS_METEO}
    />
  )
}
```

- [ ] **Step 4: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-webapp/src/components/indicateurs/commentaires/ListeCommentaires.tsx apps/mb-webapp/src/components/indicateurs/commentaires/SectionMeteoSynthese.tsx apps/mb-webapp/src/components/indicateurs/commentaires/SectionAutresCommentaires.tsx
git commit -m "feat(mb-webapp): liste commentaires (brouillon/état/historique) + sections par type"
```

---

## Task 13: Onglet Commentaires (SegmentedControl)

**Files:**
- Create: `apps/mb-webapp/src/components/indicateurs/commentaires/IndicateurCommentairesTab.tsx`

- [ ] **Step 1: IndicateurCommentairesTab**

Create `apps/mb-webapp/src/components/indicateurs/commentaires/IndicateurCommentairesTab.tsx` :

```tsx
import { CloudSun, MessageSquare } from 'lucide-react'
import { Suspense, useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { SectionAutresCommentaires } from '@/components/indicateurs/commentaires/SectionAutresCommentaires'
import { SectionMeteoSynthese } from '@/components/indicateurs/commentaires/SectionMeteoSynthese'
import { RouteLoading } from '@/components/RouteLoading'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

export function IndicateurCommentairesTab({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const [type, setType] = useState<IndicateurIndividuCommentaireType>('CONFIANCE')

  return (
    <div className="flex flex-col gap-8">
      <SegmentedControl
        aria-label="Famille de commentaires"
        value={type}
        onValueChange={(value) => setType(value)}
        options={[
          {
            value: 'CONFIANCE',
            label: 'Météo & synthèse des résultats',
            icon: <CloudSun />,
          },
          { value: 'DEFAUT', label: 'Autres commentaires', icon: <MessageSquare /> },
        ]}
      />

      <Suspense fallback={<RouteLoading message="Chargement des commentaires…" />}>
        {type === 'CONFIANCE' ? (
          <SectionMeteoSynthese indicateurId={indicateurId} individuId={individuId} />
        ) : (
          <SectionAutresCommentaires indicateurId={indicateurId} individuId={individuId} />
        )}
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-webapp/src/components/indicateurs/commentaires/IndicateurCommentairesTab.tsx
git commit -m "feat(mb-webapp): onglet commentaires avec bascule météo/autres"
```

---

## Task 14: Intégration dans la page indicateur

**Files:**
- Modify: `apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx`

- [ ] **Step 1: Ajouter l'import**

Dans `apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx`, ajouter parmi les imports de composants indicateurs :

```tsx
import { IndicateurCommentairesTab } from '@/components/indicateurs/commentaires/IndicateurCommentairesTab'
```

- [ ] **Step 2: Ajouter l'onglet à la `Tabs`**

Toujours dans le même fichier, dans le bloc `<Tabs defaultValue="valeurs">`, ajouter le `TabsTrigger` après « Métadonnées » :

```tsx
          <TabsTrigger value="commentaires">Commentaires</TabsTrigger>
```

et le `TabsContent` après celui de `metadonnees` :

```tsx
        <TabsContent value="commentaires">
          <IndicateurCommentairesTab indicateurId={id} individuId={individuId} />
        </TabsContent>
```

- [ ] **Step 3: Vérifier**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-webapp/src/routes/_authenticated/indicateurs/\$id.tsx
git commit -m "feat(mb-webapp): onglet Commentaires sur la page indicateur"
```

---

## Task 15: Vérification manuelle de bout en bout

**Files:** aucune modification (vérification).

- [ ] **Step 1: Lint global de l'app**

Run : `pnpm -F @pilote/mb-webapp lint`
Expected : PASS.

- [ ] **Step 2: Lancer l'app et tester le parcours**

Run : `pnpm -F @pilote/mb-webapp dev` (et l'API `mb-api` en parallèle selon le README local).

Vérifier sur la page d'un indicateur, onglet **Commentaires** :
1. Bascule **Météo & synthèse** / **Autres commentaires**.
2. **Ajouter un commentaire** → un brouillon en édition apparaît, le bouton « Ajouter » disparaît.
3. Saisie en **texte riche** (gras, liste, lien). La météo (CONFIANCE) se sélectionne et déclenche un toast « Météo enregistrée ».
4. **Enregistrer** (toast) puis **Publier** (toast) → le commentaire passe en « État en cours ».
5. **Éditer** depuis le menu ⋮ d'un commentaire publié → modification → Enregistrer.
6. **Historique** : « Voir plus / Voir moins » sur un commentaire long.
7. Recharger la page : la météo d'un brouillon reste affichée (grâce au changement backend Task 5).

- [ ] **Step 3: (si en fin de chantier) ouvrir la PR**

Voir la skill `feature` / le workflow PR du projet. Hors périmètre de ce plan d'implémentation.

---

## Self-review (couverture spec)

- Onglet tertiaire « Commentaires » : Task 13 + 14. ✓
- Bascule CONFIANCE/DEFAUT (libellés « Météo & synthèse des résultats » / « Autres commentaires ») : Task 13. ✓
- Empilé Brouillon → État en cours → Historique : Task 12. ✓
- Création (brouillon) / édition / publication / pas de suppression : Tasks 8, 11, 12. ✓
- Éditeur texte riche tiptap (modules simples) : Task 4 + 11. ✓
- Météo (sélecteur en édition, tag en lecture), appels séparés, facultatif : Tasks 8, 9, 11, 12. ✓
- « Voir plus » sur publié et historique : Task 9 (ContenuRepliable) utilisé par Task 10. ✓
- « Modifié le … par <auteur> » (pas de « Publié le ») : Tasks 10, 11. ✓
- Bouton « Ajouter un commentaire » masqué si brouillon : Task 12. ✓
- Cartes à liseré gauche franc, radius léger : Tasks 10, 11 (`border-l-4`, `rounded-r-sm`). ✓
- Toast succès/erreur : Task 2 + branché dans les mutations Task 8. ✓
- TODO gating près des actions : Task 10. ✓
- Changement backend (météo brouillon lisible) : Task 5. ✓
- Tokens de statut DSFR (pas de couleurs flat) : Task 1. ✓
- Réutilisation `ui/` (Button, SegmentedControl, EmptyState, Tabs, Text, DropdownMenu nouveau) : transverse. ✓
- Pas de tests front ; vérif via lint + manuel : transverse. ✓
