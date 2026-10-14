import { toBlob } from "html-to-image";

const COPYABLE_BLOCK_ATTRIBUTE = "data-copyable-block";

type CopyableBlock = "text" | "dashboard";

/**
 * Attribut à poser sur un bloc de la réponse pour l'inclure dans la copie. Les
 * blocs sont assemblés dans l'ordre du DOM, qui est celui des parts du message.
 */
export const markCopyableBlock = (block: CopyableBlock) => ({
  [COPYABLE_BLOCK_ATTRIBUTE]: block,
});

const isDashboard = (block: HTMLElement) =>
  block.getAttribute(COPYABLE_BLOCK_ATTRIBUTE) === "dashboard";

const captureDashboard = async (element: HTMLElement): Promise<Blob> => {
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
const readAsDataUrl = (capture: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(capture);
  });

const convertTextToHtml = (element: HTMLElement): string => {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("a").forEach((link) => {
    link.setAttribute("href", link.href);
  });
  clone.querySelectorAll("[class]").forEach((node) => {
    node.removeAttribute("class");
  });
  return clone.innerHTML;
};

const convertCaptureToHtml = async ({
  element,
  capture,
}: {
  element: HTMLElement;
  capture: Blob;
}): Promise<string> => {
  const image = document.createElement("img");
  image.src = await readAsDataUrl(capture);
  image.alt = "Tableau de bord";
  // L'image est capturée en 2x : on fixe sa largeur d'affichage pour qu'elle
  // ne soit pas collée au double de sa taille à l'écran.
  if (element.offsetWidth > 0) {
    image.width = element.offsetWidth;
  }
  return `<p>${image.outerHTML}</p>`;
};

/**
 * Prépare la copie riche d'une réponse qui contient au moins un dashboard ;
 * `null` sinon, la réponse se copie alors en texte brut comme avant.
 *
 * Pourquoi du HTML : l'application où l'on colle ne lit qu'UN des formats du
 * presse-papier. Le HTML est le seul qui porte le texte ET le dashboard (en
 * <img>) dans un même collage. L'image seule sert les applications qui ne
 * lisent pas le HTML (Excalidraw, Slack…) ; elle ne porte que le premier
 * dashboard.
 *
 * Réserve, à vérifier dans La Suite Docs : son éditeur (BlockNote) colle par
 * défaut avec `prioritizeMarkdownOverHTML`. Si le texte brut ressemble à du
 * Markdown (gras, listes…), il colle ce Markdown et ignore le HTML, donc le
 * dashboard.
 */
export const buildContentCopy = ({
  root,
}: {
  root: HTMLElement;
}): { html: Promise<string>; image: Promise<Blob> } | null => {
  const blocks = Array.from(
    root.querySelectorAll<HTMLElement>(`[${COPYABLE_BLOCK_ATTRIBUTE}]`),
  );
  const captures = new Map(
    blocks.filter(isDashboard).map((block) => [block, captureDashboard(block)]),
  );

  const image = captures.values().next().value;
  if (image === undefined) {
    return null;
  }

  const html = Promise.all(
    blocks.map(async (block) => {
      const capture = captures.get(block);
      return capture === undefined
        ? convertTextToHtml(block)
        : convertCaptureToHtml({ element: block, capture: await capture });
    }),
  ).then((fragments) => `<meta charset="utf-8">${fragments.join("")}`);

  return { html, image };
};

/**
 * Les formats sont passés en promesses : Safari n'autorise l'écriture que si
 * `ClipboardItem` est construit pendant le clic, avant la capture asynchrone
 * des dashboards.
 */
export const copyResponse = async ({
  root,
  text,
}: {
  root: HTMLElement;
  text: string;
}): Promise<void> => {
  const content = buildContentCopy({ root });

  if (content === null) {
    await navigator.clipboard.writeText(text);
    return;
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": content.html.then(
        (html) => new Blob([html], { type: "text/html" }),
      ),
      "text/plain": new Blob([text], { type: "text/plain" }),
      "image/png": content.image,
    }),
  ]);
};
