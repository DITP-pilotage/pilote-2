// Pointes de flèche des arêtes, éteinte et allumée, référencées par `url(#fleche-…)`.
export function ArrowMarkers() {
  return (
    <defs>
      {(['off', 'on'] as const).map((state) => (
        <marker
          key={state}
          id={`fleche-${state}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M0,0 L10,5 L0,10 z"
            className={state === 'on' ? 'fill-primary' : 'fill-border-strong'}
          />
        </marker>
      ))}
    </defs>
  )
}
