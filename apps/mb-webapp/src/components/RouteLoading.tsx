type RouteLoadingProps = {
  message?: string
}

export function RouteLoading({ message = 'Chargement…' }: RouteLoadingProps) {
  return (
    <div className="rounded border border-slate-200 bg-white p-6 text-slate-500">
      {message}
    </div>
  )
}
