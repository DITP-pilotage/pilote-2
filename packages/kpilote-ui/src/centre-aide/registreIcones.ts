import {
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  Lightbulb,
  Flag,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react'

export const registreIcones: Record<string, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
  idea: Lightbulb,
  flag: Flag,
  question: CircleHelp,
}

export const TYPES_ICONE = Object.keys(registreIcones)
