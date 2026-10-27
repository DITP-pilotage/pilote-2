const ENTITES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
};

/**
 * Les commentaires et objectifs sont saisis en HTML. Rendus tels quels par les
 * outils, le modèle les recopiait (« <p>…<br>… » dans un dashboard) et imitait
 * les balises dans ses réponses (PIL-1900) : les outils renvoient du texte.
 */
export function texteDepuisHtml({ html }: { html: string }): string {
  return (
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^<>]*>/gi, "\n• ")
      .replace(/<\/(p|div|h[1-6]|blockquote)>/gi, "\n\n")
      .replace(/<\/(ul|ol)>/gi, "\n")
      // `[^<>]` : sur une suite de `<` sans fermeture, `[^>]` backtrackait
      // sur tout le reste à chaque position.
      .replace(/<[^<>]*>/g, "")
      .replace(/&(nbsp|amp|lt|gt|quot|#39|#x27);/g, (entite) => ENTITES[entite])
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
