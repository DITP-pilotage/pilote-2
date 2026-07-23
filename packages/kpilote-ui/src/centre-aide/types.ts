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
