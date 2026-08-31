import {
  COLONNES_PAR_LARGEUR,
  type Vignette,
  type Vue,
} from '@pilote/kpilote-shared/assistant/vignettes'
import { Heading } from '@pilote/kpilote-ui/Typography'
import { Suspense, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

import { FrontiereErreurVignette } from './FrontiereErreurVignette'
import { REGISTRE_VIGNETTES } from './registre'

// Grille propre à l'assistant : `CardGrid` de kpilote-ui fixe trois colonnes sans contrôle de
// portée, elle ne peut pas porter tiers / moitie / pleine.
const PORTEES: Record<number, string> = {
  2: 'col-span-6 sm:col-span-3 lg:col-span-2',
  3: 'col-span-6 sm:col-span-6 lg:col-span-3',
  6: 'col-span-6',
}

const rendre = (vignette: Vignette): ReactNode => {
  // Le registre est indexé par le type ; l'union garantit que la vignette lui correspond.
  const rendu = REGISTRE_VIGNETTES[vignette.type] as (v: Vignette) => ReactNode
  return rendu(vignette)
}

export function GrilleVue({ vue }: { vue: Vue }) {
  return (
    <section aria-label={vue.titre} className="mt-4">
      <Heading as="h3">{vue.titre}</Heading>
      <div className="mt-3 grid grid-cols-6 gap-4">
        {vue.vignettes.map((vignette, index) => (
          <div
            key={index}
            className={clsxm('min-w-0', PORTEES[COLONNES_PAR_LARGEUR[vignette.largeur]])}
          >
            <FrontiereErreurVignette>
              <Suspense fallback={<div className="h-24 animate-pulse rounded bg-surface" />}>
                {rendre(vignette)}
              </Suspense>
            </FrontiereErreurVignette>
          </div>
        ))}
      </div>
    </section>
  )
}
