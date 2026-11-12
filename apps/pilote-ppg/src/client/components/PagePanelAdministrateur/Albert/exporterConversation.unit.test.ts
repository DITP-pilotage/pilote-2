import { imprimer } from "@/components/_commons/ChatUI/imprimer";
import { nomConversation } from "@/components/PagePanelAdministrateur/Albert/exporterConversation";

describe("nomConversation", () => {
  test("nomme le document d'après le titre de la conversation", () => {
    // When
    const nom = nomConversation({
      titre: "Qui sont les directeurs de projet du chantier CH-084 ?",
      createdAt: new Date("2026-11-09T10:00:00Z"),
    });

    // Then
    expect(nom).toEqual("qui-sont-les-directeurs-de-projet-du-chantier-ch-084");
  });

  test("sans titre, la nomme d'après sa date de création", () => {
    // When
    const nom = nomConversation({
      titre: "",
      createdAt: new Date("2026-11-09T10:00:00Z"),
    });

    // Then
    expect(nom).toEqual("conversation-2026-11-09");
  });
});

describe("imprimer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    document.title = "";
  });

  test("place l'en-tête demandé au-dessus du contenu imprimé", async () => {
    // Given
    document.body.innerHTML = `<div id="conversation"><p>Première question</p></div>`;
    const appendOriginal = document.body.append.bind(document.body);
    const cadres: HTMLIFrameElement[] = [];
    vi.spyOn(document.body, "append").mockImplementation((...noeuds) => {
      appendOriginal(...noeuds);
      noeuds.forEach((noeud) => {
        if (noeud instanceof HTMLIFrameElement && noeud.contentWindow) {
          cadres.push(noeud);
          noeud.contentWindow.print = () => {};
        }
      });
    });

    // When
    await imprimer({
      contenu: document.getElementById("conversation") as HTMLElement,
      titre: "qui-sont-les-directeurs",
      entete: "Qui sont les directeurs ?",
    });

    // Then
    const corps = cadres[0]?.contentDocument?.body;
    expect(
      [...(corps?.children ?? [])].map((noeud) => noeud.textContent),
    ).toEqual(["Qui sont les directeurs ?", "Première question"]);
  });
});
