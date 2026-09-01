import { Callout } from '@pilote/kpilote-ui/Callout'
import { Component, type ReactNode } from 'react'

// Composant de classe custom plutôt qu'une dépendance pour vingt lignes — ppg a fait le
// même arbitrage. Une vignette en échec ne doit pas emporter la vue entière.
export class FrontiereErreurVignette extends Component<
  { children: ReactNode },
  { enErreur: boolean }
> {
  state = { enErreur: false }

  static getDerivedStateFromError() {
    return { enErreur: true }
  }

  render() {
    if (this.state.enErreur) {
      return <Callout color="warning">Cette vignette n’a pas pu être affichée.</Callout>
    }
    return this.props.children
  }
}
