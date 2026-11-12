// Le contenu sort de sa colonne ou de sa fenêtre : sur papier, il occupe la page.
const STYLES_IMPRESSION = `
  @page { margin: 16mm 14mm; }
  html, body { margin: 0; background: #ffffff; }
  body {
    font-size: 15px;
    line-height: 1.5rem;
    color: #3a3a3a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .albert-encart {
    margin: 0 !important;
    padding: 24px 0 0 !important;
    border-left: 0 !important;
    border-right: 0 !important;
    border-bottom: 0 !important;
    box-shadow: none !important;
  }
  h1, h2, h3 { break-after: avoid; }
  tr, li, blockquote { break-inside: avoid; }
`;

const chargement = (lien: HTMLLinkElement): Promise<void> =>
  new Promise((resolve) => {
    lien.addEventListener("load", () => resolve());
    lien.addEventListener("error", () => resolve());
  });

/**
 * Le PDF d'un bloc de la page, tel qu'affiché, avec les styles de la page,
 * imprimé par le navigateur dans un cadre invisible (PIL-1900). Le titre du
 * document nomme le fichier PDF proposé ; `entete`, s'il est donné, ouvre le
 * document.
 */
export const imprimer = async ({
  contenu,
  titre,
  entete,
}: {
  contenu: HTMLElement;
  titre: string;
  entete?: string;
}): Promise<void> => {
  const cadre = document.createElement("iframe");
  cadre.setAttribute("aria-hidden", "true");
  cadre.tabIndex = -1;
  cadre.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.append(cadre);

  const fenetre = cadre.contentWindow;
  const impression = cadre.contentDocument;
  if (fenetre === null || impression === null) {
    cadre.remove();
    throw new Error("Le cadre d'impression n'a pas pu être créé");
  }

  const base = impression.createElement("base");
  base.href = document.baseURI;
  const styles = [
    ...document.querySelectorAll('link[rel="stylesheet"], style'),
  ].map((noeud) => impression.importNode(noeud, true));
  const stylesImpression = impression.createElement("style");
  stylesImpression.textContent = STYLES_IMPRESSION;
  impression.head.append(base, ...styles, stylesImpression);

  if (entete) {
    const titreDocument = impression.createElement("h1");
    titreDocument.className = "text-primary text-2xl mb-6";
    titreDocument.textContent = entete;
    impression.body.append(titreDocument);
  }
  const copie = impression.importNode(contenu, true);
  copie
    .querySelectorAll("[data-hors-impression]")
    .forEach((noeud) => noeud.remove());
  impression.body.append(copie);
  impression.documentElement.lang = "fr";
  impression.title = titre;

  await Promise.all(
    styles
      .filter((noeud): noeud is HTMLLinkElement => noeud.nodeName === "LINK")
      .map(chargement),
  );
  await impression.fonts?.ready;

  // Chrome nomme le PDF d'après le titre de la page, pas celui du cadre.
  const titrePage = document.title;
  document.title = titre;
  fenetre.addEventListener("afterprint", () => {
    document.title = titrePage;
    cadre.remove();
  });
  fenetre.focus();
  fenetre.print();
};
