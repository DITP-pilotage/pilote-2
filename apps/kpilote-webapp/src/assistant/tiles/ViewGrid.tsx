import { COLUMNS_BY_WIDTH, type Tile, type View } from '@pilote/kpilote-shared/assistant/tiles'
import { Heading } from '@pilote/kpilote-ui/Typography'
import { Suspense, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

import { TILE_REGISTRY } from './registry'
import { TileErrorBoundary } from './TileErrorBoundary'

// Grille propre à l'assistant : `CardGrid` de kpilote-ui fixe trois colonnes sans contrôle de
// portée, elle ne peut pas porter third / half / full.
const SPANS: Record<number, string> = {
  2: 'col-span-6 sm:col-span-3 lg:col-span-2',
  3: 'col-span-6 sm:col-span-6 lg:col-span-3',
  6: 'col-span-6',
}

const render = (tile: Tile): ReactNode => {
  // Le registre est indexé par le type ; l'union garantit que la tuile lui correspond.
  const renderTile = TILE_REGISTRY[tile.type] as (t: Tile) => ReactNode
  return renderTile(tile)
}

export function ViewGrid({ view }: { view: View }) {
  return (
    <section aria-label={view.title} className="mt-4">
      <Heading as="h3">{view.title}</Heading>
      <div className="mt-3 grid grid-cols-6 gap-4">
        {view.tiles.map((tile, index) => (
          <div key={index} className={clsxm('min-w-0', SPANS[COLUMNS_BY_WIDTH[tile.width]])}>
            <TileErrorBoundary>
              <Suspense fallback={<div className="h-24 animate-pulse rounded bg-surface" />}>
                {render(tile)}
              </Suspense>
            </TileErrorBoundary>
          </div>
        ))}
      </div>
    </section>
  )
}
