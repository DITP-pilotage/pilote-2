import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; onReset: () => void };
type State = { enErreur: boolean };

export class ErreurChargementBoundary extends Component<Props, State> {
  state: State = { enErreur: false };

  static getDerivedStateFromError(): State {
    return { enErreur: true };
  }

  private reessayer = () => {
    this.props.onReset();
    this.setState({ enErreur: false });
  };

  render() {
    if (!this.state.enErreur) {
      return this.props.children;
    }
    return (
      <div className="fr-alert fr-alert--error">
        <h2 className="fr-alert__title">
          Les indicateurs n'ont pas pu être chargés
        </h2>
        <p>Veuillez réessayer dans quelques instants.</p>
        <button
          className="fr-btn fr-btn--secondary fr-btn--sm fr-mt-2w"
          onClick={this.reessayer}
          type="button"
        >
          Réessayer
        </button>
      </div>
    );
  }
}
