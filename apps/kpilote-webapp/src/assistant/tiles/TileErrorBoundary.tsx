import { Callout } from '@pilote/kpilote-ui/Callout'
import { Component, type ReactNode } from 'react'

// Composant de classe custom plutôt qu'une dépendance pour vingt lignes — ppg a fait le
// même arbitrage. Une tuile en échec ne doit pas emporter la vue entière.
export class TileErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <Callout color="warning">Cette tuile n'a pas pu être affichée.</Callout>
    }
    return this.props.children
  }
}
