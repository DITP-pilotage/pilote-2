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
const columns = (() => {
  const helper = hook.createColumnHelper<Chantier>();
  return helper.columns([helper.accessor("nom", { header: "Nom" })]);
})();

const DELAY_MS = 300;

function Table({
  urlValue,
  onSearch,
}: {
  urlValue: string;
  onSearch: (value: string) => void;
}) {
  const table = hook.useDataTable({
    data: [],
    columns: columns,
    state: { globalFilter: urlValue },
    onGlobalFilterChange: (updater) =>
      onSearch(typeof updater === "function" ? updater(urlValue) : updater),
  });
  return <table.Search debounceMs={DELAY_MS} />;
}

function UrlTable({ manualFiltering }: { manualFiltering: boolean }) {
  const table = hook.useDataTable({
    data: [],
    columns: columns,
    manualFiltering,
    urlState: { globalFilter: true },
  });
  return (
    <>
      <table.Search />
      <output>{table.store.state.globalFilter}</output>
    </>
  );
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("table.Search", () => {
  const onSearch = vi.fn();
  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    onSearch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("n'envoie la recherche qu'une fois la saisie terminée", async () => {
    render(<Table onSearch={onSearch} urlValue="" />);

    await user.type(screen.getByRole("searchbox"), "eau");
    expect(onSearch).not.toHaveBeenCalled();

    advance(DELAY_MS);
    expect(onSearch.mock.calls).toEqual([["eau"]]);
  });

  it("conserve la saisie en cours quand l'URL reçoit la recherche précédente", async () => {
    const { rerender } = render(<Table onSearch={onSearch} urlValue="" />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "ea");
    advance(DELAY_MS);

    await user.type(input, "u");
    rerender(<Table onSearch={onSearch} urlValue="ea" />);

    expect(input).toHaveValue("eau");
  });

  it("reprend la valeur de l'URL quand elle change d'ailleurs et abandonne la saisie en attente", async () => {
    const { rerender } = render(<Table onSearch={onSearch} urlValue="eau" />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "x");

    rerender(<Table onSearch={onSearch} urlValue="" />);
    advance(DELAY_MS);

    expect(input).toHaveValue("");
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("attend une pause de frappe quand le serveur filtre le tableau", async () => {
    render(<UrlTable manualFiltering />);

    await user.type(screen.getByRole("searchbox"), "eau");
    expect(screen.getByRole("status")).toHaveTextContent("");

    advance(DELAY_MS);
    expect(screen.getByRole("status")).toHaveTextContent("eau");
  });

  it("applique la recherche à chaque frappe quand le tableau filtre côté client", async () => {
    render(<UrlTable manualFiltering={false} />);

    await user.type(screen.getByRole("searchbox"), "e");

    expect(screen.getByRole("status")).toHaveTextContent("e");
  });
});
