import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { userEvent } from "@testing-library/user-event";
import { Tag, TagToggleGroup } from "@/components/shared/Tag";

test("le tag est un bouton qui porte son libellé et lance un évènement au clic", async () => {
  const auClic = vi.fn();

  render(<Tag onClick={auClic}>Texte du tag</Tag>);
  await userEvent.click(screen.getByRole("button", { name: "Texte du tag" }));

  expect(auClic).toHaveBeenCalledTimes(1);
});

test("un groupe de tags à choix unique ne se vide pas quand on reclique le choix actif", async () => {
  const auChangement = vi.fn();

  render(
    <TagToggleGroup.Root
      aria-label="Maille"
      onValueChange={auChangement}
      value="regionale"
    >
      <TagToggleGroup.Item value="regionale">Régions</TagToggleGroup.Item>
      <TagToggleGroup.Item value="departementale">
        Départements
      </TagToggleGroup.Item>
    </TagToggleGroup.Root>,
  );
  await userEvent.click(screen.getByRole("radio", { name: "Régions" }));
  await userEvent.click(screen.getByRole("radio", { name: "Départements" }));

  expect(screen.getByRole("radio", { name: "Régions" })).toBeChecked();
  expect(auChangement).toHaveBeenCalledExactlyOnceWith("departementale");
});
