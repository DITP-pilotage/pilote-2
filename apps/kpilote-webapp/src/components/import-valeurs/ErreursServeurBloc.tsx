// Erreurs remontées par le serveur au submit (batch invalide / validation).
// Partagé entre l'aperçu format standard et la revue Albert.
export function ErreursServeurBloc({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null

  return (
    <div className="mb-3 rounded-lg border border-red-marianne/30 bg-red-marianne/5 px-4 py-3 text-sm">
      <p className="font-medium text-red-marianne">
        Aucune valeur n'a été appliquée. Corrigez puis réessayez :
      </p>
      <ul className="mt-2 space-y-1">
        {messages.map((message, index) => (
          <li key={index} className="text-text-muted">
            {message}
          </li>
        ))}
      </ul>
    </div>
  )
}
