import { toBlob } from "html-to-image";

const ATTRIBUT_BLOC_COPIABLE = "data-bloc-copiable";

type BlocCopiable = "texte" | "dashboard";

/**
 * Attribut à poser sur un bloc de la réponse pour l'inclure dans la copie. Les
 * blocs sont assemblés dans l'ordre du DOM, qui est celui des parts du message.
 */
export const marquerBlocCopiable = (bloc: BlocCopiable) => ({
  [ATTRIBUT_BLOC_COPIABLE]: bloc,
});

const estDashboard = (bloc: HTMLElement) =>
  bloc.getAttribute(ATTRIBUT_BLOC_COPIABLE) === "dashboard";

const capturerDashboard = async (element: HTMLElement): Promise<Blob> => {
  const capture = await toBlob(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  if (capture === null) {
    throw new Error("La capture du dashboard a échoué");
  }
  return capture;
};

// Pas de fetch("data:…") : la CSP de l'app (connect-src) le bloque.
const lireEnDataUrl = (capture: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(lecteur.result as string);
    lecteur.onerror = () => reject(lecteur.error);
    lecteur.readAsDataURL(capture);
  });

const convertirTexteEnHtml = (element: HTMLElement): string => {
  const copie = element.cloneNode(true) as HTMLElement;
  copie.querySelectorAll("a").forEach((lien) => {
    lien.setAttribute("href", lien.href);
  });
  copie.querySelectorAll("[class]").forEach((noeud) => {
    noeud.removeAttribute("class");
  });
  return copie.innerHTML;
};

const convertirCaptureEnHtml = async ({
  element,
  capture,
}: {
  element: HTMLElement;
  capture: Blob;
}): Promise<string> => {
  const image = document.createElement("img");
  image.src = await lireEnDataUrl(capture);
  image.alt = "Tableau de bord";
  // L'image est capturée en 2x : on fixe sa largeur d'affichage pour qu'elle
  // ne soit pas collée au double de sa taille à l'écran.
  if (element.offsetWidth > 0) {
    image.width = element.offsetWidth;
  }
  return `<p>${image.outerHTML}</p>`;
};

/**
 * Prépare les formats de la copie. Chaque application de destination choisit
 * celui qu'elle sait lire : un éditeur riche (La Suite Docs) prend le HTML,
 * un outil de dessin (Excalidraw) l'image, un champ simple le texte. Un
 * presse-papier ne porte qu'une image : celle du premier dashboard.
 */
export const construireContenuCopie = ({
  racine,
}: {
  racine: HTMLElement;
}): { html: Promise<string>; image: Promise<Blob> | null } => {
  const blocs = Array.from(
    racine.querySelectorAll<HTMLElement>(`[${ATTRIBUT_BLOC_COPIABLE}]`),
  );
  const captures = new Map(
    blocs.filter(estDashboard).map((bloc) => [bloc, capturerDashboard(bloc)]),
  );

  const html = Promise.all(
    blocs.map(async (bloc) => {
      const capture = captures.get(bloc);
      return capture === undefined
        ? convertirTexteEnHtml(bloc)
        : convertirCaptureEnHtml({ element: bloc, capture: await capture });
    }),
  ).then((fragments) => `<meta charset="utf-8">${fragments.join("")}`);

  const image = captures.values().next().value ?? null;

  return { html, image };
};

/**
 * Les formats sont passés en promesses : Safari n'autorise l'écriture que si
 * `ClipboardItem` est construit pendant le clic, avant la capture asynchrone
 * des dashboards.
 */
export const copierReponse = async ({
  racine,
  texte,
}: {
  racine: HTMLElement;
  texte: string;
}): Promise<void> => {
  const { html, image } = construireContenuCopie({ racine });

  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": html.then(
        (contenu) => new Blob([contenu], { type: "text/html" }),
      ),
      "text/plain": new Blob([texte], { type: "text/plain" }),
      ...(image === null ? {} : { "image/png": image }),
    }),
  ]);
};
