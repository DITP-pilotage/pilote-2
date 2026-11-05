// La dictée n'est pas dans lib.dom : seul ce dont `useSpeechRecognition` se sert est déclaré.
export declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: Event) => void) | null
    onend: (() => void) | null
    start(): void
    stop(): void
    abort(): void
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}
