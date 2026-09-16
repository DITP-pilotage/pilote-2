import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { LecteurVideo } from "@/client/components/_commons/CentreAide/LecteurVideo";

function VideoNodeView({ node }: NodeViewProps) {
  const src = (node.attrs.src as string) ?? "";

  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      {src ? (
        <LecteurVideo src={src} />
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
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});
