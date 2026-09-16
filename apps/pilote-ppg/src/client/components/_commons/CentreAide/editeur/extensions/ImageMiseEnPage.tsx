import Image from "@tiptap/extension-image";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { clsxm } from "@/utils/clsxm";
import {
  ALIGNEMENT_PAR_DEFAUT,
  classesMedia,
  LARGEUR_PAR_DEFAUT,
  lireAlignement,
  lireLargeur,
} from "../../alignementMedia";
import { BarreMiseEnPageMedia } from "../BarreMiseEnPageMedia";

function ImageNodeView({ node, selected, updateAttributes }: NodeViewProps) {
  const src = (node.attrs.src as string) ?? "";
  const alt = (node.attrs.alt as string) ?? "";
  const alignement = lireAlignement(node.attrs.alignement);
  const largeur = lireLargeur(node.attrs.largeur);

  return (
    <NodeViewWrapper className="relative my-2" contentEditable={false}>
      {selected && (
        <BarreMiseEnPageMedia
          alignement={alignement}
          largeur={largeur}
          onAlignement={(valeur) => updateAttributes({ alignement: valeur })}
          onLargeur={(valeur) => updateAttributes({ largeur: valeur })}
        />
      )}
      <img
        alt={alt}
        className={clsxm(classesMedia({ alignement, largeur }), "rounded")}
        src={src}
      />
    </NodeViewWrapper>
  );
}

// Etend l'extension image officielle : memes attributs, plus la mise en page, et
// un NodeView pour accrocher la barre de controle.
export const ImageMiseEnPage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignement: {
        default: ALIGNEMENT_PAR_DEFAUT,
        parseHTML: (element: HTMLElement) =>
          lireAlignement(element.getAttribute("data-align")),
        renderHTML: (attributes: Record<string, string>) => ({
          "data-align": attributes.alignement,
        }),
      },
      largeur: {
        default: LARGEUR_PAR_DEFAUT,
        parseHTML: (element: HTMLElement) =>
          lireLargeur(element.getAttribute("data-largeur")),
        renderHTML: (attributes: Record<string, string>) => ({
          "data-largeur": attributes.largeur,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
