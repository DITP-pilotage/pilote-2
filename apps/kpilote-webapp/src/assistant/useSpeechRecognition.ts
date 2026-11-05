import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionState = 'inactive' | 'listening'

const recognitionConstructor = () =>
  typeof window === 'undefined'
    ? undefined
    : (window.SpeechRecognition ?? window.webkitSpeechRecognition)

/**
 * La dictée du navigateur (Chrome, Edge, Safari) : chaque phrase reconnue est passée à
 * `onTranscript`. Absente de Firefox, d'où `isSupported`.
 */
export const useSpeechRecognition = ({
  onTranscript,
  lang = 'fr-FR',
}: {
  onTranscript: (text: string) => void
  lang?: string
}) => {
  const isSupported = recognitionConstructor() !== undefined
  const [state, setState] = useState<SpeechRecognitionState>('inactive')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  // Arrêtée, la reconnaissance ne finit qu'à `onend` : la relancer avant lèverait une erreur.
  const active = useRef(false)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const toggle = useCallback(() => {
    if (state === 'listening') {
      recognitionRef.current?.stop()
      setState('inactive')
      return
    }

    if (active.current) return

    if (!recognitionRef.current) {
      const Recognition = recognitionConstructor()
      if (!Recognition) return
      const recognition = new Recognition()
      recognition.lang = lang
      recognition.continuous = true
      recognition.interimResults = false
      recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index++) {
          const result = event.results[index]
          if (result?.isFinal && result[0]) onTranscriptRef.current(result[0].transcript)
        }
      }
      recognition.onerror = () => setState('inactive')
      recognition.onend = () => {
        active.current = false
        setState('inactive')
      }
      recognitionRef.current = recognition
    }

    recognitionRef.current.start()
    active.current = true
    setState('listening')
  }, [lang, state])

  // À l'envoi : `abort` jette ce qui n'est pas encore reconnu, qui sinon viendrait remplir
  // le champ qu'on vient de vider.
  const cancel = useCallback(() => {
    recognitionRef.current?.abort()
    setState('inactive')
  }, [])

  return { state, isSupported, toggle, cancel }
}
