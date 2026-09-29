import { act, renderHook, waitFor } from "@testing-library/react";
import {
  withNuqsTestingAdapter,
  type UrlUpdateEvent,
} from "nuqs/adapters/testing";
import {
  type UrlStateConfig,
  useUrlTableState,
} from "@/components/shared/DataTable/urlState";

const config: UrlStateConfig = {
  sorting: { default: [{ id: "updatedAt", desc: true }] },
  pagination: { pageSize: 20 },
  globalFilter: true,
  columnFilters: [
    { param: "statut", columnId: "statut", default: ["actif"] },
    { param: "critere", columnId: "critereId" },
  ],
};

const rendre = (searchParams = "") => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const rendu = renderHook(() => useUrlTableState(config), {
    wrapper: withNuqsTestingAdapter({
      searchParams,
      onUrlUpdate,
      hasMemory: true,
    }),
  });
  const derniereUrl = () =>
    onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.toString() ?? "";
  return { ...rendu, derniereUrl };
};

describe("useUrlTableState", () => {
  it("lit l'état du tableau depuis l'URL, page en base 1", () => {
    const { result } = rendre(
      "?sort=rattachement.code.desc&page=3&pageSize=50&q=eau&critere=a,b",
    );

    expect(result.current.state).toEqual({
      sorting: [{ id: "rattachement.code", desc: true }],
      pagination: { pageIndex: 2, pageSize: 50 },
      globalFilter: "eau",
      columnFilters: [
        { id: "statut", value: ["actif"] },
        { id: "critereId", value: ["a", "b"] },
      ],
    });
  });

  it("revient au tri par défaut quand le paramètre de tri est invalide", () => {
    const { result } = rendre("?sort=nom.haut");

    expect(result.current.state.sorting).toEqual([
      { id: "updatedAt", desc: true },
    ]);
  });

  it.each(["?sort=nom.constructor", "?sort=nom.toString"])(
    "ignore un sens de tri issu du prototype (%s)",
    (searchParams) => {
      const { result } = rendre(searchParams);

      expect(result.current.state.sorting).toEqual([
        { id: "updatedAt", desc: true },
      ]);
    },
  );

  it("n'accepte que les critères de tri listés quand des libellés sont fournis", () => {
    const rendreAvecCriteres = (searchParams: string) =>
      renderHook(
        () =>
          useUrlTableState({
            sorting: {
              default: [{ id: "avancement", desc: false }],
              labels: { avancement: "Taux d'avancement", météo: "Météo" },
            },
          }),
        { wrapper: withNuqsTestingAdapter({ searchParams }) },
      ).result.current.state.sorting;

    expect(rendreAvecCriteres("?sort=météo.desc")).toEqual([
      { id: "météo", desc: true },
    ]);
    expect(rendreAvecCriteres("?sort=nom.asc")).toEqual([
      { id: "avancement", desc: false },
    ]);
  });

  it("revient au tri par défaut quand le tri est retiré", async () => {
    const { result, derniereUrl } = rendre("?sort=nom.asc");

    act(() => result.current.handlers.onSortingChange?.([]));

    expect(result.current.state.sorting).toEqual([
      { id: "updatedAt", desc: true },
    ]);
    await waitFor(() => expect(derniereUrl()).toBe(""));
  });

  it("écrit le tri au format colonne.sens", async () => {
    const { result, derniereUrl } = rendre();

    act(() =>
      result.current.handlers.onSortingChange?.([{ id: "nom", desc: false }]),
    );

    await waitFor(() => expect(derniereUrl()).toBe("sort=nom.asc"));
  });

  it("revient à la première page quand le tri change", async () => {
    const { result, derniereUrl } = rendre("?page=4");

    act(() =>
      result.current.handlers.onSortingChange?.([{ id: "nom", desc: false }]),
    );

    await waitFor(() => expect(derniereUrl()).toBe("sort=nom.asc"));
  });

  it("revient à la première page quand un filtre change", async () => {
    const { result, derniereUrl } = rendre("?page=4");

    act(() =>
      result.current.handlers.onColumnFiltersChange?.((filtres) => [
        ...filtres,
        { id: "critereId", value: ["a"] },
      ]),
    );

    await waitFor(() => expect(derniereUrl()).toBe("critere=a"));
  });

  it("cumule deux mises à jour de filtres successives", async () => {
    const { result, derniereUrl } = rendre("?critere=a");

    act(() => {
      result.current.handlers.onColumnFiltersChange?.((filtres) =>
        filtres.filter((filtre) => filtre.id !== "critereId"),
      );
      result.current.handlers.onColumnFiltersChange?.((filtres) =>
        filtres.map((filtre) =>
          filtre.id === "statut" ? { ...filtre, value: ["inactif"] } : filtre,
        ),
      );
    });

    await waitFor(() => expect(derniereUrl()).toBe("statut=inactif"));
  });

  it("garde un filtre vidé même quand sa valeur par défaut est non vide", () => {
    const { result } = rendre();

    act(() =>
      result.current.handlers.onColumnFiltersChange?.((filtres) =>
        filtres.filter((filtre) => filtre.id !== "statut"),
      ),
    );

    expect(result.current.state.columnFilters).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("réinitialise filtres et recherche à leurs valeurs par défaut", () => {
    const { result } = rendre("?statut=inactif&q=eau&page=2");

    act(() => result.current.resetFilters());

    expect(result.current.state.columnFilters).toEqual([
      { id: "statut", value: ["actif"] },
    ]);
    expect(result.current.state.globalFilter).toBe("");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
