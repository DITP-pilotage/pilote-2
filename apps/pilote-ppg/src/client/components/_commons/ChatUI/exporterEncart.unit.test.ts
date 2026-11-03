import {
  imprimerEncart,
  nomEncart,
} from "@/components/_commons/ChatUI/exporterEncart";

describe("nomEncart", () => {
  test("nomme le document d'après le titre de l'encart", () => {
    // When
    const nom = nomEncart({
      markdown: "# Synthèse pour le Nord\n\nDans PILOTE…",
      type: "synthese",
      dateRedaction: "2026-10-27",
    });

    // Then
    expect(nom).toEqual("synthese-pour-le-nord");
  });

  test("sans titre, le nomme d'après son type et sa date", () => {
    // When
    const nom = nomEncart({
      markdown: "Dans PILOTE…",
      type: "comparaison",
      dateRedaction: "2026-10-27",
    });

    // Then
    expect(nom).toEqual("comparaison-territoriale-2026-10-27");
  });
});

// jsdom n'imprime pas : le cadre reçoit l'impression du test.
const intercepterImpression = (print: (fenetre: Window) => void) => {
  const appendOriginal = document.body.append.bind(document.body);
  vi.spyOn(document.body, "append").mockImplementation((...noeuds) => {
    appendOriginal(...noeuds);
    noeuds.forEach((noeud) => {
      if (noeud instanceof HTMLIFrameElement && noeud.contentWindow) {
        const fenetre = noeud.contentWindow;
        fenetre.print = () => print(fenetre);
      }
    });
  });
};

describe("imprimerEncart", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    document.title = "";
  });

  test("imprime l'encart avec les styles de la page, sans ses boutons", async () => {
    // Given
    document.title = "PILOTE";
    document.head.innerHTML = "<style>.albert-markdown { color: red; }</style>";
    document.body.innerHTML = `
      <article id="encart">
        <p>Synthèse pour le Nord</p>
        <footer data-hors-impression><button>Copier</button></footer>
      </article>`;
    const print = vi.fn();
    intercepterImpression(print);

    // When
    await imprimerEncart({
      encart: document.getElementById("encart") as HTMLElement,
      titre: "synthese-pour-le-nord",
    });

    // Then
    const impression = document.querySelector("iframe")?.contentDocument;
    expect(print).toHaveBeenCalledOnce();
    expect(impression?.title).toEqual("synthese-pour-le-nord");
    expect(document.title).toEqual("synthese-pour-le-nord");
    expect(impression?.head.textContent).toContain(
      ".albert-markdown { color: red; }",
    );
    expect(impression?.body.textContent).toContain("Synthèse pour le Nord");
    expect(impression?.body.textContent).not.toContain("Copier");
  });

  test("une fois imprimé, retire le cadre et rend son titre à la page", async () => {
    // Given
    document.title = "PILOTE";
    document.body.innerHTML = `<article id="encart">Synthèse</article>`;
    intercepterImpression((fenetre) =>
      fenetre.dispatchEvent(new Event("afterprint")),
    );

    // When
    await imprimerEncart({
      encart: document.getElementById("encart") as HTMLElement,
      titre: "synthese",
    });

    // Then
    expect(document.querySelector("iframe")).toBeNull();
    expect(document.title).toEqual("PILOTE");
  });
});
