import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import {
  ALIGNEMENT_PAR_DEFAUT,
  LARGEUR_PAR_DEFAUT,
  lireAlignement,
  lireLargeur,
  type AlignementMedia,
  type LargeurMedia,
} from "@/client/components/_commons/CentreAide/alignementMedia";
import { BarreMiseEnPageMedia } from "@/client/components/_commons/CentreAide/editeur/BarreMiseEnPageMedia";
import { LecteurVideo } from "@/client/components/_commons/CentreAide/LecteurVideo";

function VideoNodeView({ node, selected, updateAttributes }: NodeViewProps) {
  const src = (node.attrs.src as string) ?? "";
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
      {src ? (
        <LecteurVideo alignement={alignement} largeur={largeur} src={src} />
      ) : (
        <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Vidéo sans URL
        </div>
      )}
    </NodeViewWrapper>
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs: { src: string }) => ReturnType;
      definirMiseEnPageVideo: (attrs: {
        alignement?: AlignementMedia;
        largeur?: LargeurMedia;
      }) => ReturnType;
    };
  }
}

export const VideoExtension = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-src") ?? element.getAttribute("src") ?? "",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-src": attributes.src,
        }),
      },
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

  // La tolerance a iframe[src] fait remonter les articles enregistres avant le
  // changement de format ; ils sont reecrits en data-src au prochain export.
  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }, { tag: "iframe[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "video" }, HTMLAttributes)];
  },

  addCommands() {
    return {
      insertVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: attrs.src },
          }),
      definirMiseEnPageVideo:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, attrs),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});
