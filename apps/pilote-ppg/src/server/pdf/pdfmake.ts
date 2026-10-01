import pdfmake from "pdfmake/build/pdfmake";
import policeCourier from "pdfmake/build/standard-fonts/Courier";
import tablePolices from "pdfmake/build/vfs_fonts";
import { MARIANNE_FONTS, marianneVfs } from "@/server/pdf/marianne";

/**
 * En pdfmake 0.3, le module n'expose plus `createPdf` en export nommé mais une instance
 * unique, et les polices ne se passent plus en arguments de `createPdf` : elles
 * s'enregistrent sur cette instance. Ce module porte l'enregistrement et exporte
 * l'instance configurée, pour que les générateurs en dépendent par la valeur plutôt que
 * par un import à effet de bord, qu'un bundler peut réordonner ou éliminer.
 */
pdfmake.addVirtualFileSystem(tablePolices);
pdfmake.addVirtualFileSystem(marianneVfs());
pdfmake.setFonts({
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
  ...MARIANNE_FONTS,
});

// Courier apporte ses propres métriques AFM, que pdfmake 0.3 ne charge plus d'office.
pdfmake.addFontContainer(policeCourier);

// Nos documents n'embarquent aucune ressource distante : sans cette règle, une image
// ou une police désignée par une URL serait téléchargée côté serveur (SSRF).
pdfmake.setUrlAccessPolicy(() => false);

export { pdfmake };
