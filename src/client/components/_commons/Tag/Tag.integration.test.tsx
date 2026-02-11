import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { userEvent } from "@testing-library/user-event";
import { Tag } from "@/components/_commons/Tag/Tag";

test("le tag comporte le texte précisé", () => {
  render(<Tag libelle="Texte du tag" onClick={() => {}} />);
  expect(screen.getByText("Texte du tag")).toBeInTheDocument();
});

test("le tag comporte un bouton", () => {
  render(<Tag libelle="Texte du tag" onClick={() => {}} />);
  expect(screen.getByRole("button")).toBeInTheDocument();
});

test("le tag lance un event au clic", async () => {
  const auClicCallback = vi.fn();

  render(<Tag libelle="Texte du tag" onClick={auClicCallback} />);
  await userEvent.click(screen.getByRole("button"));
  expect(auClicCallback).toHaveBeenCalledTimes(1);
});
