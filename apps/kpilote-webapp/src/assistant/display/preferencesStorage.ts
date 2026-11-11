import { z } from 'zod'

import { ASSISTANT_VIEWS, type AssistantView, type WindowSize } from './views'

const VIEW_KEY = 'kpilote-assistant:vue'
const PANEL_WIDTH_KEY = 'kpilote-assistant:largeurPanneau'
const WINDOW_SIZE_KEY = 'kpilote-assistant:tailleFenetre'

const viewSchema = z.enum(ASSISTANT_VIEWS)
const widthSchema = z.coerce.number().int().positive()
const windowSizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    // Stockage indisponible (navigation privée, données bloquées).
    return null
  }
}

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Stockage indisponible : la préférence n'est simplement pas retenue.
  }
}

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const readViewPreference = (): AssistantView | null => {
  const result = viewSchema.safeParse(read(VIEW_KEY))
  return result.success ? result.data : null
}

export const writeViewPreference = (view: AssistantView): void => write(VIEW_KEY, view)

export const readPanelWidth = (): number | null => {
  const raw = read(PANEL_WIDTH_KEY)
  if (raw === null) return null
  const result = widthSchema.safeParse(raw)
  return result.success ? result.data : null
}

export const writePanelWidth = (width: number): void => write(PANEL_WIDTH_KEY, String(width))

export const readWindowSize = (): WindowSize | null => {
  const raw = read(WINDOW_SIZE_KEY)
  if (raw === null) return null
  const result = windowSizeSchema.safeParse(parseJson(raw))
  return result.success ? result.data : null
}

export const writeWindowSize = (size: WindowSize): void =>
  write(WINDOW_SIZE_KEY, JSON.stringify(size))
