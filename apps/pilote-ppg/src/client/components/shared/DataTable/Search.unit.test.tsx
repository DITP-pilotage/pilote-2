import { act, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  columnFilteringFeature,
  globalFilteringFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { render } from "@/components/shared/DataTable/testUtils";

type Chantier = { id: string; nom: string };

const hook = createDataTableHook(
  tableFeatures({ columnFilteringFeature, globalFilteringFeature }),
);
const colonnes = (() => {
  const helper = hook.createColumnHelper<Chantier>();
  return helper.columns([helper.accessor("nom", { header: "Nom" })]);
})();

const DELAI_MS = 300;

function Tableau({
  valeurUrl,
  onRecherche,
}: {
  valeurUrl: string;
  onRecherche: (valeur: string) => void;
}) {
  const table = hook.useDataTable({
    data: [],
    columns: colonnes,
    state: { globalFilter: valeurUrl },
    onGlobalFilterChange: (updater) =>
      onRecherche(typeof updater === "function" ? updater(valeurUrl) : updater),
  });
  return <table.Search debounceMs={DELAI_MS} />;
}

const avancer = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("table.Search", () => {
  const onRecherche = vi.fn();
  const utilisateur = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    onRecherche.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("n'envoie la recherche qu'une fois la saisie terminée", async () => {
    render(<Tableau onRecherche={onRecherche} valeurUrl="" />);

    await utilisateur.type(screen.getByRole("searchbox"), "eau");
    expect(onRecherche).not.toHaveBeenCalled();

    avancer(DELAI_MS);
    expect(onRecherche.mock.calls).toEqual([["eau"]]);
  });

  it("conserve la saisie en cours quand l'URL reçoit la recherche précédente", async () => {
    const { rerender } = render(
      <Tableau onRecherche={onRecherche} valeurUrl="" />,
    );
    const champ = screen.getByRole("searchbox");
    await utilisateur.type(champ, "ea");
    avancer(DELAI_MS);

    await utilisateur.type(champ, "u");
    rerender(<Tableau onRecherche={onRecherche} valeurUrl="ea" />);

    expect(champ).toHaveValue("eau");
  });

  it("reprend la valeur de l'URL quand elle change d'ailleurs et abandonne la saisie en attente", async () => {
    const { rerender } = render(
      <Tableau onRecherche={onRecherche} valeurUrl="eau" />,
    );
    const champ = screen.getByRole("searchbox");
    await utilisateur.type(champ, "x");

    rerender(<Tableau onRecherche={onRecherche} valeurUrl="" />);
    avancer(DELAI_MS);

    expect(champ).toHaveValue("");
    expect(onRecherche).not.toHaveBeenCalled();
  });
});
