# Refacto Picker — référentiels & panels permission — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réutiliser le composant générique `Picker` pour la sélection des référentiels d'un indicateur, et pour la sélection d'indicateurs/paniers dans le panel permission (clé API + utilisateur), en supprimant les implémentations redondantes.

**Architecture:** Trois wrappers métier (`ReferentielPicker`, `IndicateurPicker`, `PanierPicker`) encapsulent chacun leur query « tout charger », l'exclusion des éléments déjà sélectionnés et le rendu, autour de `src/components/ui/Picker.tsx` (filtrage client sur `items: T[]`). Les données indicateurs/paniers sont préchargées en mémoire via de nouvelles `xAllQueryOptions`, sur le pattern existant `referentiels`/`utilisateurs`.

**Tech Stack:** React, TanStack Query (`useSuspenseQuery`), TanStack Router (loaders `ensureQueryData`), react-hook-form (`useFieldArray`), cmdk + radix (dans `Picker`), Tailwind, `clsxm`.

## Global Constraints

- App : `apps/kpilote-admin`. Toutes les commandes s'exécutent depuis ce dossier.
- Gestionnaire de paquets : **pnpm** (jamais npm).
- Vérification + commit : lancer `pnpm lint` (= `tsr generate && eslint src && tsc --noEmit && prettier --check .`) AVANT chaque commit. Pas de tests front (préférence projet).
- Nommage : verbes/tech en anglais, entités en français (ex. `fetchAllIndicateurs`, `IndicateurPicker`).
- Helper de classes : `clsxm` (jamais `cn`). Styles via Tailwind + tokens (`text-text`, `text-text-muted`, `border-border`…), pas de couleurs flat.
- Pas de `Co-Authored-By` dans les commits.

---

## File Structure

- `src/api/indicateurs.ts` (modifier) — ajouter `fetchAllIndicateurs`.
- `src/api/paniers.ts` (modifier) — ajouter `fetchAllPaniers`.
- `src/queries/indicateurs.ts` (modifier) — ajouter `indicateursAllQueryOptions`.
- `src/queries/paniers.ts` (créer) — `paniersAllQueryOptions`.
- `src/components/indicateurs/ReferentielPicker.tsx` (créer) — wrapper Picker référentiels.
- `src/components/indicateurs/AdminReferentiels.tsx` (modifier) — utiliser `ReferentielPicker`.
- `src/components/permissions/IndicateurPicker.tsx` (créer) — wrapper Picker indicateurs.
- `src/components/permissions/PanierPicker.tsx` (créer) — wrapper Picker paniers.
- `src/components/PrincipalPermissions.tsx` (modifier) — utiliser les wrappers, retirer les modales.
- `src/routes/_authed/api-keys/$id.tsx` (modifier) — précharger indicateurs/paniers « all ».
- `src/routes/_authed/utilisateurs/$id.tsx` (modifier) — idem.
- `src/components/IndicateurSearchModal.tsx` (supprimer).
- `src/components/PanierSearchModal.tsx` (supprimer).
- `src/queries/permissions.ts` (modifier) — supprimer `searchIndicateursInfiniteQueryOptions` et `searchPaniersInfiniteQueryOptions` (devenues inutilisées).

---

## Task 1 : Query options « tout charger » indicateurs & paniers

**Files:**
- Modify: `src/api/indicateurs.ts`
- Modify: `src/api/paniers.ts`
- Modify: `src/queries/indicateurs.ts`
- Create: `src/queries/paniers.ts`

**Interfaces:**
- Produces :
  - `fetchAllIndicateurs(): Promise<IndicateurApiModel[]>`
  - `fetchAllPaniers(): Promise<PanierApiModel[]>`
  - `indicateursAllQueryOptions()` → queryKey `['indicateurs','all-pages']`, `data: IndicateurApiModel[]`
  - `paniersAllQueryOptions()` → queryKey `['paniers','all-pages']`, `data: PanierApiModel[]`

- [ ] **Step 1 : Ajouter `fetchAllIndicateurs` dans `src/api/indicateurs.ts`**

Ajouter l'import et la fonction (miroir de `fetchAllReferentiels`) :

```ts
import { fetchAllPages } from '@/lib/fetchAllPages'

// … fonctions existantes …

export const fetchAllIndicateurs = (): Promise<IndicateurApiModel[]> =>
  fetchAllPages((cursor) => fetchIndicateurs({ cursor }))
```

- [ ] **Step 2 : Ajouter `fetchAllPaniers` dans `src/api/paniers.ts`**

```ts
import type { PanierApiModel, PanierListApiModel } from '@pilote/kpilote-shared/panier'
import { panierListApiModelSchema } from '@pilote/kpilote-shared/panier'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

// … fetchPaniers existant inchangé …

export const fetchAllPaniers = (): Promise<PanierApiModel[]> =>
  fetchAllPages((cursor) => fetchPaniers({ cursor }))
```

(Adapter l'import `PanierApiModel` : il vient de `@pilote/kpilote-shared/panier`.)

- [ ] **Step 3 : Ajouter `indicateursAllQueryOptions` dans `src/queries/indicateurs.ts`**

```ts
import { fetchAllIndicateurs, fetchIndicateurById, fetchIndicateurs } from '@/api/indicateurs'

export const indicateursAllQueryOptions = () =>
  queryOptions({
    queryKey: ['indicateurs', 'all-pages'],
    queryFn: () => fetchAllIndicateurs(),
  })
```

(Conserver `queryOptions` dans l'import `@tanstack/react-query` en plus de `infiniteQueryOptions`.)

- [ ] **Step 4 : Créer `src/queries/paniers.ts`**

```ts
import { queryOptions } from '@tanstack/react-query'

import { fetchAllPaniers } from '@/api/paniers'

export const paniersAllQueryOptions = () =>
  queryOptions({
    queryKey: ['paniers', 'all-pages'],
    queryFn: () => fetchAllPaniers(),
  })
```

- [ ] **Step 5 : Vérifier**

Run : `pnpm lint`
Expected : PASS (typecheck + eslint + prettier OK).

- [ ] **Step 6 : Commit**

```bash
git add src/api/indicateurs.ts src/api/paniers.ts src/queries/indicateurs.ts src/queries/paniers.ts
git commit -m "feat(kpilote-admin): query options tout charger indicateurs & paniers"
```

---

## Task 2 : `ReferentielPicker` + refacto `AdminReferentiels`

**Files:**
- Create: `src/components/indicateurs/ReferentielPicker.tsx`
- Modify: `src/components/indicateurs/AdminReferentiels.tsx`

**Interfaces:**
- Consumes : `referentielsAllQueryOptions()` (existante), `Picker`.
- Produces : `ReferentielPicker` composant React.

```ts
type ReferentielPickerProps = {
  excludedIds: string[]
  onSelect: (id: string) => void
  disabled?: boolean
  triggerLabel?: ReactNode
}
```

**⚠ Piège react-hook-form :** avec `useFieldArray`, chaque objet de `fields` porte un `.id` généré par RHF (clé React) qui **masque** le champ de données `id`. Ne PAS lire `fields[index].id` pour obtenir l'id du référentiel — lire les valeurs via `form.watch('referentiels')`.

- [ ] **Step 1 : Créer `src/components/indicateurs/ReferentielPicker.tsx`**

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { Picker } from '@/components/ui/Picker'
import { referentielsAllQueryOptions } from '@/queries/referentiels'

export function ReferentielPicker({
  excludedIds,
  onSelect,
  disabled,
  triggerLabel = 'Ajouter un référentiel',
}: {
  excludedIds: string[]
  onSelect: (id: string) => void
  disabled?: boolean
  triggerLabel?: ReactNode
}) {
  const { data } = useSuspenseQuery(referentielsAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data.filter((referentiel) => !excluded.has(referentiel.id))

  return (
    <Picker
      items={items}
      onSelect={(referentiel) => onSelect(referentiel.id)}
      getKey={(referentiel) => referentiel.id}
      getSearchText={(referentiel) => `${referentiel.id} ${referentiel.nom}`}
      renderItem={(referentiel) => (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm text-text">{referentiel.nom}</span>
          <span className="shrink-0 font-mono text-xs text-text-muted">{referentiel.id}</span>
        </span>
      )}
      triggerLabel={triggerLabel}
      disabled={disabled}
    />
  )
}
```

- [ ] **Step 2 : Réécrire `src/components/indicateurs/AdminReferentiels.tsx`**

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useFieldArray, type UseFormRegister } from 'react-hook-form'

import { ReferentielPicker } from '@/components/indicateurs/ReferentielPicker'
import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { type IndicateurFormValues } from '@/components/indicateurs/indicateurFormSchema'
import { FieldSelect } from '@/components/ui/FieldSelect'
import { referentielsAllQueryOptions } from '@/queries/referentiels'

type FonctionAgregation = 'SUM' | 'AVG' | 'NONE'

const AGREGATION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Aucune',
}

export function AdminReferentiels() {
  const form = useIndicateurFormContext()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'referentiels' })
  const { data: options } = useSuspenseQuery(referentielsAllQueryOptions())

  const nomById = new Map(options.map((option) => [option.id, option.nom]))
  const values = form.watch('referentiels') ?? []
  const excludedIds = values.map((value) => value.id).filter(Boolean)

  return (
    <div className="border-t border-border pt-5">
      <div className="mb-1">
        <span className="text-sm font-bold">Référentiels liés</span>
      </div>
      <p className="mb-4 text-xs text-text-subtle">
        ⚠ Cette liste remplace <b>intégralement</b> l'existant (replace-all). Retirer une ligne
        supprime le lien.
      </p>

      <div className="mb-4">
        <ReferentielPicker
          excludedIds={excludedIds}
          onSelect={(id) => append({ id, fonctionAgregation: 'SUM' })}
        />
      </div>

      {fields.map((field, index) => (
        <ReferentielRow
          key={field.id}
          index={index}
          register={form.register}
          referentielNom={nomById.get(values[index]?.id ?? '') ?? values[index]?.id ?? ''}
          onRemove={() => remove(index)}
        />
      ))}
    </div>
  )
}

function ReferentielRow({
  index,
  register,
  referentielNom,
  onRemove,
}: {
  index: number
  register: UseFormRegister<IndicateurFormValues>
  referentielNom: string
  onRemove: () => void
}) {
  return (
    <div className="mb-2.5 flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
      <input type="hidden" {...register(`referentiels.${index}.id`)} />
      <div className="flex-[2] py-2 text-sm text-text">{referentielNom}</div>
      <div className="flex-1">
        <FieldSelect
          label="Fonction d'agrégation"
          hideLabel
          {...register(`referentiels.${index}.fonctionAgregation`)}
        >
          {Object.entries(AGREGATION_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FieldSelect>
      </div>
      <button type="button" onClick={onRemove} className="mt-2 text-accent" aria-label="Retirer">
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
```

Notes :
- Le `<input type="hidden">` enregistre `referentiels.${index}.id` (valeur posée à l'append) pour rester dans le state RHF et la soumission.
- `Plus` n'est plus importé (bouton supprimé) ; `Picker` est utilisé indirectement via `ReferentielPicker`.

- [ ] **Step 3 : Vérifier**

Run : `pnpm lint`
Expected : PASS.

- [ ] **Step 4 : Vérif visuelle**

Lancer l'app (skill `run` / `pnpm dev`), ouvrir un indicateur en édition : l'ajout de référentiel se fait via le Picker (recherche), les référentiels déjà liés n'apparaissent plus dans la liste, chaque ligne affiche le nom + le select d'agrégation + la corbeille, et la sauvegarde conserve les liens.

- [ ] **Step 5 : Commit**

```bash
git add src/components/indicateurs/ReferentielPicker.tsx src/components/indicateurs/AdminReferentiels.tsx
git commit -m "feat(kpilote-admin): Picker pour la sélection des référentiels d'un indicateur"
```

---

## Task 3 : `IndicateurPicker` + `PanierPicker` + refacto `PrincipalPermissions`

**Files:**
- Create: `src/components/permissions/IndicateurPicker.tsx`
- Create: `src/components/permissions/PanierPicker.tsx`
- Modify: `src/components/PrincipalPermissions.tsx`
- Modify: `src/routes/_authed/api-keys/$id.tsx`
- Modify: `src/routes/_authed/utilisateurs/$id.tsx`
- Delete: `src/components/IndicateurSearchModal.tsx`
- Delete: `src/components/PanierSearchModal.tsx`
- Modify: `src/queries/permissions.ts`

**Interfaces:**
- Consumes : `indicateursAllQueryOptions()`, `paniersAllQueryOptions()` (Task 1), `Picker`.
- Produces : `IndicateurPicker`, `PanierPicker`, chacun avec les props :

```ts
type Props = {
  excludedIds: string[]
  onSelect: (publicId: string) => void
  disabled?: boolean
}
```

- [ ] **Step 1 : Créer `src/components/permissions/IndicateurPicker.tsx`**

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@/components/ui/Picker'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'

export function IndicateurPicker({
  excludedIds,
  onSelect,
  disabled,
}: {
  excludedIds: string[]
  onSelect: (publicId: string) => void
  disabled?: boolean
}) {
  const { data } = useSuspenseQuery(indicateursAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data.filter((indicateur) => !excluded.has(indicateur.id))

  return (
    <Picker
      items={items}
      onSelect={(indicateur) => onSelect(indicateur.id)}
      getKey={(indicateur) => indicateur.id}
      getSearchText={(indicateur) => `${indicateur.id} ${indicateur.nom}`}
      renderItem={(indicateur) => (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate text-sm text-text">{indicateur.nom}</span>
          <span className="shrink-0 font-mono text-xs text-text-muted">{indicateur.id}</span>
        </span>
      )}
      triggerLabel="Ajouter un indicateur"
      disabled={disabled}
    />
  )
}
```

- [ ] **Step 2 : Créer `src/components/permissions/PanierPicker.tsx`**

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@/components/ui/Picker'
import { paniersAllQueryOptions } from '@/queries/paniers'

export function PanierPicker({
  excludedIds,
  onSelect,
  disabled,
}: {
  excludedIds: string[]
  onSelect: (publicId: string) => void
  disabled?: boolean
}) {
  const { data } = useSuspenseQuery(paniersAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data.filter((panier) => !excluded.has(panier.id))

  return (
    <Picker
      items={items}
      onSelect={(panier) => onSelect(panier.id)}
      getKey={(panier) => panier.id}
      getSearchText={(panier) => `${panier.id} ${panier.nom}`}
      renderItem={(panier) => (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate text-sm text-text">{panier.nom}</span>
          <span className="shrink-0 font-mono text-xs text-text-muted">{panier.id}</span>
        </span>
      )}
      triggerLabel="Ajouter un panier"
      disabled={disabled}
    />
  )
}
```

- [ ] **Step 3 : Modifier `src/components/PrincipalPermissions.tsx`**

3a. Remplacer les imports des modales par les wrappers, retirer `Plus` (bouton supprimé) :

```tsx
import { IndicateurPicker } from '@/components/permissions/IndicateurPicker'
import { PanierPicker } from '@/components/permissions/PanierPicker'
```

Retirer :
```tsx
import { IndicateurSearchModal } from '@/components/IndicateurSearchModal'
import { PanierSearchModal } from '@/components/PanierSearchModal'
```
et retirer `Plus` de l'import `lucide-react` (garder `Eye, Lock, Trash2`).

3b. Supprimer l'état modale :
```tsx
const [modal, setModal] = useState<'indicateur' | 'panier' | null>(null)
```
(et retirer `useState` de l'import `react` s'il n'est plus utilisé ; `ReactNode` reste importé.)

3c. Retirer `setModal(null)` dans `addIndicateur` et `addPanier` :
```tsx
const addIndicateur = (indicateurPublicId: string) => {
  run(() => grantIndicateurPermission({ principalId, indicateurPublicId, action: 'READ' }))
}
// … idem addPanier sans setModal …
```

3d. Remplacer la signature et le rendu du bouton dans `renderSection`. Nouvelle signature (le contrôle d'ajout devient un `ReactNode` passé par l'appelant, placé pleine largeur sous le titre) :

```tsx
const renderSection = (
  title: string,
  rows: DirectRow[],
  addControl: ReactNode,
  handlers: { onToggleWrite: (publicId: string, active: boolean) => void; onRemove: (publicId: string) => void },
  extraForRow?: (publicId: string) => ReactNode,
) => (
  <div className="mb-6">
    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
    <div className="mb-2">{addControl}</div>
    {rows.length === 0 ? (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-text-subtle">
        Aucune permission directe.
      </p>
    ) : (
      <ul className="divide-y divide-border rounded-lg border border-border">
        {rows.map((row) => {
          const writeActive = row.actions.includes('WRITE')
          const extra = extraForRow?.(row.publicId)
          return (
            <li key={row.publicId} className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{row.nom}</span>
                  <span className="font-mono text-xs text-text-muted">{row.publicId}</span>
                </span>
                <span className="flex items-center gap-2.5">
                  <span
                    title="Lecture toujours accordée pour une ressource ajoutée. Utilisez la corbeille pour la retirer."
                    className="flex items-center gap-1 text-xs font-medium text-text-muted"
                  >
                    <Eye className="size-3.5" /> Lecture
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handlers.onToggleWrite(row.publicId, writeActive)}
                    className={clsxm(
                      'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                      writeActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-text-muted hover:border-primary',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    Écriture
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handlers.onRemove(row.publicId)}
                    className="ml-1 text-text-subtle hover:text-accent disabled:opacity-50"
                    aria-label="Retirer la ressource"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </span>
              </div>
              {extra}
            </li>
          )
        })}
      </ul>
    )}
  </div>
)
```

(Le type `SectionHandlers` peut être conservé sans `onAdd`, ou inliné comme ci-dessus. Supprimer `onAdd` de `SectionHandlers` si on garde le type.)

3e. Mettre à jour les appels et supprimer les rendus de modale :

```tsx
{renderSection(
  'Indicateurs',
  data.indicateurs,
  <IndicateurPicker excludedIds={excludedIndicateurs} onSelect={addIndicateur} disabled={disabled} />,
  { onToggleWrite: toggleIndicateurWrite, onRemove: removeIndicateur },
)}
{renderSection(
  'Paniers',
  data.paniers,
  <PanierPicker excludedIds={excludedPaniers} onSelect={addPanier} disabled={disabled} />,
  { onToggleWrite: togglePanierWrite, onRemove: removePanier },
  renderHeritesForPanier,
)}
```

Supprimer entièrement les blocs :
```tsx
{modal === 'indicateur' ? ( <IndicateurSearchModal … /> ) : null}
{modal === 'panier' ? ( <PanierSearchModal … /> ) : null}
```

(`excludedIndicateurs`, `excludedPaniers`, `Button` restent utilisés — `Button` sert encore au déverrouillage PROD.)

- [ ] **Step 4 : Précharger dans `src/routes/_authed/api-keys/$id.tsx`**

Dans le `loader`, ajouter les deux `ensureQueryData` et les imports :

```tsx
import { indicateursAllQueryOptions } from '@/queries/indicateurs'
import { paniersAllQueryOptions } from '@/queries/paniers'
```

```tsx
loader: async ({ context, params }) => {
  await Promise.all([
    context.queryClient.ensureQueryData(apiKeyQueryOptions(params.id)),
    context.queryClient.ensureQueryData(principalPermissionsQueryOptions(params.id)),
    context.queryClient.ensureQueryData(indicateursAllQueryOptions()),
    context.queryClient.ensureQueryData(paniersAllQueryOptions()),
  ])
},
```

- [ ] **Step 5 : Précharger dans `src/routes/_authed/utilisateurs/$id.tsx`**

Même ajout d'imports + `ensureQueryData(indicateursAllQueryOptions())` et `ensureQueryData(paniersAllQueryOptions())` dans le `Promise.all` du loader.

- [ ] **Step 6 : Supprimer les modales et les query options de recherche devenues inutilisées**

```bash
git rm src/components/IndicateurSearchModal.tsx src/components/PanierSearchModal.tsx
```

Dans `src/queries/permissions.ts`, supprimer `searchIndicateursInfiniteQueryOptions` et `searchPaniersInfiniteQueryOptions` ainsi que le commentaire associé, et nettoyer les imports devenus inutiles (`infiniteQueryOptions`, `fetchIndicateurs`, `fetchPaniers` s'ils ne servent plus dans ce fichier). Conserver `principalPermissionsQueryOptions`.

- [ ] **Step 7 : Vérifier**

Run : `pnpm lint`
Expected : PASS (aucune référence résiduelle aux modales / query options supprimées).

- [ ] **Step 8 : Vérif visuelle**

Ouvrir une clé API puis un utilisateur, onglet Permissions : l'ajout d'indicateur et de panier se fait via le Picker (recherche insensible casse/accents), les ressources déjà accordées (directes + indicateurs hérités) sont exclues, l'ajout accorde READ, le verrou PROD désactive le Picker.

- [ ] **Step 9 : Commit**

```bash
git add -A
git commit -m "feat(kpilote-admin): Picker pour indicateurs & paniers dans le panel permission"
```

---

## Self-Review

- **Spec coverage :**
  - Partie A (référentiels via Picker) → Task 2. ✔
  - Partie B indicateurs via Picker (clé API + utilisateur, composant partagé `PrincipalPermissions`) → Task 3. ✔
  - Partie B paniers via Picker → Task 3. ✔
  - Query options « tout charger » indicateurs/paniers → Task 1. ✔
  - Préchargement loaders → Task 3 steps 4-5. ✔
  - Suppression modales + query options de recherche → Task 3 step 6. ✔
- **Type consistency :** wrappers exposent `onSelect: (id/publicId: string) => void` ; items indicateur/panier/référentiel exposent tous `{ id, nom }` (id = publicId). `indicateursAllQueryOptions`/`paniersAllQueryOptions` définis en Task 1, consommés en Task 3. ✔
- **Piège RHF** documenté (Task 2) : ne pas lire `fields[index].id`, utiliser `form.watch`. ✔
- **Placeholders :** aucun TODO/TBD ; tout le code est fourni. ✔
