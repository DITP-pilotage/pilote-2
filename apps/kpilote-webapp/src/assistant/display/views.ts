export const ASSISTANT_VIEWS = ['fullscreen', 'centered', 'sidePanel', 'floating'] as const

export type AssistantView = (typeof ASSISTANT_VIEWS)[number]

export type AssistantDisplay = AssistantView | 'minimized'

export type ScreenSize = 'narrow' | 'medium' | 'wide'

// Le panneau prend sa largeur à la page : il faut un écran large pour que les pages gardent
// la largeur pour laquelle elles sont conçues. La fenêtre flottante, elle, se pose dessus.
const VIEWS_BY_SIZE: Record<ScreenSize, readonly AssistantView[]> = {
  narrow: ['fullscreen'],
  medium: ['floating', 'centered', 'fullscreen'],
  wide: ['floating', 'sidePanel', 'centered', 'fullscreen'],
}

const FALLBACK: Record<AssistantView, AssistantView | null> = {
  sidePanel: 'floating',
  floating: 'fullscreen',
  centered: 'fullscreen',
  fullscreen: null,
}

export const viewsFor = (size: ScreenSize): readonly AssistantView[] => VIEWS_BY_SIZE[size]

/**
 * Une vue qui ne tient pas sur l'écran se replie sur la suivante, sans que la vue demandée
 * soit oubliée pour un écran plus large.
 */
export const effectiveView = (display: AssistantDisplay, size: ScreenSize): AssistantDisplay => {
  if (display === 'minimized') return display
  let view: AssistantView | null = display
  while (view && !viewsFor(size).includes(view)) view = FALLBACK[view]
  return view ?? 'fullscreen'
}

/** Plein écran et centrée sont modales : la page reste derrière, inaccessible. */
export const hidesPage = (display: AssistantDisplay): boolean =>
  display === 'fullscreen' || display === 'centered'

export const PANEL_WIDTH = { min: 400, max: 720, default: 520 } as const

// Ce que le panneau laisse au moins à la page.
export const MIN_PAGE_WIDTH = 900

export const boundPanelWidth = (width: number, viewportWidth: number): number => {
  const max = Math.max(PANEL_WIDTH.min, Math.min(PANEL_WIDTH.max, viewportWidth - MIN_PAGE_WIDTH))
  return Math.round(Math.min(max, Math.max(PANEL_WIDTH.min, width)))
}

export const WINDOW_SIZE = {
  width: { min: 360, max: 720, default: 440 },
  height: { min: 400, default: 896 },
} as const

// Marge entre la fenêtre et les bords de l'écran (bottom-4 / right-4).
export const WINDOW_MARGIN = 16

export type WindowSize = { width: number; height: number }

const bound = (value: number, min: number, max: number) =>
  Math.round(Math.min(Math.max(min, max), Math.max(min, value)))

/** Ancrée en bas à droite, la fenêtre grandit vers le haut et la gauche sans sortir de l'écran. */
export const boundWindowSize = (size: WindowSize, viewport: WindowSize): WindowSize => ({
  width: bound(
    size.width,
    WINDOW_SIZE.width.min,
    Math.min(WINDOW_SIZE.width.max, viewport.width - 2 * WINDOW_MARGIN),
  ),
  height: bound(size.height, WINDOW_SIZE.height.min, viewport.height - 2 * WINDOW_MARGIN),
})
