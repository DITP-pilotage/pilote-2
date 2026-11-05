import { dashboardSchema } from '@pilote/kpilote-shared/assistant/dashboard'

import { dashboardLabels, resolveDashboardContext } from '@/assistant/tools/dashboard/context'
import {
  buildDashboardPrompt,
  buildDashboardSystemPrompt,
} from '@/assistant/tools/dashboard/prompt'
import { validateDashboard } from '@/assistant/tools/dashboard/validate'
import { type QueryToolDefinition } from '@/assistant/tools/toolDefinition'
import { generateStructured } from '@/framework/llm/albert'

export const createDashboard: QueryToolDefinition<'create_dashboard'> = {
  description: `Compose un dashboard affiché dans la discussion. Il sait afficher, et rien d'autre :
- l'état d'un indicateur pour un individu (dernière valeur, objectif, taux) ;
- le taux d'une collection pour un individu, et les indicateurs qui la composent ;
- la courbe d'un indicateur pour 1 à 5 individus ;
- un tableau comparant un indicateur entre 2 et 20 individus ;
- le minimum, la médiane et le maximum d'un indicateur sur un référentiel ;
- une carte de France d'un indicateur, pour les référentiels qui en ont une.
Les valeurs sont lues par les widgets : passe seulement les identifiants déjà résolus (indicateurs, collections, individus, référentiels) et la demande dans \`task\`.
Utilise-le pour : une courbe, un graphique, une carte, un tableau de bord, « visualise ».
Ne l'utilise pas pour : une question sur des valeurs → les outils de données ; un camembert, un histogramme ou tout affichage hors de cette liste → clarify_with_choices avec ce qui est faisable.
Une erreur liste ce qui a été refusé : corrige les identifiants plutôt que de rappeler à l'identique.`,
  execute: async (input, { abortSignal, context }) => {
    const dashboardContext = await resolveDashboardContext(input)
    const dashboard = await generateStructured({
      name: 'create_dashboard.layout',
      model: context.model,
      system: buildDashboardSystemPrompt(),
      prompt: buildDashboardPrompt(input.task, dashboardContext),
      schema: dashboardSchema,
      trace: context.trace,
      ...(abortSignal ? { abortSignal } : {}),
    })
    validateDashboard(dashboard, dashboardContext)
    return { ...dashboard, labels: await dashboardLabels(dashboardContext) }
  },
}
