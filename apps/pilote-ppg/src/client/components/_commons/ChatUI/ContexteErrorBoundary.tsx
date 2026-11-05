import { Component, ErrorInfo, ReactNode } from "react";

type Props = { children: ReactNode; fallback: ReactNode };
type State = { error: Error | null };

/**
 * Un résultat d'outil d'un format que le panneau de contexte ne connaît pas
 * (conversation enregistrée avant un changement d'outil) ne doit casser ni le
 * panneau, ni la conversation.
 */
export class ContexteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Panneau de contexte de l'assistant", error, info);
  }

  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}
