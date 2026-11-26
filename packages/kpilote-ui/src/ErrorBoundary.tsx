import { Component, type ReactNode } from 'react'

// Garde une erreur de rendu (requête en échec sous Suspense) dans son cadre : le
// reste de la page s'affiche, la zone fautive montre `fallback`.
export class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
