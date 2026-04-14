import { Component, ErrorInfo, ReactNode } from "react";
import { DashboardWidgetError } from "./DashboardWidgetError";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class DashboardWidgetErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("DashboardWidget error", error, info);
  }

  render() {
    if (this.state.error) {
      return <DashboardWidgetError error={this.state.error} />;
    }
    return this.props.children;
  }
}
