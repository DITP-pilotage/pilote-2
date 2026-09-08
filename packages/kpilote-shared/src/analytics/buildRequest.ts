import type {
  AnalyticsConfig,
  AnalyticsContext,
  AnalyticsEvent,
  AnalyticsPage,
  AnalyticsPageView,
} from './schema'

type SplitContext = {
  dimensions: Record<string, string>
  rest: Array<[string, string]>
}

const splitContext = (context: AnalyticsContext, slots: Record<string, number>): SplitContext => {
  const dimensions: Record<string, string> = {}
  const rest: Array<[string, string]> = []

  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue
    const slot = slots[key]
    if (slot === undefined) rest.push([key, String(value)])
    else dimensions[`dimension${slot}`] = String(value)
  }

  rest.sort(([left], [right]) => left.localeCompare(right))
  return { dimensions, rest }
}

const encodeRest = (rest: Array<[string, string]>): string =>
  rest.map(([key, value]) => `${key}=${value}`).join('&')

const baseParams = (config: AnalyticsConfig): Record<string, string> => ({
  idsite: config.siteId,
  rec: '1',
  apiv: '1',
})

export const buildEventRequest = (
  event: AnalyticsEvent,
  config: AnalyticsConfig,
  page?: AnalyticsPage,
): string => {
  const { dimensions, rest } = splitContext(
    { ...config.globalContext, ...event.context },
    config.dimensionSlots ?? {},
  )
  const suffix = encodeRest(rest)

  const params = new URLSearchParams({
    ...baseParams(config),
    ...dimensions,
    e_c: event.category,
    e_a: event.action,
    e_n: suffix ? `${event.name}?${suffix}` : event.name,
  })

  if (event.value !== undefined) params.set('e_v', String(event.value))

  // Sans page, Matomo enregistre l'événement hors de tout parcours : impossible
  // de segmenter « quels événements sur quelle page ». Le contexte reste replié
  // dans `e_n`, l'URL ne porte donc que le motif de route.
  if (page) {
    params.set('url', `${config.appUrl}${page.path}`)
    if (page.title !== undefined) params.set('action_name', page.title)
  }

  return params.toString()
}

export const buildPageViewRequest = (
  pageView: AnalyticsPageView,
  config: AnalyticsConfig,
): string => {
  const { dimensions, rest } = splitContext(
    { ...config.globalContext, ...pageView.context },
    config.dimensionSlots ?? {},
  )
  const suffix = encodeRest(rest)

  const params = new URLSearchParams({
    ...baseParams(config),
    ...dimensions,
    url: suffix ? `${config.appUrl}${pageView.path}?${suffix}` : `${config.appUrl}${pageView.path}`,
  })

  if (pageView.title !== undefined) params.set('action_name', pageView.title)

  return params.toString()
}
