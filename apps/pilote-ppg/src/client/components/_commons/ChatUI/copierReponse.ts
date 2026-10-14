import { toPng } from "html-to-image";

const ATTRIBUT_BLOC_COPIABLE = "data-bloc-copiable";

type BlocCopiable = "texte" | "dashboard";

/**
 * Attribut à poser sur un bloc de la réponse pour l'inclure dans la copie. Les
 * blocs sont assemblés dans l'ordre du DOM, qui est celui des parts du message.
 */
export const marquerBlocCopiable = (bloc: BlocCopiable) => ({
  [ATTRIBUT_BLOC_COPIABLE]: bloc,
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

const convertirDashboardEnHtml = async (
  element: HTMLElement,
): Promise<string> => {
  const image = document.createElement("img");
  image.src = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  image.alt = "Tableau de bord";
  // L'image est capturée en 2x : on fixe sa largeur d'affichage pour qu'elle
  // ne soit pas collée au double de sa taille à l'écran.
  if (element.offsetWidth > 0) {
    image.width = element.offsetWidth;
  }
  return `<p>${image.outerHTML}</p>`;
};

export const construireHtmlReponse = async ({
  racine,
}: {
  racine: HTMLElement;
}): Promise<string> => {
  const blocs = Array.from(
    racine.querySelectorAll<HTMLElement>(`[${ATTRIBUT_BLOC_COPIABLE}]`),
  );
  const fragments = await Promise.all(
    blocs.map((bloc) =>
      bloc.getAttribute(ATTRIBUT_BLOC_COPIABLE) === "dashboard"
        ? convertirDashboardEnHtml(bloc)
        : convertirTexteEnHtml(bloc),
    ),
  );
  return `<meta charset="utf-8">${fragments.join("")}`;
};

/**
 * Copie la réponse en HTML (texte mis en forme + dashboards en image) pour les
 * éditeurs riches, et en texte brut pour les autres. Le HTML est passé en
 * promesse : Safari n'autorise l'écriture que si `ClipboardItem` est construit
 * pendant le clic, avant la capture asynchrone des dashboards.
 */
export const copierReponse = async ({
  racine,
  texte,
}: {
  racine: HTMLElement;
  texte: string;
}): Promise<void> => {
  await navigator.clipboard.write([
    new ClipboardItem({
      "text/html": construireHtmlReponse({ racine }).then(
        (html) => new Blob([html], { type: "text/html" }),
      ),
      "text/plain": new Blob([texte], { type: "text/plain" }),
    }),
  ]);
};
