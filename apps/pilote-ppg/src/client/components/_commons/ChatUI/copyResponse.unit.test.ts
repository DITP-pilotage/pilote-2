import { copyDashboardImage } from "@/components/_commons/ChatUI/copyResponse";

vi.mock("html-to-image", () => ({
  toBlob: async () => new Blob(["png"], { type: "image/png" }),
}));

class FakeClipboardItem {
  readonly items: Record<string, Promise<Blob>>;

  constructor(items: Record<string, Promise<Blob>>) {
    this.items = items;
  }
}

describe("copyDashboardImage", () => {
  const write = vi.fn<(items: FakeClipboardItem[]) => Promise<void>>();

  beforeEach(() => {
    write.mockReset().mockResolvedValue();
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    vi.stubGlobal("navigator", { clipboard: { write } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("copie seulement l'image du dashboard, sans le texte de la réponse", async () => {
    // Given
    const root = document.createElement("div");
    root.innerHTML = [
      `<p>Voici le tableau de bord demandé.</p>`,
      `<div data-copyable-dashboard=""><h3>Dashboard Sarthe</h3></div>`,
    ].join("");

    // When
    await copyDashboardImage({ root });

    // Then
    const [[[item]]] = write.mock.calls;
    expect(Object.keys(item.items)).toEqual(["image/png"]);
    expect((await item.items["image/png"]).type).toStrictEqual("image/png");
  });

  test("échoue quand la réponse n'a pas de dashboard", async () => {
    // Given
    const root = document.createElement("div");
    root.innerHTML = `<p>Réponse</p>`;

    // When
    const copy = copyDashboardImage({ root });

    // Then
    await expect(copy).rejects.toThrow(
      "La réponse ne contient pas de dashboard",
    );
    expect(write).not.toHaveBeenCalled();
  });
});
