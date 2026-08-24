import type {
  AnalyticsConfig,
  AnalyticsContexte,
  AnalyticsEvent,
  AnalyticsPageView,
} from './schema'

type ContexteSepare = {
  dimensions: Record<string, string>
  reste: Array<[string, string]>
}

const separerContexte = (
  contexte: AnalyticsContexte,
  slots: Record<string, number>,
): ContexteSepare => {
  const dimensions: Record<string, string> = {}
  const reste: Array<[string, string]> = []

  for (const [cle, valeur] of Object.entries(contexte)) {
    if (valeur === undefined) continue
    const slot = slots[cle]
    if (slot === undefined) reste.push([cle, String(valeur)])
    else dimensions[`dimension${slot}`] = String(valeur)
  }

  reste.sort(([gauche], [droite]) => gauche.localeCompare(droite))
  return { dimensions, reste }
}

const encoderReste = (reste: Array<[string, string]>): string =>
  reste.map(([cle, valeur]) => `${cle}=${valeur}`).join('&')

const parametresDeBase = (config: AnalyticsConfig): Record<string, string> => ({
  idsite: config.siteId,
  rec: '1',
  apiv: '1',
})

export const buildEventRequest = (event: AnalyticsEvent, config: AnalyticsConfig): string => {
  const { dimensions, reste } = separerContexte(
    { ...config.globalContexte, ...event.contexte },
    config.dimensionSlots ?? {},
  )
  const suffixe = encoderReste(reste)

  const params = new URLSearchParams({
    ...parametresDeBase(config),
    ...dimensions,
    e_c: event.category,
    e_a: event.action,
    e_n: suffixe ? `${event.name}?${suffixe}` : event.name,
  })

  if (event.value !== undefined) params.set('e_v', String(event.value))

  return params.toString()
}

export const buildPageViewRequest = (
  pageView: AnalyticsPageView,
  config: AnalyticsConfig,
): string => {
  const { dimensions, reste } = separerContexte(
    { ...config.globalContexte, ...pageView.contexte },
    config.dimensionSlots ?? {},
  )
  const suffixe = encoderReste(reste)

  const params = new URLSearchParams({
    ...parametresDeBase(config),
    ...dimensions,
    url: suffixe
      ? `${config.appUrl}${pageView.path}?${suffixe}`
      : `${config.appUrl}${pageView.path}`,
  })

  if (pageView.title !== undefined) params.set('action_name', pageView.title)

  return params.toString()
}
