import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'

import type { Command } from '@/lib/commands/types'

/**
 * Entrée « Demander à l'IA » de la palette. La question tapée est transmise telle quelle
 * avec sa surface : le moteur ne devine rien de l'intention.
 */
export const useAssistantCommand = (
  query: string,
  ouvrirAssistant: (question: string) => void,
): Command =>
  useMemo(() => {
    const question = query.trim()
    return {
      id: 'assistant:ask',
      label: question.length > 0 ? `Demander à l'IA : « ${question} »` : "Demander à l'IA",
      group: 'assistant',
      keywords: ['ia', 'assistant', 'question', 'chat'],
      icon: Sparkles,
      hint: 'Entrée',
      run: () => ouvrirAssistant(question),
    }
  }, [query, ouvrirAssistant])
