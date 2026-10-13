import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/shared/ProgressBar";

describe("ProgressBar", () => {
  test("affiche le pourcentage arrondi à côté de la barre", () => {
    render(<ProgressBar size="sm" value={20.4} variant="primary" />);

    expect(screen.getByText("20 %")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "20.4",
    );
  });

  test("affiche un tiret quand il n'y a pas de valeur", () => {
    render(<ProgressBar size="sm" value={null} variant="primary" />);

    expect(screen.getByText("- %")).toBeInTheDocument();
  });

  test("n'affiche pas le pourcentage quand le libellé est masqué", () => {
    render(
      <ProgressBar showLabel={false} size="sm" value={20} variant="primary" />,
    );

    expect(screen.queryByText("20 %")).not.toBeInTheDocument();
  });

  test("place le pourcentage au-dessus de la barre", () => {
    const { container } = render(
      <ProgressBar
        labelPosition="top"
        size="sm"
        value={20}
        variant="primary"
      />,
    );

    expect(container.firstChild).toHaveClass("flex-col-reverse");
  });
});
